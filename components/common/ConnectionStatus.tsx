"use client";

import { RootState } from "@/store/store";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const ConnectionStatus = () => {
  const status = useSelector((state: RootState) => state.peer.peerId);

  const [statusText, setStatusText] = useState("");
  const [statusColor, setStatusColor] = useState("");

  useEffect(() => {
    if (!status) {
      setStatusText("Offline");
      setStatusColor("bg-red-500 text-white");
    } else {
      setStatusText("Online");
      setStatusColor("bg-green-500 text-white");
    }
  }, [status]);

  return (
    <div className="flex min-w-fit items-center space-x-2">
      <span
        className={`inline-block px-4 py-1 rounded-full text-sm font-semibold ${statusColor}`}
      >
        {statusText}
      </span>
    </div>
  );
};

export default ConnectionStatus;
