import { useState, useEffect } from 'react';
import {useParams} from 'react-router-dom'
import axios from 'axios';

export default function CustomerUpload() {

  const { shopId } = useParams();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [settings, setSettings] = useState({
    pages: 1,
    copies: 1,
    isColor: false,
    isDoubleSided: false
  });
  const [price, setPrice] = useState({ finalAmountToPay: 0 });
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const calculatePrice = async () => {
      try {
        const response = await axios.post('https://easy-prints-backend-1npm-install.onrender.com/api/orders/calculate-price', {
          shopId: shopId || 'default_shop_id', 
          ...settings,
          // Estimate base pages logic adjusted for multiple files
          pages: settings.pages * (selectedFiles.length || 1)
        });
        setPrice(response.data);
      } catch (error) {
        console.error("Price calculation failed", error);
      }
    };
    calculatePrice();
  }, [settings, shopId, selectedFiles.length]);

 const handleFileChange = (e) => {
    if (e.target.files) {
      // NodeList ko Array me convert karna
      const filesArray = Array.from(e.target.files);
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB in bytes

      // Check karna ki kya koi bhi file 10 MB se badi hai
      const isFileTooLarge = filesArray.some(file => file.size > MAX_FILE_SIZE);

      if (isFileTooLarge) {
        alert("❌ Error: Aapki file 10 MB se badi hai!\n\nTrial version me sirf 10 MB tak ki file allowed hai. Kripya choti file select karein.");
        e.target.value = ''; // Input ko clear kar dega taaki same file dubara select na ho
        return; // Function yahi rok dega, state update nahi hogi
      }

      // Agar file size sahi hai, tabhi aage ka process hoga
      setSelectedFiles(filesArray);
      setSettings({ ...settings, pages: 5 }); 
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return alert("Pehle file(s) upload karein!");
    
    setIsUploading(true);
    try {
      const uploadedFilesArray = [];

      // 1. Har file ko sequentially Cloudinary par upload karein
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('document', file); 
        const uploadRes = await axios.post('https://easy-prints-backend-1npm-install.onrender.com/api/upload', formData);
        
        uploadedFilesArray.push({
          fileUrl: uploadRes.data.fileUrl,
          fileName: file.name,
          settings: settings // Attach current settings to this file
        });
      }
      
      // 2. Create Order Backend API (Sending Array instead of single file string)
      await axios.post('https://easy-prints-backend-1npm-install.onrender.com/api/orders/create', {
        shopId: shopId ,
        customerName: "Walk-in Customer",
        files: uploadedFilesArray, 
        payment: {
          baseAmount: price.baseAmount,
          gatewayFee: price.gatewayFee,
          finalPaidAmount: price.finalAmountToPay,
          paymentStatus: 'Paid'
        }
      });

      alert("Print order successfully placed!");
      setSelectedFiles([]); // Reset form
    } catch (error) {
      console.error(error);
      alert("Order failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 text-white shadow-2xl">
        <h2 className="text-2xl font-bold mb-6 text-center text-[#f58025]">Easy Prints</h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="border-2 border-dashed border-white/30 p-6 text-center rounded-xl hover:border-[#f58025] transition-colors">
            <input 
              type="file" 
              multiple 
              accept=".pdf,.docx,.jpg,.png" 
              onChange={handleFileChange} 
              className="hidden" 
              id="fileInput"
            />
            <label htmlFor="fileInput" className="cursor-pointer flex flex-col items-center">
              <span className="text-4xl mb-2">📄</span>
              <span className="text-sm font-medium">
                {selectedFiles.length > 0 
                  ? `${selectedFiles.length} File(s) Selected` 
                  : "Tap to Upload Document(s)"}
              </span>
              {selectedFiles.length > 0 && (
                <div className="mt-2 text-xs text-gray-300">
                  {selectedFiles.map(f => f.name).join(', ')}
                </div>
              )}
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
              <span className="text-sm">Color</span>
              <input 
                type="checkbox" 
                checked={settings.isColor} 
                onChange={(e) => setSettings({...settings, isColor: e.target.checked})}
                className="w-5 h-5 accent-[#f58025]"
              />
            </div>
            <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
              <span className="text-sm">Double Sided</span>
              <input 
                type="checkbox" 
                checked={settings.isDoubleSided} 
                onChange={(e) => setSettings({...settings, isDoubleSided: e.target.checked})}
                className="w-5 h-5 accent-[#f58025]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
            <span className="text-sm">Copies</span>
            <div className="flex items-center gap-3">
              <button 
                type="button" 
                onClick={() => setSettings({...settings, copies: Math.max(1, settings.copies - 1)})}
                className="bg-white/20 px-3 rounded"
              >-</button>
              <span>{settings.copies}</span>
              <button 
                type="button" 
                onClick={() => setSettings({...settings, copies: settings.copies + 1})}
                className="bg-white/20 px-3 rounded"
              >+</button>
            </div>
          </div>

          <div className="bg-[#005596]/30 p-4 rounded-lg mt-4 border border-[#005596]">
            <div className="flex justify-between items-center text-sm text-gray-300">
              <span>Handling Fee (2%)</span>
              <span>₹{price.gatewayFee || "0.00"}</span>
            </div>
            <div className="flex justify-between items-center text-xl font-bold mt-2">
              <span>Total Pay</span>
              <span className="text-[#f58025]">₹{price.finalAmountToPay || "0.00"}</span>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isUploading || selectedFiles.length === 0}
            className="w-full bg-[#f58025] hover:bg-orange-600 text-white font-bold py-4 rounded-xl mt-6 transition-all disabled:opacity-50"
          >
            {isUploading ? 'Uploading & Processing...' : 'Pay & Print'}
          </button>
        </form>
      </div>
    </div>
  );
}