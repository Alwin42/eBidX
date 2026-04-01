import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Dashboard = () => {
  const [data, setData] = useState({ bids: [], listings: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();
  const socketRef = useRef(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem("user_id");
    if (storedUserId) setUserId(parseInt(storedUserId));
    fetchDashboardData(true);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = new WebSocket(
      `ws://127.0.0.1:8000/ws/notifications/?token=${token}`,
    );
    socketRef.current = socket;

    socket.onopen = () => console.log("Dashboard Live Updates Active");

    socket.onmessage = (event) => {
      const msgData = JSON.parse(event.data);

      if (
        msgData.type === "notification" &&
        msgData.auction_id &&
        msgData.new_price
      ) {
        updateBidStatus(msgData.auction_id, msgData.new_price);
      }

      if (msgData.type === "dashboard_update") {
        if (
          [
            "auction_deleted",
            "item_sold",
            "payment_received",
            "payment_sent",
          ].includes(msgData.event)
        ) {
          fetchDashboardData(false);
        } else if (msgData.auction_id && msgData.new_price) {
          updateBidStatus(msgData.auction_id, msgData.new_price);
        }
      }
    };

    socket.onerror = (err) => console.error("Dashboard WebSocket Error:", err);

    return () => {
      if (socketRef.current) socketRef.current.close();
    };
  }, []);

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
      setError("Failed to load profile data.");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  if (error)
    return (
      <div className="container mx-auto mt-12 px-4">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold">My Dashboard</h2>
        <p className="text-muted-foreground">Manage your bids and listings</p>
      </div>

      <div className="mb-10">
        <h4 className="text-xl font-semibold mb-6 border-b dark:border-slate-800 pb-2">
          My Recent Bids
        </h4>
        {data?.bids?.length === 0 ? (
          <Alert className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
            <AlertDescription>
              You haven't placed any bids yet.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.bids?.map((bid) => {
              const item = bid.auction_item || {};
              const imageUrl =
                item?.image ||
                (item?.images?.length > 0 ? item.images[0].image : null);
              if (!item.id) return null;

              const isEnded = new Date(item.end_date) < new Date();
              const isWinning =
                parseFloat(bid.amount) === parseFloat(item.current_price);
              const isPaid = item.is_paid;

              return (
                <Card
                  key={bid.id}
                  className="overflow-hidden shadow-sm flex flex-col h-full border-0 bg-slate-50/30 dark:bg-slate-900/50 transition-colors"
                >
                  <div className="h-[150px] overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={item.title}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="text-muted-foreground text-sm italic">
                        No Image
                      </span>
                    )}
                  </div>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base line-clamp-1">
                      {item.title || "Unknown Item"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 flex-1 flex flex-col">
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">My Bid:</span>
                        <span className="font-bold text-primary dark:text-blue-400">
                          ₹{bid.amount}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Base Price:
                        </span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          ₹{item.base_price || "0.00"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Current Price:
                        </span>
                        <span
                          className={`font-bold ${isWinning && !isEnded ? "text-green-600 dark:text-green-400" : isEnded ? "text-slate-600 dark:text-slate-400" : "text-red-600 dark:text-red-400"}`}
                        >
                          ₹{item.current_price || "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-auto space-y-2">
                      {isEnded && isWinning ? (
                        isPaid ? (
                          <div className="flex gap-2 w-full">
                            <Button
                              disabled
                              className="flex-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 opacity-100 font-bold border border-green-200 dark:border-green-800"
                            >
                              Paid ✓
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                              onClick={() => navigate(`/receipt/${item.id}`)}
                            >
                              Receipt
                            </Button>
                          </div>
                        ) : (
                          <Button
                            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold"
                            onClick={() => navigate(`/checkout/${item.id}`)}
                          >
                            Pay Now 💳
                          </Button>
                        )
                      ) : isEnded ? (
                        <Button
                          disabled
                          className="w-full bg-slate-100 dark:bg-slate-800 text-slate-400 opacity-100"
                        >
                          Auction Ended
                        </Button>
                      ) : isWinning ? (
                        <Button
                          disabled
                          className="w-full bg-green-600 text-white opacity-100 font-bold"
                        >
                          Winning
                        </Button>
                      ) : (
                        <Button
                          disabled
                          className="w-full bg-red-500 text-white opacity-100 font-bold"
                        >
                          Outbid
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full dark:border-slate-700 dark:hover:bg-slate-800"
                        onClick={() => navigate(`/auction/${item.id}`)}
                      >
                        View Auction
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h4 className="text-xl font-semibold mb-6 border-b dark:border-slate-800 pb-2">
          My Listings
        </h4>
        {data?.listings?.length === 0 ? (
          <Alert className="bg-slate-50 dark:bg-slate-900 border-dashed border-slate-200 dark:border-slate-800">
            <AlertDescription>
              You haven't listed any items for sale.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {data?.listings?.map((item) => {
              const imageUrl =
                item?.image ||
                (item?.images?.length > 0 ? item.images[0].image : null);

              return (
                <Card
                  key={item.id}
                  className="h-full border-0 shadow-sm bg-slate-100/50 dark:bg-slate-900/40 flex flex-col transition-colors"
                >
                  <div className="h-[120px] overflow-hidden bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={item.title}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="text-muted-foreground text-xs italic">
                        No Image
                      </span>
                    )}
                  </div>
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-sm line-clamp-1">
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 flex-1 flex flex-col">
                    <div className="mb-3 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          Base Price:
                        </span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          ₹{item.base_price || "0.00"}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          Current Price:
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          ₹{item.current_price}
                        </span>
                      </div>

                      {item.is_paid && (
                        <p className="text-xs font-bold text-green-600 dark:text-green-500 mt-2">
                          Paid by Buyer ✓
                        </p>
                      )}
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full h-8 text-xs mt-auto dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white"
                      onClick={() => navigate(`/auction/${item.id}`)}
                    >
                      View My Item
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
