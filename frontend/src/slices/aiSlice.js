import { apiSlice } from "./apiSlice";

const AI_URL = "/api/ai";

export const aiApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 1. Briefing
    getDailyBriefing: builder.query({
      query: () => ({ url: `${AI_URL}/daily-briefing`, method: "GET" }),
      keepUnusedDataFor: 300,
    }),
    
    // 2. Workout Analysis
    analyzeWorkoutSession: builder.mutation({
      query: (data) => ({ url: `${AI_URL}/analyze-workout`, method: "POST", body: data }),
    }),

    // 3. Chat
    chatWithAI: builder.mutation({
      query: (data) => ({ url: `${AI_URL}/chat`, method: "POST", body: data }),
    }),

    // 4. Workout Generation
    generateWorkoutPlan: builder.mutation({
      query: (data) => ({ url: `${AI_URL}/generate`, method: "POST", body: data }),
    }),
    saveWorkoutPlan: builder.mutation({
      query: (data) => ({ url: `${AI_URL}/save-routine`, method: "POST", body: data }),
    }),
    getMyRoutine: builder.query({
      query: () => ({ url: `${AI_URL}/my-routine`, method: "GET" }),
    }),

    // 5. Diet Generation
    generateDietPlan: builder.mutation({
      query: (data) => ({ url: `${AI_URL}/generate-diet`, method: "POST", body: data }),
    }),
    saveDietPlan: builder.mutation({
      query: (data) => ({ url: `${AI_URL}/save-diet`, method: "POST", body: data }),
    }),
    getMyDiet: builder.query({
      query: () => ({ url: `${AI_URL}/my-diet`, method: "GET" }),
    }),
    analyzeFoodImage: builder.mutation({
      query: (data) => ({ url: `${AI_URL}/analyze-food`, method: "POST", body: data }),
    }),
  }),
});

export const { 
  useGetDailyBriefingQuery, 
  useAnalyzeWorkoutSessionMutation,
  useChatWithAIMutation,
  useGenerateWorkoutPlanMutation,
  useSaveWorkoutPlanMutation,
  useGetMyRoutineQuery,
  useGenerateDietPlanMutation,
  useSaveDietPlanMutation,
  useGetMyDietQuery,
  useAnalyzeFoodImageMutation
} = aiApiSlice;