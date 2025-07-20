"use client";

import { cn } from "@/lib/utils";
import { RootState } from "@/store/store";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const ConnectionStatus = () => {
  const status = useSelector((state: RootState) => state.peer.peerId);

  const isOnline = !!status;

  return (
    <div className="flex min-w-fit items-center space-x-2">
      <span
        className={cn(
          "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium",
          isOnline 
            ? "bg-green-500/20 text-green-500" 
            : "bg-red-500/20 text-red-500"
        )}
      >
        <span 
          className={cn(
            "w-2 h-2 mr-2 rounded-full", 
            isOnline 
              ? "bg-green-500 animate-pulse" 
              : "bg-red-500"
          )}
        ></span>
        {isOnline ? "Online" : "Offline"}
      </span>
    </div>
  );
};

export default ConnectionStatus;
