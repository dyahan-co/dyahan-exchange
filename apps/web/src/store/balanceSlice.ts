import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface BalanceState {
  available: number;
  reserved: number;
}

const initialState: BalanceState = { available: 0, reserved: 0 };

const balanceSlice = createSlice({
  name: 'balance',
  initialState,
  reducers: {
    // Сервер — источник истины: клиент лишь принимает авторитетное значение.
    balanceChanged(state, action: PayloadAction<BalanceState>) {
      state.available = action.payload.available;
      state.reserved = action.payload.reserved;
    },
  },
});

export const { balanceChanged } = balanceSlice.actions;
export default balanceSlice.reducer;
