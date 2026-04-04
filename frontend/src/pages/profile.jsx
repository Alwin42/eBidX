import React, { useState, useEffect } from 'react';

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // DEBUG: Check your console (F12) to see if this is null or a real string
    console.log("Current Token in Storage:", token);

    const fetchProfile = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/profile/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // FIXED: Backticks added. This is the only way JS handles variables in strings.
            'Authorization': token ? `Token ${token}` : '',
          }
        });

        if (response.status === 401) {
          throw new Error("Django rejected the token (401). Check if the user is actually logged in.");
        }
        
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        const data = await response.json();
        setUserData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    // 100ms delay to let the system "settle" and avoid race conditions
    const timer = setTimeout(fetchProfile, 100);

    let ws = null;
    const wsTimer = setTimeout(() => {
        if (token) {
            ws = new WebSocket(`ws://127.0.0.1:8000/ws/notifications/?token=${token}`);
            ws.onopen = () => console.log("WS Connected");
        }
    }, 200);

    return () => {
      clearTimeout(timer);
      clearTimeout(wsTimer);
      if (ws) ws.close();
    };
  }, []);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Authenticating...</div>;

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-4">
        <strong>Error:</strong> {error}
      </div>
      <button onClick={() => window.location.reload()} className="px-4 py-2 bg-slate-900 text-white rounded-lg">
        Retry
      </button>
    </div>
  );

  return (
    <div className="min-h-screen  p-8 flex justify-center">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
        <div className="w-20 h-20 bg-indigo-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold">
          {userData?.username?.charAt(0).toUpperCase() || 'U'}
        </div>
        <h1 className="text-2xl font-bold text-center text-slate-900">{userData?.username}</h1>
        <p className="text-center text-slate-500 mb-6">{userData?.email}</p>
        
        <div className="space-y-3">
            <div className="flex justify-between text-sm border-b pb-2">
                <span className="text-slate-400">Status</span>
                <span className="text-emerald-500 font-bold">Verified</span>
            </div>
            <div className="flex justify-between text-sm border-b pb-2">
                <span className="text-slate-400">User ID</span>
                <span className="text-slate-700 font-mono">#{userData?.id || '---'}</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;