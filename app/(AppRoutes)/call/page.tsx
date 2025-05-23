"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import ParticipantVideo from "@/components/chat/ParticipantVideo";
import ParticipantsList from "@/components/chat/ParticipantsList";
import VideoControls from "@/components/chat/VideoControls";
import usePeerConnection from "@/hooks/usePeerConnection";
import { cn } from "@/lib/utils";

const localPeerId = "kaushikvaibhav";
const remotePeerId = "dudu";

export default function VideoPage() {
  const router = useRouter();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [participants, setParticipants] = useState([
    {
      id: localPeerId,
      name: "Me",
      video: true,
      audio: true,
      isMe: true,
    },
    {
      id: remotePeerId,
      name: "Peer",
      video: true,
      audio: true,
      isMe: false,
    },
  ]);

  const { connect, switchMedia, endMedia, connectionStatus } = usePeerConnection(localPeerId, {
    onStream: (peerID, stream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    },
    onMediaChange: (peerID, type) => {
      setIsScreenSharing(type === "screen");
      if (type === "none" && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    },
  });

  useEffect(() => {
    connect(remotePeerId);
  }, [connect]);

  const setupCamera = async () => {
    let stream: MediaStream | null = null;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      await switchMedia(remotePeerId, "video");
    } catch (err) {
      console.warn("Camera/mic unavailable, proceeding without media.");
      toast("Media Unavailable", {
        description: "Joined without camera/microphone.",
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = new MediaStream(); // empty stream for layout
      }

      await switchMedia(remotePeerId, "none");

      setParticipants((prev) =>
        prev.map((p) =>
          p.id === localPeerId
            ? { ...p, audio: false, video: false }
            : p
        )
      );

      setIsAudioEnabled(false);
      setIsVideoEnabled(false);
    }
  };

  const toggleAudio = () => {
    setIsAudioEnabled((prev) => {
      const newVal = !prev;
      const stream = localVideoRef.current?.srcObject as MediaStream;
      stream?.getAudioTracks().forEach((track) => (track.enabled = newVal));
      return newVal;
    });
  };

  const toggleVideo = () => {
    setIsVideoEnabled((prev) => {
      const newVal = !prev;
      const stream = localVideoRef.current?.srcObject as MediaStream;
      stream?.getVideoTracks().forEach((track) => (track.enabled = newVal));
      return newVal;
    });
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        await switchMedia(remotePeerId, "screen");
        setIsScreenSharing(true);

        toast("Screen Sharing Started", {
          description: "You're now sharing your screen",
        });
      } catch (err) {
        console.error("Screen share error:", err);
        toast.error("Screen Sharing Failed", {
          description: "Could not share screen",
        });
      }
    } else {
      await setupCamera();
      setIsScreenSharing(false);
      toast("Screen Sharing Stopped");
    }
  };

  const endCall = () => {
    endMedia(remotePeerId);
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
    router.push("/dashboard");
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    setupCamera();

    return () => {
      endMedia(remotePeerId);
      if (localVideoRef.current?.srcObject) {
        const stream = localVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="flex h-screen pt-16 bg-black relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-purple-900/20 to-cyan-900/20 opacity-50" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full filter blur-[120px]" />
        <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full filter blur-[120px]" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col w-full">
        <div className="flex-1 p-4">
          <div
            className={cn(
              "grid gap-4 h-full",
              isMobile
                ? "grid-cols-1"
                : participants.length === 1
                ? "grid-cols-1"
                : participants.length === 2
                ? "grid-cols-1 md:grid-cols-2"
                : participants.length <= 4
                ? "grid-cols-1 md:grid-cols-2"
                : "grid-cols-1 md:grid-cols-3"
            )}
          >
            {participants.map((participant) => (
              <ParticipantVideo
                key={participant.id}
                participant={participant}
                isLarge={participants.length <= 1}
                isScreenSharing={participant.isMe && isScreenSharing}
                videoRef={
                  participant.isMe
                    ? localVideoRef
                    : participant.id === remotePeerId
                    ? remoteVideoRef
                    : undefined
                }
              />
            ))}
          </div>
        </div>

        {/* Controls */}
        <VideoControls
          isAudioEnabled={isAudioEnabled}
          isVideoEnabled={isVideoEnabled}
          isScreenSharing={isScreenSharing}
          isMobile={isMobile}
          onSwitchCamera={setupCamera}
          toggleAudio={toggleAudio}
          toggleVideo={toggleVideo}
          toggleScreenShare={toggleScreenShare}
          endCall={endCall}
          toggleParticipants={() => setShowParticipants(!showParticipants)}
        />
      </div>

      {/* Participants Sidebar */}
      <ParticipantsList
        isOpen={showParticipants}
        onClose={() => setShowParticipants(false)}
        participants={participants}
      />
    </div>
  );
}
