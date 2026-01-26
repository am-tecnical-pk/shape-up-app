import { apiSlice } from "./apiSlice";

const ROUTINES_URL = "/api/ai";

export const routinesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Save AI Plan
    saveRoutine: builder.mutation({
      query: (data) => ({
        url: `${ROUTINES_URL}/save-plan`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Routine"],
    }),
    
    // Get Active Plan
    getMyRoutine: builder.query({
      query: () => ({
        url: `${ROUTINES_URL}/my-routine`,
      }),
      providesTags: ["Routine"],
    }),

    // 👇 NEW: Adjust Routine (Progressive Overload)
    adjustRoutine: builder.mutation({
      query: (data) => ({
        url: `${ROUTINES_URL}/adjust-routine`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Routine"], // This forces Dashboard to show updated reps next time
    }),
  }),
});

export const { 
    useSaveRoutineMutation, 
    useGetMyRoutineQuery,
    useAdjustRoutineMutation // Export this
} = routinesApiSlice;