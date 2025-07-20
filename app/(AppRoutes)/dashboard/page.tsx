"use client";

import Loading from "@/app/loading";
import ConnectionStatus from "@/components/common/ConnectionStatus";
import AddContactDialog from "@/components/dashboard/AddContactDialog";
import ContactsList from "@/components/dashboard/ContactsList";
import QuickActionsGrid from "@/components/dashboard/QuickActionsGrid";
import RecentActivityCard from "@/components/dashboard/RecentActivityCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import usePeerConnection from "@/hooks/usePeerConnection";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import { useSessionWithRedux } from "@/hooks/useSessionWithRedux";
import { fetchContacts } from "@/store/slice/contactSlice";
import { setUserProfile } from "@/store/slice/userProfileSlice";
import { RootState } from "@/store/store";
import axios from "axios";
import {
  Activity,
  Calendar,
  Clock,
  FileText,
  MessageSquare,
  Plus,
  ScreenShare,
  Search,
  Users,
  Video,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";

export default function DashboardPage() {
  const { session, status } = useSessionWithRedux();

  const userProfile = useSelector(
    (state: RootState) => state.userProfile.userProfile
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddContact, setShowAddContact] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const dispatch = useAppDispatch();

  const {
    contacts,
    loading: contactLoading,
    error: contactErr,
  } = useAppSelector((state) => state.contacts);

  useEffect(() => {
    if (contacts.length === 0 && !contactLoading && !contactErr) {
      dispatch(fetchContacts());
    }
  }, [dispatch, contacts, contactLoading, contactErr]);

  useEffect(() => {
    if (status !== "authenticated") return;

    const fetchUser = async () => {
      try {
        const res = await axios.get("/api/profile");
        const user = res.data.user;

        if (user) {
          dispatch(setUserProfile(user));
        }
      } catch (error) {
        console.error("Failed to fetch user", error);
      }
    };

    if (userProfile === null) {
      fetchUser();
    }
  }, [status]);

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

  const { peerId } = usePeerConnection(session?.user?.uniqueID as string);


  if (!isMounted) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen pt-6 md:pt-16 bg-black/90">
      {/* Background effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/3 right-1/4 w-40 h-40 sm:w-52 sm:h-52 md:w-64 md:h-64 bg-purple-500/20 rounded-full filter blur-[60px] sm:blur-[80px]"></div>
        <div className="absolute bottom-1/4 left-1/4 w-52 h-52 sm:w-64 sm:h-64 md:w-80 md:h-80 bg-cyan-500/20 rounded-full filter blur-[60px] sm:blur-[80px]"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Welcome section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex md:flex-1 justify-between items-center gap-4">
                <div>
                  <h1 className="text-xl md:text-3xl font-bold">
                    Welcome, {userProfile?.name || "User"}!
                  </h1>
                  <p className="text-muted-foreground">
                    Here's what's happening today
                  </p>
                </div>
                <ConnectionStatus />
              </div>
              <Button
                onClick={() => setShowAddContact(true)}
                className="hidden sm:flex bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Contact
              </Button>
            </div>

            {/* Quick actions grid */}
            <QuickActionsGrid actions={quickActions} />

            <div className="mt-4 sm:hidden">
              <Button
                onClick={() => setShowAddContact(true)}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Contact
              </Button>
            </div>
            {/* Recent activity */}
            <Card className="p-6 bg-background/50 backdrop-blur-sm border-purple-500/20">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Activity className="w-5 h-5" /> Recent Activity
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                >
                  View All
                </Button>
              </div>
              <div className="space-y-4">
                {sampleActivities.map((activity: any) => (
                  <RecentActivityCard key={activity.id} activity={activity} />
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Online contacts */}
            <Card className="p-6 bg-background/50 backdrop-blur-sm border-purple-500/20">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5" /> Contacts
                </h2>
                <div className="text-sm text-muted-foreground">
                  {sampleContacts.filter((c) => c.status === "online").length}
                  online
                </div>
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contacts..."
                  className="pl-9 bg-muted/40 border-none focus-visible:ring-purple-500/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {contactLoading && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Loading contacts...</p>
                </div>
              )}
              <ContactsList
                contacts={contacts.filter((contact) =>
                  contact.name.toLowerCase().includes(searchQuery.toLowerCase())
                )}
              />
            </Card>

            {/* Upcoming */}
            <Card className="p-6 bg-background/50 backdrop-blur-sm border-purple-500/20">
              <h2 className="text-xl font-semibold flex items-center gap-2 mb-6">
                <Calendar className="w-5 h-5" /> Upcoming
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/40">
                  <div className="bg-purple-500/20 p-3 rounded-lg">
                    <Video className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="font-medium">Team Meeting</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="w-4 h-4" /> Tomorrow, 10:00 AM
                    </p>
                  </div>
                </div>
              </div>
            </Card>
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

const quickActions = [
  {
    title: "Start Chat",
    icon: <MessageSquare className="w-6 h-6" />,
    href: "/chat",
    color: "from-cyan-500 to-blue-500",
  },
  {
    title: "Video Call",
    icon: <Video className="w-6 h-6" />,
    href: "/call",
    color: "from-purple-500 to-pink-500",
  },
  {
    title: "Share Screen",
    icon: <ScreenShare className="w-6 h-6" />,
    href: "/call?action=share-screen",
    color: "from-orange-500 to-red-500",
  },
  {
    title: "Send File",
    icon: <FileText className="w-6 h-6" />,
    href: "/chat?action=send-file",
    color: "from-yellow-500 to-orange-500",
  },
];

const sampleContacts = [
  { id: "1", name: "Alex Chen", status: "online", lastSeen: new Date() },
  {
    id: "2",
    name: "Maya Johnson",
    status: "offline",
    lastSeen: new Date(Date.now() - 3600000),
  },
  { id: "3", name: "Jamal Williams", status: "online", lastSeen: new Date() },
];

const sampleActivities = [
  {
    id: "1",
    type: "call",
    contact: "Alex Chen",
    timestamp: new Date(Date.now() - 1800000),
    duration: "15m",
    status: "completed",
  },
  {
    id: "2",
    type: "message",
    contact: "Maya Johnson",
    timestamp: new Date(Date.now() - 3600000),
    preview: "Hey, check this out!",
    status: "sent",
  },
  {
    id: "3",
    type: "file",
    contact: "Jamal Williams",
    timestamp: new Date(Date.now() - 7200000),
    fileName: "presentation.pdf",
    status: "received",
  },
];
