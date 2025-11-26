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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Loader2, UserCheck, UserPlus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ContactRequest {
  id: string;
  createdAt: string;
  sender?: {
    id: string;
    username: string;
    name: string;
    avatar?: string;
  };
  receiver?: {
    id: string;
    username: string;
    name: string;
    avatar?: string;
  };
}

interface InviteCode {
  id: string;
  code: string;
  invitedUsername: string | null;
  used: boolean;
  usedBy: string | null;
  expiresAt: string;
  createdAt: string;
}

interface ContactRequestsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ContactRequestsDialog({
  isOpen,
  onClose,
  onSuccess,
}: ContactRequestsDialogProps) {
  const [sentRequests, setSentRequests] = useState<ContactRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<ContactRequest[]>([]);
  const [activeInvites, setActiveInvites] = useState<InviteCode[]>([]);
  const [usedInvites, setUsedInvites] = useState<InviteCode[]>([]);
  const [expiredInvites, setExpiredInvites] = useState<InviteCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchRequests();
    }
  }, [isOpen]);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const [requestsResponse, invitesResponse] = await Promise.all([
        fetch("/api/contact/request"),
        fetch("/api/invite/list"),
      ]);

      const requestsData = await requestsResponse.json();
      const invitesData = await invitesResponse.json();

      console.log("Contact requests API response:", requestsData);
      console.log("Invites API response:", invitesData);

      if (!requestsResponse.ok) {
        throw new Error(requestsData.error || "Failed to fetch requests");
      }

      setSentRequests(requestsData.sent || []);
      setReceivedRequests(requestsData.received || []);
      
      if (invitesResponse.ok) {
        setActiveInvites(invitesData.active || []);
        setUsedInvites(invitesData.used || []);
        setExpiredInvites(invitesData.expired || []);
      }
    } catch (err: any) {
      console.error("Error fetching requests:", err);
      toast.error(err.message || "Failed to load requests");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespond = async (requestId: string, action: "accept" | "reject") => {
    setProcessingId(requestId);

    try {
      const response = await fetch("/api/contact/request/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to respond to request");
      }

      toast.success(
        action === "accept" ? "Contact request accepted!" : "Contact request rejected"
      );

      // Refresh requests
      await fetchRequests();
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to respond to request");
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatExpiryDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMs < 0) return "Expired";
    if (diffMins < 60) return `in ${diffMins}m`;
    if (diffHours < 24) return `in ${diffHours}h`;
    if (diffDays < 30) return `in ${diffDays}d`;
    return date.toLocaleDateString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Contact Requests
          </DialogTitle>
          <DialogDescription>
            Manage your pending contact requests
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="received" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="received" className="relative">
              Received
              {receivedRequests.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-cyan-500 text-white">
                  {receivedRequests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="relative">
              Sent
              {sentRequests.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-purple-500 text-white">
                  {sentRequests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="invites" className="relative">
              Invites
              {activeInvites.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-500 text-white">
                  {activeInvites.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : receivedRequests.length === 0 ? (
              <div className="text-center py-8">
                <UserPlus className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  No pending requests
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {receivedRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={request.sender?.avatar} />
                      <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white">
                        {request.sender?.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">
                        {request.sender?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        @{request.sender?.username} • {formatDate(request.createdAt)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRespond(request.id, "reject")}
                        disabled={processingId === request.id}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      >
                        {processingId === request.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRespond(request.id, "accept")}
                        disabled={processingId === request.id}
                        className="h-8 w-8 p-0 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                      >
                        {processingId === request.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sent" className="mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : sentRequests.length === 0 ? (
              <div className="text-center py-8">
                <UserPlus className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  No pending requests
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {sentRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                  >
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={request.receiver?.avatar} />
                      <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white">
                        {request.receiver?.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">
                        {request.receiver?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        @{request.receiver?.username} • {formatDate(request.createdAt)}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Pending
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="invites" className="mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : activeInvites.length === 0 && usedInvites.length === 0 && expiredInvites.length === 0 ? (
              <div className="text-center py-8">
                <UserPlus className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  No invites generated yet
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {activeInvites.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-green-500">Active Invites</h4>
                    <div className="space-y-2">
                      {activeInvites.map((invite) => (
                        <div
                          key={invite.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-green-500/20 bg-green-500/5"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold font-mono text-sm">
                              {invite.code}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {invite.invitedUsername ? `For @${invite.invitedUsername}` : "General invite"} • Expires {formatExpiryDate(invite.expiresAt)}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const baseUrl = window.location.origin;
                              const link = `${baseUrl}/invite/${invite.code}`;
                              navigator.clipboard.writeText(link);
                              toast.success("Invite link copied!");
                            }}
                            className="text-green-500 hover:text-green-600 hover:bg-green-500/10"
                          >
                            Copy Link
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {usedInvites.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-blue-500">Used Invites</h4>
                    <div className="space-y-2">
                      {usedInvites.map((invite) => (
                        <div
                          key={invite.id}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold font-mono text-sm">
                              {invite.code}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {invite.invitedUsername ? `@${invite.invitedUsername}` : "General"} • Used {formatDate(invite.createdAt)}
                            </p>
                          </div>
                          <div className="text-xs text-blue-500 font-medium">
                            ✓ Used
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {expiredInvites.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-muted-foreground">Expired Invites</h4>
                    <div className="space-y-2">
                      {expiredInvites.map((invite) => (
                        <div
                          key={invite.id}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20 opacity-60"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold font-mono text-sm">
                              {invite.code}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {invite.invitedUsername ? `@${invite.invitedUsername}` : "General"} • Expired
                            </p>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Expired
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Separator />

        <div className="flex justify-end">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
