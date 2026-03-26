import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

const NavBar = () => {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem("token");

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_id");
    navigate("/");
  };

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

  useEffect(() => {
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

  // Shared classes for links so they look good in both light and dark mode
  const linkClass = "text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors";

  return (
    <nav className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white py-4 mb-8 shadow-sm border-b dark:border-slate-800 transition-colors duration-300">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold tracking-tighter">
          eBidX
        </Link>

        <div className="flex items-center gap-6">
          <Link to="/" className={linkClass}>
            Auctions
          </Link>

          {/* Theme Toggle is always visible */}
          <ThemeToggle />

          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className={linkClass}>
                Dashboard
              </Link>
              <Link to="/create" className={linkClass}>
                Sell Item
              </Link>
              <Link to="/watchlist" className={linkClass}>
                Watchlisted
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative p-2 focus:outline-none bg-transparent border-none cursor-pointer text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
                    <span className="text-xl">🔔</span>
                    {unreadCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] h-[18px] text-[10px] flex items-center justify-center rounded-full"
                      >
                        {unreadCount}
                      </Badge>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto bg-white dark:bg-slate-950 text-slate-900 dark:text-white border dark:border-slate-800">
                  <div className="flex items-center justify-between p-4">
                    <DropdownMenuLabel className="font-bold p-0">Notifications</DropdownMenuLabel>
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
                        className={`p-4 flex justify-between items-start gap-3 cursor-pointer border-b dark:border-slate-800 last:border-0 ${
                          !notif.is_read 
                            ? "bg-blue-50/50 dark:bg-blue-900/20" 
                            : "bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900"
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

              <Button
                variant="outline"
                onClick={handleLogout}
                className="h-9 px-4 transition-all"
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className={linkClass}>
                Login
              </Link>
              <Link to="/register" className={linkClass}>
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
