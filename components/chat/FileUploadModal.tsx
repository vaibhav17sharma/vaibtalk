"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { FileIcon, FileVideo, ImageIcon, Upload, X } from "lucide-react";
import { useRef, useState } from "react";

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: FileList | null) => void;
}

export default function FileUploadModal({
  isOpen,
  onClose,
  onUpload,
}: FileUploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleFileTypeIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <ImageIcon className="w-10 h-10 text-blue-500" />;
    } else if (file.type.startsWith("video/")) {
      return <FileVideo className="w-10 h-10 text-red-500" />;
    } else {
      return <FileIcon className="w-10 h-10 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(new DataTransfer().files);
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(selectedFile);
      onUpload(dataTransfer.files);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share File</DialogTitle>
        </DialogHeader>

        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer mt-4 transition-colors",
            dragActive
              ? "border-purple-500 bg-purple-500/5"
              : "border-muted-foreground/20 hover:border-muted-foreground/50",
            selectedFile && "bg-muted/20"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />

          {selectedFile ? (
            <div className="w-full flex items-center gap-4">
              {handleFileTypeIcon(selectedFile)}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                }}
                className="rounded-full"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 text-muted-foreground mb-2" />
              <p className="font-medium">Drop file here or click to upload</p>
              <p className="text-muted-foreground text-sm mt-1">
                Share documents, images, and more
              </p>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
            onClick={handleUpload}
            disabled={!selectedFile}
          >
            Send
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
