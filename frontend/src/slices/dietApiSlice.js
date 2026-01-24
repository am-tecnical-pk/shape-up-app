import { apiSlice } from "./apiSlice";

const DIET_URL = "/api/ai";

export const dietApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    generateDiet: builder.mutation({
      query: (data) => ({
        url: `${DIET_URL}/generate-diet`,
        method: "POST",
        body: data,
      }),
    }),
    saveDiet: builder.mutation({
      query: (data) => ({
        url: `${DIET_URL}/save-diet`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Diet"], // Ensure this tag exists in apiSlice.js
    }),
    getMyDiet: builder.query({
      query: () => ({
        url: `${DIET_URL}/my-diet`,
      }),
      providesTags: ["Diet"],
    }),
    analyzeImage: builder.mutation({
  query: (data) => ({
    url: `${DIET_URL}/analyze-image`,
    method: "POST",
    body: data,
  }),
}),
  }),
});

export const { useGenerateDietMutation, useSaveDietMutation, useGetMyDietQuery, useAnalyzeImageMutation } = dietApiSlice;