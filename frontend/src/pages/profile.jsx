import React, { useState, useEffect, useRef } from 'react';
import emailjs from '@emailjs/browser';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

// React Bits Animations
import BorderGlow from "@/components/ui/BorderGlow"; 
import SplitText from "@/components/ui/SplitText";
import BlurText from "@/components/ui/BlurText";

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Support Form State
  const formRef = useRef();
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState({ type: '', msg: '' });

  // --- DATA FETCHING & WEBSOCKETS ---
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    const fetchProfile = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/profile/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Token ${token}` : '',
          }
        });

        if (response.status === 401) throw new Error("Session expired. Please log in again.");
        if (!response.ok) throw new Error(`Server returned ${response.status}`);

        const data = await response.json();
        setUserData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchProfile, 100);

    let ws = null;
    const wsTimer = setTimeout(() => {
        if (token) {
            ws = new WebSocket(`ws://127.0.0.1:8000/ws/notifications/?token=${token}`);
            ws.onopen = () => console.log("WS Connected for Profile Notifications");
        }
    }, 200);

    return () => {
      clearTimeout(timer);
      clearTimeout(wsTimer);
      if (ws) ws.close();
    };
  }, []);

  // --- EMAIL.JS SUPPORT SUBMIT ---
  const handleSupportSubmit = (e) => {
    e.preventDefault();
    setIsSending(true);
    setSendStatus({ type: '', msg: '' });

    // IMPORTANT: Replace these with your actual EmailJS IDs
    const serviceID = 'YOUR_SERVICE_ID';
    const templateID = 'YOUR_TEMPLATE_ID';
    const publicKey = 'YOUR_PUBLIC_KEY';

    emailjs.sendForm(serviceID, templateID, formRef.current, publicKey)
      .then((result) => {
          setSendStatus({ type: 'success', msg: 'Message sent! Our support team will review it shortly.' });
          formRef.current.reset();
      }, (error) => {
          console.error("EmailJS Error:", error);
          setSendStatus({ type: 'error', msg: 'Failed to send message. Please try again.' });
      }).finally(() => {
          setIsSending(false);
      });
  };

  // --- UI RENDER STATES ---
  if (isLoading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen  flex flex-col items-center justify-center p-6">
      <Alert variant="destructive" className="max-w-md bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
      <Button onClick={() => window.location.reload()} className="mt-4 bg-indigo-600 hover:bg-indigo-700">
        Retry Connection
      </Button>
    </div>
  );

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden  ">
      
      {/* Decorative Background Blobs for Glassmorphism Effect */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/20 dark:bg-indigo-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[40%] rounded-full bg-blue-400/20 dark:bg-blue-600/20 blur-[120px] pointer-events-none" />

      <div className="container mx-auto pt-16 pb-24 px-4 max-w-5xl relative z-10">
        
        {/* Page Header Animation */}
        <div className="mb-12 text-center sm:text-left">
          <div className="text-4xl font-black tracking-tight text-slate-900 dark:text-white drop-shadow-sm">
            <SplitText text="USER PROFILE" delay={40} />
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium tracking-wide">
            Manage your account details and contact support.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: User Details (Glass Card) */}
          <div className="lg:col-span-1">
            <BorderGlow className="rounded-[32px] h-full" color="#4f46e5">
              <Card className="h-full border border-white/50 dark:border-slate-700/50 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl shadow-xl rounded-[32px] overflow-hidden transition-all duration-500">
                <CardHeader className="text-center pt-10 pb-4">
                  <Avatar className="w-28 h-28 mx-auto mb-4 border-4 border-white/60 dark:border-slate-800/60 shadow-lg">
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white text-4xl font-bold">
                      {userData?.username?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                    {userData?.username}
                  </CardTitle>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{userData?.email}</p>
                </CardHeader>
                
                <CardContent className="p-6">
                  <Separator className="bg-slate-200 dark:bg-slate-700/50 mb-6" />
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 rounded-xl bg-white/50 dark:bg-slate-800/30 border border-white/20 dark:border-slate-700/30">
                      <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Status</span>
                      <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-md uppercase tracking-wider">
                        Verified
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 rounded-xl bg-white/50 dark:bg-slate-800/30 border border-white/20 dark:border-slate-700/30">
                      <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">User ID</span>
                      <span className="text-sm font-mono text-slate-700 dark:text-slate-300">
                        #{userData?.id || '---'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 rounded-xl bg-white/50 dark:bg-slate-800/30 border border-white/20 dark:border-slate-700/30">
                      <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Joined</span>
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {userData?.date_joined ? new Date(userData.date_joined).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </BorderGlow>
          </div>

          {/* RIGHT COLUMN: Support Form (Glass Card) */}
          <div className="lg:col-span-2">
            <Card className="h-full border border-white/50 dark:border-slate-700/50 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl shadow-xl rounded-[32px] p-2">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></div>
                  <BlurText text="Contact Support" className="text-xl font-bold text-slate-900 dark:text-white tracking-widest uppercase" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Experiencing an issue with an auction or your account? Send a message directly to our resolution team.
                </p>
              </CardHeader>

              <CardContent>
                {sendStatus.msg && (
                  <Alert className={`mb-6 border backdrop-blur-md ${sendStatus.type === 'success' ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-400' : 'bg-red-50/50 border-red-200 text-red-800 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-400'}`}>
                    <AlertDescription className="font-medium">{sendStatus.msg}</AlertDescription>
                  </Alert>
                )}

                <form ref={formRef} onSubmit={handleSupportSubmit} className="space-y-5">
                  {/* Hidden fields so EmailJS captures the user's details securely */}
                  <input type="hidden" name="user_name" value={userData?.username || "Unknown"} />
                  <input type="hidden" name="user_email" value={userData?.email || "No Email"} />
                  <input type="hidden" name="user_id" value={userData?.id || "No ID"} />

                  <div className="space-y-2 group">
                    <Label htmlFor="subject" className="text-slate-700 dark:text-slate-300 transition-colors group-focus-within:text-indigo-600">
                      Issue Subject
                    </Label>
                    <Input 
                      id="subject"
                      name="subject"
                      required
                      placeholder="e.g. Bidding Error, Account Verification"
                      className="bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm border-white/40 dark:border-slate-700/50 focus:bg-white dark:focus:bg-slate-900 h-12 rounded-xl transition-all"
                    />
                  </div>

                  <div className="space-y-2 group">
                    <Label htmlFor="message" className="text-slate-700 dark:text-slate-300 transition-colors group-focus-within:text-indigo-600">
                      Description
                    </Label>
                    <Textarea 
                      id="message"
                      name="message"
                      required
                      placeholder="Please describe your issue in detail..."
                      className="min-h-[160px] resize-none bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm border-white/40 dark:border-slate-700/50 focus:bg-white dark:focus:bg-slate-900 rounded-xl transition-all p-4"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isSending}
                    className="w-full sm:w-auto px-8 h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {isSending ? (
                      <span className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </span>
                    ) : (
                      "Submit Ticket"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;