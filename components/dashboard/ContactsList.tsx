"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MessageSquare, MoreVertical, Phone, UserMinus } from "lucide-react";
import { toast } from "sonner";

interface Contact {
  id?: string;
  contactId: string;
  contactName: string;
  nickname?: string;
  blocked: boolean;
  username: string;
  avatar?: string;
  name: string;
  status?: "online" | "offline";
  lastSeen?: Date;
}

interface ContactsListProps {
  contacts: Contact[];
}

export default function ContactsList({ contacts }: ContactsListProps) {
  const removeContact = async (contact: Contact) => {
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contactId: contact.contactId,
          id: contact.id,
          action: "DELETE_CONTACT",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to remove contact");
      }

      toast.success("Contact removed successfully");
    } catch (error) {
      toast.error("Failed to remove contact");
    }
  };
  return (
    <div className="space-y-2">
      {contacts.length == 0 && (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">No contacts found</p>
        </div>
      )}
      {contacts.length > 0 &&
        contacts.map((contact) => (
          <div
            key={contact.id}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar>
                  <AvatarImage src={`${contact.avatar as string}`} width={20} />
                  <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white">
                    {contact.contactName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {/* <span
                  className={cn(
                    "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background",
                    contact.status === "online" ? "bg-green-500" : "bg-gray-500"
                  )}
                ></span> */}
              </div>

              <div>
                <p className="font-medium">
                  {contact.contactName}
                  {contact.nickname && (
                    <span className="text-sm text-muted-foreground ml-1">
                      ({contact.nickname})
                    </span>
                  )}
                </p>
                {/* <p className="text-xs text-muted-foreground">
                  {contact.status === "online"
                    ? "Online"
                    : contact.lastSeen
                    ? `Last seen ${dateFormat(contact.lastSeen, "h:mm a")}`
                    : "Offline"}
                </p> */}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
              >
                <Phone className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="text-red-500">
                    <UserMinus
                      onClick={() => removeContact(contact)}
                      className="h-4 w-4 mr-2"
                    />{" "}
                    Remove Contact
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
    </div>
  );
}
