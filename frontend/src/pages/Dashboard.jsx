import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

// React Bits Animations
import BorderGlow from "@/components/ui/BorderGlow"; 
import SplitText from "@/components/ui/SplitText";
import BlurText from "@/components/ui/BlurText";
import CountUp from "@/components/ui/CountUp";
import DarkVeil from "@/components/ui/DarkVeil";

const Dashboard = () => {
  const [data, setData] = useState({ bids: [], listings: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();
  const socketRef = useRef(null);

  // --- 1. FUNCTIONS DEFINED FIRST (Hoisting Fix) ---
  
  const fetchDashboardData = async (showLoading = true) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    if (showLoading) setLoading(true);

    try {
      const res = await axios.get("http://127.0.0.1:8000/api/dashboard/", {
        headers: { Authorization: `Token ${token}` },
      });
      setData(res.data || { bids: [], listings: [] });
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard data.");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const updateBidStatus = (auctionId, newPrice) => {
    setData((prevData) => {
      const updatedBids = prevData.bids.map((bid) => {
        if (bid.auction_item && bid.auction_item.id === auctionId) {
          return {
            ...bid,
            auction_item: { ...bid.auction_item, current_price: newPrice },
          };
        }
        return bid;
      });

      const updatedListings = prevData.listings.map((item) => {
        if (item.id === auctionId) {
          return { ...item, current_price: newPrice };
        }
        return item;
      });

      return { ...prevData, bids: updatedBids, listings: updatedListings };
    });
  };

  // --- 2. EFFECTS ---

  useEffect(() => {
    const storedUserId = localStorage.getItem("user_id");
    if (storedUserId) setUserId(parseInt(storedUserId));
    fetchDashboardData(true);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = new WebSocket(
      `ws://127.0.0.1:8000/ws/notifications/?token=${token}`
    );
    socketRef.current = socket;

    socket.onmessage = (event) => {
      const msgData = JSON.parse(event.data);
      if (msgData.type === "notification" && msgData.auction_id && msgData.new_price) {
        updateBidStatus(msgData.auction_id, msgData.new_price);
      }
      if (msgData.type === "dashboard_update") {
        fetchDashboardData(false);
      }
    };

    return () => {
      if (socketRef.current) socketRef.current.close();
    };
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );

  if (error)
    return (
      <div className="container mx-auto mt-12 px-4 max-w-2xl">
        <Alert variant="destructive" className="backdrop-blur-md bg-red-500/10 border-red-500/50">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );

  return (
    <div className="relative min-h-screen w-full bg-slate-950 overflow-x-hidden">
      {/* Background Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-30">
        <DarkVeil stretch={true} />
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="mb-12">
          <div className="text-4xl font-black tracking-tight text-white italic drop-shadow-md">
            <SplitText text="MY DASHBOARD" delay={50} />
          </div>
          <p className="text-slate-400 mt-2 font-medium tracking-wide">
            Real-time status of your bids and active listings.
          </p>
        </div>

        {/* --- RECENT BIDS SECTION --- */}
        <div className="mb-16">
          <div className="mb-8 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
            <BlurText 
              text="My Recent Bids" 
              className="text-xl font-bold text-slate-100 uppercase tracking-widest" 
            />
          </div>

          {data?.bids?.length === 0 ? (
            <Alert className="bg-white/5 backdrop-blur-md border-white/10 text-slate-400 rounded-2xl py-8">
              <AlertDescription>You haven't placed any bids yet. Start exploring auctions!</AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {data?.bids?.map((bid) => {
                const item = bid.auction_item || {};
                const imageUrl = item?.image || (item?.images?.length > 0 ? item.images[0].image : null);
                if (!item.id) return null;

                const isEnded = new Date(item.end_date) < new Date();
                const isWinning = parseFloat(bid.amount) === parseFloat(item.current_price);
                const isPaid = item.is_paid;

                return (
                  <BorderGlow 
                    key={bid.id} 
                    className="h-full rounded-[24px]"
                    // Glow green if winning, red if outbid (while active)
                    color={isWinning ? "#22c55e" : (!isEnded ? "#ef4444" : "#64748b")}
                  >
                    <Card className="group relative h-full flex flex-col overflow-hidden rounded-[24px] border border-white/10 bg-slate-900/40 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1">
                      
                      {/* Inset Image */}
                      <div className="p-3 pb-0">
                        <div className="relative h-40 w-full overflow-hidden rounded-xl bg-slate-800/50 border border-white/10">
                          {imageUrl ? (
                            <img src={imageUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs italic text-slate-500">No Image</div>
                          )}
                          <div className={`absolute top-2 right-2 px-2 py-1 rounded-md text-[10px] font-black uppercase ${isWinning ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
                            {isWinning ? "Winning" : "Outbid"}
                          </div>
                        </div>
                      </div>

                      <CardHeader className="p-5 pb-2">
                        <CardTitle className="text-lg font-bold line-clamp-1 text-white">
                          {item.title}
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="p-5 pt-0 flex-1 flex flex-col">
                        <div className="bg-white/5 rounded-xl p-3 mb-4 space-y-2 border border-white/5">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500 font-bold uppercase">My Bid</span>
                            <span className="text-white font-black">₹{bid.amount}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500 font-bold uppercase">Current Price</span>
                            <span className={`font-black ${isWinning ? "text-green-400" : "text-red-400"}`}>
                              ₹<CountUp to={parseFloat(item.current_price)} duration={1} />
                            </span>
                          </div>
                        </div>

                        <div className="mt-auto space-y-2">
                          {isEnded && isWinning ? (
                            isPaid ? (
                              <div className="flex gap-2">
                                <Button disabled className="flex-1 bg-green-500/20 text-green-400 border border-green-500/30 opacity-100 font-bold">Paid ✓</Button>
                                <Button variant="outline" className="flex-1 border-white/10 text-white hover:bg-white/10" onClick={() => navigate(`/receipt/${item.id}`)}>Receipt</Button>
                              </div>
                            ) : (
                              <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black shadow-lg shadow-amber-500/20 animate-pulse" onClick={() => navigate(`/checkout/${item.id}`)}>
                                PAY NOW 💳
                              </Button>
                            )
                          ) : isEnded ? (
                            <Button disabled className="w-full bg-white/5 text-slate-500 border border-white/5 font-bold">AUCTION ENDED</Button>
                          ) : (
                            <Button className={`w-full font-black text-white border-none ${isWinning ? "bg-green-600/80" : "bg-red-600/80"}`} onClick={() => navigate(`/auction/${item.id}`)}>
                              {isWinning ? "WINNING" : "RE-BID NOW"}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </BorderGlow>
                );
              })}
            </div>
          )}
        </div>

        {/* --- MY LISTINGS SECTION --- */}
        <div>
          <div className="mb-8 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
            <BlurText 
              text="My Active Listings" 
              className="text-xl font-bold text-slate-100 uppercase tracking-widest" 
            />
          </div>

          {data?.listings?.length === 0 ? (
            <Alert className="bg-white/5 backdrop-blur-md border-dashed border-white/10 text-slate-400 rounded-2xl py-8">
              <AlertDescription>You haven't listed any items yet.</AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {data?.listings?.map((item) => {
                const imageUrl = item?.image || (item?.images?.length > 0 ? item.images[0].image : null);

                return (
                  <Card key={item.id} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/30 backdrop-blur-md hover:bg-slate-900/50 transition-all">
                    <div className="h-32 w-full overflow-hidden bg-slate-800/40">
                      {imageUrl && <img src={imageUrl} alt={item.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />}
                    </div>
                    <div className="p-4">
                      <h5 className="font-bold text-white text-sm line-clamp-1 mb-2">{item.title}</h5>
                      <div className="flex justify-between items-center text-xs mb-3">
                        <span className="text-slate-500">Current</span>
                        <span className="text-blue-400 font-bold">₹{item.current_price}</span>
                      </div>
                      {item.is_paid && (
                        <div className="text-[10px] font-bold text-green-400 bg-green-400/10 py-1 px-2 rounded-md mb-3 text-center">
                          PAID BY BUYER ✓
                        </div>
                      )}
                      <Button variant="secondary" size="sm" className="w-full h-8 text-[10px] bg-white/10 text-white hover:bg-white/20 border-none" onClick={() => navigate(`/auction/${item.id}`)}>
                        VIEW ITEM
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;