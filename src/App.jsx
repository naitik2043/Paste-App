import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { SessionProvider, useSession } from "./context/SessionContext";
import AppShell from "./components/AppShell";
import Home from "./pages/Home";
import Paste from "./pages/Paste";
import ViewPaste from "./pages/ViewPaste";
import SharedPaste from "./pages/SharedPaste";
import LaunchGate from "./pages/LaunchGate";
import NotFound from "./pages/NotFound";

function LoadingScreen() {
  return <div className="launch-screen"><div className="launch-card"><div className="launch-logo">PV</div><p className="eyebrow">SECURE WORKSPACE</p><h1>Preparing your vault…</h1><div className="loading-bar"></div></div></div>;
}

function SessionGate() {
  const { user, loading } = useSession();
  if (loading) return <LoadingScreen />;
  if (!user) return <LaunchGate />;
  return <AppShell />;
}

const router = createBrowserRouter([
  { element: <SessionGate />, children: [
    { path: "/", element: <Home /> },
    { path: "/pastes", element: <Paste /> },
    { path: "/pastes/:id", element: <ViewPaste /> }
  ]},
  { path: "/share/:shareId", element: <main className="page-container"><SharedPaste /></main> },
  { path: "*", element: <NotFound /> }
]);

export default function App() {
  return <SessionProvider><RouterProvider router={router} /></SessionProvider>;
}
