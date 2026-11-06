import { useState } from 'react';
import axios from 'axios';

export default function ShopkeeperRegister() {
  const [formData, setFormData] = useState({
    shopName: '', email: '', password: '',
    
    // Category 1: Base
    bwSingle: 2, bwDouble: 3, colorSingle: 10, colorDouble: 18,
    
    // Category 2: Sizes Overrides
    a3Bw: 4, a3Color: 20,
    a5Bw: 1, a5Color: 5,
    legalBw: 2, legalColor: 10,
    letterBw: 2, letterColor: 10,
    
    // Category 3: Bulk
    bulkDiscounts: [], // e.g. { minCopies: 50, maxCopies: 100, discountPercent: 10 }
    
    // Category 4: Handling
    handlingType: 'Percentage', handlingValue: 2
  });
  
  const [status, setStatus] = useState({ loading: false, error: null, success: null });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // Bulk Discount Functions
  const addDiscountTier = () => {
    setFormData({ 
      ...formData, 
      bulkDiscounts: [...formData.bulkDiscounts, { minCopies: '', maxCopies: '', discountPercent: '' }] 
    });
  };

  const updateDiscountTier = (index, field, value) => {
    const updatedTiers = [...formData.bulkDiscounts];
    updatedTiers[index][field] = Number(value);
    setFormData({ ...formData, bulkDiscounts: updatedTiers });
  };

  const removeDiscountTier = (index) => {
    const updatedTiers = formData.bulkDiscounts.filter((_, i) => i !== index);
    setFormData({ ...formData, bulkDiscounts: updatedTiers });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null, success: null });

    try {
      await axios.post('https://easy-prints-backend-1npm-install.onrender.com/api/auth/register', {
        shopName: formData.shopName,
        email: formData.email,
        password: formData.password,
        pricing: {
          bwSingle: Number(formData.bwSingle), bwDouble: Number(formData.bwDouble),
          colorSingle: Number(formData.colorSingle), colorDouble: Number(formData.colorDouble),
          
          sizePrices: {
            A3: { bw: Number(formData.a3Bw), color: Number(formData.a3Color) },
            A5: { bw: Number(formData.a5Bw), color: Number(formData.a5Color) },
            Legal: { bw: Number(formData.legalBw), color: Number(formData.legalColor) },
            Letter: { bw: Number(formData.letterBw), color: Number(formData.letterColor) }
          },
          
          bulkDiscounts: formData.bulkDiscounts,
          
          handlingFee: {
            type: formData.handlingType,
            value: Number(formData.handlingValue)
          }
        }
      });

      setStatus({ loading: false, error: null, success: 'Shop successfully registered! You can now login.' });
    } catch (error) {
      setStatus({ loading: false, success: null, error: error.response?.data?.error || 'Registration failed' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 text-white shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[#f58025]">Partner with Easy Prints</h2>
          <p className="text-gray-400 mt-2">Setup your full pricing catalog</p>
        </div>

        {status.error && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-center border border-red-500/30">{status.error}</div>}
        {status.success && <div className="bg-green-500/20 text-green-400 p-3 rounded-lg mb-4 text-center border border-green-500/30">{status.success}</div>}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Shop Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-black/20 p-5 rounded-xl">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Shop Name</label>
              <input type="text" name="shopName" required value={formData.shopName} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-lg p-2" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-lg p-2" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Password</label>
              <input type="password" name="password" required value={formData.password} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-lg p-2" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Category 1: Base Rates */}
            <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
              <h3 className="text-lg font-semibold text-[#005596] mb-4">1. Base Rates (A4 Size)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs text-gray-400 mb-1">B&W (Single)</label><input type="number" step="0.1" name="bwSingle" value={formData.bwSingle} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded p-2" /></div>
                <div><label className="block text-xs text-gray-400 mb-1">B&W (Double)</label><input type="number" step="0.1" name="bwDouble" value={formData.bwDouble} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded p-2" /></div>
                <div><label className="block text-xs text-gray-400 mb-1">Color (Single)</label><input type="number" step="0.1" name="colorSingle" value={formData.colorSingle} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded p-2" /></div>
                <div><label className="block text-xs text-gray-400 mb-1">Color (Double)</label><input type="number" step="0.1" name="colorDouble" value={formData.colorDouble} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded p-2" /></div>
              </div>
            </div>

            {/* Category 2: Size Overrides */}
            <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
              <h3 className="text-lg font-semibold text-[#005596] mb-4">2. Other Paper Sizes (Flat Rates)</h3>
              <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
                {['a3', 'a5', 'legal', 'letter'].map((size) => (
                  <div key={size} className="flex gap-4 items-center">
                    <span className="w-12 text-sm uppercase text-gray-400">{size}</span>
                    <div className="flex-1"><input type="number" placeholder="B&W ₹" name={`${size}Bw`} value={formData[`${size}Bw`]} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm" /></div>
                    <div className="flex-1"><input type="number" placeholder="Color ₹" name={`${size}Color`} value={formData[`${size}Color`]} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm" /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Category 3: Bulk Discounts */}
            <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-[#005596]">3. Bulk Discounts</h3>
                <button type="button" onClick={addDiscountTier} className="bg-green-500/20 text-green-400 px-3 py-1 rounded text-xs font-bold hover:bg-green-500/30">+ Add Tier</button>
              </div>
              
              {formData.bulkDiscounts.length === 0 ? (
                <p className="text-sm text-gray-500">No bulk discounts added.</p>
              ) : (
                <div className="space-y-2">
                  {formData.bulkDiscounts.map((tier, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-black/30 p-2 rounded">
                      <input type="number" placeholder="Min Qty" value={tier.minCopies} onChange={(e) => updateDiscountTier(idx, 'minCopies', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded p-1 text-sm text-center" />
                      <span className="text-gray-500">to</span>
                      <input type="number" placeholder="Max Qty" value={tier.maxCopies} onChange={(e) => updateDiscountTier(idx, 'maxCopies', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded p-1 text-sm text-center" />
                      <input type="number" placeholder="% Off" value={tier.discountPercent} onChange={(e) => updateDiscountTier(idx, 'discountPercent', e.target.value)} className="w-full bg-[#f58025]/20 text-[#f58025] border border-orange-500/30 rounded p-1 text-sm text-center font-bold" />
                      <button type="button" onClick={() => removeDiscountTier(idx)} className="text-red-400 hover:text-red-300 font-bold px-2">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Category 4: Handling/Extra Charges */}
            <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
              <h3 className="text-lg font-semibold text-[#005596] mb-4">4. Extra / Handling Charges</h3>
              <p className="text-xs text-gray-400 mb-4">Ye charge customer ke final bill me add hoga, bina usko explicit detail dikhaye.</p>
              
              <div className="flex gap-4 items-center">
                <select name="handlingType" value={formData.handlingType} onChange={handleChange} className="bg-black/40 border border-white/10 rounded-lg p-3 w-1/2 text-sm text-white">
                  <option value="Percentage">Percentage (%)</option>
                  <option value="Flat">Flat Amount (₹)</option>
                  <option value="None">No Extra Charge</option>
                </select>
                
                {formData.handlingType !== 'None' && (
                  <input type="number" step="0.1" name="handlingValue" value={formData.handlingValue} onChange={handleChange} className="bg-black/40 border border-[#f58025]/50 rounded-lg p-3 w-1/2 text-center font-bold" placeholder="e.g. 2" />
                )}
              </div>
            </div>
          </div>

          <button type="submit" disabled={status.loading} className="w-full bg-[#f58025] hover:bg-orange-600 text-white font-bold py-4 rounded-xl mt-6 transition-all disabled:opacity-50 text-lg shadow-lg shadow-orange-500/20">
            {status.loading ? 'Creating Shop Account...' : 'Complete Registration'}
          </button>
        </form>
      </div>
    </div>
  );
}