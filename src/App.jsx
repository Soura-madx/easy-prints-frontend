import { BrowserRouter as Router, Routes, Route, Link, useParams, Navigate, useNavigate } from 'react-router-dom';
import ShopkeeperRegister from './components/ShopkeeperRegister';
import CustomerUpload from './components/CustomerUpload';
import ShopkeeperDashboard from './components/ShopkeeperDashboard';
import Login from './components/Login';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('shopkeeperToken'); 
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

const UploadWrapper = () => {
  const { shopId } = useParams();
  return <CustomerUpload shopId={shopId} />;
};

const DashboardWrapper = () => {
  const { shopId } = useParams();
  const shopName = localStorage.getItem('shopName') || "My Print Shop";
  return <ShopkeeperDashboard shopId={shopId} shopName={shopName} />;
};

// 🌟 Smart Dynamic Navbar (No Hardcoding)
const DynamicNavbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('shopkeeperToken');
  const savedShopId = localStorage.getItem('shopId');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <nav className="p-4 bg-black/40 border-b border-white/10 flex justify-center gap-6 flex-wrap">
      {!token ? (
        <>
          <Link to="/register" className="hover:text-[#f58025] transition-colors">Register Shop</Link>
          <Link to="/login" className="hover:text-[#f58025] transition-colors">Shop Login</Link>
        </>
      ) : (
        <>
          <Link to={`/dashboard/${savedShopId}`} className="hover:text-[#f58025] text-green-400 font-bold transition-colors">
            My Dashboard
          </Link>
          <button onClick={handleLogout} className="text-red-400 hover:text-red-300 transition-colors">
            Logout
          </button>
        </>
      )}
    </nav>
  );
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-900 text-white font-sans">
        
        {/* Dynamic Navbar component ko yahan add kiya */}
        <DynamicNavbar />

        <Routes>
          <Route path="/register" element={<ShopkeeperRegister />} />
          <Route path="/login" element={<Login />} />
          
          {/* Customer sirf QR scan karke is route par aayega, use navbar ki zaroorat nahi */}
          <Route path="/upload/:shopId" element={<UploadWrapper />} />
          
          <Route path="/dashboard/:shopId" element={
            <ProtectedRoute>
              <DashboardWrapper />
            </ProtectedRoute>
          } />
          
          <Route path="*" element={
            <div className="text-center py-20">
              <h1 className="text-5xl font-bold text-[#f58025] mb-6">Easy Prints SaaS</h1>
              <p className="text-xl text-gray-400">Smart Cloud Printing Solution for Shops</p>
              {!localStorage.getItem('shopkeeperToken') && (
                <Link to="/login" className="mt-8 inline-block bg-[#005596] hover:bg-blue-600 px-8 py-3 rounded-xl font-bold transition-colors">
                  Get Started
                </Link>
              )}
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;