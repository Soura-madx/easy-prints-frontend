import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [status, setStatus] = useState({ loading: false, error: null });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null });

    try {
      const response = await axios.post('https://easy-prints-backend-1npm-install.onrender.com/api/auth/login', {
        email: formData.email,
        password: formData.password
      });

      const { token, shopId, shopName } = response.data;

      // Token aur Shop ki details browser me save karna
      localStorage.setItem('shopkeeperToken', token);
      localStorage.setItem('shopName', shopName);
      localStorage.setItem('shopId', shopId);

      // Login hote hi dynamically us dukan ke dashboard par bhej dena
      navigate(`/dashboard/${shopId}`);
      
    } catch (error) {
      setStatus({ 
        loading: false, 
        error: error.response?.data?.error || 'Login failed. Please check your credentials.' 
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 text-white shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[#f58025]">Easy Prints</h2>
          <p className="text-gray-400 mt-2">Shopkeeper Login</p>
        </div>

        {status.error && (
          <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-6 text-center border border-red-500/30 text-sm">
            {status.error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email Address</label>
            <input 
              type="email" 
              name="email" 
              required 
              value={formData.email} 
              onChange={handleChange} 
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 focus:outline-none focus:border-[#f58025] transition-colors" 
              placeholder="shop@example.com" 
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input 
              type="password" 
              name="password" 
              required 
              value={formData.password} 
              onChange={handleChange} 
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 focus:outline-none focus:border-[#f58025] transition-colors" 
              placeholder="Enter your password" 
            />
          </div>

          <button 
            type="submit" 
            disabled={status.loading} 
            className="w-full bg-[#005596] hover:bg-blue-700 text-white font-bold py-3 rounded-xl mt-4 transition-all disabled:opacity-50 shadow-lg"
          >
            {status.loading ? 'Verifying...' : 'Login to Dashboard'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          Don't have a shop account?{' '}
          <Link to="/register" className="text-[#f58025] hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}