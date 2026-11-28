import { createBrowserRouter, Navigate, RouterProvider, useLocation } from "react-router-dom";
import { SessionProvider } from "./context/SessionContext";
import { useSession } from "./context/useSession";
import AppShell from "./components/AppShell";
import PublicSiteLayout from "./components/PublicSiteLayout";
import Home from "./pages/Home";
import Paste from "./pages/Paste";
import ViewPaste from "./pages/ViewPaste";
import SharedPaste from "./pages/SharedPaste";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Landing from "./pages/Landing";
import About from "./pages/About";
import Help from "./pages/Help";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

function LoadingScreen() {
  return (
    <div className="launch-screen">
      <div className="launch-card">
        <div className="launch-logo">PV</div>
        <p className="eyebrow">SECURE DEVELOPER WORKSPACE</p>
        <h1>Preparing your vault…</h1>
        <div className="loading-bar" />
      </div>
    </div>
  );
}

function RootRoute() {
  const { user, loading } = useSession();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <PublicSiteLayout><Landing /></PublicSiteLayout>;
}

function GuestRoute({ children }) {
  const { user, loading } = useSession();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function ProtectedRoute() {
  const { user, loading } = useSession();
  const location = useLocation();
  if (loading) return <LoadingScreen />;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <AppShell />;
}

const router = createBrowserRouter([
  { path: "/", element: <RootRoute /> },
  { path: "/about", element: <PublicSiteLayout><About /></PublicSiteLayout> },
  { path: "/help", element: <PublicSiteLayout><Help /></PublicSiteLayout> },
  { path: "/privacy", element: <PublicSiteLayout><Privacy /></PublicSiteLayout> },
  { path: "/terms", element: <PublicSiteLayout><Terms /></PublicSiteLayout> },
  { path: "/login", element: <GuestRoute><Login /></GuestRoute> },
  { path: "/signup", element: <GuestRoute><Signup /></GuestRoute> },
  { path: "/verify-email", element: <VerifyEmail /> },
  { path: "/forgot-password", element: <GuestRoute><ForgotPassword /></GuestRoute> },
  { path: "/reset-password", element: <ResetPassword /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: "/dashboard", element: <Home /> },
      { path: "/pastes", element: <Paste /> },
      { path: "/pastes/:id", element: <ViewPaste /> },
      { path: "/profile", element: <Profile /> },
      { path: "/settings", element: <Settings /> }
    ]
  },
  { path: "/share/:shareId", element: <main className="page-container"><SharedPaste /></main> },
  { path: "*", element: <NotFound /> }
]);

export default function App() {
  return <SessionProvider><RouterProvider router={router} /></SessionProvider>;
}
