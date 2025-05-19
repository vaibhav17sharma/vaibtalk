import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type MediaType = "none" | "video" | "screen";

export interface PeerState {
  peerId: string | null;
  connectedPeers: string[];
  connectionStatus: "disconnected" | "connecting" | "connected";
  activeMediaType: Record<string, MediaType>;
  messageQueue: Record<string, any[]>;
  fileTransfers: Record<
    string,
    {
      transferId: string;
      peerId: string;
      direction: "incoming" | "outgoing";
      progress: number;
      status: "pending" | "active" | "completed" | "cancelled";
      fileName?: string;
      fileSize?: number;
      mimeType?: string;
    }
  >;
}

const initialState: PeerState = {
  peerId: null,
  connectedPeers: [],
  connectionStatus: "disconnected",
  activeMediaType: {},
  messageQueue: {},
  fileTransfers: {},
};

const peerSlice = createSlice({
  name: "peer",
  initialState,
  reducers: {
    setPeerId(state, action: PayloadAction<string>) {
      state.peerId = action.payload;
    },
    setConnectionStatus(
      state,
      action: PayloadAction<PeerState["connectionStatus"]>
    ) {
      state.connectionStatus = action.payload;
    },
    addConnection(state, action: PayloadAction<string>) {
      if (!state.connectedPeers.includes(action.payload)) {
        state.connectedPeers.push(action.payload);
      }
    },
    removeConnection(state, action: PayloadAction<string>) {
      state.connectedPeers = state.connectedPeers.filter(
        (id) => id !== action.payload
      );
      if (state.connectedPeers.length === 0) {
        state.connectionStatus = "disconnected";
      }
    },
    addMediaConnection(state, action: PayloadAction<string>) {
      state.activeMediaType[action.payload] = "video";
    },
    removeMediaConnection(state, action: PayloadAction<string>) {
      delete state.activeMediaType[action.payload];
    },
    setActiveMediaType(
      state,
      action: PayloadAction<{ peerId: string; type: MediaType }>
    ) {
      state.activeMediaType[action.payload.peerId] = action.payload.type;
    },
    enqueueMessage(
      state,
      action: PayloadAction<{ toPeerId: string; message: any }>
    ) {
      const { toPeerId, message } = action.payload;
      const serializableMessage = {
        ...message,
        timestamp:
          typeof message.timestamp === "string"
            ? message.timestamp
            : message.timestamp?.toISOString?.() ?? new Date().toISOString(),
      };

      if (!state.messageQueue[toPeerId]) {
        state.messageQueue[toPeerId] = [];
      }

      state.messageQueue[toPeerId].push(serializableMessage);
    },
    clearMessageQueue(state, action: PayloadAction<string>) {
      delete state.messageQueue[action.payload];
    },
    startFileTransfer(
      state,
      action: PayloadAction<{
        transferId: string;
        peerId: string;
        direction: "incoming" | "outgoing";
        fileName?: string;
        fileSize?: number;
        mimeType?: string;
      }>
    ) {
      const { transferId, ...meta } = action.payload;
      state.fileTransfers[transferId] = {
        transferId,
        ...meta,
        progress: 0,
        status: "pending",
      };
    },

    updateTransferProgress(
      state,
      action: PayloadAction<{
        transferId: string;
        progress: number;
      }>
    ) {
      const transfer = state.fileTransfers[action.payload.transferId];
      if (transfer) {
        transfer.progress = action.payload.progress;
        transfer.status = "active";
      }
    },

    completeFileTransfer(state, action: PayloadAction<string>) {
      const transfer = state.fileTransfers[action.payload];
      if (transfer) {
        transfer.status = "completed";
      }
    },

    cancelFileTransfer(state, action: PayloadAction<string>) {
      const transfer = state.fileTransfers[action.payload];
      if (transfer) {
        transfer.status = "cancelled";
      }
    },
  },
});

export const {
  setPeerId,
  setConnectionStatus,
  addConnection,
  removeConnection,
  addMediaConnection,
  removeMediaConnection,
  setActiveMediaType,
  enqueueMessage,
  clearMessageQueue,
  startFileTransfer,
  updateTransferProgress,
  completeFileTransfer,
  cancelFileTransfer,
} = peerSlice.actions;

export default peerSlice.reducer;
