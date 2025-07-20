"use client";

import AddContactDialog from "@/components/dashboard/AddContactDialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppSelector } from "@/hooks/useRedux";
import { useSessionWithRedux } from "@/hooks/useSessionWithRedux";
import { ArrowLeft, Plus, Search, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function ContactsPage() {
  const { session, status } = useSessionWithRedux();

  const { contacts } = useAppSelector((state) => state.contacts);

  const [searchQuery, setSearchQuery] = useState("");
  const [showAddContact, setShowAddContact] = useState(false);
  const router = useRouter();

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // const onlineContacts = filteredContacts.filter(contact => contact.status === 'online');
  // const offlineContacts = filteredContacts.filter(contact => contact.status === 'offline');

  const handleContactClick = (contactId: string) => {
    router.push(`/chat?contact=${contactId}`);
  };


  const handleAddContact = async ({
    contactId,
    contactName,
    nickname,
  }: {
    contactId: string;
    contactName: string;
    nickname?: string;
  }) => {
    const payload = {
      contactId,
      contactName,
      nickname: nickname || null,
      action: "ADD_CONTACT",
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add contact.");
      }

      toast("Contact added", {
        description: `You added ${contactName} (@${contactId})${nickname ? ` with nickname "${nickname}"` : ""
          }.`,
      });

      setShowAddContact(false);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong while adding contact.");
    }
  };
  const handleBack = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-black/90">
      {/* Background effects */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
<div className="absolute inset-0 z-0">
  <div className="absolute top-1/3 right-1/4 w-40 h-40 sm:w-52 sm:h-52 md:w-64 md:h-64 bg-purple-500/5 rounded-full filter blur-[60px] sm:blur-[80px]" />
  <div className="absolute bottom-1/4 left-1/3 w-52 h-52 sm:w-64 sm:h-64 md:w-80 md:h-80 bg-cyan-500/5 rounded-full filter blur-[60px] sm:blur-[80px]" />
</div>

        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={handleBack}>
                  <ArrowLeft />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">Contacts</h1>
                  <p className="text-muted-foreground">
                    {contacts.length} online
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowAddContact(true)}
                className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Contact
              </Button>
            </div>

            <div className="relative mb-6">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                className="pl-9 bg-muted/40 border-none focus-visible:ring-purple-500/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {filteredContacts.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No contacts found</h3>
                <p className="text-muted-foreground">
                  Try a different search term or add new contacts
                </p>
              </div>
            ) : (
              <div className="space-y-6">

                {contacts.length > 0 && (
                  <div>
                    <div className="space-y-2">
                      {contacts.map(contact => (
                        <button
                          key={contact.id}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/40 transition-colors text-left"
                          onClick={() => handleContactClick(contact.username)}
                        >
                          <div className="relative">
                            <Avatar>
                              <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white">
                                {contact.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-background"></span>
                          </div>
                          <div>
                            <p className="font-medium">{contact.name}</p>
                            <p className="text-xs text-muted-foreground">Online</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <AddContactDialog
        isOpen={showAddContact}
        onClose={() => setShowAddContact(false)}
        currentUserId={session?.user?.uniqueID}
        onAdd={handleAddContact}
      />
    </div>
  );
}