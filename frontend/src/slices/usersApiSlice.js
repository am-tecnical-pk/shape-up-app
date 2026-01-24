import { apiSlice } from "./apiSlice";

const USERS_URL = "/api/users";
const USER_STATUS_URL = "/api/user/status";
const USER_MEAL_PLAN_URL = "/api/user/meal-plan";
const USER_WATER_INTAKE_URL = "/api/users/water-intake";

export const usersApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // User endpoints
    login: builder.mutation({
      query: (data) => ({
        url: `${USERS_URL}/auth`,
        method: "POST",
        body: data,
      }),
    }),
    register: builder.mutation({
      query: (data) => ({
        url: `${USERS_URL}`,
        method: "POST",
        body: data,
      }),
    }),
    logout: builder.mutation({
      query: (data) => ({
        url: `${USERS_URL}/logout`,
        method: "POST",
        body: data,
      }),
    }),
    
    updateUserProfile: builder.mutation({
      query: (data) => ({
        url: `${USERS_URL}/profile`,
        method: "PUT",
        body: data, 
      }),
    }),

    // Delete User Endpoint
    deleteUser: builder.mutation({
      query: () => ({
        url: `${USERS_URL}/profile`,
        method: "DELETE",
      }),
    }),

    // User status endpoints
    updateStatus: builder.mutation({
      query: (data) => ({
        url: `${USER_STATUS_URL}`,
        method: "PUT",
        body: data,
      }),
    }),

    // User meal plan endpoints
    createMealPlan: builder.mutation({
      query: (data) => ({
        url: `${USER_MEAL_PLAN_URL}`,
        method: "POST",
        body: data,
      }),
    }),
    updateMealPlan: builder.mutation({
      query: (data) => ({
        url: `${USER_MEAL_PLAN_URL}`,
        method: "PUT",
        body: data,
      }),
    }),

    // User Water intake endpoints
    createWaterIntake: builder.mutation({
      query: (data) => ({
        url: `${USER_WATER_INTAKE_URL}`,
        method: "POST",
        body: data,
      }),
    }),

    updateWaterIntake: builder.mutation({
      query: (data) => ({
        url: `${USER_WATER_INTAKE_URL}`,
        method: "PUT",
        body: data,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useRegisterMutation,
  useUpdateUserProfileMutation,
  useDeleteUserMutation, 
  useUpdateStatusMutation,
  useCreateMealPlanMutation,
  useUpdateMealPlanMutation,
  useCreateWaterIntakeMutation,
  useUpdateWaterIntakeMutation
} = usersApiSlice;