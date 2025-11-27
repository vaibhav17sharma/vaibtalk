"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { usePeerActions } from "@/hooks/usePeerActions";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import { useSessionWithRedux } from "@/hooks/useSessionWithRedux";
import peerManager from "@/store/peerManager";
import {
  clearActiveContact,
  removeMediaConnection,
  setActiveMediaType,
} from "@/store/slice/peerSlice";
import {
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  PhoneOff,
  Video,
  VideoOff,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function VideoPage() {
  const { session } = useSessionWithRedux();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { activeContact, activeMediaType, incomingCall } = useAppSelector(
    (state) => state.peer
  );

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Helper to get active call
  const getActiveCall = () => {
    if (!activeContact?.username) return null;
    return peerManager.getMediaConnection(
      sanitizePeerId(activeContact.username)
    );
  };

  const sanitizePeerId = (id: string) => {
    if (!id) return "";
    return id.replace(/[^a-zA-Z0-9_-]/g, "_");
  };

  const localStreamRef = useRef<MediaStream | null>(null);

  // Initialize local stream
  useEffect(() => {
    const initMedia = async () => {
      try {
        // Double check if we already have a stream to avoid re-requesting
        if (localStreamRef.current) return;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        setLocalStream(stream);
        localStreamRef.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // If we initiated the call (activeMediaType is set), call the peer
        if (
          activeContact?.username &&
          activeMediaType[activeContact.username] !== "none"
        ) {
          const targetId = sanitizePeerId(activeContact.username);
          console.log("[CallPage] Calling peer:", targetId);
          const call = peerManager.peer?.call(targetId, stream);
          if (call) {
            peerManager.addMediaConnection(call);
            setupCallEvents(call);
          }
        }
      } catch (error) {
        console.error("Error accessing media devices:", error);
        toast.error("Failed to access camera/microphone");
      }
    };

    // If there's an incoming call that was accepted (stream might be set in usePeerActions, but let's ensure we have local stream)
    // Actually, usePeerActions handles the answer() part. We just need to attach streams.
    // Let's check if we already have a call connection
    const existingCall = getActiveCall();
    if (existingCall) {
      setupCallEvents(existingCall);

      // Check if stream is already available in PeerManager
      if (activeContact?.username) {
        const storedStream = peerManager.getRemoteStream(
          sanitizePeerId(activeContact.username)
        );
        if (storedStream) {
          console.log("Found stored remote stream");
          setRemoteStream(storedStream);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = storedStream;
          }
        }
      }

      // We might need to get local stream if not already there (e.g. if we are the receiver)
      if (!localStream) {
        navigator.mediaDevices
          .getUserMedia({ video: true, audio: true })
          .then((stream) => {
            setLocalStream(stream);
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;
          });
      }
    } else {
      initMedia();
    }

    return () => {
      // Ensure local tracks are stopped when component unmounts
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [activeContact, localStream]);

  // Ensure data connection is established for messages/signaling
  const { connect } = usePeerActions();
  useEffect(() => {
    if (activeContact?.username) {
      connect(activeContact.username);
    }
  }, [activeContact, connect]);

  const setupCallEvents = (call: any) => {
    call.on("stream", (stream: MediaStream) => {
      console.log("Received remote stream");
      peerManager.setRemoteStream(call.peer, stream); // Store it!
      setRemoteStream(stream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    });

    call.on("close", () => {
      console.log("Call closed");
      endCall();
    });

    call.on("error", (err: any) => {
      console.error("Call error:", err);
      toast.error("Call connection error");
      endCall();
    });
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        // Toggle based on current state to ensure sync
        const newEnabledState = !isAudioEnabled;
        audioTrack.enabled = newEnabledState;
        setIsAudioEnabled(newEnabledState);
        console.log(`Audio ${newEnabledState ? "enabled" : "disabled"}`);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        // Toggle based on current state to ensure sync
        const newEnabledState = !isVideoEnabled;
        videoTrack.enabled = newEnabledState;
        setIsVideoEnabled(newEnabledState);
        console.log(`Video ${newEnabledState ? "enabled" : "disabled"}`);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen share -> switch back to camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        replaceStream(stream);
        setIsScreenSharing(false);
        setIsVideoEnabled(true);
      } catch (error) {
        console.error("Error switching back to camera:", error);
      }
    } else {
      // Start screen share
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        replaceStream(stream);
        setIsScreenSharing(true);

        // Handle user stopping screen share via browser UI
        stream.getVideoTracks()[0].onended = () => {
          toggleScreenShare(); // Switch back to camera
        };
      } catch (error) {
        console.error("Error starting screen share:", error);
      }
    }
  };

  const replaceStream = (newStream: MediaStream) => {
    setLocalStream(newStream);
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = newStream;
    }

    const call = getActiveCall();
    if (call && call.peerConnection) {
      const senders = call.peerConnection.getSenders();
      const videoSender = senders.find((s: any) => s.track?.kind === "video");
      const audioSender = senders.find((s: any) => s.track?.kind === "audio");

      if (videoSender) videoSender.replaceTrack(newStream.getVideoTracks()[0]);
      if (audioSender) audioSender.replaceTrack(newStream.getAudioTracks()[0]);
    }
  };

  const endCall = () => {
    // Stop tracks from state
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        track.stop();
        track.enabled = false;
      });
    }

    // Stop tracks from ref (backup)
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
        track.enabled = false;
      });
      localStreamRef.current = null;
    }

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setLocalStream(null);
    setRemoteStream(null);

    if (activeContact?.username) {
      // Send END_CALL signal
      const targetId = sanitizePeerId(activeContact.username);
      const conn = peerManager.getConnection(targetId);
      if (conn?.open) {
        conn.send({ type: "END_CALL" });
        console.log("[CallPage] Sent END_CALL to", targetId);
      }

      peerManager.removeMediaConnection(targetId);
      dispatch(removeMediaConnection(targetId)); // Redux might expect original ID? No, slice usually uses what we give it.
      // Actually, peerSlice probably expects the ID used in the map.
      // Let's check peerSlice later, but for now consistency is key.
      // If we stored it as sanitized, we should remove it as sanitized.
    }

    dispatch(
      setActiveMediaType({
        peerId: activeContact?.username || "",
        type: "none",
      })
    );

    // Clear active contact so we don't return to a broken chat state
    // We need to import clearActiveContact or just set it to null if the action exists
    // checking imports... we need to add clearActiveContact to imports if not there
    // For now, let's assume we can dispatch an action to clear it.
    // Actually, looking at imports, we don't have clearActiveContact imported.
    // I will add it in a separate edit.

    dispatch(clearActiveContact());
    router.push("/dashboard");
  };

  if (!activeContact) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <p>No active call</p>
        <Button onClick={() => router.push("/chat")} className="ml-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden flex flex-col">
      {/* Remote Video (Full Screen) */}
      <div className="flex-1 relative">
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Avatar className="w-32 h-32 mx-auto mb-4 border-4 border-purple-500/50">
                <AvatarImage src={activeContact.avatar} />
                <AvatarFallback className="text-4xl">
                  {(activeContact.name || activeContact.username)[0]}
                </AvatarFallback>
              </Avatar>
              <p className="text-xl text-white animate-pulse">
                Connecting to {activeContact.name}...
              </p>
            </div>
          </div>
        )}

        {/* Local Video (PIP) */}
        <div className="absolute bottom-24 right-4 w-32 h-48 sm:w-48 sm:h-72 bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-white/10 transition-all hover:scale-105">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {!isVideoEnabled && !isScreenSharing && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <Avatar className="w-12 h-12">
                <AvatarImage src={session?.user?.image || ""} />
                <AvatarFallback>{session?.user?.name?.[0]}</AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-black/60 backdrop-blur-md px-6 py-4 rounded-full border border-white/10">
        <Button
          variant={isAudioEnabled ? "ghost" : "destructive"}
          size="icon"
          className="rounded-full w-12 h-12"
          onClick={toggleAudio}
        >
          {isAudioEnabled ? <Mic /> : <MicOff />}
        </Button>

        <Button
          variant={isVideoEnabled ? "ghost" : "destructive"}
          size="icon"
          className="rounded-full w-12 h-12"
          onClick={toggleVideo}
        >
          {isVideoEnabled ? <Video /> : <VideoOff />}
        </Button>

        <Button
          variant={isScreenSharing ? "secondary" : "ghost"}
          size="icon"
          className="rounded-full w-12 h-12"
          onClick={toggleScreenShare}
        >
          {isScreenSharing ? <MonitorOff /> : <Monitor />}
        </Button>

        <Button
          variant="destructive"
          size="icon"
          className="rounded-full w-14 h-14"
          onClick={endCall}
        >
          <PhoneOff />
        </Button>
      </div>
    </div>
  );
}
