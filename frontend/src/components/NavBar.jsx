import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import axios from "axios";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Hamburger and Close SVG Icons
const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="6" y2="6" />
    <line x1="4" x2="20" y1="18" y2="18" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const NavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = !!localStorage.getItem("token");

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu whenever the route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_id");
    navigate("/");
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await axios.get("http://127.0.0.1:8000/api/notifications/", {
          headers: { Authorization: `Token ${token}` },
        });
        setNotifications(res.data);
        setUnreadCount(res.data.filter((n) => !n.is_read).length);
      } catch (err) {
        console.error(err);
      }
    };

    if (isAuthenticated) {
      fetchNotifications();

      const token = localStorage.getItem("token");
      const socket = new WebSocket(
        `ws://127.0.0.1:8000/ws/notifications/?token=${token}`,
      );

      socket.onopen = () => {
        console.log("Notification Socket Connected");
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        const newNotif = {
          id: Date.now(),
          message: data.message,
          link: data.link,
          is_read: false,
          created_at: new Date().toISOString(),
        };

        setNotifications((prev) => [newNotif, ...prev]);
        setUnreadCount((prev) => prev + 1);
      };

      return () => {
        socket.close();
      };
    }
  }, [isAuthenticated]);

  const handleDeleteNotification = async (e, id) => {
    e.stopPropagation();
    e.preventDefault();
    const token = localStorage.getItem("token");

    const notifToDelete = notifications.find((n) => n.id === id);
    if (notifToDelete && !notifToDelete.is_read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    if (id && id > 1000000000000 === false) {
      try {
        await axios.delete(
          `http://127.0.0.1:8000/api/notifications/${id}/delete/`,
          {
            headers: { Authorization: `Token ${token}` },
          },
        );
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleClearAll = async (e) => {
    e.stopPropagation();
    const token = localStorage.getItem("token");

    setNotifications([]);
    setUnreadCount(0);

    try {
      await axios.delete(`http://127.0.0.1:8000/api/notifications/clear-all/`, {
        headers: { Authorization: `Token ${token}` },
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notif) => {
    const token = localStorage.getItem("token");

    if (!notif.is_read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n)),
      );
    }

    if (notif.id && notif.id > 1000000000000 === false) {
      try {
        await axios.post(
          `http://127.0.0.1:8000/api/notifications/${notif.id}/read/`,
          {},
          {
            headers: { Authorization: `Token ${token}` },
          },
        );
      } catch (err) {
        console.error(err);
      }
    }

    if (notif.link) {
      navigate(notif.link);
    }
  };

  const linkClass = "text-sm font-medium text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white transition-colors";
  const mobileLinkClass = "block px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-100/50 dark:text-slate-300 dark:hover:bg-slate-800/50 rounded-lg transition-colors";

  // Notification Bell Component (Reusable for Desktop & Mobile)
  const NotificationBell = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 focus:outline-none bg-transparent border-none cursor-pointer text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
          <span className="text-xl">🔔</span>
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] h-[18px] text-[10px] flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900"
            >
              {unreadCount}
            </Badge>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto bg-white/90 dark:bg-slate-950/90 backdrop-blur-lg border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-xl mt-2 z-[60]">
        <div className="flex items-center justify-between p-4">
          <DropdownMenuLabel className="font-bold p-0 text-slate-900 dark:text-white">Notifications</DropdownMenuLabel>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-blue-600 dark:text-blue-400 hover:bg-transparent"
              onClick={handleClearAll}
            >
              Clear All
            </Button>
          )}
        </div>
        <DropdownMenuSeparator className="dark:bg-slate-800" />

        {notifications.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No new notifications
          </div>
        ) : (
          notifications.map((notif, idx) => (
            <DropdownMenuItem
              key={idx}
              className={`p-4 flex justify-between items-start gap-3 cursor-pointer border-b dark:border-slate-800 last:border-0 focus:bg-slate-100 dark:focus:bg-slate-800 focus:text-slate-900 dark:focus:text-white ${
                !notif.is_read 
                  ? "bg-blue-50/50 dark:bg-blue-900/20" 
                  : "bg-transparent"
              }`}
              onClick={() => handleNotificationClick(notif)}
            >
              <div className="text-xs leading-relaxed flex-1 text-slate-700 dark:text-slate-300">
                {notif.message}
              </div>
              <button
                onClick={(e) => handleDeleteNotification(e, notif.id)}
                className="text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 text-lg leading-none transition-colors border-none bg-transparent"
              >
                &times;
              </button>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="sticky top-4 z-50 flex flex-col items-center w-full px-4 mb-8 pointer-events-none">
      
      {/* Main Navigation Bar */}
      <nav className="pointer-events-auto flex items-center justify-between w-full max-w-5xl px-6 py-3 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/40 dark:border-slate-700/50 shadow-lg rounded-full transition-all duration-300">
        
        <Link to="/" className="text-2xl font-bold tracking-tighter text-slate-900 dark:text-white mr-6">
          eBidX
        </Link>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className={linkClass}>
            Auctions
          </Link>
          <ThemeToggle />
          
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className={linkClass}>Dashboard</Link>
              <Link to="/create" className={linkClass}>Sell Item</Link>
              <Link to="/watchlist" className={linkClass}>Watchlisted</Link>
              <NotificationBell />
              <Button
                variant="outline"
                onClick={handleLogout}
                className="h-9 px-5 rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-300 dark:border-slate-700 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all text-slate-900 dark:text-slate-100"
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className={linkClass}>Login</Link>
              <Link to="/register" className={linkClass}>Register</Link>
            </>
          )}
        </div>

        {/* Mobile Action Bar */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          {isAuthenticated && <NotificationBell />}
          <button 
            className="p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </nav>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="pointer-events-auto absolute top-full left-4 right-4 mt-2 p-4 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-xl flex flex-col md:hidden animate-in slide-in-from-top-2 fade-in duration-200">
          <Link to="/" className={mobileLinkClass}>Auctions</Link>
          
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className={mobileLinkClass}>Dashboard</Link>
              <Link to="/create" className={mobileLinkClass}>Sell Item</Link>
              <Link to="/watchlist" className={mobileLinkClass}>Watchlisted</Link>
              <div className="my-2 border-t border-slate-200 dark:border-slate-800"></div>
              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <div className="my-2 border-t border-slate-200 dark:border-slate-800"></div>
              <Link to="/login" className={mobileLinkClass}>Login</Link>
              <Link to="/register" className={mobileLinkClass}>Register</Link>
            </>
          )}
        </div>
      )}

    </div>
  );
};

export default NavBar;