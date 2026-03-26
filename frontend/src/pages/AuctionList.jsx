import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import CountdownTimer from "../components/CountdownTimer";

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

const AuctionList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const urlCondition = searchParams.get("condition");
  const urlCategory = searchParams.get("category");

  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState(urlCategory || "all");
  const [condition, setCondition] = useState(urlCondition || "all");
  const [error, setError] = useState(null);

  useEffect(() => {
    setCondition(urlCondition || "all");
    setCategory(urlCategory || "all");
  }, [urlCondition, urlCategory]);

  useEffect(() => {
    fetchAuctions();
  }, [urlCondition, urlCategory]);

  const fetchAuctions = () => {
    setLoading(true);
    setError(null);

    let url = "http://127.0.0.1:8000/api/auctions/?";
    if (searchTerm) url += `search=${searchTerm}&`;
    if (category !== "all") url += `category=${category}&`;
    if (condition !== "all") url += `condition=${condition}`;

    axios
      .get(url)
      .then((res) => {
        setAuctions(res.data);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load auctions.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") fetchAuctions();
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const activeAuctions = auctions.filter(
    (item) => new Date(item.end_date) > new Date(),
  );

  return (
    <div className="py-4 px-4 container mx-auto">
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            {condition === "refurbished"
              ? "Refurbished Deals"
              : category !== "all"
                ? `${category.charAt(0).toUpperCase() + category.slice(1)}`
                : "Live Auctions"}
          </h2>
          {(category !== "all" || condition !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/browse")}
              className="text-muted-foreground"
            >
              Clear Filters
            </Button>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-3 mx-auto max-w-full lg:max-w-none">
          <Select
            value={category}
            onValueChange={(value) => updateFilters("category", value)}
          >
            <SelectTrigger className="w-full md:w-[180px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="electronics">Electronics</SelectItem>
              <SelectItem value="fashion">Fashion</SelectItem>
              <SelectItem value="home">Home</SelectItem>
              <SelectItem value="vehicles">Vehicles</SelectItem>
              <SelectItem value="toys">Toys</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={condition}
            onValueChange={(value) => updateFilters("condition", value)}
          >
            <SelectTrigger className="w-full md:w-[160px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
              <SelectValue placeholder="Condition" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
              <SelectItem value="all">All Conditions</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="used">Used</SelectItem>
              <SelectItem value="refurbished">Refurbished</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex flex-1 gap-2">
            <Input
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            <Button
              onClick={fetchAuctions}
              className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200"
            >
              Search
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {activeAuctions.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            <div className="text-5xl mb-4">📦</div>
            <h4 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
              No auctions found
            </h4>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Be the first to list an item or try different filters.
            </p>
            <Button onClick={() => navigate("/create")}>List an Item</Button>
          </div>
        ) : (
          activeAuctions.map((item) => (
            <Card
              key={item.id}
              className="group overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-all hover:shadow-md cursor-pointer"
              onClick={() => navigate(`/auction/${item.id}`)}
            >
              <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="absolute inset-0 w-full h-full object-contain p-4 transition-transform group-hover:scale-105 duration-300"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500 italic">
                    No Image
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-slate-900/80 dark:bg-slate-100/90 text-white dark:text-slate-900 border-none shadow-sm capitalize text-[10px]"
                  >
                    {item.condition}
                  </Badge>
                </div>
                {item.condition === "refurbished" && (
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-amber-500 text-white border-none shadow-sm text-[10px]">
                      ✨ Value
                    </Badge>
                  </div>
                )}
              </div>

              <CardHeader className="p-4 pb-1">
                <div className="text-[10px] uppercase font-bold text-primary dark:text-blue-400 tracking-wider mb-1">
                  {item.category}
                </div>
                <CardTitle className="text-base line-clamp-1 font-bold">
                  {item.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 pt-0 flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">
                      Current Bid
                    </p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">
                      ₹{item.current_price}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 rounded-lg p-3 text-center border border-slate-100 dark:border-slate-800">
                  <div className="text-red-600 dark:text-red-400 font-bold tabular-nums text-sm">
                    <CountdownTimer targetDate={item.end_date} />
                  </div>
                </div>
              </CardContent>

              <div className="p-4 pt-0">
                <Button className="w-full font-semibold shadow-sm bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200">
                  View Auction
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AuctionList;
