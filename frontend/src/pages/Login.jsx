import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [captchaToken, setCaptchaToken] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.clear();
  }, []);

  const handleCaptchaChange = (token) => {
    setCaptchaToken(token);
  };

  const handleManualLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!captchaToken) {
      setError("Please verify that you are not a robot.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        username: username,
        password: password,
        recaptcha_token: captchaToken
      };

      const res = await axios.post("http://127.0.0.1:8000/api/login/", payload);

      const { token, user_id, username: returnedUsername } = res.data;

      if (!token || !user_id) {
        throw new Error("Invalid response from server");
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user_id", user_id);
      localStorage.setItem("username", returnedUsername);

      navigate("/");
    } catch (err) {
      setError("Invalid username, password, or security check failed.");
      if (window.grecaptcha) window.grecaptcha.reset();
      setCaptchaToken(null);
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <Card className="shadow-lg border-0 bg-white dark:bg-slate-900 transition-colors">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-slate-900 dark:text-white">Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleManualLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex justify-center py-2">
              <ReCAPTCHA
                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                onChange={handleCaptchaChange}
                theme="dark"
              />
            </div>

            <Button 
              className="w-full h-12 text-lg font-semibold bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white mt-2" 
              type="submit"
              disabled={!captchaToken || loading}
            >
              {loading ? "Signing in..." : "Login"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t dark:border-slate-800 p-4">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary dark:text-blue-400 hover:underline font-medium">
              Register here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
