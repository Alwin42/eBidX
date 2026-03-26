import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const AuctionShelf = ({ title, items, navigate }) => {
  if (!items || items.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex justify-between items-end mb-6 border-b border-slate-200 dark:border-slate-800 pb-2">
        <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {title}
        </h3>
        <Button
          variant="link"
          className="text-blue-600 dark:text-blue-400 font-semibold pr-0"
          onClick={() =>
            navigate(`/browse?category=${title.split(" ").pop().toLowerCase()}`)
          }
        >
          See all →
        </Button>
      </div>

      <div className="flex overflow-x-auto gap-6 pb-6 snap-x hide-scrollbar">
        {items.map((item) => {
          const imageUrl =
            item.image ||
            (item.images?.length > 0 ? item.images[0].image : null);
          return (
            <Card
              key={item.id}
              className="min-w-[240px] max-w-[240px] flex-shrink-0 snap-start shadow-sm border-0 bg-slate-50 dark:bg-slate-900/50 flex flex-col transition-all hover:scale-[1.02] cursor-pointer"
              onClick={() => navigate(`/auction/${item.id}`)}
            >
              <div className="h-[160px] bg-white dark:bg-slate-800 flex items-center justify-center p-2 rounded-t-xl overflow-hidden">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={item.title}
                    className="object-contain w-full h-full"
                  />
                ) : (
                  <span className="text-muted-foreground text-xs">
                    No Image
                  </span>
                )}
              </div>
              <CardHeader className="p-4 pb-1">
                <CardTitle className="text-base line-clamp-1">
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-primary dark:text-blue-400">
                    ₹{item.current_price}
                  </span>
                  <span className="text-[10px] uppercase font-bold px-2 py-1 bg-slate-200 dark:bg-slate-800 rounded">
                    Bid
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
    const fetchSections = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/api/home-sections/");
        setSections(res.data);
      } catch (err) {
        console.error("Home sections error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSections();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );

  return (
    <div className="flex flex-col gap-12">
      <section className="relative overflow-hidden text-center py-16 px-6 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-3xl border border-slate-800 shadow-2xl">
        <div className="relative z-10 flex flex-col items-center justify-center">
          <h1 className="text-5xl font-black tracking-tighter lg:text-7xl mb-6 text-white italic drop-shadow-md">
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
              className="text-white border-white/30 hover:bg-white/10 active:scale-95 transition-all font-semibold px-10 h-14 text-lg"
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
          title="🔥 Trending Now"
          items={sections?.trending}
          navigate={navigate}
        />
        <AuctionShelf
          title="📱 Electronics"
          items={sections?.electronics}
          navigate={navigate}
        />
        <AuctionShelf
          title="👟 Fashion"
          items={sections?.fashion}
          navigate={navigate}
        />
        <AuctionShelf
          title="🚗 Vehicles"
          items={sections?.vehicles}
          navigate={navigate}
        />
        <AuctionShelf
          title="🧸 Toys & Hobbies"
          items={sections?.toys}
          navigate={navigate}
        />
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `,
        }}
      />
    </div>
  );
};

export default Home;
