import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface UserState {
  nickname: string;
  isLoggedIn: boolean;
}

const initialState: UserState = {
  nickname: 'Контрагент_42',
  isLoggedIn: true,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    userLoggedIn(state, action: PayloadAction<string>) {
      state.nickname = action.payload;
      state.isLoggedIn = true;
    },
    userLoggedOut(state) {
      state.nickname = '';
      state.isLoggedIn = false;
    },
  },
});

export const { userLoggedIn, userLoggedOut } = userSlice.actions;
export default userSlice.reducer;