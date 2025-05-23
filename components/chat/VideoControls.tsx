"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Camera as FlipCamera2, MessageSquare, Mic, MicOff, Phone, ScreenShare, ScreenShare as StopScreenShare, Users, Video as VideoIcon, VideoOff } from "lucide-react";
import Link from "next/link";

interface VideoControlsProps {
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isMobile: boolean;
  onSwitchCamera: () => void;
  toggleAudio: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => void;
  endCall: () => void;
  toggleParticipants: () => void;
}

export default function VideoControls({
  isAudioEnabled,
  isVideoEnabled,
  isScreenSharing,
  isMobile,
  onSwitchCamera,
  toggleAudio,
  toggleVideo,
  toggleScreenShare,
  endCall,
  toggleParticipants
}: VideoControlsProps) {
  return (
    <div className="py-6 px-4 bg-background/20 backdrop-blur-md border-t border-white/10">
      <div className="max-w-3xl mx-auto flex items-center justify-center gap-2 md:gap-4">
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "bg-muted/20 border-white/10 hover:bg-muted/30 rounded-full h-12 w-12",
            !isAudioEnabled && "bg-red-500/20 text-red-500 hover:bg-red-500/30 hover:text-red-500"
          )}
          onClick={toggleAudio}
        >
          {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "bg-muted/20 border-white/10 hover:bg-muted/30 rounded-full h-12 w-12",
            !isVideoEnabled && "bg-red-500/20 text-red-500 hover:bg-red-500/30 hover:text-red-500"
          )}
          onClick={toggleVideo}
        >
          {isVideoEnabled ? <VideoIcon className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </Button>

        {isMobile && (
          <Button
            variant="outline"
            size="icon"
            className="bg-muted/20 border-white/10 hover:bg-muted/30 rounded-full h-12 w-12"
            onClick={onSwitchCamera}
          >
            
            <FlipCamera2 className="h-5 w-5" />
          </Button>
        )}
        
        {!isMobile && (
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "bg-muted/20 border-white/10 hover:bg-muted/30 rounded-full h-12 w-12",
              isScreenSharing && "bg-purple-500/20 text-purple-500 hover:bg-purple-500/30 hover:text-purple-500"
            )}
            onClick={toggleScreenShare}
          >
            {isScreenSharing ? <StopScreenShare className="h-5 w-5" /> : <ScreenShare className="h-5 w-5" />}
          </Button>
        )}
        
        <Button
          variant="destructive"
          size="icon"
          className="rounded-full h-14 w-14 bg-red-500 hover:bg-red-600"
          onClick={endCall}
        >
          <Phone className="h-6 w-6 rotate-225" />
        </Button>
        
        <Link href="/chat">
          <Button
            variant="outline"
            size="icon"
            className="bg-muted/20 border-white/10 hover:bg-muted/30 rounded-full h-12 w-12"
          >
            <MessageSquare className="h-5 w-5" />
          </Button>
        </Link>
        
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "bg-muted/20 border-white/10 hover:bg-muted/30 rounded-full h-12 w-12",
          )}
          onClick={toggleParticipants}
        >
          <Users className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}