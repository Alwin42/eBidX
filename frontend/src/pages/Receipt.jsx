import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Receipt = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

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
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  if (loading) return <div className="flex justify-center mt-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (!item || !item.is_paid) return <div className="text-center mt-20 text-red-500 font-bold">Receipt not found or item unpaid.</div>;

  return (
    <div className="container mx-auto py-12 px-4 max-w-2xl">
      <Card className="shadow-2xl border-0 bg-white dark:bg-slate-950 font-mono">
        <CardHeader className="text-center pb-8 pt-10 border-b border-dashed border-slate-300 dark:border-slate-800">
          <CardTitle className="text-3xl font-extrabold uppercase tracking-widest">eBidX Receipt</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">Official Transaction Record</p>
        </CardHeader>
        
        <CardContent className="pt-8 space-y-6">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Order ID:</span>
            <span className="font-bold">#EBX-{item.id}-{Math.floor(1000 + Math.random() * 9000)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Date:</span>
            <span className="font-bold">{new Date().toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Seller:</span>
            <span className="font-bold">{item.seller}</span>
          </div>

          <div className="py-4 border-y border-dashed border-slate-300 dark:border-slate-800">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold truncate pr-4">{item.title}</span>
              <span>₹{item.current_price}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>Platform Fee (0%)</span>
              <span>₹0.00</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-xl font-black">
            <span>TOTAL PAID</span>
            <span>₹{item.current_price}</span>
          </div>

          <Alert className="bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900 mt-8">
            <AlertDescription className="text-center text-green-800 dark:text-green-500 font-bold text-sm">
              Status: PAYMENT SUCCESSFUL
            </AlertDescription>
          </Alert>

          <div className="pt-6 flex gap-4">
            <Button className="w-full font-sans" onClick={() => window.print()}>
              Print Receipt
            </Button>
            <Button variant="outline" className="w-full font-sans" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Receipt;
