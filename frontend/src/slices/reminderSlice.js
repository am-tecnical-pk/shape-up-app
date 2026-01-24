import { apiSlice } from "./apiSlice";

const REMINDER_URL = "/api/reminders";

export const reminderSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getReminders: builder.query({
      query: () => ({ url: REMINDER_URL }),
      providesTags: ["Reminder"],
    }),
    createReminder: builder.mutation({
      query: (data) => ({
        url: REMINDER_URL,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Reminder"],
    }),
    deleteReminder: builder.mutation({
      query: (id) => ({
        url: `${REMINDER_URL}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Reminder"],
    }),
  }),
});

export const { useGetRemindersQuery, useCreateReminderMutation, useDeleteReminderMutation } = reminderSlice;