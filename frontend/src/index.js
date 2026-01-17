import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";
import { Provider } from "react-redux";
import store from "./store";
import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css";

// 👇 YEH LINE UNCOMMENT/ADD KAREIN (ZAROORI HAI) 👇
import './index.css'; 
// 👆 Iske bina Dark Mode nahi chalega 👆

// Import Components
import PrivateRoute from "./components/PrivateRoute";
import PublicRoute from "./components/PublicRoute";

// ... baaki saara code waisa hi rahega ...
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Workouts from "./pages/Workouts";
import NutritionChecker from "./pages/NutritionChecker";
import BMRCalculator from "./pages/BMRCalculator";
import Features from "./pages/Features";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import NotificationsPage from "./pages/NotificationsPage"; 
import Settings from "./pages/Settings"; 

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<App />}>
      {/* ... routes same rahenge ... */}
      <Route index={true} path="/" element={<Home />} />
      <Route path="/pages/features" element={<Features />} />
      <Route path="/pages/about" element={<About />} />
      <Route path="/pages/workouts" element={<Workouts />} />
      <Route path="/pages/nutrition-checker" element={<NutritionChecker />} />
      <Route path="/pages/bmr-calculator" element={<BMRCalculator />} />

      <Route path="" element={<PublicRoute />}>
        <Route path="/pages/login" element={<Login />} />
        <Route path="/pages/register" element={<Register />} />
      </Route>

      <Route path="" element={<PrivateRoute />}>
        <Route path="/pages/profile/*" element={<Profile />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/pages/settings" element={<Settings />} /> 
      </Route>

      <Route path="*" element={<NotFound />} />
    </Route>
  )
);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>
);