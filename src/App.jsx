import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Paste from "./pages/Paste";
import ViewPaste from "./pages/ViewPaste";

import ScrollToTop from "./components/ScrollToTop";

const Layout = ({ children }) => (
  <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-950 transition-all">

    {/* 🔝 SCROLL HANDLER */}
    <ScrollToTop />

    {/* Header */}
    <Navbar />

    {/* Page Content */}
    <main className="flex-grow w-full">
      {children}
    </main>

    {/* Footer */}
    <Footer />

  </div>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Layout>
        <Home />
      </Layout>
    ),
  },
  {
    path: "/pastes",
    element: (
      <Layout>
        <Paste />
      </Layout>
    ),
  },
  {
    path: "/pastes/:id",
    element: (
      <Layout>
        <ViewPaste />
      </Layout>
    ),
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;