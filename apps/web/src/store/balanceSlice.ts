import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface BalanceState {
  available: number;
  availableDr: number;
  reserved: number;
}

export interface BalanceUpdate {
  available: number;
  reserved: number;
  availableDr?: number;
}

const initialState: BalanceState = {
  available: 0,
  availableDr: 0,
  reserved: 0,
};

const balanceSlice = createSlice({
  name: 'balance',
  initialState,
  reducers: {
    balanceChanged(state, action: PayloadAction<BalanceUpdate>) {
      state.available = action.payload.available;
      state.reserved = action.payload.reserved;

      if (action.payload.availableDr !== undefined) {
        state.availableDr = action.payload.availableDr;
      }
    },
  },
});

export const { balanceChanged } = balanceSlice.actions;
export default balanceSlice.reducer;
