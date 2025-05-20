"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { FileIcon, ImageIcon } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";

interface FileLike {
  name: string;
  size: number;
  type?: string;
}

interface ImagePreviewProps {
  file: File | FileLike;
  isImage: boolean;
  imageName?: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const ImagePreview: React.FC<ImagePreviewProps> = ({
  file,
  isImage,
  imageName,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scaledDimensions, setScaledDimensions] = useState<{
    width: number;
    height: number;
    naturalHeight: number;
    naturalWidth: number;
  }>({
    width: 0,
    height: 0,
    naturalHeight: 0,
    naturalWidth: 0,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  const isFile = isImage && file instanceof File;

  useEffect(() => {
    if (isFile) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      const img = new window.Image();
      const maxWidth = window.innerWidth > 768 ? 540 : 240;

      img.onload = () => {
        const { width, height, naturalHeight, naturalWidth } = img;
        const ratio = width > maxWidth ? maxWidth / width : 1;
        setScaledDimensions({
          width: width * ratio,
          height: height * ratio,
          naturalHeight,
          naturalWidth,
        });
      };

      img.src = url;

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [file, isFile]);

  if (!isImage || !isFile) {
    return (
      <div className="mt-2 flex items-center gap-3 p-4 border rounded-md bg-muted/20 text-sm">
        <FileIcon className="w-6 h-6 text-muted-foreground" />
        <div>
          <div className="font-medium">{file.name}</div>
          <div className="text-muted-foreground text-xs">
            {file.type || "Unknown type"} · {formatFileSize(file.size)}
          </div>
        </div>
      </div>
    );
  }

  if (!previewUrl || scaledDimensions.width === 0) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="relative rounded-md overflow-hidden mt-2 group cursor-pointer">
          <Image
            src={previewUrl}
            alt={file.name}
            width={scaledDimensions.width}
            height={scaledDimensions.height}
            className={cn(
              "max-w-[240px] max-h-[180px] object-cover rounded-md transition-opacity duration-300",
              isLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setIsLoaded(true)}
          />
          {!isLoaded && (
            <div className="absolute inset-0 bg-muted/50 animate-pulse flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-2 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
            {file.name} ({formatFileSize(file.size)})
          </div>
        </div>
      </DialogTrigger>

      <DialogContent className="max-w-[90vw] max-h-[85vh] md:max-w-[540px] overflow-auto aspect-[3/4] sm:aspect-[3/4] md:aspect-[3/4] lg:aspect-[3/4] p-4">
        <DialogTitle>{imageName || file.name}</DialogTitle>
        <DialogDescription className="mb-2">
          Pinch to zoom or drag to pan on mobile. Use buttons below for desktop.
        </DialogDescription>

        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={4}
          wheel={{ step: 0.2 }}
          pinch={{ step: 5 }}
          doubleClick={{ disabled: true }}
          panning={{ velocityDisabled: true }}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <div className="hidden md:flex flex-wrap gap-2 mb-3 justify-center sm:justify-start">
                <Button variant="outline" onClick={() => zoomIn()}>
                  Zoom In
                </Button>
                <Button variant="outline" onClick={() => zoomOut()}>
                  Zoom Out
                </Button>
                <Button variant="ghost" onClick={() => resetTransform()}>
                  Reset
                </Button>
              </div>

              <div className="overflow-auto max-h-[70vh] border rounded bg-muted">
                <TransformComponent
                  wrapperStyle={{
                    width: "100%",
                    height: "100%",
                    touchAction: "pan-x pan-y",
                  }}
                >
                  <Image
                    src={previewUrl}
                    alt={file.name}
                    width={scaledDimensions.naturalWidth}
                    height={scaledDimensions.naturalHeight}
                    draggable={false}
                    className="w-auto h-auto max-w-full max-h-[70vh] object-contain select-none"
                  />
                </TransformComponent>
              </div>
            </>
          )}
        </TransformWrapper>

        <DialogFooter className="mt-4 flex justify-end gap-2">
          <div className="flex items-center gap-2"> 
            <a href={previewUrl} download={file.name}>
              <Button variant="outline">Download</Button>
            </a>
            <DialogClose asChild>
              <Button variant="secondary">Close</Button>
            </DialogClose>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImagePreview;
