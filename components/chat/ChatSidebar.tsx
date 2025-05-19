"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Contact } from "@/store/slice/contactSlice";
import { ChevronLeft, Plus, Search, X } from "lucide-react";
import { useState } from "react";


interface ChatSidebarProps {
  contacts: Contact[];
  activePeer: Contact;
  onSelectPeer: (contact: Contact) => void;
}

export default function ChatSidebar({ contacts, activePeer, onSelectPeer }: ChatSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredPeers = searchQuery 
    ? contacts.filter(contact => contact.contactName.toLowerCase().includes(searchQuery.toLowerCase()))
    : contacts;
  
  if (isCollapsed) {
    return (
      <div className="w-14 border-r border-border/40 bg-background/50 backdrop-blur-sm flex flex-col">
        <div className="p-3 border-b border-border/40 flex justify-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsCollapsed(false)}
            className="rounded-full h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 flex flex-col gap-2 p-2 overflow-y-auto">
          {contacts.map(contact => (
            <Button
              key={contact.id}
              variant="ghost"
              className={cn(
                "p-0 h-10 w-10 rounded-full relative",
                contact.id === activePeer.id && "ring-2 ring-purple-500 ring-offset-2 ring-offset-background"
              )}
              onClick={() => {
                onSelectPeer(contact);
                setIsCollapsed(true);
              }}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={contact.avatar} width={40}/>
                <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white">
                  {contact.contactName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              {/* <span 
                className={cn(
                  "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background",
                  contact.online ? "bg-green-500" : "bg-yellow-500"
                )}
              ></span> */}
            </Button>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-80 border-r border-border/40 bg-background/50 backdrop-blur-sm flex flex-col">
      <div className="p-4 border-b border-border/40 flex items-center justify-between">
        <h2 className="font-semibold text-lg">Chats</h2>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            <Plus className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsCollapsed(true)}
            className="h-8 w-8 rounded-full md:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="p-3 border-b border-border/40">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            className="pl-9 bg-muted/40 border-none focus-visible:ring-purple-500/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-1 top-1 h-7 w-7 rounded-full"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {filteredPeers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center">
            <p>No contacts found</p>
            <p className="text-sm">Try a different search term</p>
          </div>
        ) : (
          filteredPeers.map(contact => (
            <button
              key={contact.id}
              className={cn(
                "w-full p-3 flex items-center gap-3 hover:bg-muted/40 transition-colors text-left",
                contact.id === activePeer.id && "bg-muted/40"
              )}
              onClick={() => onSelectPeer(contact)}
            >
              <div className="relative">
                <Avatar>
                  <AvatarImage src={contact.avatar} width={40}/>
                  <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white">
                    {contact.contactName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                {/* <span 
                  className={cn(
                    "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background",
                    contact.online ? "bg-green-500" : "bg-yellow-500"
                  )}
                ></span> */}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{contact.contactName}</p>
                {/* <p className="text-xs text-muted-foreground">
                  {contact.online ? 'Online' : 'Offline'}
                </p> */}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}