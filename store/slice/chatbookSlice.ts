import { generateUUIDv4 } from "@/lib/utils";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type MessageContent = string | { size: number|string; url: string, name: string, type: string };

export interface Message {
  id: string;
  content: MessageContent;
  sender: string; // username/peerId
  receiver: string; // username/peerId
  timestamp: string; // ISO string
  type: "text" | "file";
}

export interface MessagesState {
  conversations: Record<string, Message[]>;
}

const getConversationKey = (peerA: string, peerB: string) =>
  [peerA, peerB].sort().join("|");

const initialState: MessagesState = {
  conversations: {},
};

const messagesSlice = createSlice({
  name: "chatbook",
  initialState,
  reducers: {
    addMessage: {
      reducer(state, action: PayloadAction<Message>) {
        const { sender, receiver } = action.payload;
        const key = getConversationKey(sender, receiver);
        if (!state.conversations[key]) {
          state.conversations[key] = [];
        }
        state.conversations[key].push(action.payload);
      },
      // Prepare callback auto-generates id and timestamp
      prepare(payload: Omit<Message, "id" | "timestamp">) {
        return {
          payload: {
            ...payload,
            id: generateUUIDv4(),
            timestamp: new Date().toISOString(),
          },
        };
      },
    },
    clearConversation(
      state,
      action: PayloadAction<{ peerA: string; peerB: string }>
    ) {
      const key = getConversationKey(
        action.payload.peerA,
        action.payload.peerB
      );
      delete state.conversations[key];
    },
    clearAllMessages(state) {
      state.conversations = {};
    },
  },
});

export const selectMessages =
  (currentUser: string, activePeer: string) =>
  (state: { chatbook: MessagesState }) => {
    const key = getConversationKey(currentUser, activePeer);
    return state.chatbook.conversations[key] || [];
  };

export const { addMessage, clearConversation, clearAllMessages } =
  messagesSlice.actions;
export default messagesSlice.reducer;
