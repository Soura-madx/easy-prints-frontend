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
  const [filter, setFilter] = useState('Pending'); 

  const uploadLink = `${window.location.origin}/upload/${shopId}`;

  useEffect(() => {
    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('joinShopRoom', shopId);
    });

    const fetchOrders = async () => {
      try {
        const res = await axios.get(`https://easy-prints-backend-1npm-install.onrender.com/api/orders/${shopId}/dashboard-orders`);
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

    const interval = setInterval(fetchOrders, 60000);

    return () => {
      socket.off('connect');
      socket.off('NEW_PRINT_ORDER');
      clearInterval(interval);
    };
  }, [shopId]);

  const handlePrintClick = async (orderId, filesArray) => {
    try {
      await axios.post('http://localhost:8080/print', { files: filesArray });
      
      // Update Database - Mark print as completed and payment as Paid
      await axios.put(`https://easy-prints-backend-1npm-install.onrender.com/api/orders/${orderId}/status`, { 
        status: 'Completed',
        paymentUpdate: 'Paid' // Backend update ke liye flag (optional but good practice)
      });
      
      // UI Update - Mark Completed & Paid immediately
      setOrders(orders.map(order => 
        order._id === orderId 
          ? { ...order, status: 'Completed', payment: { ...order.payment, paymentStatus: 'Paid' } } 
          : order
      ));
      
    } catch (error) {
      alert('Make sure the Local Print Agent is running on this PC!');
    }
  };

  const filteredOrders = orders.filter(o => {
    if (filter === 'All') return true;
    return o.status === filter;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-white flex">
      
      {/* 1. SIDEBAR */}
      <div className="w-64 bg-slate-800/50 border-r border-white/10 flex flex-col p-6 hidden md:flex">
        <h2 className="text-2xl font-black text-[#f58025] mb-10">Easy Prints</h2>
        
        <nav className="flex-1 space-y-2">
          <button onClick={() => setFilter('Pending')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${filter === 'Pending' ? 'bg-[#f58025]/20 text-[#f58025]' : 'hover:bg-white/5'}`}>
            ⏱️ <span className="font-medium">Live Queue</span>
            {orders.filter(o => o.status === 'Pending').length > 0 && (
              <span className="ml-auto bg-[#f58025] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {orders.filter(o => o.status === 'Pending').length}
              </span>
            )}
          </button>
          
          <button onClick={() => setFilter('Completed')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${filter === 'Completed' ? 'bg-green-500/20 text-green-400' : 'hover:bg-white/5'}`}>
            ✅ <span className="font-medium">Recent Completed</span>
          </button>
          
          <button onClick={() => setFilter('All')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${filter === 'All' ? 'bg-white/10 text-white' : 'hover:bg-white/5'}`}>
            📁 <span className="font-medium">All Orders</span>
          </button>
        </nav>

        <div className="mt-auto bg-black/30 p-4 rounded-xl text-center">
          <div className="bg-white p-2 rounded-lg inline-block mb-3 shadow-lg">
            <QRCodeCanvas value={uploadLink} size={120} level={"H"} />
          </div>
          <p className="text-sm font-semibold text-gray-300 mb-1">Store QR Code</p>
          <button onClick={() => { navigator.clipboard.writeText(uploadLink); alert("Link Copied!"); }}
            className="text-xs text-blue-400 hover:underline">Copy Link</button>
        </div>
      </div>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 p-4 md:p-8 h-screen overflow-y-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">{shopName || "My Print Shop"} Dashboard</h1>
            <p className="text-gray-400 mt-1">Manage all your print orders here</p>
          </div>

          <div className={`px-4 py-2 rounded-full border text-sm flex items-center gap-2 font-medium shadow-lg ${isConnected ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            Agent {isConnected ? 'Online & Ready' : 'Offline'}
          </div>
        </div>

        <div className="flex gap-2 mb-6 md:hidden overflow-x-auto pb-2 scrollbar-hide">
          {['Pending', 'Completed', 'All'].map(f => (
            <button key={f} onClick={() => setFilter(f)} 
              className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === f ? 'bg-[#f58025] text-white shadow-lg shadow-orange-500/20' : 'bg-white/10 text-gray-300'}`}>
              {f}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOrders.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-24 text-gray-500 bg-white/5 rounded-3xl border border-white/10 border-dashed">
              <span className="text-6xl mb-4">📭</span>
              <p className="text-xl font-medium">No {filter.toLowerCase()} orders right now.</p>
              <p className="text-sm mt-2">New orders will appear here automatically.</p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              
              // Helper constants for payment check
              const isCashPending = order.payment?.paymentMethod === 'Cash' && order.payment?.paymentStatus === 'Pending';
              
              return (
              <div key={order._id} 
                className={`rounded-2xl p-5 border transition-all duration-300 flex flex-col h-full ${order.status === 'Completed' ? 'bg-green-900/10 border-green-500/30' : 'bg-white/5 border-[#005596]/50 hover:border-[#f58025] hover:shadow-xl hover:shadow-orange-500/10'}`}>
                
                {/* Card Header */}
                <div className="flex justify-between items-start mb-4 border-b border-white/10 pb-4">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1 font-semibold">Token Number</p>
                    <h3 className={`text-4xl font-black ${order.status === 'Completed' ? 'text-green-400' : 'text-[#f58025]'}`}>
                      {order.tokenNumber || '---'}
                    </h3>
                  </div>
                  <div className="text-right">
                    {/* Dynamic Payment Badge */}
                    {isCashPending ? (
                      <span className="text-xs font-bold px-3 py-1 rounded-full uppercase bg-red-500/20 text-red-400 animate-pulse border border-red-500/30">
                        ⚠️ Cash Pending
                      </span>
                    ) : (
                      <span className="text-xs font-bold px-3 py-1 rounded-full uppercase bg-green-500/20 text-green-400">
                        ✅ Paid {order.payment?.paymentMethod || ''}
                      </span>
                    )}
                    <p className="text-lg font-bold mt-2">₹{order.payment?.finalPaidAmount || "0.00"}</p>
                  </div>
                </div>

                {/* Files List */}
                <div className="flex-1 overflow-y-auto mb-4 space-y-2 pr-1" style={{ maxHeight: '180px' }}>
                  {order.files?.map((fileItem, idx) => (
                    <div key={idx} className="bg-black/40 p-3 rounded-xl border border-white/5 flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-semibold truncate pr-3" title={fileItem.fileName}>
                          📄 {fileItem.fileName}
                        </p>
                        <a href={fileItem.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-400 bg-blue-400/10 hover:bg-blue-400/20 px-2 py-1 rounded transition-colors whitespace-nowrap">
                          View PDF
                        </a>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mt-1">
                        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-300">{fileItem.settings?.paperSize}</span>
                        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-300">{fileItem.settings?.color}</span>
                        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-300">{fileItem.settings?.sides === 'both' ? 'Duplex' : 'Single'}</span>
                        <span className="text-[10px] bg-[#f58025]/20 text-[#f58025] px-2 py-0.5 rounded font-bold">{fileItem.settings?.copies} Copies</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Action Button */}
                <div className="mt-auto pt-2">
                  {order.status === 'Pending' ? (
                    <button 
                      onClick={() => handlePrintClick(order._id, order.files)} 
                      disabled={!isConnected}
                      className={`w-full font-bold py-3.5 rounded-xl transition-all shadow-lg flex justify-center items-center gap-2 ${
                        !isConnected ? 'bg-gray-600 text-gray-300 cursor-not-allowed' : 
                        isCashPending ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20' : 
                        'bg-[#f58025] hover:bg-orange-600 text-white shadow-orange-500/20'
                      }`}
                    >
                      {isConnected 
                        ? (isCashPending ? `💵 Collect ₹${order.payment?.finalPaidAmount} & Print` : '🖨️ Print Now') 
                        : 'Agent Offline'}
                    </button>
                  ) : (
                    <div className="w-full bg-green-500/10 text-green-400 text-center font-bold py-3.5 rounded-xl border border-green-500/20 flex items-center justify-center gap-2">
                      ✅ Printed Successfully
                    </div>
                  )}
                </div>

              </div>
            )})
          )}
        </div>
      </div>
    </div>
  );
}