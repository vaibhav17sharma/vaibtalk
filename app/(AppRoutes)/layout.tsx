"use client";

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
      <div className="w-full bg-black/90">{props.children}</div>
      <SessionInitializer />
    </div>
  );
};

const SessionInitializer = () => {
  useSessionSync();
  return null;
};
