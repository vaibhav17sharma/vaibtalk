"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    AlertCircle,
    Check,
    Copy,
    Loader2,
    Mail,
    MessageCircle,
    Search,
    Share2,
    UserPlus,
    X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface EnhancedAddContactDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type CheckResult = {
  exists: boolean;
  user?: {
    id: string;
    username: string;
    name: string;
    avatar?: string;
  };
  hasPendingRequest?: boolean;
  requestDirection?: "sent" | "received" | null;
};

export default function EnhancedAddContactDialog({
  isOpen,
  onClose,
  onSuccess,
}: EnhancedAddContactDialogProps) {
  const [username, setUsername] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [inviteData, setInviteData] = useState<{
    code: string;
    inviteLink: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCheck = async () => {
    if (!username.trim()) {
      toast.error("Please enter a username");
      return;
    }

    setIsChecking(true);
    setCheckResult(null);
    setInviteData(null);

    try {
      const response = await fetch("/api/contact/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to check username");
      }

      setCheckResult(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to check username");
    } finally {
      setIsChecking(false);
    }
  };

  const handleSendRequest = async () => {
    if (!checkResult?.user) return;

    setIsSending(true);

    try {
      const response = await fetch("/api/contact/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverUsername: checkResult.user.username }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send request");
      }

      toast.success("Contact request sent!", {
        description: `Request sent to ${checkResult.user.name}`,
      });

      handleClose();
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to send request");
    } finally {
      setIsSending(false);
    }
  };

  const handleGenerateInvite = async () => {
    setIsGenerating(true);

    try {
      const response = await fetch("/api/invite/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate invite");
      }

      setInviteData({
        code: data.code,
        inviteLink: data.inviteLink,
      });

      toast.success("Invite link generated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate invite");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteData) return;

    try {
      await navigator.clipboard.writeText(inviteData.inviteLink);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  const handleShare = (platform: string) => {
    if (!inviteData) return;

    const message = `Join me on VaibTalk! ${inviteData.inviteLink}`;

    let url = "";
    switch (platform) {
      case "whatsapp":
        url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        break;
      case "email":
        url = `mailto:?subject=Join VaibTalk&body=${encodeURIComponent(message)}`;
        break;
      case "sms":
        url = `sms:?body=${encodeURIComponent(message)}`;
        break;
    }

    if (url) {
      window.open(url, "_blank");
    }
  };

  const handleWebShare = async () => {
    if (!inviteData) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join VaibTalk",
          text: "Connect with me on VaibTalk",
          url: inviteData.inviteLink,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      toast.error("Sharing not supported on this device");
    }
  };

  const handleClose = () => {
    setUsername("");
    setCheckResult(null);
    setInviteData(null);
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Add Contact
          </DialogTitle>
          <DialogDescription>
            Search for a user by their username to connect
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="username"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                  disabled={isChecking || !!checkResult}
                  className="pr-10"
                />
                {username && !checkResult && (
                  <button
                    onClick={() => setUsername("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {!checkResult && (
                <Button
                  onClick={handleCheck}
                  disabled={isChecking || !username.trim()}
                >
                  {isChecking ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* User Found */}
          {checkResult?.exists && checkResult.user && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/30">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={checkResult.user.avatar} />
                  <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white">
                    {checkResult.user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">{checkResult.user.name}</p>
                  <p className="text-sm text-muted-foreground">
                    @{checkResult.user.username}
                  </p>
                </div>
                <Check className="w-5 h-5 text-green-500" />
              </div>

              {checkResult.hasPendingRequest ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    {checkResult.requestDirection === "sent"
                      ? "You already sent a request to this user"
                      : "This user already sent you a request"}
                  </p>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setCheckResult(null);
                      setUsername("");
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Search Again
                  </Button>
                  <Button
                    onClick={handleSendRequest}
                    disabled={isSending}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                  >
                    {isSending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <UserPlus className="w-4 h-4 mr-2" />
                    )}
                    Send Request
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* User Not Found */}
          {checkResult && !checkResult.exists && !inviteData && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-lg border bg-muted/30">
                <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">User not found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    <span className="font-mono">@{username}</span> is not registered on
                    VaibTalk yet
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setCheckResult(null);
                    setUsername("");
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Search Again
                </Button>
                <Button
                  onClick={handleGenerateInvite}
                  disabled={isGenerating}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Share2 className="w-4 h-4 mr-2" />
                  )}
                  Generate Invite
                </Button>
              </div>
            </div>
          )}

          {/* Invite Generated */}
          {inviteData && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg border bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-500/20">
                <p className="text-sm font-medium mb-2">Invite Link Generated</p>
                <div className="flex items-center gap-2 p-2 rounded bg-background/50 border">
                  <code className="flex-1 text-xs truncate">
                    {inviteData.inviteLink}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopy}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Share via:</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleShare("whatsapp")}
                    className="justify-start"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleShare("email")}
                    className="justify-start"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleShare("sms")}
                    className="justify-start"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    SMS
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleWebShare}
                    className="justify-start"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    More
                  </Button>
                </div>
              </div>

              <Button onClick={handleClose} variant="outline" className="w-full">
                Done
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
