import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Watchlist = () => {
  // ... (Keep existing state and API call exactly the same) ...
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    axios.get("http://127.0.0.1:8000/api/watchlist/", { headers: { Authorization: `Token ${token}` } })
      .then((res) => { setItems(res.data); setLoading(false); })
      .catch((err) => { console.error(err); setLoading(false); });
  }, [navigate]);

  if (loading) return <div className="flex justify-center items-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-6">My Watchlist ❤️</h2>

      {items.length === 0 ? (
        <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <AlertDescription className="text-blue-800 dark:text-blue-300">
            Your watchlist is empty. Go find some cool items!
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Card key={item.id} className="h-full shadow-sm flex flex-col overflow-hidden border-0 bg-slate-50/50 dark:bg-slate-900/50 transition-colors">
              <div className="h-[200px] overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                {item.images && item.images.length > 0 ? (
                  <img src={item.images[0].image} alt={item.title} className="object-cover w-full h-full transition-transform hover:scale-105 duration-300" />
                ) : (
                  <span className="text-muted-foreground italic">No Image</span>
                )}
              </div>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xl line-clamp-1">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 flex-1">
                <p className="text-primary dark:text-blue-400 font-bold text-lg">₹{item.current_price}</p>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Button className="w-full" onClick={() => navigate(`/auction/${item.id}`)}>
                  View Auction
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Watchlist;
