import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import CountdownTimer from "../components/CountdownTimer";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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
  const [userId, setUserId] = useState(null);
  const [isWatched, setIsWatched] = useState(false);
  const isAuthenticated = !!localStorage.getItem("token");

  useEffect(() => {
    const storedUserId = localStorage.getItem("user_id");
    if (storedUserId) setUserId(parseInt(storedUserId));
    fetchAuctionData();
  }, [id]);

  useEffect(() => {
    if (item) setIsWatched(item.is_watched);
  }, [item]);

  useEffect(() => {
    const socket = new WebSocket(`ws://127.0.0.1:8000/ws/auction/${id}/`);
    
    socket.onopen = () => console.log("WebSocket Connected");
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.current_price) {
        setItem((prev) => ({ 
          ...prev, 
          current_price: data.current_price, 
          highest_bidder: data.highest_bidder 
        }));
        
        if (data.message === "Auction ended early by seller!") {
          fetchAuctionData();
        }
        
        const currentUserId = parseInt(localStorage.getItem("user_id"));
        if (data.highest_bidder && data.highest_bidder !== currentUserId) {
          setBidSuccess("");
        }
      }
    };
    
    socket.onerror = (err) => console.error("WebSocket Error:", err);
    
    return () => socket.close();
  }, [id]);

  const fetchAuctionData = () => {
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Token ${token}` } : {};
    axios.get(`http://127.0.0.1:8000/api/auctions/${id}/`, { headers })
      .then((res) => { setItem(res.data); setLoading(false); })
      .catch((err) => { 
        console.error(err); 
        setError("Item not found or auction has ended."); 
        setLoading(false); 
      });
  };

  const toggleWatchlist = async () => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    try {
      const res = await axios.post(`http://127.0.0.1:8000/api/auctions/${id}/watchlist/`, {}, { 
        headers: { Authorization: `Token ${token}` } 
      });
      setIsWatched(res.data.watched);
    } catch (err) { 
        if (err.response?.data?.error) alert(err.response.data.error);
        console.error("Watchlist failed", err); 
    }
  };

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    setBidError(""); setBidSuccess("");
    const token = localStorage.getItem("token");
    
    if (parseFloat(bidAmount) <= item.current_price) {
        setBidError(`Bid must be higher than ₹${item.current_price}`);
        return;
    }

    try {
      const res = await axios.post(`http://127.0.0.1:8000/api/auctions/${id}/bid/`, { amount: bidAmount }, { 
        headers: { Authorization: `Token ${token}` } 
      });
      setBidSuccess(`Bid placed successfully! New Price: ₹${res.data.amount}`);
      setBidAmount("");
    } catch (err) {
      if (err.response && err.response.data.error) setBidError(err.response.data.error);
      else setBidError("Something went wrong. Try again.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this auction? This cannot be undone.")) return;
    setDeleteLoading(true);
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`http://127.0.0.1:8000/api/auctions/${id}/`, { 
        headers: { Authorization: `Token ${token}` } 
      });
      navigate("/");
    } catch (err) { console.error(err); alert("Failed to delete auction."); setDeleteLoading(false); }
  };

  const handleEndEarly = async () => {
    if (!window.confirm("Accept the current bid and end this auction immediately?")) return;
    setEndEarlyLoading(true);
    const token = localStorage.getItem("token");
    try {
      await axios.post(`http://127.0.0.1:8000/api/auctions/${id}/end/`, {}, { 
        headers: { Authorization: `Token ${token}` } 
      });
      fetchAuctionData();
    } catch (err) { 
      console.error(err); 
      alert(err.response?.data?.error || "Failed to end auction."); 
    } finally {
      setEndEarlyLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center mt-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (error) return <div className="container mx-auto mt-12 px-4 max-w-3xl"><Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert></div>;

  const isAuctionActive = new Date(item.end_date) > new Date();

  return (
    <div className="container mx-auto mt-12 px-4 max-w-3xl mb-20">
      <Card className="shadow-lg border-0 overflow-hidden bg-white dark:bg-slate-900 transition-colors">
        {item.images && item.images.length > 0 ? (
          <Carousel className="w-full relative group">
            <CarouselContent>
              {item.images.map((imgObj) => (
                <CarouselItem key={imgObj.id}>
                  <div className="bg-slate-50 dark:bg-slate-950 flex items-center justify-center h-[400px] w-full">
                    <img 
                      src={imgObj.image} 
                      alt={item.title} 
                      className="max-h-full max-w-full object-contain select-none"
                      draggable="false"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            
            {item.images.length > 1 && (
              <>
                <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-50 h-10 w-10 rounded-full border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer flex items-center justify-center hover:scale-110" />
                <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-50 h-10 w-10 rounded-full border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer flex items-center justify-center hover:scale-110" />
              </>
            )}
          </Carousel>
        ) : (
          item.image && (
            <div className="bg-slate-50 dark:bg-slate-950 h-[400px] flex items-center justify-center w-full">
              <img src={item.image} alt={item.title} className="max-h-full max-w-full object-contain" />
            </div>
          )
        )}

        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-3xl font-bold">{item.title}</h2>
            {isAuctionActive && (
              <button onClick={toggleWatchlist} className="text-3xl transition-transform hover:scale-110" title={isWatched ? "Remove from Watchlist" : "Add to Watchlist"}>
                {isWatched ? "❤️" : "🤍"}
              </button>
            )}
          </div>

          <p className="text-muted-foreground mb-6">{item.description}</p>
          <hr className="my-6 border-slate-200 dark:border-slate-800" />

          {isAuctionActive ? (
            <div className="mb-6">
              <CountdownTimer targetDate={item.end_date} />
            </div>
          ) : (
            <Alert className="mb-6 bg-slate-100 dark:bg-slate-800 border-none text-center">
              <AlertTitle className="text-xl font-bold">Auction Closed</AlertTitle>
              <AlertDescription>This item is no longer accepting bids.</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between items-center mb-8">
            <div>
              <p className="text-xs uppercase text-muted-foreground font-bold tracking-wider">
                {isAuctionActive ? "Current Price" : "Final Price"}
              </p>
              <h3 className="text-4xl text-primary dark:text-blue-400 font-bold">₹{item.current_price}</h3>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Seller</p>
              <p className="text-lg font-medium">{item.seller}</p>
            </div>
          </div>

          {item.is_owner ? (
            <Alert className={`${!isAuctionActive ? (item.highest_bidder ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700") : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"} text-center flex flex-col items-center p-6`}>
              <AlertTitle className={`${!isAuctionActive ? (item.highest_bidder ? "text-green-800 dark:text-green-300" : "text-slate-800 dark:text-slate-300") : "text-blue-800 dark:text-blue-300"} font-bold text-lg mb-2`}>
                {!isAuctionActive 
                  ? (item.highest_bidder 
                      ? (item.is_paid ? "💰 Payment Received!" : "🎉 Item Sold!") 
                      : "⏳ Auction Expired") 
                  : "You are the seller."}
              </AlertTitle>
              <AlertDescription className={`${!isAuctionActive ? (item.highest_bidder ? "text-green-700 dark:text-green-400" : "text-slate-600 dark:text-slate-400") : "text-blue-700 dark:text-blue-400"} mb-4`}>
                {!isAuctionActive 
                  ? (item.highest_bidder 
                      ? (item.is_paid 
                          ? "The buyer has successfully paid for this item. Please prepare for shipping or handover." 
                          : "This auction has concluded successfully. Awaiting buyer payment.") 
                      : "This auction ended without any bids. You can safely delete it to clear your dashboard.") 
                  : "You manage this auction."}
              </AlertDescription>
              <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                {isAuctionActive && item.highest_bidder && (
                  <Button variant="default" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleEndEarly} disabled={endEarlyLoading}>
                    {endEarlyLoading ? "Processing..." : "Accept Highest Bid & End"}
                  </Button>
                )}
                
                {(isAuctionActive || !item.highest_bidder) && (
                  <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
                    {deleteLoading ? "Deleting..." : "Delete Auction"}
                  </Button>
                )}
              </div>
            </Alert>
          ) : item.highest_bidder === userId ? (
            <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="text-5xl mb-3">🎉</div>
              <h3 className="text-2xl text-green-700 dark:text-green-400 font-bold mb-1">
                {isAuctionActive ? "You are winning!" : "You won this auction!"}
              </h3>
              <p className="text-green-600 dark:text-green-500 mb-4">
                {isAuctionActive 
                  ? `Your bid of ₹${item.current_price} is currently the highest.` 
                  : `You secured the item for ₹${item.current_price}.`}
              </p>
              
              {!isAuctionActive && (
                item.is_paid ? (
                  <div className="flex flex-col gap-3 mt-4">
                    <div className="bg-green-200 dark:bg-green-800/50 text-green-800 dark:text-green-200 py-2 px-4 rounded-md font-bold">
                      Payment Successful ✓
                    </div>
                    <Button 
                      variant="outline"
                      className="w-full h-12 text-lg font-bold border-green-600 text-green-700 hover:bg-green-50 dark:border-green-500 dark:text-green-400 dark:hover:bg-green-900/30 transition-transform hover:scale-[1.02]" 
                      onClick={() => navigate(`/receipt/${item.id}`)}
                    >
                      View Receipt 🧾
                    </Button>
                  </div>
                ) : (
                  <Button 
                    size="lg" 
                    className="w-full h-12 text-lg font-bold bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white shadow-md transition-transform hover:scale-[1.02]" 
                    onClick={() => navigate(`/checkout/${item.id}`)}
                  >
                    Proceed to Payment 💳
                  </Button>
                )
              )}
            </div>
          ) : isAuctionActive && isAuthenticated ? (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-lg border border-slate-100 dark:border-slate-800">
              <h5 className="font-semibold text-lg mb-4">Place Your Bid</h5>

              {bidError && <Alert variant="destructive" className="mb-4"><AlertDescription>{bidError}</AlertDescription></Alert>}
              {bidSuccess && (
                <Alert className="border-green-500 dark:border-green-700 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 mb-4">
                  <AlertDescription>{bidSuccess}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleBidSubmit} className="flex gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder={`Enter amount > ${item.current_price}`} 
                    value={bidAmount} 
                    onChange={(e) => setBidAmount(e.target.value)} 
                    required 
                    className="flex h-12 w-full rounded-md border border-input bg-white dark:bg-slate-900 px-8 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <Button type="submit" className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white h-12 px-6">
                  Submit Bid
                </Button>
              </form>
            </div>
          ) : isAuctionActive && !isAuthenticated ? (
            <Button size="lg" className="w-full h-14 text-lg font-bold bg-amber-500 hover:bg-amber-600 text-white" onClick={() => navigate("/login")}>
              Login to Bid
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuctionDetail;
