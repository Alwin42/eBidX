import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import CountdownTimer from "../components/ui/CountdownTimer";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// React Bits Animations
import BorderGlow from "@/components/ui/BorderGlow"; 
import SplitText from "@/components/ui/SplitText";
import BlurText from "@/components/ui/BlurText";
import CountUp from "@/components/ui/CountUp";

const AuctionList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const category = searchParams.get("category") || "all";
  const condition = searchParams.get("condition") || "all";
  const searchUrl = searchParams.get("search") || "";

  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchUrl);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAuctions = async () => {
      await Promise.resolve(); 
      setLoading(true);
      setError(null);

      let url = "http://127.0.0.1:8000/api/auctions/?";
      if (searchUrl) url += `search=${searchUrl}&`;
      if (category !== "all") url += `category=${category}&`;
      if (condition !== "all") url += `condition=${condition}`;

      try {
        const res = await axios.get(url);
        setAuctions(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load auctions.");
      } finally {
        setLoading(false);
      }
    };

    fetchAuctions();
  }, [category, condition, searchUrl]);

  const handleSearchClick = () => {
    const newParams = new URLSearchParams(searchParams);
    if (searchTerm.trim()) {
      newParams.set("search", searchTerm);
    } else {
      newParams.delete("search");
    }
    setSearchParams(newParams);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSearchClick();
  };

  const updateFilters = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === "all") {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    setSearchParams(newParams);
  };

  if (loading && auctions.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const activeAuctions = auctions.filter(
    (item) => new Date(item.end_date) > new Date()
  );

  // Determine page title text
  const pageTitle = condition === "refurbished"
    ? "Refurbished Deals"
    : category !== "all"
      ? `${category.charAt(0).toUpperCase() + category.slice(1)}`
      : "Live Auctions";

  return (
    <div className="py-8 px-4 container mx-auto">
      {error && (
        <Alert variant="destructive" className="mb-6 backdrop-blur-md bg-red-500/10 border-red-500/50 text-red-500">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="mb-10">
        <div className="flex justify-between items-center mb-8">
          {/* Animated Header with SplitText */}
          <div className="text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100 drop-shadow-sm">
            <SplitText text={pageTitle} delay={40} />
          </div>
          
          {(category !== "all" || condition !== "all" || searchUrl) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/browse")}
              className="text-muted-foreground hover:bg-slate-200/50 dark:hover:bg-slate-800/50 backdrop-blur-sm transition-all"
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Glassmorphic Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mx-auto max-w-full lg:max-w-none p-4 rounded-2xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/60 dark:border-slate-700/50 shadow-lg">
          <Select value={category} onValueChange={(value) => updateFilters("category", value)}>
            <SelectTrigger className="w-full md:w-[200px] bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border-white/50 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-white/90 dark:bg-slate-900/90 text-white backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="electronics">Electronics</SelectItem>
              <SelectItem value="fashion">Fashion</SelectItem>
              <SelectItem value="home">Home</SelectItem>
              <SelectItem value="vehicles">Vehicles</SelectItem>
              <SelectItem value="toys">Toys</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>

          <Select value={condition} onValueChange={(value) => updateFilters("condition", value)}>
            <SelectTrigger className="w-full md:w-[180px] bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border-white/50 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all">
              <SelectValue placeholder="Condition" />
            </SelectTrigger>
            <SelectContent className="bg-white/90 dark:bg-slate-900/90 text-white backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
              <SelectItem value="all">All Conditions</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="used">Used</SelectItem>
              <SelectItem value="refurbished">Refurbished</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex flex-1 gap-3">
            <Input
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border-white/50 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500/50"
            />
            <Button
              onClick={handleSearchClick}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30 transition-all active:scale-95"
            >
              Search
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {activeAuctions.length === 0 && !loading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-24 px-6 bg-white/30 dark:bg-slate-900/30 backdrop-blur-lg rounded-3xl border border-white/40 dark:border-slate-800/50 shadow-xl">
            <div className="text-6xl mb-6 opacity-80 animate-bounce">📦</div>
            {/* BlurText Animation for empty state */}
            <BlurText 
              text="No auctions found" 
              className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3" 
            />
            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md text-center">
              Be the first to list an item or try different filters to discover amazing deals.
            </p>
            <Button 
              onClick={() => navigate("/create")}
              className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full px-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
            >
              List an Item
            </Button>
          </div>
        ) : (
          activeAuctions.map((item) => (
            /* Wrapped the entire card in BorderGlow component */
            <BorderGlow key={item.id} className="h-full rounded-[24px]">
              <Card
                // Upgraded to a more frosted glass look with deeper rounded corners
                className="group relative h-full flex flex-col overflow-hidden rounded-[24px] border border-white/60 dark:border-slate-700/50 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl shadow-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] cursor-pointer"
                onClick={() => navigate(`/auction/${item.id}`)}
              >
                {/* 1. INSET IMAGE: Added p-3 to the wrapper so the image floats inside the card.
                  2. Added internal border and inner shadow to the image container. 
                */}
                <div className="p-3 pb-0">
                  <div className="relative h-52 w-full overflow-hidden rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-white/50 dark:border-slate-700/50 shadow-sm">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        // Corrected to w-full object-cover with a smooth hover scale
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500 font-medium tracking-wide">
                        No Image Available
                      </div>
                    )}
                    
                    {/* Inner shadow overlay to make text badges pop */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-black/0 opacity-80"></div>

                    <div className="absolute top-3 right-3 flex gap-2">
                      <Badge className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-slate-900 dark:text-white border border-white/50 dark:border-slate-700 shadow-sm capitalize font-bold text-[10px] px-3 py-1.5 rounded-full">
                        {item.condition}
                      </Badge>
                    </div>
                    {item.condition === "refurbished" && (
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-none shadow-md font-bold text-[10px] px-3 py-1.5 rounded-full">
                          ✨ Value
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                <CardHeader className="px-5 pt-4 pb-2 relative z-10">
                  <div className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider mb-1">
                    {item.category}
                  </div>
                  <CardTitle className="text-xl line-clamp-1 font-black text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">
                    {item.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="px-5 pb-5 pt-0 flex-1 flex flex-col justify-end relative z-10">
                  {/* UNIFIED INFO BOX: Grouped the price and the timer into a single, 
                    clean internal frosted container.
                  */}
                  <div className="bg-white/50 dark:bg-slate-950/30 backdrop-blur-md rounded-2xl p-4 border border-white/60 dark:border-slate-700/50 shadow-inner mt-2 flex flex-col gap-3">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">
                          Current Bid
                        </p>
                        <div className="flex items-center text-3xl font-black text-slate-900 dark:text-white drop-shadow-sm">
                          <span className="text-2xl mr-1 text-slate-400 dark:text-slate-500">₹</span>
                          <CountUp 
                            from={0} 
                            to={parseFloat(item.current_price) || 0} 
                            duration={1.5} 
                            separator="," 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="h-[1px] w-full bg-slate-200/50 dark:bg-slate-700/50"></div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Ends in:
                      </span>
                      <div className="text-red-600 dark:text-red-400 font-bold tabular-nums text-sm tracking-wide">
                        <CountdownTimer targetDate={item.end_date} />
                      </div>
                    </div>
                  </div>
                </CardContent>

                <div className="px-5 pb-5 pt-0">
                  <Button className="w-full font-bold text-md shadow-lg shadow-indigo-500/20 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white border-none rounded-xl py-6 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-indigo-500/40">
                    Place Bid
                  </Button>
                </div>
              </Card>
            </BorderGlow>
          ))
        )}
      </div>
    </div>
  );
};

export default AuctionList;