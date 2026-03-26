import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import StripePayment from "../components/StripeCheckout"; // Import your Stripe component

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

const Checkout = () => {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchItem = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await axios.get(`http://127.0.0.1:8000/api/auctions/${id}/`, {
          headers: { Authorization: `Token ${token}` },
        });
        setItem(res.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Could not load checkout details. Please try again.");
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] mt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Loading secure checkout...</p>
      </div>
    );
  
  if (error)
    return (
      <div className="container mx-auto mt-12 px-4 max-w-3xl">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );

  return (
    <div className="container mx-auto py-12 px-4 max-w-5xl">
      <h2 className="text-3xl font-bold mb-8">Secure Checkout 🔒</h2>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5">
          <Card className="shadow-sm border-0 bg-slate-50 dark:bg-slate-900 transition-colors">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center mb-6">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-16 h-16 object-cover rounded-md mr-4 shadow-sm"
                />
                <div>
                  <h6 className="font-bold text-base leading-tight">
                    {item.title}
                  </h6>
                  <p className="text-sm text-muted-foreground">Item #{item.id}</p>
                </div>
              </div>
              <Separator className="my-4 dark:bg-slate-800" />
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Winning Bid</span>
                  <span className="font-bold">₹{item.current_price}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Processing Fee (0%)</span>
                  <span>₹0.00</span>
                </div>
              </div>
              <Separator className="my-4 dark:bg-slate-800" />
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold">Total</span>
                <span className="text-2xl font-bold text-green-600 dark:text-green-500">
                  ₹{item.current_price}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-7">
          <Card className="shadow-lg border-0 bg-white dark:bg-slate-900 transition-colors">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Pay with Card</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <AlertDescription className="text-blue-800 dark:text-blue-300 text-sm leading-relaxed">
                  <span className="font-bold block mb-1">Test Mode Active:</span>
                  You will not be charged. Use test card: <br />
                  <code className="bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded font-bold text-blue-900 dark:text-blue-200 mt-1 inline-block">
                    4242 4242 4242 4242
                  </code>
                </AlertDescription>
              </Alert>
              <div className="pt-2">
                {/* Replaced Simulated form with your actual Stripe Component */}
                <StripePayment
                  auctionId={item.id}
                  price={item.current_price}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
