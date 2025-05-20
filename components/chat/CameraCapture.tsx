"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { useRef, useState } from "react";
import { toast } from "sonner";

const CameraCaptureDialog = ({
  open,
  onOpenChange,
  onSend,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (file: File) => void;
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [isPreview, setIsPreview] = useState(false);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
    } catch (error) {
      console.error("Camera error:", error);
      toast("Camera Error", {
        description: "Unable to access the camera.",
      });
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach((track) => track.stop());
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStream(null);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        setCapturedBlob(blob);
        setIsPreview(true);
      } else {
        toast.error("Capture Error", {
          description: "Failed to capture image.",
        });
      }
    }, "image/jpeg");
  };

  const sendPhoto = () => {
    if (capturedBlob) {
      const file = new File([capturedBlob], "photo.jpg", {
        type: "image/jpeg",
      });
      onSend(file);
      closeDialog();
    }
  };

  const handleRetake = () => {
    setCapturedBlob(null);
    setIsPreview(false);
    startCamera();
  };

  const closeDialog = () => {
    stopCamera();
    setCapturedBlob(null);
    setIsPreview(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) closeDialog();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-[540px] max-h-[95vh] h-auto overflow-auto aspect-[3/4] sm:aspect-[3/4] md:aspect-[3/4] lg:aspect-[3/4]" onOpenAutoFocus={startCamera}>
        <DialogTitle>Take a Photo</DialogTitle>
        <div className="w-full">
          {!isPreview ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-md"
            />
          ) : (
            <img
              src={capturedBlob ? URL.createObjectURL(capturedBlob) : ""}
              alt="Captured"
              className="w-full rounded-md"
            />
          )}
        </div>

        <DialogFooter className="flex justify-end gap-2 mt-4">
          {!isPreview ? (
            <Button onClick={capturePhoto}>Capture</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => handleRetake()}>
                Retake
              </Button>
              <Button onClick={sendPhoto}>Send</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CameraCaptureDialog;
