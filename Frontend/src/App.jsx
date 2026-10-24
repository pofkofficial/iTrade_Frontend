import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { HelmetProvider } from 'react-helmet-async';
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import About from "./pages/About";
import Shop from "./pages/Shop";
import ContactUs from "./pages/ContactUs";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Login from "./pages/admin/Login";
import Checkout from "./pages/Checkout";
import Order_Confirmation from "./pages/Order-confirmation";
import Developertag from "./components/Developertag";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App = () => {
  return (
    <HelmetProvider>
      <Routes>
        {/* Admin routes with AuthProvider */}
        <Route path="/admin/*" element={
          <>
            <AuthProvider>
              <Routes>
                <Route path="login" element={<Login />} />
                <Route path="/" element={<AdminDashboard />} />
              </Routes>
            </AuthProvider>
            <ToastContainer />
          </>
        } />
        
        {/* Public routes with Navbar and Footer */}
        <Route path="*" element={
          <>
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/about" element={<About />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-confirmation" element={<Order_Confirmation />} />
              <Route path="/contact-us" element={<ContactUs />} />
              
            </Routes>
            <Footer />
            <Developertag />
          </>
        } />
      </Routes>
    </HelmetProvider>
  );
};

export default App;