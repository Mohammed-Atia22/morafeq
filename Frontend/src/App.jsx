import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./features/auth/context/AuthContext";
import { LandingPage } from "./pages/LandingPage";
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
import Layout from "./pages/Layout/Layout";
import { Toaster } from "react-hot-toast";
import AddListingPage from "./pages/AddListingPage";
import { ProtectedRoute } from "./routes/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<LandingPage />} />
          <Route path="home" element={<HomePage />} />

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












// import { createBrowserRouter, Navigate, Route, RouterProvider, Routes } from "react-router-dom";
// import { AuthProvider } from "./features/auth/context/AuthContext";
// import { HomePage } from "./pages/HomePage";
// import { LoginPage } from "./pages/auth/LoginPage";
// import { RegisterPage } from "./pages/auth/RegisterPage";
// import { ConfirmOtpPage } from "./pages/auth/ConfirmOtpPage";
// import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";
// import { ResetPasswordPage } from "./pages/auth/ResetPasswordPage";
// import { AuthCallbackPage } from "./pages/auth/AuthCallbackPage";
// import { OnboardingPage } from "./features/onboarding/pages/OnboardingPage";
// import { OwnerPage } from "./pages/OwnerPage";
// import { ExpatriatePage } from "./pages/ExpatriatePage";
// import { Toaster } from "react-hot-toast";
// import Layout from './pages/Layout/Layout';

// function App() {
//   let Roudes = createBrowserRouter([
//     {
      
//     path:"/" ,element:<Layout />, children:[
//       {path:"/" ,element:<HomePage />},
//            {path:"/login" ,element:<LoginPage />} ,
//            {path:"/register" ,element:<RegisterPage />} ,
//            {path:"/confirm-otp" ,element:<ConfirmOtpPage />} ,
//            {path:"/forgot-password" ,element:<ForgotPasswordPage />} ,
//            {path:"/reset-password" ,element:<ResetPasswordPage />} ,
//            {path:"/auth/callback" ,element:<AuthCallbackPage /> },  
//            {path:"/onboarding" ,element:<OnboardingPage/> },
//            {path:"/owner" ,element:<OwnerPage />},
//            {path:"/expatriate" ,element:<ExpatriatePage />} ,
//           //  {path:"*" ,element:<Navigate to:"/" replace /> }
//     ]
//   }
// ])
//   return (
//     <AuthProvider>
     
//      <RouterProvider router={Roudes}/>
//       <Toaster />
//     </AuthProvider>
//   );
// }

// export default App;
