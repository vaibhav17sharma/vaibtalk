"use client";

import CameraCaptureDialog from "@/components/chat/CameraCapture";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatSidebar from "@/components/chat/ChatSidebar";
import FileUploadModal from "@/components/chat/FileUploadModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import usePeerConnection from "@/hooks/usePeerConnection";
import { useAppSelector } from "@/hooks/useRedux";
import { useSessionWithRedux } from "@/hooks/useSessionWithRedux";
import { cn, generateAudioFileName } from "@/lib/utils";
import { selectMessages } from "@/store/slice/chatbookSlice";
import EmojiPicker from "emoji-picker-react";
import {
  Camera,
  FileText,
  ImageIcon,
  Mic,
  Paperclip,
  Send,
  Smile,
  User,
  Video as VideoIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useReactMediaRecorder } from "react-media-recorder";
import { toast } from "sonner";

export default function ChatPage() {
  const [navbarHeight, setNavbarHeight] = useState(0);

  useEffect(() => {
    const navbar = document.getElementById("navbar");
    if (navbar) {
      setNavbarHeight(navbar.offsetHeight);
    }
  }, []);

  const { session } = useSessionWithRedux();
  const { contacts } = useAppSelector((state) => state.contacts);

  const [activePeer, setActivePeer] = useState({
    ...contacts[0],
    online: false,
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [emojiPanelVisible, setEmojiPanelVisible] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Redux: Get messages for this conversation
  const currentUser = session?.user.uniqueID as string;
  const activePeerId = activePeer?.username as string;
  const messages = useAppSelector(selectMessages(currentUser, activePeerId));

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
      inline: "nearest",
    });
  }, [messages]);

  const handleEmojiClick = (emoji: { emoji: string }) => {
    setMessageInput((prevMessage) => prevMessage + emoji.emoji);
  };

  const {
    status: recordingStatus,
    startRecording,
    stopRecording,
    clearBlobUrl,
    mediaBlobUrl,
  } = useReactMediaRecorder({
    audio: true,
    video: false,
    blobPropertyBag: { type: "audio/webm" },
  });

  const {
    sendMessage: sendPeerMessage,
    sendFile,
    connectionStatus,
    connect,
  } = usePeerConnection(currentUser);

  useEffect(() => {
    if (activePeer?.id) {
      connect(activePeer.username);
    }
  }, [activePeer, connect]);

  useEffect(() => {
    if (mediaBlobUrl && !isRecording) {
      fetch(mediaBlobUrl)
        .then((response) => response.blob())
        .then((blob) => {
          const filename = generateAudioFileName();
          const file = new File([blob], filename, {
            type: "audio/webm",
          });

          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);

          handleFileUpload(dataTransfer.files);
        })
        .catch((error) => {
          console.error("Error fetching blob from mediaBlobUrl:", error);
        });
    }
  }, [mediaBlobUrl, isRecording]);

  const handleConnect = () => {
    if (activePeer?.id) {
      connect(activePeer.username);
    }
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !activePeer) return;
    sendPeerMessage(messageInput, activePeer.username);
    setMessageInput("");
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !activePeer) return;

    const file = files[0];

    try {
      setShowFileUpload(false);

      const success = await sendFile(file, activePeer.username);

      if (success) {
        toast.success("File sent", {
          description: `${file.name} was sent successfully!`,
        });
      } else {
        toast.error("File transfer failed", {
          description: `${file.name} couldn't be sent. Please try again.`,
        });
      }
    } catch (error) {
      console.error("File send error:", error);
      toast.error("File transfer error", {
        description: `Failed to send ${file.name}. Please check your connection.`,
      });
    }
  };

  const cancelVoiceRecord = async () => {
    await clearBlobUrl();
    setIsRecording(false);
  };

  const handleVoiceRecord = async () => {
    try {
      if (isRecording) {
        await stopRecording();
        setIsRecording(false);
      } else {
        await startRecording();
        setIsRecording(true);
      }
    } catch (error) {
      console.error("Recording error:", error);
      toast.error("Recording Error", {
        description: "Failed to start or stop recording",
      });
    }
  };

  const capturePhoto = async (file: File) => {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    handleFileUpload(dataTransfer.files);
  };

  const changeChatMessage = (peer: any) => {
    setActivePeer(peer);
  };

  return (
    <div
      className="flex"
      style={{
        height: `calc(100vh - ${navbarHeight}px)`,
      }}
    >
      <video ref={videoRef} className="hidden" />
      <ChatSidebar
        contacts={contacts}
        activePeer={activePeer}
        onSelectPeer={changeChatMessage}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-500/5 rounded-full filter blur-[80px]"></div>
          <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-cyan-500/5 rounded-full filter blur-[80px]"></div>
        </div>

        <div className="border-b border-border/40 p-4 bg-background/50 backdrop-blur-sm flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage
                src={activePeer?.avatar}
                alt={activePeer?.name}
                width={40}
              />
              <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white">
                {activePeer?.name &&
                  activePeer.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-medium">{activePeer?.name}</h2>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span
                  className={cn(
                    "w-2 h-2 rounded-full inline-block",
                    connectionStatus == "connected"
                      ? "bg-green-500"
                      : "bg-gray-500"
                  )}
                ></span>
                {connectionStatus == "connected" ? "Online" : "Offline"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleConnect}>
              <VideoIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Messages container */}
        <div className="flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] p-4 space-y-4 relative z-10">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <User className="w-16 h-16 mb-4 text-muted-foreground/50" />
              <p className="text-xl font-medium mb-2">No messages yet</p>
              <p>Send a message to start the conversation</p>
            </div>
          ) : (
            messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={{
                  ...message,
                  isMe: message.sender === currentUser,
                  timestamp: new Date(message.timestamp),
                }}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-border/40 p-4 bg-background/50 backdrop-blur-sm relative z-10">
          {/* Recording indicator */}
          {isRecording && (
            <div className="absolute top-[-35] left-0 right-0 bg-red-500/10 text-red-500 text-sm py-1 px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                Recording voice message...
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 h-6 px-2"
                  onClick={cancelVoiceRecord}
                >
                  Cancel
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-green-500 h-6 px-2"
                  onClick={handleVoiceRecord}
                >
                  Done
                </Button>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                className="bg-muted/40 border-none focus-visible:ring-purple-500/50"
              />
              <div className="flex absolute right-0 top-0">
                <div className="hidden md:block">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={() => setEmojiPanelVisible((v) => !v)}
                  >
                    <Smile className="w-8 h-8" />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={() => setShowMediaOptions(!showMediaOptions)}
                >
                  <Paperclip className="w-8 h-8" />
                </Button>
              </div>
            </div>

            {showMediaOptions && (
              <div className="absolute bottom-full right-1 mb-2 bg-background/95 backdrop-blur-sm border border-border/40 rounded-lg shadow-lg p-2 w-[180px]">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 mb-1"
                  onClick={() => {
                    setShowFileUpload(true);

                    setShowMediaOptions(false);
                  }}
                >
                  <FileText className="w-4 h-4" /> Upload File
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 mb-1"
                  onClick={() => {
                    setShowFileUpload(true);

                    setShowMediaOptions(false);
                  }}
                >
                  <ImageIcon className="w-4 h-4" /> Upload Image
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 mb-1"
                  onClick={() => {
                    setDialogOpen(true);

                    setShowMediaOptions(false);
                  }}
                >
                  <Camera className="w-4 h-4" /> Take Photo
                </Button>

                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-2",

                    isRecording && "text-red-500"
                  )}
                  onClick={() => {
                    handleVoiceRecord();

                    setShowMediaOptions(false);
                  }}
                >
                  <Mic className="w-4 h-4" />

                  {isRecording ? "Stop Recording" : "Voice Message"}
                </Button>
              </div>
            )}
            <Button
              variant="default"
              size="icon"
              onClick={handleSendMessage}
              className="rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {emojiPanelVisible && (
            <div className="absolute z-10 right-0">
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </div>
          )}
        </div>
      </div>

      <FileUploadModal
        isOpen={showFileUpload}
        onClose={() => setShowFileUpload(false)}
        onUpload={handleFileUpload}
      />
      <CameraCaptureDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSend={capturePhoto}
      />
    </div>
  );
}
