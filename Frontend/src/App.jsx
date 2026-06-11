import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./features/auth/context/AuthContext";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./features/auth/pages/LoginPage";
import { RegisterPage } from "./features/auth/pages/RegisterPage";
import { ConfirmOtpPage } from "./features/auth/pages/ConfirmOtpPage";
import { ForgotPasswordPage } from "./features/auth/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./features/auth/pages/ResetPasswordPage";
import { AuthCallbackPage } from "./features/auth/pages/AuthCallbackPage";
import { OnboardingPage } from "./features/onboarding/pages/OnboardingPage";
import { OwnerPage } from "./features/owner/pages/OwnerDashboardPage";
import { ExpatriateHomePage } from "./features/expatriate/pages/ExpatriateHomePage";
import { ExpatriateSearchPage } from "./features/expatriate/pages/ExpatriateSearchPage";
import { ExpatriateListingDetailPage } from "./features/expatriate/pages/ExpatriateListingDetailPage";
import { ExpatriateLocationInsightPage } from "./features/expatriate/pages/ExpatriateLocationInsightPage";
import { ProfilePage } from "./features/peofile/pages/ProfilePage";
import Layout from "./app/layouts/MainLayout";
import OwnerLayout from "./app/layouts/OwnerLayout";
import ExpatriateLayout from "./app/layouts/ExpatriateLayout";
import { Toaster } from "react-hot-toast";
import AddListingPage from "./features/listings/pages/AddListingPage";
import { ProtectedRoute } from "./app/routes/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* ─── Public / Auth routes ─────────────────── */}
        <Route element={<Layout />}>
          <Route index element={<LandingPage />} />
          <Route path="home" element={<LandingPage />} />

          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="confirm-otp" element={<ConfirmOtpPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
          <Route path="auth/callback" element={<AuthCallbackPage />} />

          <Route path="onboarding" element={<OnboardingPage />} />

          <Route
            path="owner"
            element={
              <ProtectedRoute>
                <OwnerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<OwnerPage />} />
            <Route path="add" element={<AddListingPage />} />
          </Route>
        </Route>

        {/* ─── Expatriate routes (own layout + sidebar) ─ */}
        <Route
          path="expatriate"
          element={
            <ProtectedRoute>
              <ExpatriateLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ExpatriateHomePage />} />
          <Route path="search" element={<ExpatriateSearchPage />} />
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

        {/* ─── Shared profile route (both expatriate & owner) ─ */}
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster />
    </AuthProvider>
  );
}

export default App;
