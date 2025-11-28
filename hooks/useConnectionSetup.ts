import peerManager from "@/store/peerManager";
import {
    addMessage,
    updateMessageByTransferId,
} from "@/store/slice/chatbookSlice";
import {
    addConnection,
    clearMessageQueue,
    completeFileTransfer,
    removeConnection,
    removeMediaConnection,
    setActiveMediaType,
    setConnectionStatus,
    startFileTransfer,
    updateTransferProgress,
} from "@/store/slice/peerSlice";
import { RootState } from "@/store/store";
import { DataConnection } from "peerjs";
import { useCallback, useRef } from "react";
import { useAppDispatch, useAppSelector } from "./useRedux";

export function useConnectionSetup() {
  const dispatch = useAppDispatch();
  const messageQueue = useAppSelector(
    (state: RootState) => state.peer.messageQueue
  );
  const messageQueueRef = useRef(messageQueue);
  
  // Keep ref updated
  messageQueueRef.current = messageQueue;

  const setupConnection = useCallback(
    (conn: DataConnection, uniqueID: string) => {
      peerManager.addConnection(conn);

      if (conn.open) {
        dispatch(addConnection(conn.peer));
        dispatch(setConnectionStatus("connected"));
        dispatch(clearMessageQueue(conn.peer));
      }

      conn.on("open", () => {
        dispatch(addConnection(conn.peer));
        dispatch(setConnectionStatus("connected"));

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
          if (!transfer || !transfer.meta) return;

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

          if (receivedBytes >= transfer.meta.fileSize) {
            dispatch(completeFileTransfer(data.transferId));
            dispatch(
              updateMessageByTransferId({
                sender: senderId,
                receiver: uniqueID,
                transferId: data.transferId,
                updatedFields: {
                  content: {
                    transferId: data.transferId,
                    size: transfer.meta.fileSize,
                    name: transfer.meta.fileName,
                    type: transfer.meta.mimeType as string,
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
        } else if (typeof data === "string") {
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
        peerManager.removeConnection(conn);
        if (!peerManager.hasConnection(conn.peer)) {
          dispatch(removeConnection(conn.peer));
        }
      });

      conn.on("error", (err) => {
        console.error("[Connection] Error:", err);
        dispatch(setConnectionStatus("disconnected"));
      });
    },
    [dispatch]
  );

  return { setupConnection };
}
