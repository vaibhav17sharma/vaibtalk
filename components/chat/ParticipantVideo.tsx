"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MicOff, VideoOff } from "lucide-react";
import { useEffect, useState } from "react";

interface Participant {
  id: string;
  name: string;
  video: boolean;
  audio: boolean;
  isMe: boolean;
}

interface ParticipantVideoProps {
  participant: Participant;
  isLarge: boolean;
  isScreenSharing: boolean;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
}

export default function ParticipantVideo({ 
  participant, 
  isLarge, 
  isScreenSharing,
  videoRef 
}: ParticipantVideoProps) {
  const [isAudioActive, setIsAudioActive] = useState(false);
  
  // Simulate audio activity
  useEffect(() => {
    if (participant.audio) {
      const interval = setInterval(() => {
        setIsAudioActive(prev => !prev);
      }, Math.random() * 3000 + 1000);
      
      return () => clearInterval(interval);
    }
    
    return undefined;
  }, [participant.audio]);
  
  return (
    <Card 
      className={cn(
        "relative overflow-hidden aspect-video flex items-center justify-center border-purple-500/10 bg-gradient-to-br from-background/50 to-background/80",
        isLarge && "col-span-full md:col-span-2",
        isAudioActive && participant.audio && !participant.isMe && "ring-2 ring-cyan-500"
      )}
    >
      {participant.video ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={participant.isMe}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center justify-center">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-4xl">
              {participant.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <p className="text-xl font-medium">{participant.name}</p>
        </div>
      )}
      
      {isScreenSharing && (
        <div className="absolute inset-0 bg-black flex items-center justify-center">
          <p className="bg-muted/20 backdrop-blur-md px-4 py-2 rounded-md">
            You are sharing your screen
          </p>
        </div>
      )}
      
      {/* Status indicators */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2">
        <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm p-1.5 rounded-full">
          {!participant.audio && (
            <div className="bg-red-500/20 p-1 rounded-full">
              <MicOff className="h-3 w-3 text-red-500" />
            </div>
          )}
          {!participant.video && (
            <div className="bg-red-500/20 p-1 rounded-full">
              <VideoOff className="h-3 w-3 text-red-500" />
            </div>
          )}
        </div>
        
        <div className="bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full text-xs">
          {participant.isMe ? 'You' : participant.name}
        </div>
      </div>
      
      {/* Audio activity indicator */}
      {participant.audio && isAudioActive && !participant.isMe && (
        <div className="absolute bottom-3 right-3">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4].map((n) => (
              <div 
                key={n}
                className="bg-cyan-500 w-1 rounded-full animate-pulse" 
                style={{ 
                  height: `${n * 5}px`,
                  animationDelay: `${n * 100}ms` 
                }}
              ></div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}