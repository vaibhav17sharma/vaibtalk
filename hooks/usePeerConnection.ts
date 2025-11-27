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
      console.log("[usePeerConnection] Setting up connection with:", conn.peer);
      console.log("[usePeerConnection] Initial connection state:", {
        open: conn.open,
        connectionState: conn.peerConnection?.connectionState,
        iceConnectionState: conn.peerConnection?.iceConnectionState
      });

      peerManager.addConnection(conn);
      dispatch(addConnection(conn.peer));

      // Check if connection is already open (race condition fix)
      if (conn.open) {
        console.log("[usePeerConnection] Connection already open with:", conn.peer);
        dispatch(setConnectionStatus("connected"));
        dispatch(clearMessageQueue(conn.peer));
      }

      // Monitor ICE connection state for debugging
      if (conn.peerConnection) {
        conn.peerConnection.addEventListener('iceconnectionstatechange', () => {
          console.log(`[usePeerConnection] ICE connection state changed for ${conn.peer}:`, conn.peerConnection?.iceConnectionState);
        });
        conn.peerConnection.addEventListener('connectionstatechange', () => {
          console.log(`[usePeerConnection] Connection state changed for ${conn.peer}:`, conn.peerConnection?.connectionState);
        });
      }

      conn.on("open", () => {
        console.log("[usePeerConnection] Connection open event fired for:", conn.peer);
        dispatch(setConnectionStatus("connected"));
        
        // Send any queued messages
        const queuedMessages = messageQueueRef.current[conn.peer] || [];
        console.log(`[usePeerConnection] Sending ${queuedMessages.length} queued messages to ${conn.peer}`);
        
        queuedMessages.forEach((message: string) => {
          if (conn.open) {
            conn.send(message);
            console.log("[usePeerConnection] Sent queued message to", conn.peer);
          }
        });
        
        dispatch(clearMessageQueue(conn.peer));
      });

      conn.on("data", async (data: any) => {
        console.log(
          "[usePeerConnection] Received data from",
          conn.peer,          
        );
        if (conn.peer === uniqueID) return;
        if (data?.type === "file-metadata") {
          const transferId = data.transferId;

          dispatch(
            addMessage({
              sender: conn.peer,
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
              peerId: conn.peer,
              direction: "incoming",
              fileName: data.fileName,
              fileSize: data.fileSize,
              mimeType: data.mimeType,
            })
          );

          peerManager.startFileTransfer(transferId, {
            peerId: conn.peer,
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
                sender: conn.peer,
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
        } else if (typeof data === "string") {
          dispatch(
            addMessage({
              sender: conn.peer,
              receiver: uniqueID,
              content: data,
              type: "text",
            })
          );
        }
      });

      conn.on("close", () => {
        console.log("[usePeerConnection] Connection closed with:", conn.peer);
        peerManager.removeConnection(conn.peer);
        dispatch(removeConnection(conn.peer));
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
      console.log(
        "[usePeerConnection] Creating Peer instance with ID:",
        uniqueID
      );
      const peerHost = process.env.NEXT_PUBLIC_PEER_SERVER_HOST;
      const host = (peerHost && peerHost !== "localhost") ? peerHost : window.location.hostname;
      const sanitizedId = sanitizePeerId(uniqueID);
      
      const peer = new Peer(sanitizedId, {
        host: host,
        port: Number(process.env.NEXT_PUBLIC_PEER_SERVER_PORT) || 9000,
        path: process.env.NEXT_PUBLIC_PEER_SERVER_PATH || "/peerjs",
        secure: process.env.NEXT_PUBLIC_PEER_SERVER_SECURE === "true",
        config: {
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        },
      });

      peerManager.peer = peer;

      peer.on("open", (id) => {
        console.log("[usePeerConnection] Peer open with ID:", id);
        dispatch(setPeerId(id));
      });

      peer.on("error", (err) => {
        console.error("[usePeerConnection] Peer error:", err);
      });

      peer.on("connection", (conn) => {
        console.log("[usePeerConnection] Incoming connection from:", conn.peer);
        peerManager.addConnection(conn); // Always replace with the latest
        dispatch(addConnection(conn.peer));
        setupConnection(conn);
      });

      peer.on("call", (call) => {
        console.log("[usePeerConnection] Incoming media call from:", call.peer);
        if (peerManager.hasMediaConnection(call.peer)) {
          console.log(
            "[usePeerConnection] Already have media connection with",
            call.peer,
            "- closing duplicate."
          );
          call.close();
          return;
        }

        const answerCall = async () => {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: true,
            });
            call.answer(stream);
            peerManager.addMediaConnection(call);
            dispatch(addMediaConnection(call.peer));

            call.on("stream", (remoteStream) => {
              console.log(
                "[usePeerConnection] Received remote media stream from:",
                call.peer
              );
              mediaCallbacksRef.current?.onStream?.(call.peer, remoteStream);
              dispatch(
                setActiveMediaType({ peerId: call.peer, type: "video" })
              );
            });

            call.on("close", () => {
              console.log(
                "[usePeerConnection] Media call closed with:",
                call.peer
              );
              peerManager.removeMediaConnection(call.peer);
              dispatch(removeMediaConnection(call.peer));
              mediaCallbacksRef.current?.onMediaChange?.(call.peer, "none");
            });
          } catch (error) {
            console.error("[usePeerConnection] Failed to answer call:", error);
            call.close();
          }
        };

        answerCall();
      });

      return () => {
        console.log("[usePeerConnection] Cleaning up Peer instance");
        peerManager.reset();
      };
    }
  }, [uniqueID, setupConnection, dispatch]);

  const connect = useCallback(
    (targetId: string) => {
      const sanitizedTargetId = sanitizePeerId(targetId);
      if (!peerManager.peer) {
        console.warn("[usePeerConnection] No Peer instance available");
        return;
      }
      if (peerManager.hasConnection(sanitizedTargetId)) {
        console.log("[usePeerConnection] Already connected to", sanitizedTargetId);
        return;
      }
      dispatch(setConnectionStatus("connecting"));
      console.log("[usePeerConnection] Connecting to peer:", sanitizedTargetId);
      const conn = peerManager.peer.connect(sanitizedTargetId);
      setupConnection(conn);
    },
    [dispatch, setupConnection]
  );

  const disconnect = useCallback(
    (targetId: string) => {
      const sanitizedTargetId = sanitizePeerId(targetId);
      console.log("[usePeerConnection] Disconnecting from peer:", sanitizedTargetId);
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
          console.log(
            "[usePeerConnection] Received remote stream from:",
            sanitizedTargetId
          );
          mediaCallbacksRef.current?.onStream?.(sanitizedTargetId, remoteStream);
        });

        call.on("close", () => {
          console.log("[usePeerConnection] Media call closed with:", sanitizedTargetId);
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
      console.log("[usePeerConnection] Ending media with:", sanitizedTargetId);
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
      console.log("[usePeerConnection] sendMessage", message, "to", sanitizedToPeerId);
      console.log("[usePeerConnection] Connection exists:", !!conn);
      console.log("[usePeerConnection] Connection open:", conn?.open);
      console.log("[usePeerConnection] Connection peerConnection state:", conn?.peerConnection?.connectionState);
      console.log("[usePeerConnection] Connection peerConnection iceConnectionState:", conn?.peerConnection?.iceConnectionState);
      
      if (conn?.open) {
        conn.send(message);
        console.log("[usePeerConnection] Message sent to", sanitizedToPeerId);
        dispatch(
          addMessage({
            sender: uniqueID, // Keep original ID for chat logic/display
            receiver: toPeerId, // Keep original ID for chat logic/display
            content: message,
            type: "text",
          })
        );
      } else {
        console.warn(
          "[usePeerConnection] Connection not open, queueing message for",
          sanitizedToPeerId
        );
        console.warn("[usePeerConnection] Connection state details:", {
          exists: !!conn,
          open: conn?.open,
          peer: conn?.peer,
          connectionState: conn?.peerConnection?.connectionState,
          iceConnectionState: conn?.peerConnection?.iceConnectionState
        });
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
