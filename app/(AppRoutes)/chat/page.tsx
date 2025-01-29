"use client";

import { Textarea } from "@/components/ui/textarea";
import EmojiPicker from "emoji-picker-react";
import { useSession } from "next-auth/react";
import Peer, { DataConnection } from "peerjs";
import React, { useEffect, useRef, useState } from "react";

interface Message {
  from: "me" | "peer";
  text: string;
}

const Chat: React.FC = () => {
  const { data: session, status } = useSession();
  const [emojiPanelVisible, setEmojiPanelVisible] = useState(false);
  const [peer, setPeer] = useState<Peer | null>(null);
  const [connection, setConnection] = useState<DataConnection | null>(null);
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);

  const [myUniqueId, setMyUniqueId] = useState<string>("");
  const [idToCall, setIdToCall] = useState("");
  const [connected, setConnected] = useState<boolean>(false);

  const generateUniqueId = () => {
    const id = Math.random().toString(36).substring(2, 15);
    return id;
  };
  const handleEmojiClick = (emoji: { emoji: string }) => {
    setEmojiPanelVisible(false);
    setMessage(message + emoji.emoji);
  };
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (myUniqueId) {
      let peer: Peer;
      if (typeof window !== "undefined") {
        peer = new Peer(myUniqueId, {
          host: "192.168.31.111",
          port: 9000,
          path: "/",
        });

        setPeer(peer);
        peer.on("connection", (conn: DataConnection) => {
          setConnection(conn);
          setIdToCall(conn.peer);
          setConnected(true);
          conn.on("data", (data: any) => {
            setMessages((prevMessages) => [
              ...prevMessages,
              { from: "peer", text: data.toString() },
            ]);
          });
        });
      }

      return () => {
        if (peer) {
          peer.destroy();
        }
      };
    }
  }, [myUniqueId]);

  useEffect(() => {
    const sessionUserId = session?.user
      ? session?.user["uniqueID"]
      : generateUniqueId();
    setMyUniqueId(sessionUserId);
  }, [session]);

  const handleConnect = (peerId: string) => {
    if (peer && peerId) {
      console.log(peerId);
      const conn = peer.connect(peerId);
      setConnection(conn);
      setConnected(true);

      conn.on("data", (data: any) => {
        setMessages((prevMessages) => [
          ...prevMessages,
          { from: "peer", text: data.toString() },
        ]);
      });

      conn.on("open", () => {
        setConnected(true);
      });
    }
  };
  const sendMessage = () => {
    if (connection && message.trim()) {
      connection.send(message);
      setMessages((prevMessages) => [
        ...prevMessages,
        { from: "me", text: message },
      ]);
      setMessage("");
    }
  };

  return (
    <div className="p-5 w-100 border border-gray-300">
      <h3 className="text-lg font-semibold mb-4">My Peer ID: {myUniqueId}</h3>
      {connected && (
        <h3 className="text-lg font-semibold mb-4">
          Chatting with Peer ID: {idToCall}
        </h3>
      )}

      {!connected && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Enter Peer ID to connect"
            value={idToCall}
            onChange={(e) => setIdToCall(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => handleConnect(idToCall)}
            className="mt-2 w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none"
          >
            Connect
          </button>
        </div>
      )}

      {connected && (
        <div>
          <div className="max-h-[60vh] overflow-y-scroll mb-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.from === "me" ? "justify-end" : "justify-start"
                } mb-2`}
              >
                <p
                  className={`inline-block px-4 py-2 rounded-lg ${
                    msg.from === "me" ? "bg-green-500" : "bg-gray-400"
                  }`}
                >
                  {msg.text}
                </p>
              </div>
            ))}
            <div ref={messageEndRef} />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <Textarea
                rows={1}
                className="h-fit"
                placeholder="Type a message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && message.trim() !== "") {
                    sendMessage();
                  }
                }}
              />
              <button
                onClick={() => setEmojiPanelVisible(!emojiPanelVisible)}
                className="text-xl"
              >
                😊
              </button>

              {emojiPanelVisible && (
                <div className="absolute z-10 mt-2">
                  <EmojiPicker onEmojiClick={handleEmojiClick} />
                </div>
              )}
            </div>

            <button
              onClick={sendMessage}
              className="mt-2 w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
