"use client";

import IncomingCallModal from "@/components/chat/IncomingCallModal";
import PeerProvider from "@/components/providers/PeerProvider";
import { useSessionSync } from "@/hooks/useSessionSync";
import React, { useEffect, useState } from "react";

interface Props {
  children: React.ReactNode;
}

export default (props: Props) => {
  const [navbarHeight, setNavbarHeight] = useState(0);

  useEffect(() => {
    const navbar = document.getElementById("navbar");
    if (navbar) {
      setNavbarHeight(navbar.offsetHeight);
    }
  }, []);

  return (
    <div
      className="w-full"
      style={{
        maxHeight: `calc(100vh - ${navbarHeight}px)`,
        marginTop: `${navbarHeight}px`,
      }}
    >
      <PeerProvider>
        <IncomingCallModal />
        <div className="w-full bg-black/90">{props.children}</div>
        <SessionInitializer />
      </PeerProvider>
    </div>
  );
};

const SessionInitializer = () => {
  useSessionSync();
  return null;
};
