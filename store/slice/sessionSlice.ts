import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Session } from 'next-auth';

type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface SessionState {
  data: Session | null;
  status: SessionStatus;
}

const initialState: SessionState = {
  data: null,
  status: 'loading', 
};

export const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<Session | null>) => {
      state.data = action.payload;
      state.status = action.payload ? 'authenticated' : 'unauthenticated';
    },
    setStatus: (state, action: PayloadAction<SessionStatus>) => {
      state.status = action.payload;
    },
  },
});

export const { setSession, setStatus } = sessionSlice.actions;
export default sessionSlice.reducer;
