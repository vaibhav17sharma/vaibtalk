import { flattenContacts } from "@/lib/utils";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";

export interface Contact {
  id: string;
  contactId: string;
  contactName: string;
  nickname?: string;
  blocked: boolean;
  username: string;
  avatar?: string;
  name: string;
}

interface ContactState {
  contacts: Contact[];
  loading: boolean;
  error: string | null;
}

export const selectContactByUsername = (state: RootState, username: string) => {
  if (!state.contacts) {
    return null;
  } else if (!username) {
    return null;
  }
  return state.contacts.contacts.find(
    (contact) => contact.username === username
  );
};

const loadContactsFromSessionStorage = (): Contact[] => {
  if (typeof window !== "undefined" && typeof sessionStorage !== "undefined") {
    const contacts = sessionStorage.getItem("contacts");
    return contacts ? JSON.parse(contacts) : [];
  }
  return [];
};

const saveContactsToSessionStorage = (contacts: Contact[]) => {
  if (typeof window !== "undefined" && typeof sessionStorage !== "undefined") {
    sessionStorage.setItem("contacts", JSON.stringify(contacts));
  }
};

const initialState: ContactState = {
  contacts: loadContactsFromSessionStorage(),
  loading: false,
  error: null,
};

export const fetchContacts = createAsyncThunk("contacts/fetch", async () => {
  const response = await fetch("/api/contact");
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch contacts");
  }

  return flattenContacts(data.contacts);
});

const contactSlice = createSlice({
  name: "contacts",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchContacts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchContacts.fulfilled,
        (state, action: PayloadAction<Contact[]>) => {
          state.loading = false;
          state.contacts = action.payload;
          saveContactsToSessionStorage(action.payload);
        }
      )
      .addCase(fetchContacts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Something went wrong";
      });
  },
});

export default contactSlice.reducer;
