"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface AvatarUploadProps {
  currentAvatar?: string | null;
  userName: string;
  onUploadSuccess?: (url: string) => void;
  isEditing?: boolean;
}

export function AvatarUpload({
  currentAvatar,
  userName,
  onUploadSuccess,
  isEditing = false,
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type", {
        description: "Please upload a JPEG, PNG, or WebP image",
      });
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File too large", {
        description: "Maximum file size is 5MB",
      });
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const data = await response.json();
      toast.success("Avatar updated successfully");
      
      if (onUploadSuccess) {
        onUploadSuccess(data.url);
      }
      
      // Refresh the page to show new avatar
      window.location.reload();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Failed to upload avatar", {
        description: error.message,
      });
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const displayAvatar = previewUrl || currentAvatar;

  return (
    <div className="relative group">
      <Avatar className="w-32 h-32 border-4 border-background">
        <AvatarImage src={displayAvatar || undefined} />
        <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-500 text-2xl text-white">
          {userName
            ? userName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
            : "?"}
        </AvatarFallback>
      </Avatar>

      {isEditing && (
        <>
          <button
            type="button"
            onClick={handleClick}
            disabled={isUploading}
            className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Camera className="w-6 h-6" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
        </>
      )}
    </div>
  );
}
