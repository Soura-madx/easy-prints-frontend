import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function CustomerUpload() {
  const { shopId } = useParams();
  const [selectedFiles, setSelectedFiles] = useState([]);
  
  // 6 Customization State
  const [settings, setSettings] = useState({
    pages: 1, 
    copies: 1,
    color: 'B&W',
    paperSize: 'A4',
    sides: 'single',
    orientation: 'portrait',
    scale: 'fit'
  });
  
  const [price, setPrice] = useState({ finalAmountToPay: 0, baseAmount: 0, gatewayFee: 0 });
  const [isUploading, setIsUploading] = useState(false);
  const [tokenDisplay, setTokenDisplay] = useState(null); 
  const [completedPaymentMode, setCompletedPaymentMode] = useState(''); // Success screen par dikhane ke liye

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
        alert("❌ Error: Galat File Format!\n\nAbhi sirf PDF aur Images (JPG/PNG) allowed hain. Kripya apni Word ya Excel file ko pehle PDF me Save/Convert karein, fir upload karein.");
        e.target.value = '';
        return;
      }

      const isFileTooLarge = filesArray.some(file => file.size > MAX_FILE_SIZE);
      if (isFileTooLarge) {
        alert("❌ Error: File ka size bahut bada hai!\n\nTrial version me max 10 MB tak ki file allowed hai. Kripya choti file select karein.");
        e.target.value = ''; 
        return; 
      }

      setSelectedFiles(filesArray);
      setSettings({ ...settings, pages: 1 }); 
    }
  };

  // NAYA: handleSubmit ab mode accept karega ('Online' ya 'Cash')
  const handleSubmit = async (paymentMode) => {
    if (selectedFiles.length === 0) return alert("Pehle file(s) upload karein!");
    
    setIsUploading(true);
    setTokenDisplay(null);
    setCompletedPaymentMode(paymentMode); // Success screen ke liye save kar rahe hain

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
      
      const response = await axios.post('https://easy-prints-backend-1npm-install.onrender.com/api/orders/create', {
        shopId: shopId,
        customerName: "Walk-in Customer",
        files: uploadedFilesArray, 
        payment: {
          baseAmount: price.baseAmount,
          gatewayFee: price.gatewayFee,
          finalPaidAmount: price.finalAmountToPay,
          paymentStatus: paymentMode === 'Cash' ? 'Pending' : 'Paid', // Cash hai toh Pending
          paymentMethod: paymentMode // Database me method save hoga
        }
      });

      setTokenDisplay(response.data.order.tokenNumber);
      setSelectedFiles([]); 
    } catch (error) {
      console.error(error);
      alert("Order failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // SUCCESS SCREEN
  if (tokenDisplay) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 text-center text-white shadow-2xl">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-2">Order Successful!</h2>
          <p className="text-gray-300 mb-6">Aapki file dukan par bhej di gayi hai.</p>
          
          <div className="bg-[#f58025]/20 border-2 border-[#f58025] rounded-xl p-6 mb-6">
            <p className="text-sm text-gray-300 uppercase tracking-wider">Aapka Token Number</p>
            <p className="text-6xl font-black text-[#f58025] mt-2">{tokenDisplay}</p>
          </div>
          
          {/* Cash walo ke liye red alert */}
          {completedPaymentMode === 'Cash' && (
            <div className="bg-red-500/20 text-red-200 p-4 rounded-xl mb-6 border border-red-500/30 font-medium animate-pulse text-sm">
              ⚠️ Counter par jakar apna Token number batayein aur ₹{price.finalAmountToPay} dekar print lein.
            </div>
          )}

          {!completedPaymentMode || completedPaymentMode === 'Online' && (
             <p className="text-sm text-gray-400 mb-6">Counter par apna token number batayein aur print lein.</p>
          )}
          
          <button 
            onClick={() => {
              setTokenDisplay(null);
              setSettings({ ...settings, pages: 1, copies: 1, color: 'B&W', paperSize: 'A4', sides: 'single' });
            }} 
            className="w-full bg-white/10 hover:bg-white/20 border border-white/20 py-3 rounded-xl transition-colors font-medium"
          >
            Print Another Document
          </button>
        </div>
      </div>
    );
  }

  // UPLOAD FORM UI
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-white">
      <div className="w-full max-w-lg bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-2xl">
        <h2 className="text-2xl font-bold mb-6 text-center text-[#f58025]">Easy Prints</h2>
        
        {/* Changed from <form onSubmit> to simple <div> since we use buttons directly */}
        <div className="space-y-4">
          <div className="border-2 border-dashed border-white/30 p-6 text-center rounded-xl hover:border-[#f58025] transition-colors">
            <input 
              type="file" 
              multiple 
              accept=".pdf, .jpg, .jpeg, .png" 
              onChange={handleFileChange} 
              className="hidden" 
              id="fileInput" 
            />
            <label htmlFor="fileInput" className="cursor-pointer flex flex-col items-center">
              <span className="text-4xl mb-2">📄</span>
              <span className="text-sm font-medium">
                {selectedFiles.length > 0 ? `${selectedFiles.length} File(s) Selected` : "Tap to Upload Document(s)"}
              </span>
              {selectedFiles.length > 0 && (
                <div className="mt-2 text-xs text-gray-300 max-h-16 overflow-y-auto w-full px-4">
                  {selectedFiles.map(f => f.name).join(', ')}
                </div>
              )}
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <select className="bg-white/5 border border-white/20 p-2 rounded-lg text-white outline-none cursor-pointer" 
              value={settings.color} onChange={(e) => setSettings({...settings, color: e.target.value})}>
              <option className="text-black" value="B&W">Black & White</option>
              <option className="text-black" value="Color">Color Print</option>
            </select>
            <select className="bg-white/5 border border-white/20 p-2 rounded-lg text-white outline-none cursor-pointer" 
              value={settings.paperSize} onChange={(e) => setSettings({...settings, paperSize: e.target.value})}>
              <option className="text-black" value="A4">A4 (Standard)</option>
              <option className="text-black" value="A3">A3 (Large)</option>
              <option className="text-black" value="A5">A5 (Small)</option>
              <option className="text-black" value="Legal">Legal</option>
              <option className="text-black" value="Letter">Letter</option>
            </select>
            <select className="bg-white/5 border border-white/20 p-2 rounded-lg text-white outline-none cursor-pointer" 
              value={settings.sides} onChange={(e) => setSettings({...settings, sides: e.target.value})}>
              <option className="text-black" value="single">Single Side</option>
              <option className="text-black" value="both">Both Sides (Duplex)</option>
            </select>
            <div className="flex items-center justify-between bg-white/5 border border-white/20 p-2 rounded-lg">
              <span className="text-gray-300">Copies:</span>
              <div className="flex gap-2">
                <button type="button" className="px-2 bg-white/10 hover:bg-white/20 rounded" onClick={() => setSettings({...settings, copies: Math.max(1, settings.copies - 1)})}>-</button>
                <span className="w-4 text-center">{settings.copies}</span>
                <button type="button" className="px-2 bg-white/10 hover:bg-white/20 rounded" onClick={() => setSettings({...settings, copies: settings.copies + 1})}>+</button>
              </div>
            </div>
            <select className="bg-white/5 border border-white/20 p-2 rounded-lg text-white outline-none cursor-pointer" 
              value={settings.orientation} onChange={(e) => setSettings({...settings, orientation: e.target.value})}>
              <option className="text-black" value="portrait">Portrait</option>
              <option className="text-black" value="landscape">Landscape</option>
            </select>
            <select className="bg-white/5 border border-white/20 p-2 rounded-lg text-white outline-none cursor-pointer" 
              value={settings.scale} onChange={(e) => setSettings({...settings, scale: e.target.value})}>
              <option className="text-black" value="fit">Fit to Page</option>
              <option className="text-black" value="actual">Actual Size</option>
            </select>
          </div>

          <div className="bg-[#005596]/30 p-5 rounded-lg mt-4 border border-[#005596] shadow-inner">
            <div className="flex justify-between items-center text-2xl font-bold">
              <span>Total Amount</span>
              <span className="text-[#f58025]">₹{price.finalAmountToPay || "0.00"}</span>
            </div>
            {price.discountAmount > 0 && (
              <p className="text-xs text-green-400 mt-1 text-right">
                🎉 Bulk discount applied!
              </p>
            )}
          </div>

          {/* 2 ALAG BUTTONS FOR SUBMISSION */}
          {isUploading ? (
             <div className="w-full bg-[#f58025] opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2">
               <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
               Processing...
             </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => handleSubmit('Cash')}
                disabled={selectedFiles.length === 0}
                className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 flex justify-center items-center gap-2"
              >
                💵 Cash on Counter
              </button>
              
              
            </div>
          )}
        </div>
      </div>
    </div>
  );
}