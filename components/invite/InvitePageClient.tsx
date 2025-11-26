"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, Check, Loader2, UserPlus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface InvitePageClientProps {
  code: string;
}

type InviteData = {
  valid: boolean;
  inviter?: {
    id: string;
    username: string;
    name: string;
    avatar?: string;
  };
  invitedUsername?: string;
  expired?: boolean;
  used?: boolean;
  error?: string;
};

export default function InvitePageClient({ code }: InvitePageClientProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    validateInvite();
  }, [code]);

  const validateInvite = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/invite/validate?code=${code}`);
      const data = await response.json();

      setInviteData(data);
    } catch (err: any) {
      toast.error("Failed to validate invite");
      setInviteData({ valid: false, error: "Failed to validate invite" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!session) {
      // Store invite code in localStorage so it persists after signin flow
      localStorage.setItem("pendingInviteCode", code);
      
      // Redirect to signin with invite code preserved
      router.push(`/signin?inviteCode=${code}`);
      return;
    }

    setIsAccepting(true);

    try {
      const response = await fetch("/api/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to accept invite");
      }

      toast.success("Invite accepted!", {
        description: data.message,
      });

      setAccepted(true);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err: any) {
      toast.error(err.message || "Failed to accept invite");
    } finally {
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-purple-900/20 to-black">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-black via-purple-900/20 to-black">
      {/* Background effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <Card className="relative z-10 w-full max-w-md p-8 bg-background/50 backdrop-blur-xl border-purple-500/20">
        {!inviteData?.valid ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2">Invalid Invite</h1>
              <p className="text-muted-foreground">
                {inviteData?.expired
                  ? "This invite link has expired"
                  : inviteData?.used
                  ? "This invite link has already been used"
                  : inviteData?.error || "This invite link is not valid"}
              </p>
            </div>
            <Button
              onClick={() => router.push("/")}
              className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
            >
              Go to Home
            </Button>
          </div>
        ) : accepted ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2">Connected!</h1>
              <p className="text-muted-foreground">
                You are now connected with {inviteData.inviter?.name}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Redirecting to dashboard...
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center">
                <UserPlus className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold mb-2">You're Invited!</h1>
              <p className="text-muted-foreground">
                Join VaibTalk and connect with
              </p>
            </div>

            {inviteData.inviter && (
              <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/30">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={inviteData.inviter.avatar} />
                  <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-lg">
                    {inviteData.inviter.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">
                    {inviteData.inviter.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    @{inviteData.inviter.username}
                  </p>
                </div>
              </div>
            )}

            {inviteData.invitedUsername && (
              <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <p className="text-sm text-center">
                  Suggested username:{" "}
                  <span className="font-mono font-semibold">
                    @{inviteData.invitedUsername}
                  </span>
                </p>
              </div>
            )}

            <Button
              onClick={handleAcceptInvite}
              disabled={isAccepting}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
              size="lg"
            >
              {isAccepting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Accepting...
                </>
              ) : session ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Accept Invite
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Sign In to Accept
                </>
              )}
            </Button>

            {!session && (
              <p className="text-xs text-center text-muted-foreground">
                You'll be redirected to sign in, then automatically connected
              </p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
