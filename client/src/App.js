import Login from "./pages/login/Login";
import Register from "./pages/register/Register";
import Landing from "./pages/landing/Landing";
import About from "./pages/about/About";
import TimeLimitPage from "./pages/timeLimit/TimeLimit";
import MessagesPage from "./pages/messages/Messages";
import Friends from "./pages/friends/Friends";
import Admin from "./pages/admin/Admin";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  Navigate,
  useParams,
  Link,
} from "react-router-dom";
import Navbar from "./components/navbar/Navbar";
import LeftBar from "./components/leftBar/LeftBar";
import RightBar from "./components/rightBar/RightBar";
import Home from "./pages/home/Home";
import Profile from "./pages/profile/Profile";
import ErrorBoundary from "./components/errorBoundary/ErrorBoundary";
import "./style.scss";
import { useContext, useState } from "react";
import { DarkModeContext } from "./context/darkModeContext";
import { AuthContext } from "./context/authContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

function App() {
  const { currentUser } = useContext(AuthContext);
  const { darkMode } = useContext(DarkModeContext);
  const queryClient = new QueryClient();

  const ProfileRedirect = () => {
    const { id } = useParams();
    return <Navigate to={`/app/profile/${id}`} replace />;
  };

  const Layout = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => {
      setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
      setIsMobileMenuOpen(false);
    };

    return (
      <QueryClientProvider client={queryClient}>
        <div className={`theme-${darkMode ? "dark" : "light"} app-layout`}>
          <Navbar onMobileMenuToggle={toggleMobileMenu} />
          <div className="main-container">
            <aside className="sidebar-left">
              <LeftBar isOpen={isMobileMenuOpen} onClose={closeMobileMenu} />
            </aside>
            <main className="content-area">
              <Outlet />
            </main>
            <aside className="sidebar-right">
              <RightBar />
            </aside>
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: darkMode ? "#333" : "#fff",
                color: darkMode ? "#fff" : "#333",
              },
              success: {
                iconTheme: {
                  primary: "#4ade80",
                  secondary: "white",
                },
              },
              error: {
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "white",
                },
              },
            }}
          />
        </div>
      </QueryClientProvider>
    );
  };

  const ProtectedRoute = ({ children }) => {
    if (!currentUser) {
      return <Navigate to="/login" />;
    }

    return children;
  };

  const LoggedInRoute = ({ children }) => {
    if (currentUser) {
      return <Navigate to="/app" />;
    }

    return children;
  };

  const AdminRoute = ({ children }) => {
    console.log("AdminRoute check:", {
      currentUser,
      isAdmin: currentUser?.isAdmin,
    });

    if (!currentUser || !currentUser.isAdmin) {
      console.log("Redirecting to /app - Not admin");
      return <Navigate to="/app" />;
    }
    return children;
  };

  const router = createBrowserRouter([
    {
      path: "/",
      element: <Landing />,
    },
    {
      path: "/about",
      element: <About />,
    },
    {
      path: "/profile/:id",
      element: (
        <ProtectedRoute>
          <ProfileRedirect />
        </ProtectedRoute>
      ),
    },
    {
      path: "/app",
      element: (
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      ),
      children: [
        {
          path: "/app",
          element: <Home />,
        },
        {
          path: "/app/profile/:id",
          element: <Profile />,
        },
        {
          path: "/app/messages",
          element: <MessagesPage />,
        },
        {
          path: "/app/friends",
          element: <Friends />,
        },
        {
          path: "/app/admin",
          element: (
            <AdminRoute>
              <Admin />
            </AdminRoute>
          ),
        },
      ],
    },
    {
      path: "/time-limit",
      element: <TimeLimitPage />,
    },
    {
      path: "/login",
      element: (
        <LoggedInRoute>
          <Login />
        </LoggedInRoute>
      ),
    },
    {
      path: "/register",
      element: (
        <LoggedInRoute>
          <Register />
        </LoggedInRoute>
      ),
    },
    {
      path: "*",
      element: (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            textAlign: "center",
            padding: "20px",
          }}
        >
          <h1
            style={{
              fontSize: "72px",
              margin: "0",
              color: "var(--primary-color)",
            }}
          >
            404
          </h1>
          <h2 style={{ margin: "20px 0", color: "var(--text-color)" }}>
            Page Not Found
          </h2>
          <p
            style={{
              color: "var(--text-color-secondary)",
              marginBottom: "30px",
            }}
          >
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link
            to="/app"
            style={{
              padding: "12px 24px",
              background: "var(--primary-gradient)",
              color: "white",
              textDecoration: "none",
              borderRadius: "8px",
              fontWeight: "600",
            }}
          >
            Go Home
          </Link>
        </div>
      ),
    },
  ]);

  return (
    <ErrorBoundary>
      <div>
        <RouterProvider router={router} />
      </div>
    </ErrorBoundary>
  );
}

export default App;
