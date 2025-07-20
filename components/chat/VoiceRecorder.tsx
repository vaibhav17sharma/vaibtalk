"use client";

import { Button } from "@/components/ui/button";
import { generateAudioFileName } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useReactMediaRecorder } from "react-media-recorder";
import { toast } from "sonner";

type VoiceRecorderProps = {
  onUpload: (file: File) => void;
  onCancel?: () => void;
};

export default function VoiceRecorder({ onUpload, onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [didStopRecording, setDidStopRecording] = useState(false);

  const {
    startRecording,
    stopRecording,
    clearBlobUrl,
    mediaBlobUrl,
  } = useReactMediaRecorder({
    audio: true,
    video: false,
    blobPropertyBag: { type: "audio/webm" },
    onStop: (blobUrl, blob) => {
    console.log("[VoiceRecorder] onStop fired!");
    console.log("👉 blobUrl:", blobUrl);
    console.log("👉 blob:", blob);
  }
  });

  useEffect(() => {
    const init = async () => {
      try {
        console.log("[VoiceRecorder] Starting recording...");
        await startRecording();
        setIsRecording(true);
      } catch (err) {
        toast.error("Failed to start recording");
        console.error("[VoiceRecorder] Error starting recording:", err);
      }
    };
    init();

    return () => {
      console.log("[VoiceRecorder] Cleaning up recording...");
      stopRecording();
      clearBlobUrl();
    };
  }, []);

  useEffect(() => {
    console.log("[VoiceRecorder] mediaBlobUrl updated:", mediaBlobUrl);
    console.log("[VoiceRecorder] isRecording:", isRecording);
    console.log("[VoiceRecorder] didStopRecording:", didStopRecording);

    if (mediaBlobUrl && didStopRecording) {
      console.log("[VoiceRecorder] Processing recorded media...");
      fetch(mediaBlobUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], generateAudioFileName(), {
            type: "audio/webm",
          });
          console.log("[VoiceRecorder] Uploading audio file:", file);
          onUpload(file);
          clearBlobUrl();
          setDidStopRecording(false); // Reset flag
        })
        .catch((err) => {
          toast.error("Failed to process recording");
          console.error("[VoiceRecorder] Error processing blob:", err);
        });
    }
  }, [mediaBlobUrl, didStopRecording]);

  const handleCancel = async () => {
    console.log("[VoiceRecorder] Cancel clicked");
    await stopRecording();
    await clearBlobUrl();
    setIsRecording(false);
    setDidStopRecording(false);
    if (onCancel) onCancel();
  };

  const handleDone = async () => {
    console.log("[VoiceRecorder] Done clicked - stopping recording...");
    await stopRecording();
    setIsRecording(false);
    setDidStopRecording(true);
  };

  if (!isRecording) {
    console.log("[VoiceRecorder] Not recording — component not rendering");
    return null;
  }

  return (
    <div className="absolute top-[-35px] left-0 right-0 bg-red-500/10 text-red-500 text-sm py-1 px-4 flex items-center justify-between z-20">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span>Recording voice message...</span>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="text-red-500 h-6 px-2" onClick={handleCancel}>
          Cancel
        </Button>
        <Button variant="ghost" size="sm" className="text-green-500 h-6 px-2" onClick={handleDone}>
          Done
        </Button>
      </div>
    </div>
  );
}
