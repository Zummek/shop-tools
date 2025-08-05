import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { createMigrate, persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import { smImportProductsSlice } from '../features/smSystem/products/store/smImportProductsSlice';
import { smUserSlice } from '../features/smSystem/user/store/smUserSlice';
import { isDev } from '../utils/envs';

import { storeMigrations } from './migrations';

const reducers = combineReducers({
  smSystemUser: smUserSlice.reducer,
  smImportProducts: smImportProductsSlice.reducer,
});

const persistedReducer = persistReducer(
  {
    key: 'root',
    version: 1,
    storage,
    debug: isDev,
    migrate: createMigrate(storeMigrations, { debug: isDev }),
  },
  reducers
);

export const store = configureStore({
  devTools: isDev,
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
