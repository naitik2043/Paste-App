import { configureStore } from "@reduxjs/toolkit";
import pasteReducer from "./pasteSlice";

export const store = configureStore({
  reducer: {
    paste: pasteReducer,
  },
});

// auto localStorage sync
store.subscribe(() => {
  localStorage.setItem(
    "pastes",
    JSON.stringify(store.getState().paste.pastes)
  );
});