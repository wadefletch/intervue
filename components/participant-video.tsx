import { VideoTrack, useTracks } from "@livekit/components-react";
import {
  LocalParticipant,
  RemoteParticipant,
  RoomEvent,
  Track,
} from "livekit-client";

export default function ParticipantVideo({
  type,
  className,
}: {
  type: "remote" | "local";
  className?: string;
}) {
  const tracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { updateOnlyOn: [RoomEvent.ActiveSpeakersChanged], onlySubscribed: false },
  );

  const selectedTrack = tracks.find(
    (track) =>
      track.participant instanceof
      (type == "local" ? LocalParticipant : RemoteParticipant),
  );

  return selectedTrack ? (
    <VideoTrack {...selectedTrack} className={className} />
  ) : (
    <div className="grid place-content-center">
      {type.slice(0, 1).toUpperCase() + type.slice(1)} participant not
      connected.
    </div>
  );
}
