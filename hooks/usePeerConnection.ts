"use client";

import peerManager from "@/store/peerManager";
import {
  addMessage,
  updateMessageByTransferId,
} from "@/store/slice/chatbookSlice";
import {
  addConnection,
  addMediaConnection,
  cancelFileTransfer,
  clearMessageQueue,
  completeFileTransfer,
  enqueueMessage,
  removeConnection,
  removeMediaConnection,
  setActiveMediaType,
  setConnectionStatus,
  setIncomingCall,
  setPeerId,
  startFileTransfer,
  updateTransferProgress,
} from "@/store/slice/peerSlice";
import type { RootState } from "@/store/store";
import Peer, { DataConnection } from "peerjs";
import { useCallback, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "./useRedux";

export type FileMeta = { isMeta: true; fileName: string; fileSize: number };
export type PeerMessageType = string | ArrayBuffer | FileMeta | "__end__";

type MediaCallbacks = {
  onStream?: (peerID: string, stream: MediaStream) => void;
  onMediaChange?: (peerID: string, type: "none" | "video" | "screen") => void;
};

// Helper to ensure IDs are PeerJS compatible (alphanumeric, dashes, underscores)
const sanitizePeerId = (id: string) => {
  if (!id) return "";
  return id.replace(/[^a-zA-Z0-9_-]/g, "_");
};

export default function usePeerConnection(
  uniqueID: string,
  mediaCallbacks?: MediaCallbacks
) {
  const dispatch = useAppDispatch();
  const peerId = useAppSelector((state: RootState) => state.peer.peerId);
  const connectionStatus = useAppSelector(
    (state: RootState) => state.peer.connectionStatus
  );
  const activeMediaType = useAppSelector(
    (state: RootState) => state.peer.activeMediaType
  );
  const messageQueue = useAppSelector(
    (state: RootState) => state.peer.messageQueue
  );

  const localMediaStreamRef = useRef<MediaStream | null>(null);
  const messageQueueRef = useRef(messageQueue);

  // Update refs when values change
  const mediaCallbacksRef = useRef<MediaCallbacks | undefined>(mediaCallbacks);
  useEffect(() => {
    mediaCallbacksRef.current = mediaCallbacks;
    messageQueueRef.current = messageQueue;
  }, [mediaCallbacks, messageQueue]);

  const setupConnection = useCallback(
    (conn: DataConnection) => {


      peerManager.addConnection(conn);
      // Don't dispatch addConnection yet - wait for 'open' event
      // dispatch(addConnection(conn.peer)); 

      // Check if connection is already open (race condition fix)
      if (conn.open) {

        dispatch(addConnection(conn.peer)); // Add to Redux only if open
        dispatch(setConnectionStatus("connected"));
        dispatch(clearMessageQueue(conn.peer));
      }

      // Monitor ICE connection state for debugging
      if (conn.peerConnection) {

      }

      conn.on("open", () => {

        dispatch(addConnection(conn.peer)); // Add to Redux now that it's open
        dispatch(setConnectionStatus("connected"));
        
        // Send any queued messages
        const queuedMessages = messageQueueRef.current[conn.peer] || [];

        
        queuedMessages.forEach((message: string) => {
          if (conn.open) {
            conn.send(message);

          }
        });
        
        dispatch(clearMessageQueue(conn.peer));
      });

      conn.on("data", async (data: any) => {

        if (conn.peer === uniqueID) return;
        
        // Use the explicit senderId from payload if available, otherwise fallback to conn.peer
        // This fixes the issue where sanitized IDs (user_name) don't match contact IDs (user.name)
        const senderId = data?.senderId || conn.peer;

        if (data?.type === "file-metadata") {
          const transferId = data.transferId;

          dispatch(
            addMessage({
              sender: senderId,
              receiver: uniqueID,
              content: {
                transferId: data.transferId,
                name: data.fileName,
                size: data.fileSize,
                status: "pending",
                type: data.mimeType,
              },
              type: "file",
            })
          );

          dispatch(
            startFileTransfer({
              transferId,
              peerId: senderId,
              direction: "incoming",
              fileName: data.fileName,
              fileSize: data.fileSize,
              mimeType: data.mimeType,
            })
          );

          peerManager.startFileTransfer(transferId, {
            peerId: senderId,
            direction: "incoming",
            fileName: data.fileName,
            fileSize: data.fileSize,
            mimeType: data.mimeType,
          });
        } else if (data?.type === "file-chunk") {
          const transferId = data.transferId;

          const transfer = peerManager.getTransfer(transferId);
          if (!transfer || !transfer.meta) return 0;

          const chunk = data.chunk;

          peerManager.appendFileChunk(transferId, chunk);

          const receivedBytes = transfer.chunks.reduce(
            (acc, c) => acc + c.byteLength,
            0
          );
          const progress = (receivedBytes / transfer.meta.fileSize) * 100;

          dispatch(
            updateTransferProgress({
              transferId,
              progress: Math.min(100, progress),
            })
          );

          if (receivedBytes >= transfer.meta!.fileSize) {
            dispatch(completeFileTransfer(data.transferId));
            dispatch(
              updateMessageByTransferId({
                sender: senderId, // Use the stored peerId from transfer would be safer, but this works if consistent
                receiver: uniqueID,
                transferId: data.transferId,
                updatedFields: {
                  content: {
                    transferId: data.transferId,
                    size: transfer.meta!.fileSize,
                    name: transfer.meta!.fileName,
                    type: transfer.meta!.mimeType as string,
                    progress,
                    status: "completed",
                  },
                },
              })
            );
          }
        } else if (data?.type === "text") {
          dispatch(
            addMessage({
              sender: senderId,
              receiver: uniqueID,
              content: data.content,
              type: "text",
            })
          );
        } else if (data?.type === "END_CALL") {

          peerManager.removeMediaConnection(senderId);
          dispatch(removeMediaConnection(senderId));
          dispatch(setActiveMediaType({ peerId: senderId, type: "none" }));
          // Optionally redirect if on call page? 
          // The UI should react to activeMediaType change.
        } else if (typeof data === "string") {
          // Legacy support for plain string messages
          dispatch(
            addMessage({
              sender: senderId,
              receiver: uniqueID,
              content: data,
              type: "text",
            })
          );
        }
      });

      conn.on("close", () => {

        
        // Remove this specific connection from manager
        peerManager.removeConnection(conn);
        
        // Only update Redux if NO connections remain for this peer
        if (!peerManager.hasConnection(conn.peer)) {
          dispatch(removeConnection(conn.peer));
        } else {
        }
      });

      conn.on("error", (err) => {
        console.error("[usePeerConnection] Connection error:", err);
        dispatch(setConnectionStatus("disconnected"));
      });
    },
    [dispatch, uniqueID]
  );

  useEffect(() => {
    if (!peerManager.peer && uniqueID) {

      const peerHost = process.env.NEXT_PUBLIC_PEER_SERVER_HOST;
      const host = (peerHost && peerHost !== "localhost") ? peerHost : window.location.hostname;
      const sanitizedId = sanitizePeerId(uniqueID);
      
      const peer = new Peer(sanitizedId, {
        host: host,
        port: Number(process.env.NEXT_PUBLIC_PEER_SERVER_PORT) || 3000,
        path: process.env.NEXT_PUBLIC_PEER_SERVER_PATH || "/peerjs",
        secure: process.env.NEXT_PUBLIC_PEER_SERVER_SECURE === "true",
        config: {
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        },
      });

      peerManager.peer = peer;

      peer.on("open", (id) => {

        dispatch(setPeerId(id));
      });

      peer.on("error", (err) => {
        console.error("[usePeerConnection] Peer error:", err);
      });

      peer.on("connection", (conn) => {

        peerManager.addConnection(conn); // Always replace with the latest
        dispatch(addConnection(conn.peer));
        setupConnection(conn);
      });

      peer.on("call", (call) => {
        if (peerManager.hasMediaConnection(call.peer)) {
          call.close();
          return;
        }

        // Store the call and notify Redux
        peerManager.pendingCall = call;
        dispatch(setIncomingCall({ callerId: call.peer, type: "video" }));

        
        // Handle if the caller cancels before we answer
        call.on("close", () => {

          if (peerManager.pendingCall === call) {
            peerManager.pendingCall = null;
            dispatch(setIncomingCall(null));
          }
        });
      });

      return () => {

        peerManager.reset();
      };
    }
  }, [uniqueID, setupConnection, dispatch]);

  const connect = useCallback(
    async (targetId: string) => {
      const sanitizedTargetId = sanitizePeerId(targetId);
      if (!peerManager.peer) {
        console.warn("[usePeerConnection] No Peer instance available");
        return;
      }
      if (peerManager.hasConnection(sanitizedTargetId)) {

        return;
      }
      
      // Check if peer exists on the server first
      try {

        const response = await fetch(
          `${peerManager.peer.options.secure ? 'https' : 'http'}://${peerManager.peer.options.host}:${peerManager.peer.options.port}${peerManager.peer.options.path}/peerjs/peers`,
          { method: 'GET' }
        );
        
        if (response.ok) {
          const peers = await response.json();

          
          if (!peers.includes(sanitizedTargetId)) {
            console.error(
              `[usePeerConnection] Peer ${sanitizedTargetId} is NOT online!`,
              `\nAvailable peers: ${peers.join(', ') || 'none'}`
            );
            dispatch(setConnectionStatus("disconnected"));
            // Still attempt connection in case the API is outdated
          } else {

          }
        }
      } catch (error) {
        console.warn("[usePeerConnection] Could not check peer existence:", error);
        // Continue anyway
      }
      
      dispatch(setConnectionStatus("connecting"));

      
      const conn = peerManager.peer.connect(sanitizedTargetId, {
        reliable: true,
        metadata: { connectingFrom: uniqueID }
      });
      
      // Set a timeout to detect stuck connections
      const connectionTimeout = setTimeout(() => {
        if (!conn.open) {
          console.error(
            `[usePeerConnection] Connection to ${sanitizedTargetId} timed out after 10s.`,
            "Possible reasons:",
            "\n1. Peer is not online/connected to PeerJS server",
            "\n2. Peer ID doesn't exist",
            "\n3. Network/firewall blocking connection",
            "\nConnection state:", conn.peerConnection?.connectionState,
            "\nICE state:", conn.peerConnection?.iceConnectionState
          );
          dispatch(setConnectionStatus("disconnected"));
        }
      }, 10000);
      
      // Clear timeout when connection opens
      conn.on("open", () => {
        clearTimeout(connectionTimeout);
      });
      
      setupConnection(conn);
    },
    [dispatch, setupConnection, uniqueID]
  );

  const disconnect = useCallback(
    (targetId: string) => {
      const sanitizedTargetId = sanitizePeerId(targetId);

      peerManager.removeConnection(sanitizedTargetId);
      dispatch(removeConnection(sanitizedTargetId));
      endMedia(sanitizedTargetId);
    },
    [dispatch]
  );

  const switchMedia = useCallback(
    async (targetId: string, mediaType: "video" | "screen" | "none") => {
      const sanitizedTargetId = sanitizePeerId(targetId);
      if (!peerManager.peer || !peerManager.hasConnection(sanitizedTargetId)) {
        console.warn(
          "[usePeerConnection] Cannot switch media, missing peer or connection"
        );
        return;
      }
      peerManager.removeMediaConnection(sanitizedTargetId);
      dispatch(removeMediaConnection(sanitizedTargetId));
      try {
        let stream: MediaStream | null = null;

        if (mediaType === "video") {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
        } else if (mediaType === "screen") {
          stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
          });
        } else if (mediaType === "none") stream = new MediaStream();

        localMediaStreamRef.current = stream as MediaStream;
        const call = peerManager.peer.call(sanitizedTargetId, stream as MediaStream);
        peerManager.addMediaConnection(call);
        dispatch(addMediaConnection(sanitizedTargetId));
        dispatch(setActiveMediaType({ peerId: sanitizedTargetId, type: mediaType }));
        mediaCallbacksRef.current?.onMediaChange?.(sanitizedTargetId, mediaType);

        call.on("stream", (remoteStream) => {

          mediaCallbacksRef.current?.onStream?.(sanitizedTargetId, remoteStream);
        });

        call.on("close", () => {

          peerManager.removeMediaConnection(sanitizedTargetId);
          dispatch(removeMediaConnection(sanitizedTargetId));
          mediaCallbacksRef.current?.onMediaChange?.(sanitizedTargetId, "none");
        });

        return call;
      } catch (err) {
        console.error("[usePeerConnection] Error switching media:", err);
        dispatch(setActiveMediaType({ peerId: sanitizedTargetId, type: "none" }));
      }
    },
    [dispatch]
  );

  const endMedia = useCallback(
    (targetId: string) => {
      const sanitizedTargetId = sanitizePeerId(targetId);

      peerManager.removeMediaConnection(sanitizedTargetId);
      dispatch(removeMediaConnection(sanitizedTargetId));
      mediaCallbacksRef.current?.onMediaChange?.(sanitizedTargetId, "none");

      if (localMediaStreamRef.current) {
        localMediaStreamRef.current
          .getTracks()
          .forEach((track) => track.stop());
        localMediaStreamRef.current = null;
      }
    },
    [dispatch]
  );

  const sendMessage = useCallback(
    (message: string, toPeerId: string) => {
      const sanitizedToPeerId = sanitizePeerId(toPeerId);
      const conn = peerManager.getConnection(sanitizedToPeerId);

      
      if (conn?.open) {
        // Send object with metadata instead of plain string
        conn.send({
          type: "text",
          content: message,
          senderId: uniqueID // Send original ID (e.g. "user.name")
        });
        

        dispatch(
          addMessage({
            sender: uniqueID, // Keep original ID for chat logic/display
            receiver: toPeerId, // Keep original ID for chat logic/display
            content: message,
            type: "text",
          })
        );
      } else {

        dispatch(enqueueMessage({ toPeerId: sanitizedToPeerId, message }));
      }
    },
    [dispatch, uniqueID]
  );

  const sendFile = useCallback(
    async (file: File, toPeerId: string) => {
      const conn = peerManager.getConnection(toPeerId);
      if (!conn?.open) {
        console.warn(
          "[usePeerConnection] Cannot send file, connection not open for",
          toPeerId
        );
        return false;
      }
      const transferId = `${peerId}-${Date.now()}`;
      const CHUNK_SIZE = 16 * 1024;

      dispatch(
        startFileTransfer({
          transferId,
          peerId: toPeerId,
          direction: "outgoing",
          fileName: file.name,
          fileSize: file.size,
        })
      );

      peerManager.startFileTransfer(transferId, {
        peerId: toPeerId,
        direction: "outgoing",
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      });

      try {
        conn.send({
          type: "file-metadata",
          transferId,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        });

        dispatch(
          addMessage({
            sender: uniqueID,
            receiver: toPeerId,
            content: {
              transferId,
              name: file.name,
              size: file.size,
              type: file.type,
              status: "pending",
            },
            type: "file",
          })
        );

        let offset = 0;
        while (offset < file.size) {
          const chunk = file.slice(offset, offset + CHUNK_SIZE);
          const arrayBuffer = await chunk.arrayBuffer();
          conn.send({
            type: "file-chunk",
            transferId,
            chunk: arrayBuffer,
            offset,
          });

          offset += CHUNK_SIZE;
          const progress = Math.min(100, (offset / file.size) * 100);

          dispatch(
            updateTransferProgress({
              transferId,
              progress,
            })
          );
          dispatch(
            updateMessageByTransferId({
              sender: conn.peer,
              receiver: uniqueID,
              transferId: transferId,
              updatedFields: {
                content: {
                  transferId: transferId,
                  size: file.size,
                  name: file.name,
                  type: file.type,
                  progress,
                  status: "completed",
                },
              },
            })
          );
        }

        dispatch(completeFileTransfer(transferId));
        return true;
      } catch (error) {
        dispatch(cancelFileTransfer(transferId));
        return false;
      }
    },
    [dispatch, peerId]
  );

  return {
    peerId,
    connectionStatus,
    activeMediaType,
    connect,
    disconnect,
    sendMessage,
    sendFile,
    switchMedia,
    endMedia,
  };
}
