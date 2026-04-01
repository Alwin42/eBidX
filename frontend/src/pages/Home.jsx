import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ColorBends from "@/components/ui/colorbends";

const AuctionShelf = ({ title = "Auctions", items = [], navigate }) => {
  // Graceful fallback if items is undefined or empty
  if (!items || items.length === 0) return null;

  // Safely extract the category slug without crashing if title is missing
  const categorySlug = title ? title.split(" ").pop().toLowerCase() : "all";

  // Helper function to safely extract the image URL
  const getImageUrl = (item) => {
    if (item?.image) return item.image;
    if (item?.images && item.images.length > 0) return item.images[0].image;
    return null;
  };

  return (
    <section className="mb-12">
      <div className="flex justify-between items-end mb-6 border-b border-slate-200/50 dark:border-slate-700/50 pb-2">
        <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 drop-shadow-sm">
          {title}
        </h3>
        <Button
          variant="link"
          className="text-blue-600 dark:text-blue-400 font-semibold pr-0"
          onClick={() => navigate(`/browse?category=${categorySlug}`)}
        >
          See all →
        </Button>
      </div>

      <div className="flex overflow-x-auto gap-6 pb-8 snap-x hide-scrollbar">
        {items.map((item, index) => {
          const imageUrl = getImageUrl(item);
          
          return (
            <Card
              key={item?.id || `fallback-key-${index}`} 
              
              className="group min-w-[320px] max-w-[320px] snap-start relative flex flex-col overflow-hidden rounded-2xl border border-white/60 dark:border-slate-700/50  from-white/60 to-white/30 dark:from-slate-800/60 dark:to-slate-900/40 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] cursor-pointer"
              onClick={() => navigate(`/auction/${item?.id}`)}
            >
              {/* Removed padding, set to exact height, added hidden overflow for the zoom effect */}
              <div className="relative w-full h-auto overflow-hidden bg-slate-100 dark:bg-slate-800/50 border-b border-white/30 dark:border-slate-700/50">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={item?.title || "Auction Item"}
                    // object-cover makes it edge-to-edge. transition and scale add the smooth zoom!
                    className="w-full h-full top-0 object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full">
                    <span className="text-muted-foreground text-sm font-medium">
                      No Image
                    </span>
                  </div>
                )}
                {/* Subtle inner shadow at the bottom of the image to make it look premium */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
              </div>

              <CardHeader className="p-5 pb-2 relative z-10">
                {/* Title changes color slightly on hover */}
                <CardTitle className="text-xl font-bold line-clamp-1 text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                  {item?.title || "Untitled Auction"}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-5 pt-0 mt-auto relative z-10">
                <div className="flex justify-between items-center mt-3">
                  {/* Premium gradient text for the price */}
                  <span className="font-extrabold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 drop-shadow-sm">
                    ₹{item?.current_price || "0"}
                  </span>
                  {/* Rounded pill-shaped badge that glows slightly on hover */}
                  <span className="text-[10px] tracking-wider uppercase font-bold px-4 py-1.5 bg-white/50 dark:bg-slate-900/50 border border-white/50 dark:border-slate-700/50 backdrop-blur-md rounded-full text-slate-800 dark:text-slate-200 shadow-sm transition-all duration-300 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:border-blue-200 dark:group-hover:border-blue-800/50">
                    Bid Now
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
};

const Home = () => {
  const [sections, setSections] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Added AbortController to prevent memory leaks if the component unmounts mid-fetch
    const controller = new AbortController();
    
    const fetchSections = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/api/home-sections/", {
          signal: controller.signal
        });
        setSections(res.data);
      } catch (err) {
        if (!axios.isCancel(err)) {
          console.error("Home sections error:", err);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchSections();
    
    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full">
      
      {/* FIXED BACKGROUND WRAPPER */}
      <div className="fixed inset-0 z-0 w-full h-full pointer-events-none opacity-80">
        <ColorBends
            colors={["#ff5c7a", "#8a5cff", "#00ffd1"]}
            rotation={0}
            speed={0.2}
            scale={1}
            frequency={1}
            warpStrength={1}
            mouseInfluence={1}
            parallax={0.5}
            noise={0.1}
            transparent={true}
            autoRotate={0}
            color=""
          />
      </div>

      {/* CONTENT WRAPPER - relative z-10 ensures UI sits ON TOP of the background */}
      <div className="relative z-10 flex flex-col w-full">
      
        
        <div className="flex flex-col gap-12 pt-4 px-4 md:px-0">
          
          {/* GLASSMORPHIC HERO SECTION */}
          <section className="relative overflow-hidden text-center py-16 px-6 bg-slate-900/70 dark:bg-slate-950/70 backdrop-blur-xl rounded-3xl border border-white/10 dark:border-slate-700/50 shadow-2xl">
            <div className="relative z-10 flex flex-col items-center justify-center">
              <h1 className="text-5xl font-black tracking-tighter lg:text-7xl mb-6 text-white italic drop-shadow-lg">
                eBidX
              </h1>
              <p className="text-xl text-blue-100 max-w-[600px] mx-auto opacity-90 mb-8 leading-relaxed">
                The premium auction experience. Secure, transparent, and built for
                winners.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-sm">
                <Button
                  size="lg"
                  className="bg-white text-blue-900 hover:bg-blue-50 active:scale-95 transition-all font-bold px-10 shadow-lg h-14 text-lg"
                  onClick={() => navigate("/browse")}
                >
                  Explore All
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-white border-white/30 bg-white/10 backdrop-blur-md hover:bg-white/20 active:scale-95 transition-all font-semibold px-10 h-14 text-lg"
                  onClick={() => navigate("/create")}
                >
                  Start Selling
                </Button>
              </div>
            </div>
            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
            </div>
          </section>

          <div className="px-1">
            <AuctionShelf
              title="Trending Now"
              items={sections?.trending}
              navigate={navigate}
            />
            <AuctionShelf
              title="Electronics"
              items={sections?.electronics}
              navigate={navigate}
            />
            <AuctionShelf
              title="Fashion"
              items={sections?.fashion}
              navigate={navigate}
            />
            <AuctionShelf
              title="Vehicles"
              items={sections?.vehicles}
              navigate={navigate}
            />
            <AuctionShelf
              title="Toys & Hobbies"
              items={sections?.toys}
              navigate={navigate}
            />
          </div>

          <style>{`
            .hide-scrollbar::-webkit-scrollbar { display: none; }
            .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          `}</style>
        </div>
      </div>
    </div>
  );
};

export default Home;