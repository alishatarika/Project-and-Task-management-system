import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { clearAuth, getUser, isLoggedIn, getToken } from "../utils/auth";
import { toast } from "react-hot-toast";

const BASE = "http://localhost:8000";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const [showDropdown, setShowDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [selectedUser, setSelectedUser] = useState("");
  const [message, setMessage] = useState("");

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

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${BASE}/users/`, axiosConfig());
      const currentUser = getUser<any>();
      setUsers(res.data.filter((u: any) => u.id !== currentUser?.id));
    } catch (err) {
      console.log("User fetch error:", err);
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

  const sendNotification = async () => {
    if (!selectedUser || !message) {
      toast.error("Please select user and enter message"); // ✅ toast instead of alert
      return;
    }
    try {
      await axios.post(
        `${BASE}/notifications/`,
        { user_id: Number(selectedUser), message },
        axiosConfig()
      );
      toast.success("Notification sent"); // ✅ toast instead of alert
      setMessage("");
      setSelectedUser("");
      setShowModal(false);
    } catch (err) {
      toast.error("Failed to send notification"); // ✅ toast instead of alert
      console.log("Send notification error:", err);
    }
  };

  const openModal = () => {
    fetchUsers();
    setShowModal(true);
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
                              From: {n.sender?.username || `User #${n.send_by}`}
                            </small>
                            <small className="text-gray-400">
                              {formatTime(n.created_at)}
                            </small>
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={openModal}
                        className="w-full p-2 bg-gray-100 hover:bg-gray-200 text-sm border-t"
                      >
                        + Send Notification
                      </button>
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

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded w-96">
            <h2 className="text-lg font-semibold mb-4">Send Notification</h2>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full border p-2 mb-3 rounded"
            >
              <option value="">Select User</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username || u.name || u.email}
                </option>
              ))}
            </select>

            <textarea
              placeholder="Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border p-2 mb-3 rounded"
              rows={3}
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-3 py-1 bg-gray-400 text-white rounded"
              >
                Cancel
              </button>
              <button
                onClick={sendNotification}
                className="px-3 py-1 bg-blue-600 text-white rounded"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;