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
import { ImageIcon } from "lucide-react";
import Image from "next/image";
import React, { useCallback, useEffect, useRef, useState } from "react";

interface ImagePreviewProps {
  file: File;
  imageName?: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const ImagePreview: React.FC<ImagePreviewProps> = ({ file, imageName }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scaledDimensions, setScaledDimensions] = useState<{
    width: number;
    height: number;
    maxWidth: number;
  }>({
    width: 240,
    height: 180,
    maxWidth: 540,
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const createPreviewUrl = useCallback(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      return url;
    }
    return null;
  }, [file]);

  useEffect(() => {
    const url = createPreviewUrl();
    
    const img = new window.Image();
    const maxWidth = window.innerWidth > 768 ? 540 : 240;
    img.src = url!;
    
    img.onload = () => {
      const { width, height } = img;

      let scaledWidth = width;
      let scaledHeight = height;

      if (width > maxWidth) {
        scaledWidth = maxWidth;
        scaledHeight = Math.round((height / width) * maxWidth);
      }

      setScaledDimensions({
        width: scaledWidth,
        height: scaledHeight,
        maxWidth,
      });
    };

    return () => {
       if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [file, createPreviewUrl]);

  const handleDialogClose = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  if (!file || !previewUrl) return null;

  return (
    <Dialog onOpenChange={handleDialogClose}>
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

      <DialogContent className="max-w-[540px] max-h-[95vh] h-auto overflow-auto aspect-[3/4] sm:aspect-[3/4] md:aspect-[3/4] lg:aspect-[3/4]">
        <DialogTitle>{imageName}</DialogTitle>

        <DialogDescription>
          Click to download or ignore the image.
        </DialogDescription>
        <Image
          src={previewUrl}
          width={scaledDimensions.maxWidth}
          height={scaledDimensions.height}
          alt={file.name}
          className="w-full h-auto rounded-md object-contain"
        />
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
