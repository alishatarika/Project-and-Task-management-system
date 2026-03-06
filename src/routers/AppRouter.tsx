import { BrowserRouter, Routes, Route } from "react-router-dom";
import Footer from "../components/Footer";
import Login from "../pages/login";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Login />} />
          </Routes>
        </main>

        <Footer />
        
      </div>
    </BrowserRouter>
  );
}