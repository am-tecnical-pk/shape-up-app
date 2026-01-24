import { apiSlice } from "./apiSlice";

const WORKOUTS_URL = "/api/workouts";

export const workoutsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 👇 THIS MUTATION REFRESHES THE DASHBOARD
    createWorkout: builder.mutation({
      query: (data) => ({
        url: `${WORKOUTS_URL}`,
        method: "POST",
        body: data,
      }),
      // ⚠️ IMPORTANT: Invalidate 'DailyLog' so volume charts update instantly
      invalidatesTags: ["Workout", "DailyLog"], 
    }),

    getWorkouts: builder.query({
      query: () => ({
        url: `${WORKOUTS_URL}`,
        method: "GET",
      }),
      providesTags: ["Workout"],
    }),

    getWorkoutByDate: builder.query({
      query: (date) => ({
        url: `${WORKOUTS_URL}/${date}`,
        method: "GET",
      }),
      providesTags: ["Workout"],
    }),
  }),
});

export const {
  useCreateWorkoutMutation,
  useGetWorkoutsQuery,
  useGetWorkoutByDateQuery,
} = workoutsApiSlice;