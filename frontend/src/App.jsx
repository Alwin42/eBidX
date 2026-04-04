import { ThemeProvider } from "./components/ThemeProvider";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";
import AuctionList from "./pages/AuctionList";
import AuctionDetail from "./pages/AuctionDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CreateAuction from "./pages/CreateAuction";
import WatchList from "./pages/WatchList";
import Checkout from "./pages/Checkout";
import RequireAuth from "./components/RequireAuth";
import Home from "./pages/Home";
import PaymentSuccess from "./pages/PaymentSuccess";
import Receipt from "./pages/Receipt";
import Profile from "./pages/profile";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="ebidx-theme">
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300">
        <Router>
          <NavBar />
          <main className="container mx-auto px-4">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/auction/:id" element={<AuctionDetail />} />
              <Route path="/browse" element={<AuctionList />} />
              <Route
                path="/profile"
                element={
                  <RequireAuth>
                    <Profile />
                  </RequireAuth>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <RequireAuth>
                    <Dashboard />
                  </RequireAuth>
                }
              />
              <Route
                path="/create"
                element={
                  <RequireAuth>
                    <CreateAuction />
                  </RequireAuth>
                }
              />
              <Route
                path="/watchlist"
                element={
                  <RequireAuth>
                    <WatchList />
                  </RequireAuth>
                }
              />
              <Route
                path="/checkout/:id"
                element={
                  <RequireAuth>
                    <Checkout />
                  </RequireAuth>
                }
              />
              <Route
                path="/payment-success"
                element={
                  <RequireAuth>
                    <PaymentSuccess />
                  </RequireAuth>
                }
              />
              <Route
                path="/receipt/:id"
                element={
                  <RequireAuth>
                    <Receipt />
                  </RequireAuth>
                }
              />
            </Routes>
          </main>
        </Router>
      </div>
    </ThemeProvider>
  );
}

export default App;
