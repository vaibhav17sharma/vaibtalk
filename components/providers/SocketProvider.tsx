"use client";

import { useSessionWithRedux } from "@/hooks/useSessionWithRedux";
import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { session } = useSessionWithRedux();

  useEffect(() => {
    if (!session?.user) {
      return;
    }

    const socketInstance = io(
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      {
        path: "/socket.io",
        addTrailingSlash: false,
      }
    );

    socketInstance.on("connect", () => {
      console.log("Socket connected:", socketInstance.id);
      setIsConnected(true);

      // Join user's own room for 1:1 messages
      socketInstance.emit("join_room", session.user.uniqueID);
    });

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [session]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
