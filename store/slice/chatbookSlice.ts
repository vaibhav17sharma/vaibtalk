import { generateUUIDv4 } from "@/lib/utils";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createSelector } from 'reselect';

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
  receiver?: string; // username/peerId
  groupId?: string;
  senderName?: string; // For group chat display
  timestamp: string; // ISO string
  type: "text" | "file" | "voice";
}

export interface MessagesState {
  conversations: Record<string, Message[]>;
}

const getConversationKey = (peerA: string, peerB: string, groupId?: string) => {
  if (groupId) return groupId;
  return [peerA, peerB].sort().join("|");
};

const initialState: MessagesState = {
  conversations: {},
};

const messagesSlice = createSlice({
  name: "chatbook",
  initialState,
  reducers: {
    setMessages: {
      reducer(state, action: PayloadAction<{ messages: Message[]; currentUser: string; peerId: string; groupId?: string }>) {
        const { messages, currentUser, peerId, groupId } = action.payload;
        const key = getConversationKey(currentUser, peerId, groupId);
        state.conversations[key] = messages;
      },
      prepare(messages: Message[], currentUser: string, peerId: string, groupId?: string) {
        return { payload: { messages, currentUser, peerId, groupId } };
      }
    },
    addMessage: {
      reducer(state, action: PayloadAction<Message>) {
        const { sender, receiver, groupId } = action.payload;
        // If it's a group message, key is groupId.
        // If 1:1, key is sorted(sender, receiver).
        // receiver might be undefined for group message if we follow my schema, but here we need a second arg for getConversationKey if not group.
        // If groupId is present, use it.
        // If not, use sender and receiver.
        const key = getConversationKey(sender, receiver || "", groupId);
        const existing = state.conversations[key] || [];
        // Avoid duplicates if message with same ID exists
        if (!existing.find(m => m.id === action.payload.id)) {
          state.conversations[key] = [...existing, action.payload];
        }
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
    receiveMessage: {
      reducer(state, action: PayloadAction<Message>) {
        const { sender, receiver, groupId } = action.payload;
        const key = getConversationKey(sender, receiver || "", groupId);
        const existing = state.conversations[key] || [];
        if (!existing.find(m => m.id === action.payload.id)) {
          state.conversations[key] = [...existing, action.payload];
        }
      },
      prepare(payload: Message) {
        return { payload };
      }
    },
    clearConversation(
      state,
      action: PayloadAction<{ peerA: string; peerB: string; groupId?: string }>
    ) {
      const key = getConversationKey(
        action.payload.peerA,
        action.payload.peerB,
        action.payload.groupId
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
        groupId?: string;
        transferId: string;
        updatedFields: Partial<Message>;
      }>
    ) {
      const { sender, receiver, groupId, transferId, updatedFields } = action.payload;
      const key = getConversationKey(sender, receiver, groupId);
      const conversation = state.conversations[key];

      if (!conversation) return;

      const messageIndex = conversation.findIndex(
        (msg) =>
          (msg.type === "file" || msg.type === "voice") &&
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

export const makeSelectMessages = (currentUser: string, activePeer: string, isGroup: boolean = false) =>
  createSelector(
    (state: { chatbook: MessagesState }) => state.chatbook.conversations,
    (conversations: any): Message[] => {
      const key = getConversationKey(currentUser, activePeer, isGroup ? activePeer : undefined);
      return conversations[key] || [];
    }
  );


export const {
  addMessage,
  setMessages,
  receiveMessage,
  clearConversation,
  clearAllMessages,
  updateMessageByTransferId,
} = messagesSlice.actions;
export default messagesSlice.reducer;
