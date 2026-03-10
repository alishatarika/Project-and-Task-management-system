import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { clearAuth, getUser, isLoggedIn } from "../utils/auth";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (isLoggedIn()) {
      setUser(getUser());
    } else {
      setUser(null);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    navigate("/login");
  };

  return (
    <header className="bg-gray-900 text-gray-300 border-b border-gray-700 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">

        <Link to="/projects" className="text-sm font-semibold text-white">
          Project and Task Management System
        </Link>

        <div className="flex items-center gap-6">
          {isLoggedIn() && (
            <nav className="flex items-center gap-6">
              <Link
                to="/projects"
                className={`text-sm ${
                  location.pathname.startsWith("/projects")
                    ? "text-white font-medium"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Projects
              </Link>

              <Link
                to="/profile"
                className={`text-sm ${
                  location.pathname === "/profile"
                    ? "text-white font-medium"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Profile
              </Link>
            </nav>
          )}

          {/* Auth Buttons */}
          {user ? (
            <button
              onClick={handleLogout}
              className="text-sm text-red-400 hover:text-red-300"
            >
              Logout
            </button>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-sm text-gray-400 hover:text-white">
                Login
              </Link>
              <Link to="/register" className="text-sm text-gray-400 hover:text-white">
                Register
              </Link>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default Header;