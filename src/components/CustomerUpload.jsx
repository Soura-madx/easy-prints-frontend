import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function CustomerUpload() {
  const { shopId } = useParams();
  const [selectedFiles, setSelectedFiles] = useState([]);
  
  // 6 Nayi Customization State
  const [settings, setSettings] = useState({
    pages: 1, // Future me PDF page counter logic yahan aayega
    copies: 1,
    color: 'B&W',
    paperSize: 'A4',
    sides: 'single',
    orientation: 'portrait',
    scale: 'fit'
  });
  
  const [price, setPrice] = useState({ finalAmountToPay: 0 });
  const [isUploading, setIsUploading] = useState(false);

  // Price Calculation trigger
  useEffect(() => {
    const calculatePrice = async () => {
      try {
        const response = await axios.post('https://easy-prints-backend-1npm-install.onrender.com/api/orders/calculate-price', {
          shopId: shopId || 'default_shop_id', 
          ...settings,
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
      const filesArray = Array.from(e.target.files);
      const MAX_FILE_SIZE = 10 * 1024 * 1024;
      const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

      const hasInvalidType = filesArray.some(file => !ALLOWED_TYPES.includes(file.type));
      if (hasInvalidType) {
        alert("❌ Error: Galat File Format!\n\nAbhi sirf PDF aur Images allowed hain. Word/Excel ko PDF me convert karein.");
        e.target.value = '';
        return;
      }

      const isFileTooLarge = filesArray.some(file => file.size > MAX_FILE_SIZE);
      if (isFileTooLarge) {
        alert("❌ Error: File 10 MB se badi hai!\n\nTrial version me max 10 MB allowed hai.");
        e.target.value = ''; 
        return; 
      }

      setSelectedFiles(filesArray);
      // Pages ki dummy value abhi 5 rakh rahe hain jaisa apka tha
      setSettings({ ...settings, pages: 5 }); 
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return alert("Pehle file(s) upload karein!");
    
    setIsUploading(true);
    try {
      const uploadedFilesArray = [];
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('document', file); 
        const uploadRes = await axios.post('https://easy-prints-backend-1npm-install.onrender.com/api/upload', formData);
        
        uploadedFilesArray.push({
          fileUrl: uploadRes.data.fileUrl,
          fileName: file.name,
          settings: settings 
        });
      }
      
      await axios.post('https://easy-prints-backend-1npm-install.onrender.com/api/orders/create', {
        shopId: shopId,
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
      setSelectedFiles([]); 
    } catch (error) {
      alert("Order failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-white">
      <div className="w-full max-w-lg bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-2xl">
        <h2 className="text-2xl font-bold mb-6 text-center text-[#f58025]">Easy Prints</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="border-2 border-dashed border-white/30 p-6 text-center rounded-xl hover:border-[#f58025] transition-colors">
            <input type="file" multiple accept=".pdf, .jpg, .jpeg, .png" onChange={handleFileChange} className="hidden" id="fileInput" />
            <label htmlFor="fileInput" className="cursor-pointer flex flex-col items-center">
              <span className="text-4xl mb-2">📄</span>
              <span className="text-sm font-medium">{selectedFiles.length > 0 ? `${selectedFiles.length} File(s) Selected` : "Tap to Upload Document(s)"}</span>
              {selectedFiles.length > 0 && <div className="mt-2 text-xs text-gray-300">{selectedFiles.map(f => f.name).join(', ')}</div>}
            </label>
          </div>

          {/* 6 Customization Options Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <select className="bg-white/5 border border-white/20 p-2 rounded-lg text-white outline-none" 
              value={settings.color} onChange={(e) => setSettings({...settings, color: e.target.value})}>
              <option className="text-black" value="B&W">Black & White</option>
              <option className="text-black" value="Color">Color Print</option>
            </select>

            <select className="bg-white/5 border border-white/20 p-2 rounded-lg text-white outline-none" 
              value={settings.paperSize} onChange={(e) => setSettings({...settings, paperSize: e.target.value})}>
              <option className="text-black" value="A4">A4 (Standard)</option>
              <option className="text-black" value="A3">A3 (Large)</option>
              <option className="text-black" value="A5">A5 (Small)</option>
              <option className="text-black" value="Legal">Legal</option>
              <option className="text-black" value="Letter">Letter</option>
            </select>

            <select className="bg-white/5 border border-white/20 p-2 rounded-lg text-white outline-none" 
              value={settings.sides} onChange={(e) => setSettings({...settings, sides: e.target.value})}>
              <option className="text-black" value="single">Single Side</option>
              <option className="text-black" value="both">Both Sides</option>
            </select>

            <div className="flex items-center justify-between bg-white/5 border border-white/20 p-2 rounded-lg">
              <span className="text-gray-300">Copies:</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => setSettings({...settings, copies: Math.max(1, settings.copies - 1)})}>-</button>
                <span>{settings.copies}</span>
                <button type="button" onClick={() => setSettings({...settings, copies: settings.copies + 1})}>+</button>
              </div>
            </div>

            <select className="bg-white/5 border border-white/20 p-2 rounded-lg text-white outline-none" 
              value={settings.orientation} onChange={(e) => setSettings({...settings, orientation: e.target.value})}>
              <option className="text-black" value="portrait">Portrait</option>
              <option className="text-black" value="landscape">Landscape</option>
            </select>

            <select className="bg-white/5 border border-white/20 p-2 rounded-lg text-white outline-none" 
              value={settings.scale} onChange={(e) => setSettings({...settings, scale: e.target.value})}>
              <option className="text-black" value="fit">Fit to Page</option>
              <option className="text-black" value="actual">Actual Size</option>
            </select>
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

          <button type="submit" disabled={isUploading || selectedFiles.length === 0}
            className="w-full bg-[#f58025] hover:bg-orange-600 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50">
            {isUploading ? 'Uploading & Processing...' : 'Pay & Print'}
          </button>
        </form>
      </div>
    </div>
  );
}