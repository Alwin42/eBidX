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
    <div className="container mx-auto px-4 py-12 max-w-md">
      <Card className="shadow-lg border-0 bg-white dark:bg-slate-900 transition-colors">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-slate-900 dark:text-white">
            Create an Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-6 border-green-500 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {!success && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  onChange={handleChange}
                  required
                  className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  onChange={handleChange}
                  required
                  className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  onChange={handleChange}
                  required
                  className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password_confirm">Confirm Password</Label>
                <Input
                  id="password_confirm"
                  name="password_confirm"
                  type="password"
                  onChange={handleChange}
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
                type="submit" 
                className="w-full h-12 text-lg font-semibold bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white mt-2"
                disabled={!captchaToken || loading}
              >
                {loading ? "Registering..." : "Register"}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="justify-center border-t dark:border-slate-800 p-4">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary dark:text-blue-400 hover:underline font-medium">
              Login here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Register;
