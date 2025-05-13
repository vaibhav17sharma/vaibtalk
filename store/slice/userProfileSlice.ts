import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type UserProfile = {
  id: string;
  email: string;
  username?: string;
  name?: string;
  bio?: string;
  avatar?: string;
  profileCompleted?: boolean;
  createdAt?: Date;
};

interface UserProfileState {
  userProfile: UserProfile | null;
}

const storedUser = typeof window !== 'undefined'
  ? sessionStorage.getItem('userProfile')
  : null;

const initialState: UserProfileState = {
  userProfile: storedUser ? JSON.parse(storedUser) : null,
};

const userProfileSlice = createSlice({
  name: 'userProfile',
  initialState,
  reducers: {
    setUserProfile(state, action: PayloadAction<UserProfile | null>) {
      state.userProfile = action.payload;
      if (typeof window !== 'undefined') {
        if (action.payload) {
          sessionStorage.setItem('userProfile', JSON.stringify(action.payload));
        } else {
          sessionStorage.removeItem('userProfile');
        }
      }
    },
  },
});

export const { setUserProfile } = userProfileSlice.actions;
export default userProfileSlice.reducer;
