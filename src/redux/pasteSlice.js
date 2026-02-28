import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  pastes: JSON.parse(localStorage.getItem("pastes")) || [],
};

// ✅ helper
const saveToLocalStorage = (pastes) => {
  localStorage.setItem("pastes", JSON.stringify(pastes));
};

const pasteSlice = createSlice({
  name: "paste",
  initialState,
  reducers: {
    addToPastes: (state, action) => {
      const paste = {
        viewCount: 0,
        isPinned: false,
        ...action.payload,
      };

      const exists = state.pastes.find((item) => item._id === paste._id);

      if (!exists) {
        state.pastes.push(paste);
        saveToLocalStorage(state.pastes); // ⭐ added
      }
    },

    updatePastes: (state, action) => {
      const index = state.pastes.findIndex(
        (item) => item._id === action.payload._id,
      );

      if (index !== -1) {
        state.pastes[index] = {
          ...state.pastes[index],
          ...action.payload,
        };
        saveToLocalStorage(state.pastes); // ⭐ added
      }
    },

    removeFromPastes: (state, action) => {
      state.pastes = state.pastes.filter((item) => item._id !== action.payload);
      saveToLocalStorage(state.pastes); // ⭐ added
    },

    resetPaste: (state) => {
      state.pastes = [];
      localStorage.removeItem("pastes"); // ⭐ added
    },

    incrementViewCount: (state, action) => {
      const paste = state.pastes.find((item) => item._id === action.payload);

      if (paste) {
        paste.viewCount = (paste.viewCount || 0) + 1;
        saveToLocalStorage(state.pastes); // ⭐ added
      }
    },

    togglePin: (state, action) => {
      const paste = state.pastes.find((item) => item._id === action.payload);

      if (paste) {
        paste.isPinned = !paste.isPinned;
        saveToLocalStorage(state.pastes); // ⭐ added
      }
    },
  },
});

export const {
  addToPastes,
  updatePastes,
  removeFromPastes,
  resetPaste,
  incrementViewCount,
  togglePin,
} = pasteSlice.actions;

export default pasteSlice.reducer;
