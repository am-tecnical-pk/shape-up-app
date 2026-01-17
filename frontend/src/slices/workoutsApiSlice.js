import { apiSlice } from "./apiSlice";

const WORKOUTS_URL = "/api/workouts";

export const workoutsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Create Workout: Invalidates the cache so data re-fetches
    createWorkout: builder.mutation({
      query: (data) => ({
        url: `${WORKOUTS_URL}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Workout"],
    }),

    // Get All Workouts: specific tag allows it to be auto-updated
    getWorkouts: builder.query({
      query: () => ({
        url: `${WORKOUTS_URL}`,
        method: "GET",
      }),
      providesTags: ["Workout"],
    }),

    // Get Single Workout Date: specific tag allows it to be auto-updated
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