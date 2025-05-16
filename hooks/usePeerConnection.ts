"use client";

import peerManager from "@/store/peerManager";
import { addMessage } from "@/store/slice/chatbookSlice";
import {
  addConnection,
  addMediaConnection,
  appendFileChunk,
  clearMessageQueue,
  enqueueMessage,
  finalizeFile,
  removeConnection,
  removeMediaConnection,
  setActiveMediaType,
  setConnectionStatus,
  setFileMeta,
  setPeerId,
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

  // For media callbacks only (not for chat messages)
  const mediaCallbacksRef = useRef<MediaCallbacks | undefined>(mediaCallbacks);
  useEffect(() => {
    mediaCallbacksRef.current = mediaCallbacks;
  }, [mediaCallbacks]);

  // Setup incoming data connection
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

      conn.on("data", (data: unknown) => {
        console.log("[usePeerConnection] Received data from", conn.peer, data);
        if (conn.peer === uniqueID) return; // Ignore self-sent messages
        // --- Redux chat message dispatch ---
        if (typeof data === "string") {
          dispatch(
            addMessage({
              sender: conn.peer,
              receiver: uniqueID,
              content: data,
              type: "text",
            })
          );
        } else if (data instanceof ArrayBuffer) {
          dispatch(appendFileChunk({ from: conn.peer, chunk: data }));
          // File chunks are handled in peerSlice; message is added on finalize
        } else if (typeof data === "object" && (data as any)?.isMeta) {
          const meta = data as FileMeta;
          dispatch(setFileMeta({ from: conn.peer, meta }));
        } else if (data === "__end__") {
          dispatch(finalizeFile({ from: conn.peer }));
        }
        // --- End Redux chat message dispatch ---
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

  // Setup peer and listeners
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
      console.log(
        "[usePeerConnection] sendMessage",
        message,
        "to",
        toPeerId,
      );
      if (conn?.open) {
        conn.send(message);
        console.log("[usePeerConnection] Message sent to", toPeerId);
        // Also add to Redux (as outgoing message)
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
    (file: File, toPeerId: string) => {
      const conn = peerManager.getConnection(toPeerId);
      if (!conn?.open) {
        console.warn(
          "[usePeerConnection] Cannot send file, connection not open for",
          toPeerId
        );
        return false;
      }

      const chunkSize = 16 * 1024;
      let offset = 0;

      // Send file meta
      conn.send({ isMeta: true, fileName: file.name, fileSize: file.size });

      const sendChunk = () => {
        const slice = file.slice(offset, offset + chunkSize);
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result instanceof ArrayBuffer) {
            conn.send(reader.result);
            offset += chunkSize;
            if (offset < file.size) {
              sendChunk();
            } else {
              conn.send("__end__");
              // Add to Redux as outgoing file message
              const url = URL.createObjectURL(file);
              dispatch(
                addMessage({
                  sender: uniqueID,
                  receiver: toPeerId,
                  content: { url, name: file.name, size: file.size, type: file.type },
                  type: "file",
                })
              );
              console.log("[usePeerConnection] File sent to", toPeerId);
            }
          }
        };
        reader.readAsArrayBuffer(slice);
      };

      sendChunk();
      return true;
    },
    [dispatch, uniqueID]
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
