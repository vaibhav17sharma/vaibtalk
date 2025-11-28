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
  const localStreamRef = useRef<MediaStream | null>(null);

  // --- Helpers ---

  const sanitizePeerId = (id: string) => {
    if (!id) return "";
    return id.replace(/[^a-zA-Z0-9_-]/g, "_");
  };

  const getActiveCall = () => {
    if (!activeContact?.username) return null;
    return peerManager.getMediaConnection(
      sanitizePeerId(activeContact.username)
    );
  };

  // --- Actions ---

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
      dispatch(removeMediaConnection(targetId));
    }

    dispatch(
      setActiveMediaType({
        peerId: activeContact?.username || "",
        type: "none",
      })
    );

    dispatch(clearActiveContact());
    router.push("/dashboard");
  };

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

  const replaceStream = (newStream: MediaStream) => {
    // Stop old stream tracks to ensure camera light goes off
    if (localStream && localStream.id !== newStream.id) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    setLocalStream(newStream);
    localStreamRef.current = newStream;

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

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
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

  // --- Effects ---

  // Initialize local stream & Handle Call Logic
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

        // 1. Check for PENDING incoming call (The one we just accepted)
        if (
          peerManager.pendingCall &&
          peerManager.pendingCall.peer ===
            sanitizePeerId(activeContact?.username || "")
        ) {
          const call = peerManager.pendingCall;
          console.log("[CallPage] Answering PENDING call from:", call.peer);

          call.answer(stream); // Answer with our stream
          peerManager.addMediaConnection(call); // Register it as active
          peerManager.pendingCall = null; // Clear pending

          setupCallEvents(call);

          // If remote stream is already there (race condition)
          if (call.remoteStream) {
            setRemoteStream(call.remoteStream);
            if (remoteVideoRef.current)
              remoteVideoRef.current.srcObject = call.remoteStream;
          }
        }
        // 2. Check for existing ACTIVE call (if we refreshed or navigated back)
        else {
          const existingCall = getActiveCall();
          if (existingCall) {
            console.log(
              "[CallPage] Resuming existing active call with:",
              existingCall.peer
            );

            // CRITICAL FIX: Ensure the existing call uses the NEW stream we just created
            // Otherwise, toggling mute/video on 'stream' won't affect the call!
            if (existingCall.peerConnection) {
              const senders = existingCall.peerConnection.getSenders();
              const videoSender = senders.find(
                (s: any) => s.track?.kind === "video"
              );
              const audioSender = senders.find(
                (s: any) => s.track?.kind === "audio"
              );

              if (videoSender)
                videoSender.replaceTrack(stream.getVideoTracks()[0]);
              if (audioSender)
                audioSender.replaceTrack(stream.getAudioTracks()[0]);
            }

            // If it's not open, maybe we need to answer? But usually it's open if it's in active list.
            if (!existingCall.open) {
              existingCall.answer(stream);
            }
            setupCallEvents(existingCall);

            if (existingCall.remoteStream) {
              setRemoteStream(existingCall.remoteStream);
              if (remoteVideoRef.current)
                remoteVideoRef.current.srcObject = existingCall.remoteStream;
            }
          }
          // 3. If no pending and no active, WE are the caller
          else if (
            activeContact?.username &&
            activeMediaType[activeContact.username] !== "none"
          ) {
            const targetId = sanitizePeerId(activeContact.username);
            console.log("[CallPage] Initiating NEW call to:", targetId);

            if (!peerManager.peer) {
              console.error("[CallPage] Cannot call: Peer instance not ready");
              toast.error(
                "Connection not ready. Please try again in a moment."
              );
              return;
            }

            const call = peerManager.peer.call(targetId, stream);
            if (call) {
              peerManager.addMediaConnection(call);
              setupCallEvents(call);
            }
          }
        }
      } catch (error) {
        console.error("Error accessing media devices:", error);
        toast.error("Failed to access camera/microphone");
      }
    };

    initMedia();

    return () => {
      // Robust cleanup
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          track.stop();
          track.enabled = false;
        });
        localStreamRef.current = null;
      }
      setLocalStream(null);
    };
  }, [activeContact]);

  // Fix for blank screen: Ensure video element gets the stream when it mounts/updates
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      console.log("[VideoPage] Attaching remote stream to video element");
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Ensure data connection is established for messages/signaling
  const { connect } = usePeerActions();
  useEffect(() => {
    if (activeContact?.username) {
      connect(activeContact.username);
    }
  }, [activeContact, connect]);

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
