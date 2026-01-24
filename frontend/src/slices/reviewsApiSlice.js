import { apiSlice } from "./apiSlice";

const REVIEWS_URL = "/api/reviews";

export const reviewsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getReviews: builder.query({
      query: () => ({
        url: REVIEWS_URL,
      }),
      keepUnusedDataFor: 5,
    }),
    createReview: builder.mutation({
      query: (data) => ({
        url: REVIEWS_URL,
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const { useGetReviewsQuery, useCreateReviewMutation } = reviewsApiSlice;