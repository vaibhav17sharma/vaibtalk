"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { useAppSelector } from "@/hooks/useRedux";
import { cn, dateFormat } from "@/lib/utils";
import peerManager from "@/store/peerManager";
import { selectContactByUsername } from "@/store/slice/contactSlice";
import { AvatarImage } from "@radix-ui/react-avatar";
import { Ban, Download, FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Progress } from "../ui/progress";
import ImagePreview from "./ImagePreview";

type Message = {
  id: string;
  content:
    | string
    | {
        size: number | string;
        url?: string;
        name: string;
        type: string;
        transferId?: string;
      };
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
  const [downloading, setDownloading] = useState(false);

  const transferId =
    typeof message.content === "object" && message.content.transferId
      ? message.content.transferId
      : undefined;

  const fileTransfer = useAppSelector((state) =>
    transferId ? state.peer.fileTransfers[transferId] : undefined
  );

  const username = message.isMe ? peerManager.peer?.id : message.sender;

  

  const contact = useAppSelector((state) =>
    selectContactByUsername(state, username as string)
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  const handleDownload = async () => {
    if (!transferId) return;
    setDownloading(true);
    try {
      const file = peerManager.finalizeFileTransfer(transferId);
      if (file) {
        const url = URL.createObjectURL(file);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Error downloading file. Please try again later.");
    } finally {
      setDownloading(false);
    }
  };

  const renderFilePreview = () => {
    if (typeof message.content === "string") return null;

    const { name, size, type, url } = message.content;


    if (fileTransfer && fileTransfer.status !== "completed") {
      return (
        <div className="flex flex-col items-start gap-2 mt-2">
          <div className="flex items-center gap-2">
            <Loader2 className="animate-spin w-5 h-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {fileTransfer.status === "pending" && "Waiting..."}
              {fileTransfer.status === "active" &&
                `Receiving... (${fileTransfer.progress.toFixed(1)}%)`}
              {fileTransfer.status === "cancelled" && "Cancelled"}
            </span>
          </div>
          <div className="w-40 h-2 bg-muted/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all"
              style={{ width: `${fileTransfer.progress}%` }}
            />
          </div>
        </div>
      );
    }

    if (type.startsWith("image/")) {
      const file = peerManager.getFile(transferId as string);
      if (!file) return null;
      return (
        <ImagePreview imageName={name} file={file} />
      );
    }

    return (
      <div className="flex items-center gap-3 mt-2 p-3 bg-muted/30 rounded-md">
        <div className="bg-muted/50 w-10 h-10 rounded-md flex items-center justify-center">
          <FileText className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{name}</p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(Number(size))}
          </p>
        </div>
        {(fileTransfer?.status === "active" ||
          fileTransfer?.status === "pending") && (
          <Progress value={fileTransfer?.progress} />
        )}
        {fileTransfer?.status === "cancelled" && (
          <Ban className="w-5 h-5" />
        )}
        {(fileTransfer?.status === "completed" || url) && (
          <button
            onClick={handleDownload}
            className="text-muted-foreground hover:text-foreground transition-colors"
            disabled={downloading}
            title="Download"
          >
            <Download className="w-5 h-5" />
          </button>
        )}
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
          <AvatarImage src={contact?.avatar} alt={contact?.name} width={40} />
          <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-xs">
            {message.sender
              .split(" ")
              .map((n) => n[0])
              .join("")}
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
