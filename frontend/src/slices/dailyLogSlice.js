import { apiSlice } from "./apiSlice";

const DAILY_LOG_URL = "/api/daily-logs";

export const dailyLogSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDailyLogs: builder.query({
      query: () => ({
        url: DAILY_LOG_URL,
      }),
      keepUnusedDataFor: 5,
      // ⚠️ MASTER FIX: This tag allows the dashboard to 'listen' for updates
      providesTags: ["DailyLog"],
    }),
    updateDailyLog: builder.mutation({
      query: (data) => ({
        url: DAILY_LOG_URL,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["DailyLog"],
    }),
    deleteFoodItem: builder.mutation({
      query: (data) => ({
        url: `${DAILY_LOG_URL}/food`,
        method: "DELETE",
        body: data,
      }),
      invalidatesTags: ["DailyLog"],
    }),
  }),
});

export const {
  useGetDailyLogsQuery,
  useUpdateDailyLogMutation,
  useDeleteFoodItemMutation,
} = dailyLogSlice;