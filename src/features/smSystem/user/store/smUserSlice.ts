import { createSlice } from '@reduxjs/toolkit';

import { CurrentUser } from '../types';

interface SmUserState {
  accessToken: string | null;
  refreshToken: string | null;
  user: CurrentUser | null;
}

const initialState: SmUserState = {
  accessToken: null,
  refreshToken: null,
  user: null,
};

interface SetSessionPayload {
  accessToken: string;
  refreshToken: string;
  user: CurrentUser;
}

export const smUserSlice = createSlice({
  name: 'SmUser',
  initialState,
  reducers: {
    setSession: (state, action: { payload: SetSessionPayload }) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
    },
    clearSession: (state) => {
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
    },
    setAccessToken: (state, action: { payload: string | null }) => {
      state.accessToken = action.payload;
    },
  },
});

export const { setSession, clearSession, setAccessToken } = smUserSlice.actions;
