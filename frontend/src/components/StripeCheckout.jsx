import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTheme } from "./ThemeProvider";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CheckoutForm = ({ auctionId, price }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { theme } = useTheme(); // Get the current theme

  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (theme === "system") {
      setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    } else {
      setIsDark(theme === "dark");
    }
  }, [theme]);

  useEffect(() => {
    const fetchSecret = async () => {
      try {
        const res = await axios.post(
          "http://127.0.0.1:8000/api/create-payment-intent/",
          {
            auction_id: auctionId,
          },
        );
        setClientSecret(res.data.clientSecret);
      } catch (err) {
        console.error("Secret fetch failed", err);
      }
    };
    fetchSecret();
  }, [auctionId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setProcessing(true);

    if (!stripe || !elements) return;

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
      },
    });

    if (result.error) {
      setError(result.error.message);
      setProcessing(false);
    } else {
      if (result.paymentIntent.status === "succeeded") {
        const token = localStorage.getItem("token");
        try {
          await axios.post(`http://127.0.0.1:8000/api/auctions/${auctionId}/mark-paid/`, {}, {
            headers: { Authorization: `Token ${token}` }
          });
          navigate("/payment-success");
        } catch (err) {
          console.error("Failed to update paid status", err);
          setError("Payment succeeded, but failed to update status.");
          setProcessing(false);
        }
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-900 shadow-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-colors">
        <CardElement 
          options={{ 
            style: { 
              base: { 
                fontSize: "16px",
                color: isDark ? "#f8fafc" : "#0f172a", 
                iconColor: isDark ? "#f8fafc" : "#0f172a",
                "::placeholder": {
                  color: isDark ? "#64748b" : "#94a3b8",
                },
              } 
            } 
          }} 
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white"
        disabled={!stripe || processing || !clientSecret}
      >
        {processing ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Processing...
          </div>
        ) : (
          `Pay ₹${price}`
        )}
      </Button>
    </form>
  );
};

const StripePayment = ({ auctionId, price }) => (
  <Elements stripe={stripePromise}>
    <CheckoutForm auctionId={auctionId} price={price} />
  </Elements>
);

export default StripePayment;
