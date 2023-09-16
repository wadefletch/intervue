"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useWhisper } from "@chengsokdara/use-whisper";

import {
  LiveKitRoom,
  ParticipantTile,
  VideoTrack,
  useTracks,
} from "@livekit/components-react";
import { Participant, RoomEvent, Track } from "livekit-client";

function IntervieweePage() {
  const room = "intervue";
  const name = process.env.NEXT_PUBLIC_PARTICIPANT_NAME;
  const [token, setToken] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch(
          `/api/get-participant-token?room=${room}&username=${name}`,
        );
        const data = await resp.json();
        setToken(data.token);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  if (token === "") {
    return <div>Getting token...</div>;
  }

  return (
    <>
      <div>
        <h1>Interviewee</h1>
        <p>Room: {room}</p>
        <p>Name: {name}</p>
      </div>
      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      >
        <ParticipantVideo name={""} />
        <ParticipantVideo name={"interviewer"} />
      </LiveKitRoom>
    </>
  );
}

function ParticipantVideo({ name }: { name: string }) {
  const tracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { updateOnlyOn: [RoomEvent.ActiveSpeakersChanged], onlySubscribed: false },
  );

  console.log(tracks[0]);

  const selectedTrack = tracks.find((track) => track.participant.name === name);
  //   const selectedTrack = tracks[0];

  if (!selectedTrack) {
    return <div>Participant {name} not connected</div>;
  }

  const audioContext = new window.AudioContext();
  const audioStream = selectedTrack.participant.audioTracks[0].mediaStream();
  const source = audioContext.createMediaStreamSource(audioStream);

  return <VideoTrack {...selectedTrack} key={selectedTrack.participant.name} />;
}

export default IntervieweePage;
