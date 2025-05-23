"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge, Tag, User } from "lucide-react";
import { useState } from "react";

interface AddContactDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (payload: { contactId: string; contactName: string; nickname?: string }) => void;
  currentUserId?: string; // optional, for self-check
}

export default function AddContactDialog({ isOpen, onClose, onAdd, currentUserId }: AddContactDialogProps) {
  const [contactId, setContactId] = useState("");
  const [contactName, setContactName] = useState("");
  const [nickname, setNickname] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!contactId || !contactName) {
      setError("Username and name are required.");
      return;
    }

    if (contactId === currentUserId) {
      setError("You cannot add yourself as a contact.");
      return;
    }

    if (nickname.length > 20) {
      setError("Nickname cannot exceed 20 characters.");
      return;
    }

    if (contactName.length > 50) {
      setError("Contact name cannot exceed 50 characters.");
      return;
    }

    setIsLoading(true);

    try {
      await onAdd({
        contactId,
        contactName,
        nickname: nickname || undefined,
      });

      // Reset
      setContactId("");
      setContactName("");
      setNickname("");
    } catch (err: any) {
      setError(err.message || "Failed to add contact.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Contact</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="contactId">Contact Username</Label>
            <div className="relative">
              <Badge className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="contactId"
                type="text"
                placeholder="Enter contact's username"
                className="pl-9 bg-muted/40"
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactName">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="contactName"
                type="text"
                placeholder="Enter full name"
                className="pl-9 bg-muted/40"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nickname">Nickname (optional)</Label>
            <div className="relative">
              <Tag className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="nickname"
                type="text"
                placeholder="Enter nickname"
                className="pl-9 bg-muted/40"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
              disabled={isLoading}
            >
              {isLoading ? "Adding..." : "Add Contact"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
