import { generateUUIDv4 } from "@/lib/utils";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type MessageContent =
  | string
  | {
      transferId: string;
      size: number | string;
      url?: string;
      name: string;
      type: string;
      status?: "pending" | "completed" | "failed";
      progress?: number;
    };

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
    updateMessageByTransferId(
      state,
      action: PayloadAction<{
        sender: string;
        receiver: string;
        transferId: string;
        updatedFields: Partial<Message>;
      }>
    ) {
      const { sender, receiver, transferId, updatedFields } = action.payload;
      const key = getConversationKey(sender, receiver);
      const conversation = state.conversations[key];

      if (!conversation) return;

      const messageIndex = conversation.findIndex(
        (msg) =>
          msg.type === "file" &&
          typeof msg.content !== "string" &&
          msg.content.transferId === transferId
      );

      if (messageIndex !== -1) {
        const existingMessage = conversation[messageIndex];

        let updatedContent = existingMessage.content;
        if (
          typeof existingMessage.content !== "string" &&
          updatedFields.content &&
          typeof updatedFields.content !== "string"
        ) {
          updatedContent = {
            ...existingMessage.content,
            ...updatedFields.content,
          };
        }

        state.conversations[key][messageIndex] = {
          ...existingMessage,
          ...updatedFields,
          content: updatedContent,
        };
      }
    },
  },
});

export const selectMessages =
  (currentUser: string, activePeer: string) =>
  (state: { chatbook: MessagesState }) => {
    const key = getConversationKey(currentUser, activePeer);
    return state.chatbook.conversations[key] || [];
  };

export const {
  addMessage,
  clearConversation,
  clearAllMessages,
  updateMessageByTransferId,
} = messagesSlice.actions;
export default messagesSlice.reducer;
