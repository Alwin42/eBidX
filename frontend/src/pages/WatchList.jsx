import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Shadcn UI Components
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AspectRatio } from "@/components/ui/aspect-ratio";

// React Bits Components (from your ui folder)
import BlurText from "@/components/ui/BlurText";
import CountUp from "@/components/ui/CountUp";

const Watchlist = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { 
      navigate("/login"); 
      return; 
    }
    
    axios.get("http://127.0.0.1:8000/api/watchlist/", { 
      headers: { Authorization: `Token ${token}` } 
    })
      .then((res) => { 
        setItems(res.data); 
        setLoading(false); 
      })
      .catch((err) => { 
        console.error(err); 
        setLoading(false); 
      });
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex justify-center items-center">
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-500"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-8 w-8 bg-white dark:bg-slate-900 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Animated Header */}
        <div className="mb-10 text-center sm:text-left">
          <BlurText 
            text="My Watchlist " 
            className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 pb-2"
            delay={50}
          />
          <p className="text-slate-600 dark:text-slate-400 mt-2 text-3xl animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300">
            Keep track of your favorite auctions.
          </p>
        </div>

        {items.length === 0 ? (
          <Alert className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 shadow-lg py-8 animate-in zoom-in-95 duration-500">
            <AlertDescription className="text-center text-lg text-slate-700 dark:text-slate-300 font-medium">
              Your watchlist is empty. Go explore the marketplace to find some cool items!
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {items.map((item, index) => (
              <Card 
                key={item.id} 
                className="h-full flex flex-col overflow-hidden bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transform-gpu transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4"
                style={{ animationFillMode: "both", animationDelay: `${index * 100}ms` }} 
              >
                {/* Image Section using AspectRatio to prevent layout shifts */}
                <div className="h-54 w-full bg-slate-100/50 dark:bg-slate-800/50 overflow-hidden">
                  <AspectRatio ratio={4 / 3}>
                    {item.images && item.images.length > 0 ? (
                      <img 
                        src={item.images[0].image} 
                        alt={item.title} 
                        className="object-cover w-full h-full transition-transform duration-500 hover:scale-110" 
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500 italic">
                        No Image
                      </div>
                    )}
                  </AspectRatio>
                </div>
                
                <CardHeader className="p-5 pb-2">
                  <CardTitle className="text-xl font-bold line-clamp-1 text-slate-900 dark:text-slate-100" title={item.title}>
                    {item.title}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="p-5 pt-0 flex-1 flex flex-col justify-end">
                  <div className="flex items-baseline space-x-1">
                    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Current Bid:</span>
                    <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-400 dark:to-blue-400">
                      ₹<CountUp to={parseFloat(item.current_price)} duration={1.0} separator="," />
                    </span>
                  </div>
                </CardContent>
                
                {/* Added border-none here to fix the white line issue */}
                <CardFooter className="p-8 pt-0 border-none">
                  <Button 
                    className="w-full h-11 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white border-0 shadow-md hover:shadow-indigo-500/25 transition-all duration-300 active:scale-95" 
                    onClick={() => navigate(`/auction/${item.id}`)}
                  >
                    View Auction
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Watchlist;