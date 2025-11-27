"use client";

import usePeerConnection from "@/hooks/usePeerConnection";
import { useSessionWithRedux } from "@/hooks/useSessionWithRedux";
import { ReactNode } from "react";

interface PeerProviderProps {
  children: ReactNode;
}

/**
 * Global Peer Provider
 * Ensures the Peer instance is created and maintained across all pages
 * This allows users to receive incoming connections even when not on the chat page
 */
export default function PeerProvider({ children }: PeerProviderProps) {
  const { session } = useSessionWithRedux();
  const uniqueID = session?.user?.uniqueID as string;

  // Initialize peer connection globally
  // This creates the Peer instance and keeps it alive across all pages
  usePeerConnection(uniqueID);

  return <>{children}</>;
}
