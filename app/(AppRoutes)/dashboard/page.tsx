"use client";

import Loading from "@/app/loading";
import ConnectionStatus from "@/components/common/ConnectionStatus";
import ContactRequestsDialog from "@/components/dashboard/ContactRequestsDialog";
import ContactsList from "@/components/dashboard/ContactsList";
import EnhancedAddContactDialog from "@/components/dashboard/EnhancedAddContactDialog";
import QuickActionsGrid from "@/components/dashboard/QuickActionsGrid";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useInviteCodeHandler } from "@/hooks/useInviteCodeHandler";
import usePeerConnection from "@/hooks/usePeerConnection";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import { useSessionWithRedux } from "@/hooks/useSessionWithRedux";
import { fetchContacts } from "@/store/slice/contactSlice";
import { setUserProfile } from "@/store/slice/userProfileSlice";
import { RootState } from "@/store/store";
import axios from "axios";
import {
  Bell,
  FileText,
  MessageSquare,
  Plus,
  ScreenShare,
  Search,
  Users,
  Video
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

export default function DashboardPage() {
  const { session, status } = useSessionWithRedux();

  const userProfile = useSelector(
    (state: RootState) => state.userProfile.userProfile
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddContact, setShowAddContact] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [requestCount, setRequestCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const dispatch = useAppDispatch();

  const {
    contacts,
    loading: contactLoading,
    error: contactErr,
    initialized: contactsInitialized,
  } = useAppSelector((state) => state.contacts);

  useEffect(() => {
    if (!contactsInitialized && !contactLoading) {
      dispatch(fetchContacts());
    }
  }, [dispatch, contactsInitialized, contactLoading]);

  // Fetch contact requests count
  useEffect(() => {
    const fetchRequestsCount = async () => {
      try {
        const response = await fetch("/api/contact/request");
        const data = await response.json();
        if (response.ok) {
          setRequestCount(data.received?.length || 0);
        }
      } catch (err) {
        console.error("Failed to fetch requests count", err);
      }
    };

    if (status === "authenticated") {
      fetchRequestsCount();
      // Poll every 30 seconds
      const interval = setInterval(fetchRequestsCount, 30000);
      return () => clearInterval(interval);
    }
  }, [status]);



  useEffect(() => {
    if (status !== "authenticated") return;

    const fetchUser = async () => {
      try {
        const res = await axios.get("/api/profile");
        const user = res.data.user;

        if (user) {
          dispatch(setUserProfile(user));
        }
      } catch (error: any) {
        console.error("Failed to fetch user", error);
        // If user not found (e.g. DB reset), sign out
        if (error.response?.status === 404 || error.response?.status === 401) {
          signOut({ callbackUrl: "/signin" });
        }
      }
    };

    if (userProfile === null) {
      fetchUser();
    }
  }, [status]);

  const handleContactSuccess = () => {
    dispatch(fetchContacts());
    // Refresh request count
    fetch("/api/contact/request")
      .then((res) => res.json())
      .then((data) => setRequestCount(data.received?.length || 0))
      .catch(() => {});
  };

  const { peerId } = usePeerConnection(session?.user?.uniqueID as string);
  useInviteCodeHandler(); // Handle invite codes from URL


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
        <div className="space-y-8 max-w-4xl mx-auto">
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
            <div className="hidden sm:flex gap-2">
              <Button
                onClick={() => setShowRequests(true)}
                variant="outline"
                className="relative"
              >
                <Bell className="w-4 h-4 mr-2" />
                Requests
                {requestCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {requestCount}
                  </span>
                )}
              </Button>
              <Button
                onClick={() => setShowAddContact(true)}
                className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Contact
              </Button>
            </div>
          </div>

          {/* Quick actions grid */}
          <QuickActionsGrid actions={quickActions} />

          <div className="mt-4 sm:hidden space-y-2">
            <Button
              onClick={() => setShowRequests(true)}
              variant="outline"
              className="w-full relative"
            >
              <Bell className="w-4 h-4 mr-2" />
              Contact Requests
              {requestCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {requestCount}
                </span>
              )}
            </Button>
            <Button
              onClick={() => setShowAddContact(true)}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Contact
            </Button>
          </div>
          
          {/* Contacts */}
          <Card className="p-6 bg-background/50 backdrop-blur-sm border-purple-500/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" /> Contacts
              </h2>
              {/* <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-500">
                  <span className="w-2 h-2 mr-1 bg-green-500 rounded-full animate-pulse"></span>
                  {contacts.filter((c) => c.online === true).length || 0} online
                </span>
              </div> */}
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
        </div>
      </div>

      <EnhancedAddContactDialog
        isOpen={showAddContact}
        onClose={() => setShowAddContact(false)}
        onSuccess={handleContactSuccess}
      />

      <ContactRequestsDialog
        isOpen={showRequests}
        onClose={() => setShowRequests(false)}
        onSuccess={handleContactSuccess}
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


