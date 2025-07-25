import { createSlice } from '@reduxjs/toolkit';

const productSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
  },
  reducers: {},
});

export default productSlice.reducer;
