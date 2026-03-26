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
    <div className="container mx-auto px-4 py-12 flex justify-center">
      <Card className="w-full max-w-2xl shadow-lg border-0 bg-white dark:bg-slate-900 transition-colors">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-slate-900 dark:text-white">Sell an Item</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Item Title</Label>
              <Input
                id="title"
                name="title"
                required
                onChange={handleChange}
                placeholder="e.g. Sony WH-1000XM4"
                className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="images">Upload Images</Label>
              <Input
                id="images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                required
                className="cursor-pointer bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-900 dark:file:text-slate-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                required
                rows={4}
                onChange={handleChange}
                placeholder="Describe the condition and features..."
                className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="base_price">Starting Price (₹)</Label>
                <Input
                  id="base_price"
                  type="number"
                  name="base_price"
                  required
                  onChange={handleChange}
                  placeholder="1000"
                  className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="space-y-2 flex flex-col">
                <Label>Condition</Label>
                <Select 
                  value={formData.condition} 
                  onValueChange={(v) => handleSelectChange("condition", v)}
                >
                  <SelectTrigger className="w-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-primary focus:outline-none">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="used">Used</SelectItem>
                    <SelectItem value="refurbished">Refurbished</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 flex flex-col">
                <Label>Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(v) => handleSelectChange("category", v)}
                >
                  <SelectTrigger className="w-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-primary focus:outline-none">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="fashion">Fashion</SelectItem>
                    <SelectItem value="home">Home</SelectItem>
                    <SelectItem value="vehicles">Vehicles</SelectItem>
                    <SelectItem value="toys">Toys</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">Auction End Date</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  name="end_date"
                  required
                  onChange={handleChange}
                  className="w-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
                <p className="text-xs text-muted-foreground">When does the bidding stop?</p>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full py-6 text-lg font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
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
