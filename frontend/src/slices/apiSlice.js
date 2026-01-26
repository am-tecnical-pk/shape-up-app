import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({ baseUrl: "" });

export const apiSlice = createApi({
  baseQuery,
  tagTypes: ["User", "Workout", "DailyLog", "Routine", "Diet", "Reminder"], 
  endpoints: (builder) => ({}),
});