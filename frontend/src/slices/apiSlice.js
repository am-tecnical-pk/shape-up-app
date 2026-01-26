import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({ baseUrl: "" });

export const apiSlice = createApi({
  baseQuery,
  // ⚠️ CRITICAL: All tags must be listed here for auto-refresh to work
  tagTypes: ["User", "Workout", "DailyLog", "Routine"], 
  endpoints: (builder) => ({}),
});