import next from "next";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { prisma } from "./lib/prisma";

import httpProxy from "http-proxy";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

const proxy = httpProxy.createProxyServer();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    if (req.url?.startsWith("/socket.io")) {
      // Let Socket.io handle it via its own listener
      return;
    }
    if (req.url?.startsWith("/peerjs")) {
      // Proxy PeerJS requests
      // Default to peerjs:9000 (Docker internal) but allow override (e.g. localhost:9000 for local dev)
      const peerHost = process.env.PEER_INTERNAL_HOST || "peerjs";
      const peerPort = process.env.PEER_INTERNAL_PORT || "9000";
      const target = `http://${peerHost}:${peerPort}`;
      
      proxy.web(req, res, { target }, (err) => {
        console.error("PeerJS Proxy Error:", err);
      });
      return;
    }
    handler(req, res);
  });

  httpServer.on('upgrade', (req, socket, head) => {
    if (req.url?.startsWith("/peerjs")) {
      const peerHost = process.env.PEER_INTERNAL_HOST || "peerjs";
      const peerPort = process.env.PEER_INTERNAL_PORT || "9000";
      const target = `http://${peerHost}:${peerPort}`;

      proxy.ws(req, socket, head, { target }, (err) => {
        console.error("PeerJS WS Proxy Error:", err);
      });
    }
  });

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_SITE_URL || "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  });

  io.on("connection", (socket) => {
    console.log("Client connected", socket.id);

    socket.on("join_room", (roomId) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on("send_message", async (data) => {
      const { content, senderId, groupId, receiverId, type, fileUrl, fileName, fileSize } = data;

      try {
        // Save to database
        const message = await prisma.message.create({
          data: {
            content,
            senderId,
            receiverId: receiverId || undefined,
            groupId: groupId || undefined,
            type: type || "text",
            fileUrl,
            fileName,
            fileSize,
            senderName: data.senderName, // Assuming senderName is passed, or we fetch it
            receiverName: data.receiverName, // Optional
            read: false,
          },
          include: {
            sender: {
              select: {
                username: true,
                name: true,
                avatar: true,
              }
            }
          }
        });

        // Emit to recipients
        if (groupId) {
          io.to(groupId).emit("new_message", message);
        } else if (receiverId) {
          io.to(receiverId).emit("new_message", message);
          // Also emit to sender's other devices/tabs if needed, or just rely on optimistic UI
          // But for now, let's emit to sender too so they get the confirmed message with ID
          io.to(senderId).emit("new_message", message); 
        }
      } catch (error) {
        console.error("Error saving message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected", socket.id);
    });
  });

  // Cleanup old group messages (retention: 1 week)
  const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
  const RETENTION_PERIOD = 7 * 24 * 60 * 60 * 1000; // 7 days

  setInterval(async () => {
    try {
      const cutoffDate = new Date(Date.now() - RETENTION_PERIOD);
      const deleted = await prisma.message.deleteMany({
        where: {
          groupId: { not: null },
          createdAt: { lt: cutoffDate },
        },
      });
      console.log(`[Cleanup] Deleted ${deleted.count} old group messages`);
    } catch (error) {
      console.error("[Cleanup] Error deleting old messages:", error);
    }
  }, CLEANUP_INTERVAL);

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
