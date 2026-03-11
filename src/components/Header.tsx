import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { clearAuth, getUser, isLoggedIn, getToken } from "../utils/auth";

const BASE = "http://localhost:8000";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  const [showDropdown, setShowDropdown] = useState(false);

  const axiosConfig = () => ({
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  });

  useEffect(() => {
    if (isLoggedIn()) {
      const u = getUser();
      setUser(u);
      fetchNotifications(u.id);
    } else {
      setUser(null);
    }
  }, [location.pathname]);

  const fetchNotifications = async (id: number) => {
    try {
      const res = await axios.get(
        `${BASE}/notifications/user/${id}`,
        axiosConfig()
      );
      setNotifications(res.data);
    } catch (err) {
      console.log("Notification fetch error:", err);
    }
  };

  const markSeen = async (id: number) => {
    try {
      await axios.put(
        `${BASE}/notifications/${id}`,
        { is_seen: true },
        axiosConfig()
      );
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_seen: true } : n))
      );
    } catch (err) {
      console.log("Mark seen error:", err);
    }
  };

  const handleBellClick = () => {
    const opening = !showDropdown;
    setShowDropdown(opening);
    if (opening) {
      notifications
        .filter((n) => n.is_seen === false)
        .forEach((n) => markSeen(n.id));
    }
  };

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    navigate("/login");
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true,
    });
  };

  const unreadCount = notifications.filter((n) => n.is_seen === false).length;

  return (
    <>
      <header className="bg-gray-900 text-gray-300 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">

          <Link to="/projects" className="text-sm font-semibold text-white">
            Project and Task Management System
          </Link>

          <div className="flex items-center gap-6">
            {isLoggedIn() && (
              <>
                <Link to="/projects" className="text-sm text-gray-400 hover:text-white">
                  Projects
                </Link>
                <Link to="/profile" className="text-sm text-gray-400 hover:text-white">
                  Profile
                </Link>
                <div className="relative">
                  <button onClick={handleBellClick} className="text-xl">
                    🔔
                  </button>

                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-xs px-1 rounded text-white">
                      {unreadCount}
                    </span>
                  )}

                  {showDropdown && (
                    <div className="absolute right-0 mt-3 w-80 bg-white text-black rounded shadow-lg z-50 max-h-96 overflow-y-auto">

                      <div className="px-3 py-2 border-b bg-gray-50 flex justify-between items-center">
                        <span className="text-sm font-semibold">Notifications</span>
                        <button
                          onClick={() => setShowDropdown(false)}
                          className="text-gray-400 hover:text-black text-xs"
                        >
                          ✕ Close
                        </button>
                      </div>

                      {notifications.length === 0 && (
                        <p className="p-3 text-sm text-gray-500">No Notifications</p>
                      )}

                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 border-b ${
                            n.is_seen ? "opacity-60 bg-white" : "bg-blue-50"
                          }`}
                        >
                          <p className="text-sm font-medium">{n.message}</p>
                          <div className="flex justify-between items-center mt-1">
                            <small className="text-gray-400">
                              {formatTime(n.created_at)}
                            </small>
                          </div>
                        </div>
                      ))}

                    </div>
                  )}
                </div>
              </>
            )}

            {user ? (
              <button
                onClick={handleLogout}
                className="text-sm text-red-400 hover:text-red-300"
              >
                Logout
              </button>
            ) : (
              <div className="flex gap-4">
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;