import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({ baseUrl: "" });

export const apiSlice = createApi({
  baseQuery,
  // We include 'DailyLog' here to ensure caching works for all features
  tagTypes: ["User", "Workout", "DailyLog"], 
  endpoints: (builder) => ({}),
});