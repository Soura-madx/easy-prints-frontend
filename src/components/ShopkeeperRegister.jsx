import { useState } from 'react';
import axios from 'axios';

export default function ShopkeeperRegister() {
  const [formData, setFormData] = useState({
    shopName: '',
    email: '',
    password: '',
    bwSingle: 2,
    bwDouble: 1.5,
    colorSingle: 10,
    colorDouble: 8
  });
  
  const [status, setStatus] = useState({ loading: false, error: null, success: null });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null, success: null });

    try {
      // Backend registration API ko hit karna
      const response = await axios.post('https://easy-prints-backend-1npm-install.onrender.com/api/auth/register', {
        shopName: formData.shopName,
        email: formData.email,
        password: formData.password,
        pricing: {
          bwSingle: Number(formData.bwSingle),
          bwDouble: Number(formData.bwDouble),
          colorSingle: Number(formData.colorSingle),
          colorDouble: Number(formData.colorDouble)
        }
      });

      setStatus({ 
        loading: false, 
        error: null, 
        success: `Success! Your Shop ID is: ${response.data.shopId}. Please login now.` 
      });
      
    } catch (error) {
      setStatus({ 
        loading: false, 
        success: null, 
        error: error.response?.data?.error || 'Registration failed' 
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 text-white shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[#f58025]">Partner with Easy Prints</h2>
          <p className="text-gray-400 mt-2">Create your shop account and set your print rates</p>
        </div>

        {status.error && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-center border border-red-500/30">{status.error}</div>}
        {status.success && <div className="bg-green-500/20 text-green-400 p-3 rounded-lg mb-4 text-center border border-green-500/30">{status.success}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Shop Name</label>
              <input type="text" name="shopName" required value={formData.shopName} onChange={handleChange} 
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 focus:outline-none focus:border-[#f58025] transition-colors" placeholder="Sharma Print Point" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email Address</label>
              <input type="email" name="email" required value={formData.email} onChange={handleChange} 
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 focus:outline-none focus:border-[#f58025] transition-colors" placeholder="shop@example.com" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Password</label>
              <input type="password" name="password" required value={formData.password} onChange={handleChange} 
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 focus:outline-none focus:border-[#f58025] transition-colors" placeholder="Secure password" />
            </div>
          </div>

          <hr className="border-white/10" />

          {/* Pricing Setup Section */}
          <div>
            <h3 className="text-lg font-semibold text-[#005596] mb-4">Set Your Print Rates (₹)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">B&W (1-Side)</label>
                <input type="number" step="0.1" name="bwSingle" required value={formData.bwSingle} onChange={handleChange} 
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-center" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">B&W (2-Side)</label>
                <input type="number" step="0.1" name="bwDouble" required value={formData.bwDouble} onChange={handleChange} 
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-center" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Color (1-Side)</label>
                <input type="number" step="0.1" name="colorSingle" required value={formData.colorSingle} onChange={handleChange} 
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-center" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Color (2-Side)</label>
                <input type="number" step="0.1" name="colorDouble" required value={formData.colorDouble} onChange={handleChange} 
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-center" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={status.loading} 
            className="w-full bg-[#f58025] hover:bg-orange-600 text-white font-bold py-4 rounded-xl mt-6 transition-all disabled:opacity-50">
            {status.loading ? 'Registering Shop...' : 'Create Shop Account'}
          </button>
        </form>
      </div>
    </div>
  );
}