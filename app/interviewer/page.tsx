"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTracks } from "@livekit/components-react";
import ParticipantVideo from "@/components/participant-video";
import { RemoteParticipant, RoomEvent, Track } from "livekit-client";
import {
  MicManager,
  createSpeechRecognition,
  SpeechRecognitionBase,
  Transcript,
} from "ai-jsx/lib/asr/asr";

const AUDIO_WORKLET_SRC = `
class InputProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
  }
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    for (let channel = 0; channel < input.length; ++channel) {
      const inputChannel = input[channel];
      const outputChannel = output[channel];

      for (let i = 0; i < inputChannel.length; ++i) {
        outputChannel[i] = inputChannel[i];
      }
    }

    // Copy the input data to a new Float32Array
    const data = new Float32Array(input[0]);

    // Post the data back to the main thread
    this.port.postMessage(data);

    return true;
  }
}

registerProcessor("input-processor", InputProcessor);
`;
const AUDIO_WORKLET_NUM_SAMPLES = 128;

class CustomMicManager extends EventTarget {
  private outBuffer?: Float32Array[];
  private context?: AudioContext;
  private streamElement?: HTMLAudioElement;
  private stream?: MediaStream;
  private processorNode?: AudioWorkletNode;
  private numSilentFrames = 0;
  /**
   * Starts capture from the microphone.
   */
  async startMic(timeslice: number, onEnded: () => void) {
    this.startGraph(
      await navigator.mediaDevices.getUserMedia({ audio: true }),
      timeslice,
      onEnded,
    );
  }
  /**
   * Starts capture from an audio file at a specified URL, useful for testing.
   */
  async startFile(url: string, timeslice: number, onEnded: () => void) {
    const response = await fetch(url);
    const blob = await response.blob();
    this.streamElement = new Audio();
    this.streamElement.src = URL.createObjectURL(blob);
    await this.streamElement.play();
    // TODO(juberti): replace use of this API (not present in Safari) with Web Audio.
    const stream = await (this.streamElement as any).captureStream();
    this.streamElement.onpause = () => {
      console.log("MicManager audio element paused");
      stream.getAudioTracks()[0].onended();
    };
    await this.startGraph(stream, timeslice, onEnded);
  }
  /**
   * Stops capture.
   */
  stop() {
    this.processorNode?.disconnect();
    this.stream?.getTracks().forEach((track) => track.stop());
    this.streamElement?.pause();
    this.context?.close();
    this.processorNode = undefined;
    this.stream = undefined;
    this.context = undefined;
    this.outBuffer = [];
  }
  /**
   * Returns the sample rate of the capturer.
   */
  sampleRate() {
    return this.context?.sampleRate;
  }

  async startGraph(
    stream: MediaStream,
    timeslice: number,
    onEnded?: () => void,
  ) {
    this.outBuffer = [];
    this.context = new window.AudioContext();
    this.stream = stream;
    const workletSrcBlob = new Blob([AUDIO_WORKLET_SRC], {
      type: "application/javascript",
    });
    const workletSrcUrl = URL.createObjectURL(workletSrcBlob);
    await this.context!.audioWorklet.addModule(workletSrcUrl);
    this.processorNode = new AudioWorkletNode(this.context, "input-processor");
    this.processorNode.port.onmessage = (event) => {
      this.outBuffer!.push(event.data);
      const bufDuration =
        ((AUDIO_WORKLET_NUM_SAMPLES * this.outBuffer!.length) /
          this.sampleRate()!) *
        1000;
      if (bufDuration >= timeslice) {
        const chunkEvent = new CustomEvent("chunk", {
          detail: this.makeAudioChunk(this.outBuffer!),
        });
        this.dispatchEvent(chunkEvent);
        this.outBuffer = [];
      }
    };
    const source = this.context.createMediaStreamSource(stream);
    source.connect(this.processorNode);
    this.stream.getAudioTracks()[0].onended = () => {
      console.log("MicManager stream ended");
      this.stop();
      onEnded?.();
    };
    this.numSilentFrames = 0;
  }
  /**
   * Converts a list of Float32Arrays to a single ArrayBuffer of 16-bit
   * little-endian Pulse Code Modulation (PCM) audio data, which is
   * the universal format for ASR providers.
   * Also updates the Voice Activity Detection (VAD) state based on the
   * average energy of the audio data.
   */
  private makeAudioChunk(inBuffers: Float32Array[]) {
    const byteLength =
      inBuffers.reduce((sum, inBuffer) => sum + inBuffer.length, 0) * 2;
    const outBuffer = new ArrayBuffer(byteLength);
    const view = new DataView(outBuffer);
    let index = 0;
    let energy = 0.0;
    inBuffers.forEach((inBuffer) => {
      inBuffer.forEach((sample) => {
        energy += sample * sample;
        const i16 = Math.max(
          -32768,
          Math.min(32767, Math.floor(sample * 32768)),
        );
        view.setInt16(index, i16, true);
        index += 2;
      });
      this.updateVad(energy / (index / 2));
    });
    return outBuffer;
  }
  /**
   * Updates the Voice Activity Detection (VAD) state based on the
   * average energy of a single audio buffer. This is a very primitive
   * VAD that simply checks if the average energy is above a threshold
   * for a certain amount of time (12800 samples @ 48KHz = 266ms)
   */
  private updateVad(energy: number) {
    const dbfs = 10 * Math.log10(energy);
    if (dbfs < -50) {
      this.numSilentFrames++;
      if (this.numSilentFrames == 100) {
        this.dispatchEvent(new CustomEvent("vad", { detail: false }));
      }
    } else {
      if (this.numSilentFrames >= 100) {
        this.dispatchEvent(new CustomEvent("vad", { detail: true }));
      }
      this.numSilentFrames = 0;
    }
  }
}

function InterviewerPage() {
  const [transcript, setTranscript] = useState("");
  const tracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    {
      updateOnlyOn: [RoomEvent.ActiveSpeakersChanged],
      onlySubscribed: false,
    },
  );
  const parentRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLMediaElement>(null);

  const manager = new CustomMicManager();
  const recognizer = createSpeechRecognition({
    provider: "deepgram",
    manager,
    getToken: async () => process.env.NEXT_PUBLIC_DEEPGRAM_TOKEN!,
  });
  recognizer.addEventListener(
    "transcript",
    (event: CustomEventInit<Transcript>) => {
      const transcriptObj = event.detail!;
      const currData = transcript;
      const lastNewlineIndex = currData.lastIndexOf("\n");
      const oldData =
        lastNewlineIndex != -1 ? currData.slice(0, lastNewlineIndex + 1) : "";
      let newData = oldData + transcriptObj.text;
      newData += "\n";
      setTranscript(newData);
    },
  );

  const remoteTrack = tracks.find(
    (track) => track.participant instanceof RemoteParticipant,
  );

  if (!remoteTrack?.publication?.track) {
    return <div>Waiting for interviewee to join...</div>;
  }

  const stream = remoteTrack.publication.track.mediaStream!;

  manager.startGraph(stream, 100).then(() => {
    recognizer.start();
  });

  return (
    <div ref={parentRef} className="relative h-screen w-screen">
      <ParticipantVideo
        type={"local"}
        className="absolute bottom-20 rounded-full overflow-hidden right-20 w-40 h-40 object-cover border-4 border-white"
      />
      <div className="flex flex-col">
        <ParticipantVideo type={"remote"} className="w-full flex-1" />
        <div>{transcript}</div>
      </div>
    </div>
  );
}

export default InterviewerPage;
