import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    password_confirm: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [captchaToken, setCaptchaToken] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.clear();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCaptchaChange = (token) => {
    setCaptchaToken(token);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (formData.password !== formData.password_confirm) {
      setError("Passwords do not match!");
      return;
    }

    if (!captchaToken) {
      setError("Please verify that you are not a robot.");
      return;
    }

    setLoading(true);

    try {
      const payload = { ...formData, recaptcha_token: captchaToken };
      await axios.post("http://127.0.0.1:8000/api/register/", payload);

      setSuccess("Registration successful! Redirecting to Login...");

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.error || 
        err.response?.data?.username?.[0] || 
        "An error occurred during registration."
      );
      if (window.grecaptcha) window.grecaptcha.reset();
      setCaptchaToken(null);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen  px-4 py-12 flex items-center justify-center">
      
      <Card className="w-full max-w-md bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <CardHeader className="space-y-1 pb-6">
          <CardTitle className="text-3xl font-extrabold text-center bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
            Create an Account
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6 animate-in slide-in-from-top-2">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-6 border-green-500/50 text-green-700 dark:text-green-400 bg-green-50/80 dark:bg-green-900/30 backdrop-blur-sm animate-in zoom-in-95 duration-300">
              <AlertDescription className="font-medium text-center">{success}</AlertDescription>
            </Alert>
          )}

          {!success && (
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-2 group">
                <Label htmlFor="username" className="text-slate-700 dark:text-slate-300 transition-colors group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400">
                  Username
                </Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  onChange={handleChange}
                  required
                  className="bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm border-white/20 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 hover:bg-white/80 dark:hover:bg-slate-900/80 transition-all duration-300 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50 h-12"
                />
              </div>

              <div className="space-y-2 group">
                <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 transition-colors group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400">
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  onChange={handleChange}
                  required
                  className="bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm border-white/20 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 hover:bg-white/80 dark:hover:bg-slate-900/80 transition-all duration-300 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50 h-12"
                />
              </div>

              <div className="space-y-2 group">
                <Label htmlFor="password" className="text-slate-700 dark:text-slate-300 transition-colors group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  onChange={handleChange}
                  required
                  className="bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm border-white/20 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 hover:bg-white/80 dark:hover:bg-slate-900/80 transition-all duration-300 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50 h-12"
                />
              </div>

              <div className="space-y-2 group">
                <Label htmlFor="password_confirm" className="text-slate-700 dark:text-slate-300 transition-colors group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400">
                  Confirm Password
                </Label>
                <Input
                  id="password_confirm"
                  name="password_confirm"
                  type="password"
                  onChange={handleChange}
                  required
                  className="bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm border-white/20 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 hover:bg-white/80 dark:hover:bg-slate-900/80 transition-all duration-300 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50 h-12"
                />
              </div>

              <div className="flex justify-center py-4 transform-gpu transition-transform hover:scale-[1.02] duration-300">
                <div className="rounded-lg overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800">
                  <ReCAPTCHA
                    sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                    onChange={handleCaptchaChange}
                    theme="dark"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-1 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                disabled={!captchaToken || loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    Registering...
                  </div>
                ) : (
                  "Register"
                )}
              </Button>
            </form>
          )}
        </CardContent>
        
        <CardFooter className="justify-center border-t border-white/20 dark:border-slate-800/50 p-6 mt-2">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Already have an account?{" "}
            <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline font-semibold transition-colors">
              Login here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Register;