import { configureStore } from '@reduxjs/toolkit';
import balance from './balanceSlice';

export const makeStore = () => configureStore({ reducer: { balance } });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
