import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./features/auth/context/AuthContext";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { ConfirmOtpPage } from "./pages/auth/ConfirmOtpPage";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/auth/ResetPasswordPage";
import { AuthCallbackPage } from "./pages/auth/AuthCallbackPage";
import { OnboardingPage } from "./features/onboarding/pages/OnboardingPage";
import { OwnerPage } from "./pages/OwnerPage";
import { ExpatriatePage } from "./pages/ExpatriatePage";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/confirm-otp" element={<ConfirmOtpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/owner" element={<OwnerPage />} />
        <Route path="/expatriate" element={<ExpatriatePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </AuthProvider>
  );
}

export default App;
