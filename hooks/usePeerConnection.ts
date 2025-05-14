"use client";

import {
  addChatMessage,
  addConnection,
  addMediaConnection,
  appendFileChunk,
  clearMessageQueue,
  enqueueMessage,
  finalizeFile,
  initializePeer,
  removeConnection,
  removeMediaConnection,
  setActiveMediaType,
  setFileMeta,
  setStatus,
} from "@/store/slice/peerSlice";
import type { RootState } from "@/store/store";
import { DataConnection, MediaConnection } from "peerjs";
import { useCallback, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "./useRedux";

export type FileMeta = { isMeta: true; fileName: string; fileSize: number };
export type PeerMessageType = string | ArrayBuffer | FileMeta | "__end__";

type Callbacks = {
  onConnect?: (peerID: string) => void;
  onMessage?: (msg: PeerMessageType, peerID: string) => void;
  onDisconnect?: (peerID: string) => void;
  onStream?: (peerID: string, stream: MediaStream) => void;
  onMediaChange?: (peerID: string, type: "none" | "video" | "screen") => void;
};

export default function usePeerConnection(
  uniqueID: string,
  callbacks?: Callbacks
) {
  const dispatch = useAppDispatch();

  const peer = useAppSelector((state: RootState) => state.peer.peer);
  const peerId = useAppSelector((state: RootState) => state.peer.peerId);
  const connections = useAppSelector(
    (state: RootState) => state.peer.connections
  );
  const mediaConnections = useAppSelector(
    (state: RootState) => state.peer.mediaConnections
  );
  const activeMediaType = useAppSelector(
    (state: RootState) => state.peer.activeMediaType
  );
  const connectionStatus = useAppSelector(
    (state: RootState) => state.peer.connectionStatus
  );

  const localMediaStreamRef = useRef<MediaStream | null>(null);
  const mediaConnectionsRef = useRef<{ [peerId: string]: MediaConnection }>({});

  // Initialize peer connection
  useEffect(() => {
    if (!peer && uniqueID) {
      dispatch(initializePeer(uniqueID));
    }
  }, [uniqueID, peer, dispatch]);

  // Setup data connection handlers
  const setupConnection = useCallback(
    (conn: DataConnection) => {
      dispatch(addConnection(conn));

      conn.on("open", () => {
        dispatch(setStatus("connected"));
        callbacks?.onConnect?.(conn.peer);
        const queued: any = [];
        queued.forEach((msg: any) => conn.send(msg));
        dispatch(clearMessageQueue(conn.peer));
      });

      conn.on("close", () => {
        dispatch(removeConnection(conn.peer));
        callbacks?.onDisconnect?.(conn.peer);
      });

      conn.on("error", (err) => {
        console.error("Connection error:", err);
        dispatch(setStatus("disconnected"));
      });

      conn.on("data", (data: unknown) => {
        if (data === "__end__") {
          dispatch(finalizeFile({ from: conn.peer }));
          callbacks?.onMessage?.("__end__", conn.peer);
        } else if (typeof data === "string") {
          dispatch(addChatMessage({ from: conn.peer, message: data }));
          callbacks?.onMessage?.(data, conn.peer);
        } else if (data instanceof ArrayBuffer) {
          dispatch(appendFileChunk({ from: conn.peer, chunk: data }));
          callbacks?.onMessage?.(data, conn.peer);
        } else if (typeof data === "object" && (data as any).isMeta) {
          const meta = data as FileMeta;
          dispatch(setFileMeta({ from: conn.peer, meta }));
          callbacks?.onMessage?.(meta, conn.peer);
        }
      });
    },
    [dispatch, callbacks]
  );

  // Handle incoming media connections
  useEffect(() => {
    if (!peer) return;

    const handleCall = (call: MediaConnection) => {
      const answerCall = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          call.answer(stream);
          dispatch(addMediaConnection(call));

          call.on("stream", (remoteStream) => {
            callbacks?.onStream?.(call.peer, remoteStream);
            dispatch(setActiveMediaType({ peerId: call.peer, type: "video" }));
          });

          call.on("close", () => {
            dispatch(removeMediaConnection(call.peer));
            callbacks?.onMediaChange?.(call.peer, "none");
          });
        } catch (error) {
          console.error("Failed to answer call:", error);
          call.close();
        }
      };

      // For screen sharing, you might want different handling
      if (!mediaConnections[call.peer]) {
        answerCall();
      }
    };

    peer.on("call", handleCall);
    return () => {
      peer.off("call", handleCall);
    };
  }, [peer, mediaConnections, dispatch, callbacks]);

  // Connection management
  const connect = useCallback(
    (targetId: string) => {
      if (!peer || connections[targetId]) return;
      dispatch(setStatus("connecting"));
      const conn = peer.connect(targetId);
      setupConnection(conn);
    },
    [peer, connections, dispatch, setupConnection]
  );

  const disconnect = useCallback(
    (targetId: string) => {
      const conn = connections[targetId];
      if (conn) {
        conn.close();
        dispatch(removeConnection(targetId));
      }
      endMedia(targetId);
    },
    [connections, dispatch]
  );

  // Media handling
  const switchMedia = useCallback(
    async (targetId: string, mediaType: "video" | "screen") => {
      if (!peer || !connections[targetId]) return;

      // End existing media connection
      if (mediaConnectionsRef.current[targetId]) {
        mediaConnectionsRef.current[targetId].close();
        dispatch(removeMediaConnection(targetId));
      }

      try {
        const stream =
          mediaType === "video"
            ? await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
              })
            : await navigator.mediaDevices.getDisplayMedia({ video: true });

        localMediaStreamRef.current = stream;
        const call = peer.call(targetId, stream);
        mediaConnectionsRef.current[targetId] = call;

        dispatch(addMediaConnection(call));
        dispatch(setActiveMediaType({ peerId: targetId, type: mediaType }));
        callbacks?.onMediaChange?.(targetId, mediaType);

        call.on("stream", (remoteStream) => {
          callbacks?.onStream?.(targetId, remoteStream);
        });

        call.on("close", () => {
          dispatch(removeMediaConnection(targetId));
          callbacks?.onMediaChange?.(targetId, "none");
        });

        return call;
      } catch (error) {
        console.error("Error starting media:", error);
        dispatch(setActiveMediaType({ peerId: targetId, type: "none" }));
      }
    },
    [peer, connections, dispatch, callbacks]
  );

  const endMedia = useCallback(
    (targetId: string) => {
      const call = mediaConnectionsRef.current[targetId];
      if (call) {
        call.close();
        dispatch(removeMediaConnection(targetId));
        callbacks?.onMediaChange?.(targetId, "none");
      }
      if (localMediaStreamRef.current) {
        localMediaStreamRef.current
          .getTracks()
          .forEach((track) => track.stop());
        localMediaStreamRef.current = null;
      }
    },
    [dispatch, callbacks]
  );

  // Messaging
  const sendMessage = useCallback(
    (message: string, toPeerId: string) => {
      const conn = connections[toPeerId];
      if (conn?.open) {
        conn.send(message);
      } else {
        dispatch(enqueueMessage({ toPeerId, message }));
      }
    },
    [connections, dispatch]
  );

  const sendFile = useCallback(
    (file: File, toPeerId: string) => {
      const conn = connections[toPeerId];
      if (!conn?.open) return false;

      const chunkSize = 16 * 1024;
      let offset = 0;

      conn.send({
        isMeta: true,
        fileName: file.name,
        fileSize: file.size,
      });

      const sendChunk = () => {
        const slice = file.slice(offset, offset + chunkSize);
        const reader = new FileReader();

        reader.onload = () => {
          if (reader.result instanceof ArrayBuffer) {
            conn.send(reader.result);
            offset += chunkSize;
            offset < file.size ? sendChunk() : conn.send("__end__");
          }
        };
        reader.readAsArrayBuffer(slice);
      };

      sendChunk();
      return true;
    },
    [connections]
  );

  return {
    peerId,
    connections,
    connectionStatus,
    mediaConnections,
    activeMediaType,
    connect,
    disconnect,
    sendMessage,
    sendFile,
    switchMedia,
    endMedia,
  };
}
