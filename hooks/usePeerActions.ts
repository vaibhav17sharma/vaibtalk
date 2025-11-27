"use client";

import peerManager from "@/store/peerManager";
import {
  addMessage,
} from "@/store/slice/chatbookSlice";
import {
  addConnection,
  addMediaConnection,
  enqueueMessage,
  removeConnection,
  removeMediaConnection,
  setActiveContact,
  setActiveMediaType,
  setIncomingCall,
} from "@/store/slice/peerSlice";
import { RootState } from "@/store/store";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "./useRedux";

/**
 * Hook to access peer connection functions without creating a new Peer instance
 * Use this in pages that need to send messages/files but shouldn't create their own Peer
 */
export function usePeerActions() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const peerId = useAppSelector((state: RootState) => state.peer.peerId);
  const connectionStatus = useAppSelector(
    (state: RootState) => state.peer.connectionStatus
  );

  const sanitizePeerId = (id: string) => {
    if (!id) return "";
    return id.replace(/[^a-zA-Z0-9_-]/g, "_");
  };

  const sendMessage = useCallback(
    (message: string, toPeerId: string, fromPeerId: string) => {
      const sanitizedToPeerId = sanitizePeerId(toPeerId);
      const conn = peerManager.getConnection(sanitizedToPeerId);
      
      console.log("[usePeerActions] sendMessage", message, "to", sanitizedToPeerId);
      console.log("[usePeerActions] Connection exists:", !!conn);
      console.log("[usePeerActions] Connection open:", conn?.open);
      
      if (conn?.open) {
        conn.send({
          type: "text",
          content: message,
          senderId: fromPeerId // Send original ID
        });
        console.log("[usePeerActions] Message sent to", sanitizedToPeerId);
        dispatch(
          addMessage({
            sender: fromPeerId,
            receiver: toPeerId,
            content: message,
            type: "text",
          })
        );
      } else {
        console.warn(
          "[usePeerActions] Connection not open, queueing message for",
          sanitizedToPeerId
        );
        dispatch(enqueueMessage({ toPeerId: sanitizedToPeerId, message }));
      }
    },
    [dispatch]
  );

  const sendFile = useCallback(
    async (file: File, toPeerId: string, fromPeerId: string) => {
      const sanitizedToPeerId = sanitizePeerId(toPeerId);
      const conn = peerManager.getConnection(sanitizedToPeerId);
      
      if (!conn?.open) {
        console.warn(
          "[usePeerActions] Cannot send file, connection not open for",
          toPeerId
        );
        return false;
      }

      const transferId = `${fromPeerId}-${Date.now()}`;
      const CHUNK_SIZE = 16 * 1024;

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
          conn.send({
            type: "file-chunk",
            transferId,
            chunk: arrayBuffer,
            offset,
          });
          offset += CHUNK_SIZE;
        }

        return true;
      } catch (error) {
        console.error("[usePeerActions] File send error:", error);
        return false;
      }
    },
    []
  );

  const connect = useCallback(
    async (targetId: string) => {
      const sanitizedTargetId = sanitizePeerId(targetId);
      
      if (!peerManager.peer) {
        console.warn("[usePeerActions] No Peer instance available");
        return;
      }
      
      if (peerManager.hasConnection(sanitizedTargetId)) {
        console.log("[usePeerActions] Already connected to", sanitizedTargetId);
        return;
      }

      console.log("[usePeerActions] Initiating connection to:", sanitizedTargetId);
      
      const conn = peerManager.peer.connect(sanitizedTargetId, {
        reliable: true,
        metadata: { connectingFrom: peerManager.peer.id }
      });

      // Setup listeners for this outgoing connection
      // This duplicates logic from usePeerConnection but is necessary because
      // peer.on('connection') only fires for INCOMING connections.
      
      peerManager.addConnection(conn);

      conn.on("open", () => {
        console.log("[usePeerActions] Outgoing connection open:", conn.peer);
        dispatch(addConnection(conn.peer));
      });

      conn.on("data", (data: any) => {
        console.log("[usePeerActions] Received data from", conn.peer);
        const senderId = data?.senderId || conn.peer;

        if (data?.type === "text") {
          dispatch(
            addMessage({
              sender: senderId,
              receiver: peerManager.peer?.id || "",
              content: data.content,
              type: "text",
            })
          );
        }
        // Note: File transfer logic omitted for brevity in this hook fallback.
        // Ideally, usePeerConnection should be refactored to share setup logic.
      });

      conn.on("close", () => {
        console.log("[usePeerActions] Connection closed:", conn.peer);
        peerManager.removeConnection(conn);
        if (!peerManager.hasConnection(conn.peer)) {
           dispatch(removeConnection(conn.peer));
        }
      });

      conn.on("error", (err) => {
        console.error("[usePeerActions] Connection error:", err);
      });
    },
    [dispatch],
  );

  const switchMedia = useCallback(
    async (targetId: string, mediaType: "video" | "screen" | "none") => {
      const sanitizedTargetId = sanitizePeerId(targetId);
      
      if (!peerManager.peer || !peerManager.hasConnection(sanitizedTargetId)) {
        console.warn("[usePeerActions] Cannot switch media, missing peer or connection");
        return;
      }

      peerManager.removeMediaConnection(sanitizedTargetId);
      
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
            audio: false,
          });
        } else if (mediaType === "none") {
          stream = new MediaStream();
        }

        const call = peerManager.peer.call(sanitizedTargetId, stream as MediaStream);
        peerManager.addMediaConnection(call);

        return call;
      } catch (err) {
        console.error("[usePeerActions] Error switching media:", err);
      }
    },
    []
  );

  const endMedia = useCallback(
    (targetId: string) => {
      const sanitizedTargetId = sanitizePeerId(targetId);
      console.log("[usePeerActions] Ending media with:", sanitizedTargetId);
      peerManager.removeMediaConnection(sanitizedTargetId);
    },
    []
  );

  const acceptIncomingCall = useCallback(async () => {
    const call = peerManager.pendingCall;
    if (!call) {
      console.warn("[usePeerActions] No pending call to accept");
      return;
    }

    try {
      console.log("[usePeerActions] Accepting call from:", call.peer);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      
      call.answer(stream);
      peerManager.addMediaConnection(call);
      dispatch(addMediaConnection(call.peer));
      
      // Clear pending call state
      peerManager.pendingCall = null;
      dispatch(setIncomingCall(null));

      // Set active contact and redirect
      dispatch(setActiveContact({
        username: call.peer,
        type: "call",
      }));
      
      router.push("/call");

      call.on("stream", (remoteStream) => {
        console.log("[usePeerActions] Received remote stream from:", call.peer);
        peerManager.setRemoteStream(call.peer, remoteStream); // Store stream
        dispatch(setActiveMediaType({ peerId: call.peer, type: "video" }));
      });

      call.on("close", () => {
        console.log("[usePeerActions] Call closed with:", call.peer);
        peerManager.removeMediaConnection(call.peer);
        dispatch(removeMediaConnection(call.peer));
      });

    } catch (error) {
      console.error("[usePeerActions] Failed to accept call:", error);
      call.close();
      peerManager.pendingCall = null;
      dispatch(setIncomingCall(null));
    }
  }, [dispatch, router]);

  const rejectIncomingCall = useCallback(() => {
    const call = peerManager.pendingCall;
    if (call) {
      console.log("[usePeerActions] Rejecting call from:", call.peer);
      call.close();
      peerManager.pendingCall = null;
    }
    dispatch(setIncomingCall(null));
  }, [dispatch]);

  return {
    peerId,
    connectionStatus,
    sendMessage,
    sendFile,
    connect,
    switchMedia,
    endMedia,
    acceptIncomingCall,
    rejectIncomingCall,
  };
}
