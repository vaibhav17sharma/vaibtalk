"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import ParticipantsList from "@/components/chat/ParticipantsList";
import VideoControls from "@/components/chat/VideoControls";
import { usePeerActions } from "@/hooks/usePeerActions";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import { useSessionWithRedux } from "@/hooks/useSessionWithRedux";
import { clearActiveContact, setActiveContact } from "@/store/slice/peerSlice";
import { Loader2, PhoneOff } from "lucide-react";

export default function VideoPage() {
  const router = useRouter();
  const { session } = useSessionWithRedux();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { contacts } = useAppSelector((state) => state.contacts);
  const activeContact = useAppSelector((state) => state.peer.activeContact);

  const localPeerId = session?.user?.uniqueID as string;

  // Get remote peer ID from Redux or URL params (backward compatibility)
  let remotePeerId = "";
  if (activeContact && activeContact.type === "call") {
    remotePeerId = activeContact.username;
  } else {
    remotePeerId = searchParams.get("contact") || "";
    // Populate Redux from URL param if available
    if (remotePeerId && contacts.length > 0) {
      const contact = contacts.find((c) => c.username === remotePeerId);
      if (contact) {
        dispatch(
          setActiveContact({
            username: contact.username,
            name: contact.contactName,
            avatar: contact.avatar as string,
            type: "call",
          })
        );
      }
    }
  }

  // Get contact info
  const remoteContact = contacts.find((c) => c.username === remotePeerId);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [hasRemoteStream, setHasRemoteStream] = useState(false);

  const { connect, switchMedia, endMedia, connectionStatus } = usePeerActions();

  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Call duration timer
  useEffect(() => {
    if (!isCallActive) return;

    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isCallActive]);

  // Check if contact exists
  useEffect(() => {
    if (!remotePeerId) {
      toast.error("No contact specified");
      router.push("/contacts");
      return;
    }
  }, [remotePeerId, router]);

  // Clear active contact on unmount
  useEffect(() => {
    return () => {
      dispatch(clearActiveContact());
    };
  }, [dispatch]);

  const setupCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      await switchMedia(remotePeerId, "video");
      setIsConnecting(false);

      toast.success("Camera ready", {
        description: "Your camera and microphone are active",
      });
    } catch (err) {
      console.error("Camera/mic error:", err);
      setIsConnecting(false);

      toast.error("Media Access Denied", {
        description:
          "Please allow camera and microphone access to join the call",
      });

      // Create empty stream for layout
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = new MediaStream();
      }

      await switchMedia(remotePeerId, "none");
      setIsAudioEnabled(false);
      setIsVideoEnabled(false);
    }
  }, [remotePeerId, switchMedia]);

  const toggleAudio = useCallback(() => {
    setIsAudioEnabled((prev) => {
      const newVal = !prev;
      localStreamRef.current?.getAudioTracks().forEach((track) => {
        track.enabled = newVal;
      });

      toast(newVal ? "Microphone on" : "Microphone off", {
        duration: 1500,
      });

      return newVal;
    });
  }, []);

  const toggleVideo = useCallback(() => {
    setIsVideoEnabled((prev) => {
      const newVal = !prev;
      localStreamRef.current?.getVideoTracks().forEach((track) => {
        track.enabled = newVal;
      });

      toast(newVal ? "Camera on" : "Camera off", {
        duration: 1500,
      });

      return newVal;
    });
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (!isScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });

        // Stop current stream
        localStreamRef.current?.getTracks().forEach((track) => track.stop());
        localStreamRef.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Listen for user stopping screen share via browser UI
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          setupCamera();
          toast("Screen sharing stopped");
        };

        await switchMedia(remotePeerId, "screen");
        setIsScreenSharing(true);

        toast.success("Screen Sharing Started", {
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
  }, [isScreenSharing, remotePeerId, setupCamera, switchMedia]);

  const endCall = useCallback(() => {
    // Stop all tracks
    localStreamRef.current?.getTracks().forEach((track) => track.stop());

    // End media connection
    endMedia(remotePeerId);

    toast("Call ended");
    router.push("/dashboard");
  }, [remotePeerId, endMedia, router]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Initialize call
  useEffect(() => {
    if (!remotePeerId || !localPeerId) return;

    // Connect to peer
    connect(remotePeerId);

    // Setup camera
    setupCamera();

    // Cleanup on unmount
    return () => {
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      endMedia(remotePeerId);
    };
  }, [remotePeerId, localPeerId, connect, setupCamera, endMedia]);

  // Monitor connection status
  useEffect(() => {
    if (connectionStatus === "connected") {
      setIsCallActive(true);
      setIsConnecting(false);
    } else if (connectionStatus === "disconnected") {
      setIsCallActive(false);
    }
  }, [connectionStatus]);

  // Monitor remote stream
  useEffect(() => {
    if (!remoteVideoRef.current) return;

    const checkStream = () => {
      const stream = remoteVideoRef.current?.srcObject as MediaStream;
      setHasRemoteStream(!!stream && stream.getTracks().length > 0);
    };

    const interval = setInterval(checkStream, 1000);
    return () => clearInterval(interval);
  }, []);

  // Show loading state
  if (!remotePeerId) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="flex h-screen pt-16 bg-black relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-purple-900/20 to-cyan-900/20 opacity-50" />
        <div className="absolute top-1/3 right-1/4 w-60 h-60 sm:w-72 sm:h-72 md:w-96 md:h-96 bg-purple-500/20 rounded-full filter blur-[80px] sm:blur-[100px] md:blur-[120px]" />
        <div className="absolute bottom-1/3 left-1/4 w-60 h-60 sm:w-72 sm:h-72 md:w-96 md:h-96 bg-cyan-500/20 rounded-full filter blur-[80px] sm:blur-[100px] md:blur-[120px]" />
      </div>

      {/* Call status header */}
      <div className="absolute top-20 left-0 right-0 z-20 flex items-center justify-center">
        <div className="bg-black/50 backdrop-blur-md rounded-full px-6 py-3 flex items-center gap-3">
          {isConnecting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
              <span className="text-sm text-white">Connecting...</span>
            </>
          ) : isCallActive ? (
            <>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-white font-medium">
                {remoteContact?.name || remotePeerId}
              </span>
              <span className="text-sm text-gray-400">•</span>
              <span className="text-sm text-gray-400">
                {formatDuration(callDuration)}
              </span>
            </>
          ) : (
            <>
              <PhoneOff className="w-4 h-4 text-red-500" />
              <span className="text-sm text-white">Call ended</span>
            </>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col w-full">
        <div className="flex-1 p-4 relative">
          {/* Remote video (main) */}
          <div className="relative h-full w-full rounded-2xl overflow-hidden bg-gray-900">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

            {!hasRemoteStream && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-purple-900/50 to-cyan-900/50">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center mb-4">
                  <span className="text-3xl font-bold text-white">
                    {remoteContact?.name?.charAt(0) || remotePeerId.charAt(0)}
                  </span>
                </div>
                <p className="text-white text-lg font-medium">
                  {remoteContact?.name || remotePeerId}
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  {isConnecting ? "Connecting..." : "Waiting to join..."}
                </p>
              </div>
            )}
          </div>

          {/* Local video (picture-in-picture) */}
          <div className="absolute bottom-24 right-8 w-48 h-36 rounded-xl overflow-hidden bg-gray-900 border-2 border-white/20 shadow-2xl">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
            />
            {!isVideoEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center">
                  <span className="text-xl font-bold text-white">
                    {session?.user?.name?.charAt(0) || "You"}
                  </span>
                </div>
              </div>
            )}
            {isScreenSharing && (
              <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                Sharing
              </div>
            )}
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
        participants={[
          {
            id: localPeerId,
            name: session?.user?.name || "Me",
            video: isVideoEnabled,
            audio: isAudioEnabled,
            isMe: true,
          },
          {
            id: remotePeerId,
            name: remoteContact?.name || remotePeerId,
            video: hasRemoteStream,
            audio: hasRemoteStream,
            isMe: false,
          },
        ]}
      />

      <style jsx>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
}
