import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import CountdownTimer from "../components/ui/CountdownTimer";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// React Bits Animations & UI
import BorderGlow from "@/components/ui/BorderGlow"; 
import SplitText from "@/components/ui/SplitText";
import BlurText from "@/components/ui/BlurText";
import CountUp from "@/components/ui/CountUp";


const getBidIncrement = (price) => {
  if (price < 100) return 10;
  if (price < 1000) return 50;
  if (price < 10000) return 100;
  if (price < 50000) return 500;
  if (price < 100000) return 1000;
  if (price < 500000) return 5000;
  if (price < 1000000) return 10000;
  if (price < 5000000) return 50000;
  return 100000;
};

const AuctionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [bidError, setBidError] = useState("");
  const [bidSuccess, setBidSuccess] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [endEarlyLoading, setEndEarlyLoading] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  
  const [userId] = useState(() => {
    const stored = localStorage.getItem("user_id");
    return stored ? parseInt(stored) : null;
  });

  const isAuthenticated = !!localStorage.getItem("token");

  // --- 1. FUNCTIONS DEFINED FIRST (Hoisting Fix) ---
  const fetchAuctionData = () => {
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Token ${token}` } : {};
    axios.get(`http://127.0.0.1:8000/api/auctions/${id}/`, { headers })
      .then((res) => { 
        setItem(res.data);
        setIsWatched(res.data.is_watched);
        setLoading(false); 
      })
      .catch((err) => { 
        console.error("Fetch error:", err);
        setError("Item not found or auction has ended."); 
        setLoading(false); 
      });
  };

  const handleEndEarly = async () => {
    if (!window.confirm("End auction early?")) return;
    setEndEarlyLoading(true);
    const token = localStorage.getItem("token");
    try {
      await axios.post(`http://127.0.0.1:8000/api/auctions/${id}/end/`, {}, {
        headers: { Authorization: `Token ${token}` },
      });
      fetchAuctionData();
    } catch (err) { 
      console.error("End early failed:", err);
      setEndEarlyLoading(false); 
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this auction?")) return;
    setDeleteLoading(true);
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`http://127.0.0.1:8000/api/auctions/${id}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      navigate("/");
    } catch (err) { 
      console.error("Delete failed:", err);
      setDeleteLoading(false); 
    }
  };

  const toggleWatchlist = async () => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");
    try {
      const res = await axios.post(`http://127.0.0.1:8000/api/auctions/${id}/watchlist/`, {}, {
        headers: { Authorization: `Token ${token}` },
      });
      setIsWatched(res.data.watched);
    } catch (err) { console.error("Watchlist failed", err); }
  };

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    setBidError(""); setBidSuccess("");
    const token = localStorage.getItem("token");
    try {
      await axios.post(`http://127.0.0.1:8000/api/auctions/${id}/bid/`, { amount: bidAmount }, {
        headers: { Authorization: `Token ${token}` },
      });
      setBidSuccess(`Bid placed successfully!`);
      setBidAmount("");
      fetchAuctionData();
    } catch (err) { setBidError(err.response?.data?.error || "Something went wrong."); }
  };

  // --- 2. EFFECTS ---
  useEffect(() => {
    fetchAuctionData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const socket = new WebSocket(`ws://127.0.0.1:8000/ws/auction/${id}/`);
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.current_price) {
        setItem((prev) => ({
          ...prev,
          current_price: data.current_price,
          highest_bidder: data.highest_bidder,
          bids: data.bids || prev.bids // Update bids list if backend sends it
        }));
        if (data.message === "Auction ended early!") fetchAuctionData();
      }
    };
    return () => socket.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>;
  if (error) return <div className="container mx-auto pt-12 px-4 max-w-2xl min-h-screen text-white"><Alert variant="destructive" className="bg-red-500/10 border-red-500/50 text-white"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert></div>;

  const currentPriceForUI = item ? parseFloat(item.current_price) : 0;
  const isAuctionActive = new Date(item.end_date) > new Date();
  const dynamicIncrement = getBidIncrement(currentPriceForUI);
  const nextValidBid = currentPriceForUI + dynamicIncrement;

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-slate-950">
      

      {/* Expanded container for side-by-side layout */}
      <div className="container mx-auto pt-12 pb-24 px-4 max-w-6xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Main Auction Details (2/3 width) */}
          <div className="lg:col-span-2">
            <BorderGlow className="rounded-[32px]">
              <Card className="shadow-2xl border border-white/10 dark:border-slate-800/50 overflow-hidden bg-white/5 dark:bg-slate-900/60 backdrop-blur-3xl rounded-[32px]">
                <div className="p-4 pb-0">
                  <div className="relative rounded-2xl overflow-hidden bg-white/10 dark:bg-slate-800/40 border border-white/10 dark:border-slate-700/30 group">
                    {item.images && item.images.length > 0 ? (
                      <Carousel className="w-full">
                        <CarouselContent>
                          {item.images.map((imgObj) => (
                            <CarouselItem key={imgObj.id}>
                              <div className="flex items-center justify-center h-[400px] w-full p-4">
                                <img src={imgObj.image} alt={item.title} className="max-h-full max-w-full object-contain transition-transform duration-700 hover:scale-105" />
                              </div>
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                        <CarouselPrevious className="left-4 bg-white/10 backdrop-blur-md border-white/20 text-white" />
                        <CarouselNext className="right-4 bg-white/10 backdrop-blur-md border-white/20 text-white" />
                      </Carousel>
                    ) : (
                      <div className="h-[400px] flex items-center justify-center text-slate-400">No Image Available</div>
                    )}
                  </div>
                </div>

                <CardContent className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div className="text-3xl sm:text-4xl font-black text-white leading-tight">
                      <SplitText text={item.title} delay={30} />
                    </div>
                    {isAuctionActive && (
                      <button onClick={toggleWatchlist} className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-2xl transition-transform hover:scale-110">
                        {isWatched ? "❤️" : "🤍"}
                      </button>
                    )}
                  </div>

                  <p className="text-slate-400 mb-8 text-lg leading-relaxed">{item.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="p-5 bg-white/5 dark:bg-slate-900/40 rounded-2xl border border-white/10 shadow-inner">
                      <p className="text-xs uppercase text-slate-500 font-bold mb-1 tracking-widest">Time Remaining</p>
                      {isAuctionActive ? (
                        <div className="text-red-500 font-bold text-2xl"><CountdownTimer targetDate={item.end_date} /></div>
                      ) : (
                        <div className="text-slate-400 font-bold text-xl uppercase">Auction Ended</div>
                      )}
                    </div>
                    <div className="p-5 bg-white/5 dark:bg-slate-900/40 rounded-2xl border border-white/10 shadow-inner">
                      <p className="text-xs uppercase text-slate-500 font-bold mb-1 tracking-widest">Seller</p>
                      <p className="text-white font-bold text-xl">{item.seller}</p>
                    </div>
                  </div>

                  <div className="mb-8">
                    <p className="text-xs uppercase text-slate-500 font-bold mb-2 tracking-widest">{isAuctionActive ? "Current Bid" : "Final Price"}</p>
                    <div className="text-5xl font-black text-blue-400 flex items-center">
                      <span className="text-3xl mr-2 text-slate-500">₹</span>
                      <CountUp from={0} to={currentPriceForUI} duration={1.5} separator="," />
                    </div>
                  </div>

                  {/* Owner Controls */}
                  {item.is_owner ? (
                    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl text-center backdrop-blur-md">
                      <h3 className="text-xl font-bold mb-4 text-white">Owner Controls</h3>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        {isAuctionActive && item.highest_bidder && (
                          <Button onClick={handleEndEarly} disabled={endEarlyLoading} className="bg-green-600 hover:bg-green-700 text-white font-bold h-12 rounded-xl">
                            {endEarlyLoading ? "Ending..." : "Accept Bid & End"}
                          </Button>
                        )}
                        <Button variant="destructive" onClick={handleDelete} className="font-bold h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl" disabled={deleteLoading}>
                          {deleteLoading ? "Deleting..." : "Delete Auction"}
                        </Button>
                      </div>
                    </div>
                  ) : isAuctionActive && isAuthenticated ? (
                    <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                      {bidError && <Alert variant="destructive" className="mb-4 bg-red-500/20 text-white border-red-500/50">{bidError}</Alert>}
                      {bidSuccess && <Alert className="mb-4 bg-green-500/20 text-green-400 border-green-500/50 font-bold">{bidSuccess}</Alert>}
                      <form onSubmit={handleBidSubmit} className="flex flex-col sm:flex-row gap-4">
                        <div className="flex flex-1 items-center bg-slate-950/50 rounded-xl px-4 border border-white/10">
                          <span className="text-slate-500 font-bold text-xl mr-2">₹</span>
                          <input type="number" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} className="w-full h-14 bg-transparent font-bold text-xl text-white outline-none" placeholder={`Min ₹${nextValidBid}`} />
                        </div>
                        <Button type="submit" className="h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20">Bid Now</Button>
                      </form>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </BorderGlow>
          </div>

          {/* RIGHT COLUMN: Bidding History (1/3 width) */}
          <div className="lg:col-span-1">
            <BorderGlow className="rounded-[32px] h-full" color="#3b82f6">
              <Card className="h-full shadow-2xl border border-white/10 dark:border-slate-800/50 bg-white/5 dark:bg-slate-900/60 backdrop-blur-3xl rounded-[32px] flex flex-col">
                <CardHeader className="p-6 border-b border-white/10">
                  <div className="text-xl font-black text-white tracking-widest uppercase">
                    <BlurText text="Bid History" />
                  </div>
                </CardHeader>
                <CardContent className="p-6 flex-1 overflow-y-auto max-h-[600px] hide-scrollbar">
                  {!item.bids || item.bids.length === 0 ? (
                    <div className="text-center py-20">
                      <div className="text-4xl mb-4">🧊</div>
                      <p className="text-slate-500 font-medium italic">No bids placed yet.<br/>Be the first to bid!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {item.bids.map((bid, index) => (
                        <div key={bid.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${index === 0 ? "bg-blue-600/20 border-blue-500/50 shadow-lg shadow-blue-500/10" : "bg-white/5 border-white/5"}`}>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-white/10 bg-slate-800">
                              <AvatarFallback className="text-blue-400 font-bold uppercase">{bid.bidder_username?.charAt(0) || "U"}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-bold text-white leading-none mb-1">
                                {bid.bidder_username}
                                {index === 0 && <span className="ml-2 text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full uppercase">High</span>}
                              </p>
                              <p className="text-[10px] text-slate-500 font-medium">
                                {new Date(bid.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-black text-lg ${index === 0 ? "text-blue-400" : "text-white"}`}>₹{bid.amount}</p>
                            {index === 0 && <p className="text-[10px] text-green-400 font-bold uppercase">Leading</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                <div className="p-6 border-t border-white/10 bg-white/5 rounded-b-[32px]">
                   <p className="text-[10px] text-slate-500 text-center font-medium uppercase tracking-widest">
                     Live Bidding Updates Active
                   </p>
                </div>
              </Card>
            </BorderGlow>
          </div>

        </div>
      </div>
      
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default AuctionDetail;