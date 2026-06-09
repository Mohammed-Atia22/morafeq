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
import { ExpatriatePage } from "./features/expatriate/pages/ExpatriatePage";
import Layout from "./app/layouts/MainLayout";
import { Toaster } from "react-hot-toast";
import AddListingPage from "./features/listings/pages/AddListingPage";
import { ProtectedRoute } from "./app/routes/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <Routes>
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
                <OwnerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="expatriate"
            element={
              <ProtectedRoute>
                <ExpatriatePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="AddListing"
            element={
              <ProtectedRoute>
                <AddListingPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>

      <Toaster />
    </AuthProvider>
  );
}

export default App;
