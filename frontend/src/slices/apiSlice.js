import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// 👇 Change this line to use the Environment Variable
const baseQuery = fetchBaseQuery({ 
  baseUrl: process.env.REACT_APP_API_URL || "" 
});

export const apiSlice = createApi({
  baseQuery,
  tagTypes: ["User", "Workout", "DailyLog"], 
  endpoints: (builder) => ({}),
});