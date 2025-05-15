// store.ts
import { configureStore } from "@reduxjs/toolkit";
import chatBookReducer from "./slice/chatbookSlice";
import contactReducer from "./slice/contactSlice";
import peerReducer from "./slice/peerSlice";
import sessionReducer from "./slice/sessionSlice";
import userProfileReducer from "./slice/userProfileSlice";

const store = configureStore({
  reducer: {
    userProfile: userProfileReducer,
    peer: peerReducer,
    contacts: contactReducer,
    session: sessionReducer,
    chatbook: chatBookReducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["peer/initialize/fulfilled"],
        ignoredPaths: ["peer.peer"],
      },
    }),
});

export default store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
