"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export function useInviteCodeHandler() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const handleInviteCode = async () => {
      const inviteCode = searchParams.get("inviteCode");

      if (!inviteCode || status !== "authenticated" || !session) {
        return;
      }

      // Check if profile is completed
      const user = session.user as any;
      if (!user.profileCompleted) {
        // Store invite code for processing after profile completion
        localStorage.setItem("pendingInviteCode", inviteCode);
        
        // Fetch and store suggested username
        try {
          const response = await fetch(`/api/invite/validate?code=${inviteCode}`);
          const data = await response.json();
          
          if (data.valid && data.invitedUsername) {
            localStorage.setItem("suggestedUsername", data.invitedUsername);
          }
        } catch (err) {
          console.error("Failed to validate invite:", err);
        }

        // Remove from URL
        const url = new URL(window.location.href);
        url.searchParams.delete("inviteCode");
        router.replace(url.pathname + url.search);
        return;
      }

      // Profile is completed, process invite immediately
      try {
        const response = await fetch("/api/invite/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: inviteCode }),
        });

        const data = await response.json();

        if (response.ok) {
          toast.success("Invite accepted!", {
            description: data.message,
          });

          // Remove invite code from URL
          const url = new URL(window.location.href);
          url.searchParams.delete("inviteCode");
          router.replace(url.pathname + url.search);
        } else {
          // Only show error if it's not already used
          if (!data.error?.includes("already")) {
            toast.error(data.error || "Failed to accept invite");
          }
        }
      } catch (err) {
        console.error("Failed to accept invite:", err);
      }
    };

    handleInviteCode();
  }, [session, status, searchParams, router]);
}

// Hook to process pending invite after profile completion
export function useProcessPendingInvite() {
  const { data: session } = useSession();

  const processPendingInvite = async () => {
    const pendingInviteCode = localStorage.getItem("pendingInviteCode");
    
    if (!pendingInviteCode) {
      return;
    }

    try {
      console.log("Attempting to accept pending invite:", pendingInviteCode);
      const response = await fetch("/api/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: pendingInviteCode }),
      });

      const data = await response.json();
      console.log("Invite accept response:", data);

      if (response.ok) {
        toast.success("Connected!", {
          description: data.message,
        });
        
        // Clear stored invite code
        localStorage.removeItem("pendingInviteCode");
        localStorage.removeItem("suggestedUsername");
      } else {
        console.error("Failed to accept invite:", data.error);
        toast.error("Failed to connect with inviter: " + (data.error || "Unknown error"));
        // Clear anyway to avoid retry loops
        localStorage.removeItem("pendingInviteCode");
        localStorage.removeItem("suggestedUsername");
      }
    } catch (err) {
      console.error("Failed to process pending invite:", err);
      // Clear anyway to avoid retry loops
      localStorage.removeItem("pendingInviteCode");
      localStorage.removeItem("suggestedUsername");
    }
  };

  return { processPendingInvite };
}
