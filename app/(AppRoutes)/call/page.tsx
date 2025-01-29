"use client";

import { useSession } from "next-auth/react";
import Peer from "peerjs";
import { useEffect, useRef, useState } from "react";

const Room = () => {
  const { data: session, status } = useSession()
  const myVideoRef = useRef<HTMLVideoElement>(null);
  const callingVideoRef = useRef<HTMLVideoElement>(null);

  const [peerInstance, setPeerInstance] = useState<Peer | null>(null);
  const [myUniqueId, setMyUniqueId] = useState<string>("");
  const [idToCall, setIdToCall] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const generateUniqueId = () => {
    const id = Math.random().toString(36).substring(2, 15);
    return id;
  }

  const handleCall = () => {
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then((stream) => {
        const call = peerInstance?.call(idToCall, stream);
        if (call) {
          call.on("stream", (userVideoStream) => {
            if (callingVideoRef.current) {
              callingVideoRef.current.srcObject = userVideoStream;
            }
          });
        }
      });
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
    if (myVideoRef.current?.srcObject instanceof MediaStream) {
      myVideoRef.current.srcObject
        .getTracks()
        .forEach((track) => {
          if (track.kind === "audio") {
            track.enabled = !isMuted;
          }
        });
    }
  };

  const toggleVideo = () => {
    setIsVideoOff((prev) => !prev);
    if (myVideoRef.current?.srcObject instanceof MediaStream) {
      myVideoRef.current.srcObject
        .getTracks()
        .forEach((track) => {
          if (track.kind === "video") {
            track.enabled = !isVideoOff;
          }
        });
    }
  };

  useEffect(() => {
    if (myUniqueId) {
      let peer: Peer;
      if (typeof window !== "undefined") {
        peer = new Peer(myUniqueId, {
          host: "localhost",
          port: 9000,
          path: "/",
        });

        setPeerInstance(peer);

        navigator.mediaDevices
          .getUserMedia({
            video: true,
            audio: true,
          })
          .then((stream) => {
            if (myVideoRef.current) {
              myVideoRef.current.srcObject = stream;
            }

            peer.on("call", (call) => {
              call.answer(stream);
              call.on("stream", (userVideoStream) => {
                if (callingVideoRef.current) {
                  callingVideoRef.current.srcObject = userVideoStream;
                }
              });
            });
          });
      }
      return () => {
        if (peer) {
          peer.destroy();
        }
      };
    }
  }, [myUniqueId]);

  useEffect(() => {
    setMyUniqueId(session?.user ? session?.user['uniqueID'] : generateUniqueId());
  }, [session]);

  return (
    <div className="flex flex-col items-center p-8 bg-gray-900 h-screen text-white">
      {/* Your video container */}
      <div className="relative w-full max-w-3xl">
        <div className="absolute top-2 left-2 z-10 p-2 bg-black bg-opacity-50 rounded-md">
          <p>Your ID: {myUniqueId}</p>
        </div>
        <video
          className="w-full h-96 rounded-lg object-cover"
          playsInline
          ref={myVideoRef}
          autoPlay
        />
        {/* Mute and Video Off/On buttons */}
        <div className="absolute top-2 right-2 z-20 flex space-x-4">
          <button
            onClick={toggleMute}
            className="bg-black bg-opacity-50 hover:bg-opacity-80 text-white px-4 py-2 rounded-lg"
          >
            {isMuted ? "Unmute" : "Mute"}
          </button>
          <button
            onClick={toggleVideo}
            className="bg-black bg-opacity-50 hover:bg-opacity-80 text-white px-4 py-2 rounded-lg"
          >
            {isVideoOff ? "Start Video" : "Stop Video"}
          </button>
        </div>
      </div>

      {/* Input and Call Button */}
      <div className="flex flex-col items-center mt-8 space-y-4">
        <input
          className="p-2 w-72 rounded-lg text-black text-center"
          placeholder="Enter ID to Call"
          value={idToCall}
          onChange={(e) => setIdToCall(e.target.value)}
        />
        <button
          onClick={handleCall}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg"
        >
          Call
        </button>
      </div>

      {/* Second person's video (bottom) */}
      <div className="relative mt-8 w-full max-w-3xl">
        <video
          className="w-full h-96 rounded-lg object-cover"
          playsInline
          ref={callingVideoRef}
          autoPlay
        />
      </div>
    </div>
  );
};

export default Room;
