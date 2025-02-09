import { createSlice } from '@reduxjs/toolkit';

interface SmUserState {
  accessToken: string | null;
}

const initialState: SmUserState = {
  accessToken: null,
};

interface SetSessionPayload {
  accessToken: string;
}

export const smUserSlice = createSlice({
  name: 'SmUser',
  initialState,
  reducers: {
    setSession: (state, action: { payload: SetSessionPayload }) => {
      state.accessToken = action.payload.accessToken;
    },
    clearSession: (state) => {
      state.accessToken = null;
    },
  },
});

export const { setSession, clearSession } = smUserSlice.actions;
