import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuth, isLoggedIn, getUser } from "../utils/auth";
import { toast } from "react-hot-toast";

type User = {
  id: number;
  username: string;
  email: string;
};


const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [user] = useState<User | null>(() => getUser<User>());

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);


  const handleLogout = () => {
    clearAuth();
    toast.success("Logged out successfully!");
    navigate("/login");
  };

  if (!user) return null;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8">

        <div className="space-y-4">
          <div className="border rounded-lg px-4 py-3">
            <p className="text-xs text-gray-400 mb-0.5">Username</p>
            <p className="text-gray-700 font-medium">{user.username}</p>
          </div>
          <div className="border rounded-lg px-4 py-3">
            <p className="text-xs text-gray-400 mb-0.5">Email</p>
            <p className="text-gray-700 font-medium">{user.email}</p>
          </div>
          
          
        </div>

        <button
          onClick={handleLogout}
          className="w-full mt-6 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition"
        >
          Logout
        </button>

      </div>
    </div>
  );
};

export default Profile;