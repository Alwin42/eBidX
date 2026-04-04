import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CreateAuction = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    base_price: "",
    condition: "used",
    category: "electronics",
    end_date: "",
  });
  const [images, setImages] = useState([]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    setImages(e.target.files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("base_price", formData.base_price);
    data.append("condition", formData.condition);
    data.append("category", formData.category);
    data.append("end_date", formData.end_date);

    for (let i = 0; i < images.length; i++) {
      data.append("uploaded_images", images[i]);
    }

    try {
      await axios.post("http://127.0.0.1:8000/api/auctions/", data, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      navigate("/");
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        setError(JSON.stringify(err.response.data));
      } else {
        setError("Failed to create auction. Please check your inputs.");
      }
      setLoading(false);
    }
  };

  return (
    // Background gradient needed to make the glass effect visible
    <div className="min-h-screen  px-4 py-12 flex justify-center items-center">
      
      <Card className="w-full max-w-2xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-500 animate-in fade-in zoom-in-95 duration-700">
        <CardHeader className="pb-8">
          <CardTitle className="text-4xl font-extrabold text-center bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
            Sell an Item
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6 animate-in slide-in-from-top-2">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 group">
              <Label htmlFor="title" className="text-slate-700 dark:text-slate-300 transition-colors group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400">Item Title</Label>
              <Input
                id="title"
                name="title"
                required
                onChange={handleChange}
                placeholder="e.g. Sony WH-1000XM4"
                className="bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm border-white/20 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 hover:bg-white/80 dark:hover:bg-slate-900/80 transition-all duration-300 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div className="space-y-2 group">
              <Label htmlFor="images" className="text-slate-700 dark:text-slate-300 transition-colors group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400">Upload Images</Label>
              <Input
                id="images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                required
                className="cursor-pointer bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm border-white/20 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 transition-all duration-300 text-slate-900 dark:text-slate-100 file:bg-indigo-50 dark:file:bg-indigo-950 file:text-indigo-700 dark:file:text-indigo-300 file:border-0 file:rounded-md file:px-4 file:py-1 file:mr-4 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900 file:transition-colors"
              />
            </div>

            <div className="space-y-2 group">
              <Label htmlFor="description" className="text-slate-700 dark:text-slate-300 transition-colors group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400">Description</Label>
              <Textarea
                id="description"
                name="description"
                required
                rows={4}
                onChange={handleChange}
                placeholder="Describe the condition and features..."
                className="bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm border-white/20 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 hover:bg-white/80 dark:hover:bg-slate-900/80 transition-all duration-300 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 group">
                <Label htmlFor="base_price" className="text-slate-700 dark:text-slate-300 transition-colors group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400">Starting Price (₹)</Label>
                <Input
                  id="base_price"
                  type="number"
                  name="base_price"
                  required
                  onChange={handleChange}
                  placeholder="1000"
                  className="bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm border-white/20 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 hover:bg-white/80 dark:hover:bg-slate-900/80 transition-all duration-300 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div className="space-y-2 group">
                <Label className="text-slate-700 dark:text-slate-300 transition-colors group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400">Condition</Label>
                <Select 
                  value={formData.condition} 
                  onValueChange={(v) => handleSelectChange("condition", v)}
                >
                  <SelectTrigger className="w-full bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm text-slate-900 dark:text-slate-100 border-white/20 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none hover:bg-white/80 dark:hover:bg-slate-900/80 transition-all duration-300">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                    <SelectItem value="new" className="cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/50">New</SelectItem>
                    <SelectItem value="used" className="cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/50">Used</SelectItem>
                    <SelectItem value="refurbished" className="cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/50">Refurbished</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 group">
                <Label className="text-slate-700 dark:text-slate-300 transition-colors group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400">Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(v) => handleSelectChange("category", v)}
                >
                  <SelectTrigger className="w-full bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm text-slate-900 dark:text-slate-100 border-white/20 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none hover:bg-white/80 dark:hover:bg-slate-900/80 transition-all duration-300">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                    <SelectItem value="electronics" className="cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/50">Electronics</SelectItem>
                    <SelectItem value="fashion" className="cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/50">Fashion</SelectItem>
                    <SelectItem value="home" className="cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/50">Home</SelectItem>
                    <SelectItem value="vehicles" className="cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/50">Vehicles</SelectItem>
                    <SelectItem value="toys" className="cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/50">Toys</SelectItem>
                    <SelectItem value="other" className="cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/50">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 group">
                <Label htmlFor="end_date" className="text-slate-700 dark:text-slate-300 transition-colors group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400">Auction End Date</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  name="end_date"
                  required
                  onChange={handleChange}
                  className="w-full bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm border-white/20 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 hover:bg-white/80 dark:hover:bg-slate-900/80 transition-all duration-300 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/50"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 pl-1">When does the bidding stop?</p>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full py-6 mt-4 text-lg font-semibold bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-1 transition-all duration-300 active:scale-95"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  Processing...
                </div>
              ) : (
                "List Item for Sale"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateAuction;