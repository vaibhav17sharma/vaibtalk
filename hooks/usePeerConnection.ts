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

  const localMediaStreamRef = useRef<MediaStream | null>(null);

  const mediaCallbacksRef = useRef<MediaCallbacks | undefined>(mediaCallbacks);
  useEffect(() => {
    mediaCallbacksRef.current = mediaCallbacks;
  }, [mediaCallbacks]);

  const setupConnection = useCallback(
    (conn: DataConnection) => {
      console.log("[usePeerConnection] Setting up connection with:", conn.peer);

      peerManager.addConnection(conn);
      dispatch(addConnection(conn.peer));

      conn.on("open", () => {
        console.log("[usePeerConnection] Connection open with:", conn.peer);
        dispatch(setConnectionStatus("connected"));
        dispatch(clearMessageQueue(conn.peer));
      });

      conn.on("data", async (data: any) => {
        console.log(
          "[usePeerConnection] Received data from",
          conn.peer,
          data?.type
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
      const peer = new Peer(uniqueID, {
        host: "192.168.31.111",
        port: 9000,
        path: "/peer-server/vaibtalk",
        secure: false,
        config: {
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        },
      });

      peerManager.peer = peer;

      peer.on("open", (id) => {
        console.log("[usePeerConnection] Peer open with ID:", id);
        dispatch(setPeerId(id));
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

        return () => {
          peerManager.reset();
        };
      });
    }
  }, [uniqueID, setupConnection, dispatch]);

  const connect = useCallback(
    (targetId: string) => {
      if (!peerManager.peer) {
        console.warn("[usePeerConnection] No Peer instance available");
        return;
      }
      if (peerManager.hasConnection(targetId)) {
        console.log("[usePeerConnection] Already connected to", targetId);
        return;
      }
      dispatch(setConnectionStatus("connecting"));
      console.log("[usePeerConnection] Connecting to peer:", targetId);
      const conn = peerManager.peer.connect(targetId);
      setupConnection(conn);
    },
    [dispatch, setupConnection]
  );

  const disconnect = useCallback(
    (targetId: string) => {
      console.log("[usePeerConnection] Disconnecting from peer:", targetId);
      peerManager.removeConnection(targetId);
      dispatch(removeConnection(targetId));
      endMedia(targetId);
    },
    [dispatch]
  );

  const switchMedia = useCallback(
    async (targetId: string, mediaType: "video" | "screen") => {
      if (!peerManager.peer || !peerManager.hasConnection(targetId)) {
        console.warn(
          "[usePeerConnection] Cannot switch media, missing peer or connection"
        );
        return;
      }
      peerManager.removeMediaConnection(targetId);
      dispatch(removeMediaConnection(targetId));

      try {
        const stream =
          mediaType === "video"
            ? await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
              })
            : await navigator.mediaDevices.getDisplayMedia({ video: true });

        localMediaStreamRef.current = stream;
        const call = peerManager.peer.call(targetId, stream);
        peerManager.addMediaConnection(call);
        dispatch(addMediaConnection(targetId));
        dispatch(setActiveMediaType({ peerId: targetId, type: mediaType }));
        mediaCallbacksRef.current?.onMediaChange?.(targetId, mediaType);

        call.on("stream", (remoteStream) => {
          console.log(
            "[usePeerConnection] Received remote stream from:",
            targetId
          );
          mediaCallbacksRef.current?.onStream?.(targetId, remoteStream);
        });

        call.on("close", () => {
          console.log("[usePeerConnection] Media call closed with:", targetId);
          peerManager.removeMediaConnection(targetId);
          dispatch(removeMediaConnection(targetId));
          mediaCallbacksRef.current?.onMediaChange?.(targetId, "none");
        });

        return call;
      } catch (err) {
        console.error("[usePeerConnection] Error switching media:", err);
        dispatch(setActiveMediaType({ peerId: targetId, type: "none" }));
      }
    },
    [dispatch]
  );

  const endMedia = useCallback(
    (targetId: string) => {
      console.log("[usePeerConnection] Ending media with:", targetId);
      peerManager.removeMediaConnection(targetId);
      dispatch(removeMediaConnection(targetId));
      mediaCallbacksRef.current?.onMediaChange?.(targetId, "none");

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
      const conn = peerManager.getConnection(toPeerId);
      console.log("[usePeerConnection] sendMessage", message, "to", toPeerId);
      if (conn?.open) {
        conn.send(message);
        console.log("[usePeerConnection] Message sent to", toPeerId);
        dispatch(
          addMessage({
            sender: uniqueID,
            receiver: toPeerId,
            content: message,
            type: "text",
          })
        );
      } else {
        console.warn(
          "[usePeerConnection] Connection not open, queueing message for",
          toPeerId
        );
        dispatch(enqueueMessage({ toPeerId, message }));
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

      try {
        conn.send({
          type: "file-metadata",
          transferId,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        });

        let offset = 0;
        while (offset < file.size) {
          const chunk = file.slice(offset, offset + CHUNK_SIZE);
          const arrayBuffer = await chunk.arrayBuffer();
          
          await new Promise(resolve => setTimeout(resolve, 2000));

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
