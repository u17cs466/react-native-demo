import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
};

const blogsSlice = createSlice({
  name: 'blogs',
  initialState,
  reducers: {
    setBlogs(state, action) {
      state.items = action.payload;
    },
    addBlog(state, action) {
      state.items.unshift(action.payload);
    },
    deleteBlog(state, action) {
      state.items = state.items.filter(b => b.id !== action.payload);
    },
    toggleExpand(state, action) {
      state.items = state.items.map(b => (b.id === action.payload ? { ...b, expanded: !b.expanded } : b));
    },
  },
});

export const { setBlogs, addBlog, deleteBlog, toggleExpand } = blogsSlice.actions;
export default blogsSlice.reducer;
