import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type MediaType = "none" | "video" | "screen";

export interface PeerState {
  peerId: string | null;
  connectedPeers: string[];
  connectionStatus: "disconnected" | "connecting" | "connected";
  activeMediaType: Record<string, MediaType>;
  messageQueue: Record<string, any[]>;
  chatMessages: Record<string, any[]>;
  receivedFiles: Record<string, File[]>;
  incomingFileChunks: Record<string, ArrayBuffer[]>;
  incomingFileMeta: Record<string, { fileName: string; fileSize: number }>;
}

const initialState: PeerState = {
  peerId: null,
  connectedPeers: [],
  connectionStatus: "disconnected",
  activeMediaType: {},
  messageQueue: {},
  chatMessages: {},
  receivedFiles: {},
  incomingFileChunks: {},
  incomingFileMeta: {},
};

const peerSlice = createSlice({
  name: "peer",
  initialState,
  reducers: {
    setPeerId(state, action: PayloadAction<string>) {
      state.peerId = action.payload;
    },
    setConnectionStatus(state, action: PayloadAction<PeerState["connectionStatus"]>) {
      state.connectionStatus = action.payload;
    },
    addConnection(state, action: PayloadAction<string>) {
      if (!state.connectedPeers.includes(action.payload)) {
        state.connectedPeers.push(action.payload);
      }
    },
    removeConnection(state, action: PayloadAction<string>) {
      state.connectedPeers = state.connectedPeers.filter(id => id !== action.payload);
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
    setActiveMediaType(state, action: PayloadAction<{ peerId: string; type: MediaType }>) {
      state.activeMediaType[action.payload.peerId] = action.payload.type;
    },
    enqueueMessage(state, action: PayloadAction<{ toPeerId: string; message: any }>) {
      const { toPeerId, message } = action.payload;
      const serializableMessage = {
        ...message,
        timestamp: typeof message.timestamp === "string"
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
    addChatMessage(state, action: PayloadAction<{ from: string; message: any }>) {
      const { from, message } = action.payload;
      if (!state.chatMessages[from]) {
        state.chatMessages[from] = [];
      }
      state.chatMessages[from].push(message);
    },
    setFileMeta(state, action: PayloadAction<{ from: string; meta: { fileName: string; fileSize: number } }>) {
      state.incomingFileMeta[action.payload.from] = action.payload.meta;
    },
    appendFileChunk(state, action: PayloadAction<{ from: string; chunk: ArrayBuffer }>) {
      const { from, chunk } = action.payload;
      if (!state.incomingFileChunks[from]) {
        state.incomingFileChunks[from] = [];
      }
      state.incomingFileChunks[from].push(chunk);
    },
    finalizeFile(state, action: PayloadAction<{ from: string }>) {
      const { from } = action.payload;
      const chunks = state.incomingFileChunks[from];
      const meta = state.incomingFileMeta[from];

      if (!chunks || !meta) return;

      const blob = new Blob(chunks);
      const file = new File([blob], meta.fileName || "download.bin");

      if (!state.receivedFiles[from]) {
        state.receivedFiles[from] = [];
      }
      state.receivedFiles[from].push(file);

      delete state.incomingFileChunks[from];
      delete state.incomingFileMeta[from];
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
  addChatMessage,
  setFileMeta,
  appendFileChunk,
  finalizeFile,
} = peerSlice.actions;

export default peerSlice.reducer;
