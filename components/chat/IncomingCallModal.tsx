"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { usePeerActions } from "@/hooks/usePeerActions";
import { useAppSelector } from "@/hooks/useRedux";
import { Phone, PhoneOff, Video } from "lucide-react";
import { useEffect, useState } from "react";

export default function IncomingCallModal() {
  const incomingCall = useAppSelector((state) => state.peer.incomingCall);
  const { contacts } = useAppSelector((state) => state.contacts);
  const { acceptIncomingCall, rejectIncomingCall } = usePeerActions();
  const [callerName, setCallerName] = useState<string>("");
  const [callerAvatar, setCallerAvatar] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    if (incomingCall) {
      const contact = contacts.find(
        (c) => c.username === incomingCall.callerId
      );
      setCallerName(contact?.contactName || incomingCall.callerId);
      setCallerAvatar(contact?.avatar);

      // Play ringtone (optional, but good for UX)
      // const audio = new Audio("/sounds/ringtone.mp3");
      // audio.play();
    }
  }, [incomingCall, contacts]);

  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-background/90 backdrop-blur-md border border-white/10 p-8 rounded-2xl shadow-2xl w-full max-w-sm flex flex-col items-center gap-6 animate-in zoom-in-95 duration-300">
        {/* Caller Info */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-cyan-500/20 animate-ping" />
            <Avatar className="w-24 h-24 border-4 border-background shadow-xl relative z-10">
              <AvatarImage src={callerAvatar} />
              <AvatarFallback className="text-2xl bg-gradient-to-br from-cyan-500 to-purple-500 text-white">
                {callerName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="text-center">
            <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
              {callerName}
            </h3>
            <p className="text-muted-foreground flex items-center justify-center gap-2 mt-1">
              <Video className="w-4 h-4" />
              Incoming Video Call...
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-8 w-full justify-center mt-4">
          <div className="flex flex-col items-center gap-2">
            <Button
              onClick={rejectIncomingCall}
              variant="destructive"
              size="icon"
              className="w-16 h-16 rounded-full shadow-lg hover:scale-110 transition-transform"
            >
              <PhoneOff className="w-8 h-8" />
            </Button>
            <span className="text-xs text-muted-foreground">Decline</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Button
              onClick={acceptIncomingCall}
              className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 shadow-lg hover:scale-110 transition-transform animate-pulse"
              size="icon"
            >
              <Phone className="w-8 h-8" />
            </Button>
            <span className="text-xs text-muted-foreground">Accept</span>
          </div>
        </div>
      </div>
    </div>
  );
}
