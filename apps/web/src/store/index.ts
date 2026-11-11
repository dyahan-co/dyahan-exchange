import { configureStore } from '@reduxjs/toolkit';
import balance from './balanceSlice';
import user from './userSlice'; // <--- подключаем

export const makeStore = () => configureStore({ reducer: { balance, user } });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
