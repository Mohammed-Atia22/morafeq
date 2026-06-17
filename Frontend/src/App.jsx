import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { AuthProvider } from "./features/auth/context/AuthContext";
import { ProtectedRoute } from "./app/routes/ProtectedRoute";

import Layout from "./app/layouts/MainLayout";
import OwnerLayout from "./app/layouts/OwnerLayout";
import ExpatriateLayout from "./app/layouts/ExpatriateLayout";

import { LandingPage } from "./pages/LandingPage";

import { LoginPage } from "./features/auth/pages/LoginPage";
import { RegisterPage } from "./features/auth/pages/RegisterPage";
import { ConfirmOtpPage } from "./features/auth/pages/ConfirmOtpPage";
import { ForgotPasswordPage } from "./features/auth/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./features/auth/pages/ResetPasswordPage";
import { AuthCallbackPage } from "./features/auth/pages/AuthCallbackPage";

import { OnboardingPage } from "./features/onboarding/pages/OnboardingPage";

import { OwnerPage } from "./features/owner/pages/OwnerDashboardPage";
import { OwnerBookingsPage } from "./features/owner/pages/OwnerBookingsPage";
import { OwnerMessagesPage } from "./features/owner/pages/OwnerMessagesPage";
import { OwnerSettingsPage } from "./features/owner/pages/OwnerSettingsPage";

import { ExpatriateHomePage } from "./features/expatriate/pages/ExpatriateHomePage";
import { ExpatriateSearchPage } from "./features/expatriate/pages/ExpatriateSearchPage";
import { ExpatriateListingDetailPage } from "./features/expatriate/pages/ExpatriateListingDetailPage";
import { ExpatriateLocationInsightPage } from "./features/expatriate/pages/ExpatriateLocationInsightPage";
import { ExpatriateMessagesPage } from "./features/expatriate/pages/ExpatriateMessagesPage";

import { ProfilePage } from "./features/profile/pages/ProfilePage";

import AddListingPage from "./features/listings/pages/AddListingPage";
import EditListingPage from "./features/listings/pages/EditListingPage";

function App() {
return ( <AuthProvider> <Routes>
{/* Public and authentication routes */}
<Route element={<Layout />}>
<Route index element={<LandingPage />} />
<Route path="home" element={<LandingPage />} />


      <Route path="login" element={<LoginPage />} />
      <Route path="register" element={<RegisterPage />} />
      <Route path="confirm-otp" element={<ConfirmOtpPage />} />
      <Route
        path="forgot-password"
        element={<ForgotPasswordPage />}
      />
      <Route
        path="reset-password"
        element={<ResetPasswordPage />}
      />
      <Route
        path="auth/callback"
        element={<AuthCallbackPage />}
      />

      <Route
        path="onboarding"
        element={<OnboardingPage />}
      />
    </Route>

    {/* Owner routes */}
    <Route
      path="owner"
      element={
        <ProtectedRoute allowedRoles={["HOST"]}>
  <OwnerLayout />
</ProtectedRoute>
      }
    >
      <Route index element={<OwnerPage />} />

      <Route
        path="bookings"
        element={<OwnerBookingsPage />}
      />

      <Route
        path="messages"
        element={<OwnerMessagesPage />}
      />

      <Route
        path="settings"
        element={<OwnerSettingsPage />}
      />

      <Route path="profile" element={<ProfilePage />} />

      <Route path="add" element={<AddListingPage />} />

      <Route
        path="listings/:id/edit"
        element={<EditListingPage />}
      />
    </Route>

    {/* Expatriate routes */}
    <Route
      path="expatriate"
      element={
        <ProtectedRoute allowedRoles={["GUEST"]}>
  <ExpatriateLayout />
</ProtectedRoute>
      }
    >
      <Route index element={<ExpatriateHomePage />} />

      <Route
        path="search"
        element={<ExpatriateSearchPage />}
      />

      <Route
        path="messages"
        element={<ExpatriateMessagesPage />}
      />

      <Route
        path="listings/:id"
        element={<ExpatriateListingDetailPage />}
      />

      <Route
        path="listings/:id/insights"
        element={<ExpatriateLocationInsightPage />}
      />

      <Route path="profile" element={<ProfilePage />} />
    </Route>

    {/* Shared profile route */}
    <Route
      path="profile"
      element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      }
    />

    {/* Unknown routes */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>

  <Toaster />
</AuthProvider>


);
}

export default App;
