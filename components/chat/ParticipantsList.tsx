"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronRight, MicOff, VideoOff } from "lucide-react";

interface Participant {
  id: string;
  name: string;
  video: boolean;
  audio: boolean;
  isMe: boolean;
}

interface ParticipantsListProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
}

export default function ParticipantsList({ isOpen, onClose, participants }: ParticipantsListProps) {
  return (
    <div 
      className={cn(
        "absolute top-16 bottom-0 right-0 w-80 bg-background/90 backdrop-blur-lg border-l border-white/10 transform transition-transform duration-300 z-20",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="font-medium">Participants ({participants.length})</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="p-4 space-y-2 overflow-y-auto max-h-[calc(100%-64px)]">
        {participants.map((participant) => (
          <div 
            key={participant.id}
            className="flex items-center justify-between p-2 rounded-md hover:bg-muted/20"
          >
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white">
                  {participant.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{participant.isMe ? `${participant.name} (You)` : participant.name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {!participant.audio && (
                <MicOff className="h-4 w-4 text-muted-foreground" />
              )}
              {!participant.video && (
                <VideoOff className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}