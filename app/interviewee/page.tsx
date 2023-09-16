"use client";

import React from "react";
import ParticipantVideo from "@/components/participant-video";

function IntervieweePage() {
  return (
    <div className="grid grid-cols-2">
      <ParticipantVideo type={"local"} />
      <ParticipantVideo type={"remote"} />
    </div>
  );
}

export default IntervieweePage;
