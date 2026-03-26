import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const PaymentSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[70vh] px-4">
      <Card className="w-full max-w-md text-center shadow-2xl border-0 bg-white dark:bg-slate-900 animate-in zoom-in duration-500">
        <CardHeader className="pt-10 pb-2">
          <div className="mx-auto h-24 w-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <svg 
              className="h-12 w-12 text-green-600 dark:text-green-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <CardTitle className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
            Payment Successful!
          </CardTitle>
          <CardDescription className="text-base text-slate-500 dark:text-slate-400">
            Your transaction has been securely processed.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pb-10 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 text-sm text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
            <p>The seller has been notified of your payment.</p>
            <p className="mt-1 font-medium">You will receive shipping details shortly.</p>
          </div>
          
          <div className="flex flex-col gap-3">
            <Button 
              size="lg" 
              className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold"
              onClick={() => navigate("/dashboard")}
            >
              View My Dashboard
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full font-semibold border-slate-200 dark:border-slate-700"
              onClick={() => navigate("/")}
            >
              Continue Browsing
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
