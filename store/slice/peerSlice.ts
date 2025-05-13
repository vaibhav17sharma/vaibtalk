import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import Peer, { DataConnection, MediaConnection } from "peerjs";
import { RootState } from "../store";

type MediaType = "none" | "video" | "screen";

export interface PeerState {
  peer: Peer | null;
  peerId: string | null;
  connections: Record<string, DataConnection>;
  mediaConnections: Record<string, MediaConnection>;
  activeMediaType: Record<string, MediaType>;
  connectionStatus: "disconnected" | "connecting" | "connected";
  messageQueue: Record<string, any[]>;
  chatMessages: Record<string, any[]>;
  receivedFiles: Record<string, File[]>;
  incomingFileChunks: Record<string, ArrayBuffer[]>;
  incomingFileMeta: Record<string, { fileName: string; fileSize: number }>;
}

const initialState: PeerState = {
  peer: null,
  peerId: null,
  connections: {},
  mediaConnections: {},
  activeMediaType: {},
  connectionStatus: "disconnected",
  messageQueue: {},
  chatMessages: {},
  receivedFiles: {},
  incomingFileChunks: {},
  incomingFileMeta: {},
};

export const initializePeer = createAsyncThunk<
  Peer,
  string,
  { state: RootState }
>("peer/initialize", async (uniqueID, { dispatch, getState }) => {
  const peer = new Peer(uniqueID, {
    host: "localhost",
    port: 9000,
    path: "/peer-server/vaibtalk",
    secure: false,
    config: {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    },
  });

  peer.on("open", (id) => {
    console.log("Your Peer ID:", id);
    dispatch(setPeerId(id));
  });

  peer.on("connection", (conn: DataConnection) => {
    const { connections } = getState().peer;
    if (connections[conn.peer]) {
      conn.close();
      return;
    }

    conn.on("open", () => {
      dispatch(addConnection(conn));
      dispatch(setStatus("connected"));
      
      const queued = getState().peer.messageQueue[conn.peer] || [];
      queued.forEach((msg: any) => conn.send(msg));
      dispatch(clearMessageQueue(conn.peer));
    });

    conn.on("close", () => dispatch(removeConnection(conn.peer)));
    conn.on("error", (err) => {
      console.error("Connection error:", err);
      dispatch(setStatus("disconnected"));
    });

    conn.on("data", (data: any) => {
      const from = conn.peer;

      if (data === "__end__") {
        dispatch(finalizeFile({ from }));
      } else if (data?.isMeta) {
        dispatch(setFileMeta({ from, meta: data }));
      } else if (data instanceof ArrayBuffer) {
        dispatch(appendFileChunk({ from, chunk: data }));
      } else {
        dispatch(addChatMessage({ from, message: data }));
      }
    });
  });
  peer.on("call", (call: MediaConnection) => {
    const existingCall = getState().peer.mediaConnections[call.peer];
    if (existingCall) {
      call.close();
      return;
    }

    call.on("close", () => {
      dispatch(removeMediaConnection(call.peer));
    });

    // Auto-answer for demo (you might want user confirmation)
    call.answer();
    dispatch(addMediaConnection(call));
  });

  return peer;
});

const peerSlice = createSlice({
  name: "peer",
  initialState,
  reducers: {
    setPeer(state, action: PayloadAction<Peer>) {
      state.peer = action.payload;
    },
    setPeerId(state, action: PayloadAction<string>) {
      state.peerId = action.payload;
    },
    setStatus(state, action: PayloadAction<PeerState["connectionStatus"]>) {
      state.connectionStatus = action.payload;
    },
    addConnection(state, action: PayloadAction<DataConnection>) {
      const conn = action.payload;
      state.connections[conn.peer] = conn;
    },
    removeConnection(state, action: PayloadAction<string>) {
      delete state.connections[action.payload];
      if (Object.keys(state.connections).length === 0) {
        state.connectionStatus = "disconnected";
      }
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

    addChatMessage(
      state,
      action: PayloadAction<{ from: string; message: any }>
    ) {
      const { from, message } = action.payload;
      if (!state.chatMessages[from]) {
        state.chatMessages[from] = [];
      }
      state.chatMessages[from].push(message);
    },

    setFileMeta(
      state,
      action: PayloadAction<{
        from: string;
        meta: { fileName: string; fileSize: number };
      }>
    ) {
      state.incomingFileMeta[action.payload.from] = action.payload.meta;
    },

    appendFileChunk(
      state,
      action: PayloadAction<{ from: string; chunk: ArrayBuffer }>
    ) {
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
    addMediaConnection(state, action: PayloadAction<MediaConnection>) {
      state.mediaConnections[action.payload.peer] = action.payload;
    },
    removeMediaConnection(state, action: PayloadAction<string>) {
      delete state.mediaConnections[action.payload];
      state.activeMediaType[action.payload] = "none";
    },
    setActiveMediaType(
      state,
      action: PayloadAction<{ peerId: string; type: MediaType }>
    ) {
      const { peerId, type } = action.payload;
      state.activeMediaType[peerId] = type;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(initializePeer.fulfilled, (state, action) => {
      state.peer = action.payload;
    });
  },
});


export const {
  setPeer,
  setPeerId,
  setStatus,
  addConnection,
  removeConnection,
  enqueueMessage,
  clearMessageQueue,
  addChatMessage,
  setFileMeta,
  appendFileChunk,
  finalizeFile,
  addMediaConnection,
  removeMediaConnection,
  setActiveMediaType,
} = peerSlice.actions;

export default peerSlice.reducer;