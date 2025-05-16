"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { cn, dateFormat } from "@/lib/utils";
import { Download, FileText, Image } from "lucide-react";
import { useState } from "react";

type Message = {
  id: string;
  content: string | { size: number|string; url: string, name: string, type: string };
  sender: string;
  timestamp: Date;
  isMe: boolean;
  type: "text" | "file";
};

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  const renderFilePreview = () => {
    if (typeof message.content === "string") return null;

    const { name, size, type, url } = message.content;

    if (type.startsWith("image/")) {
      return (
        <div className="relative rounded-md overflow-hidden mt-2 group">
          <img
            src={url}
            alt={name}
            className={cn(
              "max-w-[240px] max-h-[180px] rounded-md transition-opacity duration-300",
              isLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setIsLoaded(true)}
          />
          {!isLoaded && (
            <div className="absolute inset-0 bg-muted/50 animate-pulse flex items-center justify-center">
              <Image className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-2 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
            {name} ({formatFileSize(Number(size))})
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-3 mt-2 p-3 bg-muted/30 rounded-md">
        <div className="bg-muted/50 w-10 h-10 rounded-md flex items-center justify-center">
          <FileText className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{name}</p>
          <p className="text-xs text-muted-foreground">{formatFileSize(Number(size))}</p>
        </div>
        <a href={url} download={name} className="text-muted-foreground hover:text-foreground transition-colors">
          <Download className="w-5 h-5" />
        </a>
      </div>
    );
  };

  return (
    <div
      className={cn(
        "flex gap-3 max-w-4xl",
        message.isMe ? "ml-auto flex-row-reverse" : "mr-auto"
      )}
    >
      {!message.isMe && (
        <Avatar className="w-8 h-8">
          <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-xs">
            {message.sender.split(" ").map((n) => n[0]).join("")}
          </AvatarFallback>
        </Avatar>
      )}

      <div>
        <Card
          className={cn(
            "p-3 shadow-sm",
            message.isMe
              ? "bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border-purple-500/20"
              : "bg-muted/20 border-border"
          )}
        >
          {message.type === "text" ? (
            <p>{message.content as string}</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-1">Sent a file</p>
              {renderFilePreview()}
            </>
          )}
        </Card>
        <p className="text-xs text-muted-foreground mt-1 px-1">
          {dateFormat(message.timestamp, "h:mm a")}
        </p>
      </div>
    </div>
  );
}
