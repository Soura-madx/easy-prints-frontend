import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react'; 

const socket = io('https://easy-prints-backend-1npm-install.onrender.com');

export default function ShopkeeperDashboard({ shopName }) {
  const { shopId } = useParams();
  const [orders, setOrders] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  const uploadLink = `${window.location.origin}/upload/${shopId}`;

  useEffect(() => {
    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('joinShopRoom', shopId);
    });

    const fetchOrders = async () => {
      try {
        const res = await axios.get(`https://easy-prints-backend-1npm-install.onrender.com/api/orders/${shopId}/pending`);
        setOrders(res.data.orders || []);
      } catch (error) {
        console.error("Failed to fetch past orders", error);
      }
    };
    fetchOrders();

    socket.on('NEW_PRINT_ORDER', (newOrder) => {
      setOrders((prevOrders) => [newOrder, ...prevOrders]);
      const audio = new Audio('/notification.mp3'); 
      audio.play().catch(e => console.log('Audio blocked'));
    });

    return () => {
      socket.off('connect');
      socket.off('NEW_PRINT_ORDER');
    };
  }, [shopId]);

  const handlePrintClick = async (orderId, filesArray) => {
    try {
      await axios.post('http://localhost:8080/print', { files: filesArray });
      await axios.put(`https://easy-prints-backend-1npm-install.onrender.com/api/orders/${orderId}/status`, { status: 'Completed' });
      setOrders(orders.filter(order => order._id !== orderId));
      alert('Print command sent successfully for all files!');
    } catch (error) {
      alert('Make sure the Local Print Agent is running on this PC!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6 bg-white/10 p-6 rounded-2xl border border-white/20 backdrop-blur-md">
          <div>
            <h1 className="text-3xl font-bold text-[#f58025]">{shopName || "My Print Shop"} Dashboard</h1>
            <p className="text-sm text-gray-400 mt-1">Live Order Management</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Agent Status:</span>
            {isConnected ? (
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full border border-green-500/30 text-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> Online
              </span>
            ) : (
              <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full border border-red-500/30 text-sm">
                Offline
              </span>
            )}
          </div>
        </div>

        {/* QR Code Section */}
        <div className="flex flex-col md:flex-row items-center gap-6 bg-gradient-to-r from-[#005596]/30 to-[#f58025]/20 p-6 rounded-2xl border border-white/10 mb-8">
          <div className="bg-white p-3 rounded-xl shadow-lg">
            <QRCodeCanvas value={uploadLink} size={120} level={"H"} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold text-white mb-2">Apni Dukan ka QR Code Print Karein</h2>
            <p className="text-gray-300 text-sm mb-4">
              Is QR code ko print karke dukan par lagayein. Customer ise scan karke direct aapke shop par files upload kar payenge.
            </p>
            <div className="bg-black/40 p-3 rounded-lg flex items-center justify-between border border-white/10">
              <a href={uploadLink} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline truncate text-sm">
                {uploadLink}
              </a>
              <button 
                onClick={() => { navigator.clipboard.writeText(uploadLink); alert("Link Copied!"); }}
                className="ml-4 bg-white/10 hover:bg-white/20 px-4 py-1 rounded text-sm transition-colors"
              >
                Copy Link
              </button>
            </div>
          </div>
        </div>

        {/* Orders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.length === 0 ? (
            <div className="col-span-full text-center py-20 text-gray-400">
              <span className="text-6xl block mb-4">🖨️</span>
              <p className="text-xl">Waiting for new print orders...</p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order._id} className="bg-white/5 border border-[#005596]/50 rounded-xl p-5 hover:border-[#f58025] transition-colors relative flex flex-col">
                <div className="absolute top-0 right-0 bg-[#f58025] text-xs font-bold px-3 py-1 rounded-bl-lg">
                  New
                </div>
                
                <div className="mb-4 mt-2">
                  <h3 className="text-lg font-bold">🛒 {order.customerName}</h3>
                  <p className="text-sm text-gray-400 mt-1">{order.files?.length || 0} File(s) in this order</p>
                </div>

                <div className="flex-1 max-h-48 overflow-y-auto mb-4 space-y-3 pr-1">
                  {order.files?.map((fileItem, idx) => (
                    <div key={idx} className="bg-black/30 p-3 rounded-lg text-sm">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold truncate pr-2" title={fileItem.fileName}>
                          📄 {fileItem.fileName}
                        </span>
                        <a href={fileItem.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:text-blue-300 underline whitespace-nowrap">
                          Preview
                        </a>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-1 text-xs text-gray-400">
                        <div><span className="block text-gray-500">Color</span> {fileItem.settings?.isColor ? 'Yes' : 'No'}</div>
                        <div><span className="block text-gray-500">Copies</span> {fileItem.settings?.copies}x</div>
                        <div><span className="block text-gray-500">Sides</span> {fileItem.settings?.isDoubleSided ? 'Double' : 'Single'}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-auto">
                  <div className="flex justify-between items-center pt-3 border-t border-white/10 mb-4">
                    <span className="text-gray-400">Paid Amount:</span>
                    <span className="text-lg font-bold text-green-400">
                      ₹{order.payment?.finalPaidAmount || "0.00"}
                    </span>
                  </div>

                  <button onClick={() => handlePrintClick(order._id, order.files)} className="w-full bg-[#f58025] hover:bg-orange-600 text-center py-3 rounded-lg font-bold text-white transition-colors shadow-lg shadow-orange-500/20">
                    Print All Files
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        
      </div>
    </div>
  );
}