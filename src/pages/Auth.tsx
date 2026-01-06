import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo.png";
import { toast } from "sonner";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  /**
   * These filenames are taken directly from your uploaded folder screenshot.
   * Path: /public/images/pins/
   */
  const imageFiles = [
    "art-abstract.jpg",
    "art-wallpaper.jpg",
    "Celebration.jpg",
    "coffee-cafe.jpg",
    "Cute-Dog.jpg",
    "diy-crafts.jpg",
    "fashion-outfit.jpg",
    "fitness-yoga.jpg",
    "flowers-bouquet.jpg",
    "food-pasta.jpg",
    "interior-modern.jpg",
    "Lamp.jpg",
    "nature-forest.jpg",
    "New-Year.jpg",
    "pet-dog.jpg",
    "travel-beach.jpg"
  ];

  // Map to the public URL and double the array to ensure a full grid
  const gridImages = [...imageFiles, ...imageFiles].map(img => `/images/pins/${img}`).slice(0, 20);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let success: boolean;
      if (isLogin) {
        success = await login(email, password);
        if (success) {
          toast.success("Welcome back!");
          navigate("/");
        } else {
          toast.error("Invalid credentials.");
        }
      } else {
        if (!name.trim()) {
          toast.error("Please enter your name");
          setLoading(false);
          return;
        }
        success = await signup(email, password, name);
        if (success) {
          toast.success("Account created successfully!");
          navigate("/");
        }
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white font-sans">
      {/* LEFT SIDE: DECORATIVE GRID */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#e60023]">
        {/* Image Grid Layer */}
        <div className="absolute inset-0 grid grid-cols-4 gap-4 p-8 rotate-12 scale-150">
          {gridImages.map((src, i) => (
            <div key={i} className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-2xl">
              <img 
                src={src} 
                alt="Idea" 
                className="w-full h-full object-cover"
              />
              {/* Red overlay blend for the middle section */}
              <div className="absolute inset-0 bg-red-600/30 mix-blend-multiply" />
            </div>
          ))}
        </div>

        {/* Text Layer */}
        <div className="absolute bottom-20 left-16 text-white z-30">
          <h2 className="text-7xl font-bold tracking-tight mb-2">Get your next</h2>
          <p className="text-4xl font-light">great idea</p>
        </div>
        
        {/* Final Gradient Fade (Matches test.jpg exactly) */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#e60023] via-[#e60023]/60 to-transparent z-20" />
      </div>

      {/* RIGHT SIDE: AUTH FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-[400px] text-center">
          <div className="flex justify-center mb-4">
            <img src={logo} alt="Pinterest" className="w-10 h-10 object-contain" />
          </div>

          <h1 className="text-3xl font-semibold text-[#111] mb-2">
            Welcome back
          </h1>
          <p className="text-[#111] text-sm mb-10">
            Log in to see more
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-xs font-semibold ml-1">Name</label>
                <Input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-2xl h-12 border-gray-300 focus:ring-0 focus:border-gray-400"
                  required={!isLogin}
                />
              </div>
            )}
            
            <div className="space-y-1">
              <label className="text-xs font-semibold ml-1">Email</label>
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-2xl h-12 border-gray-300 focus:ring-0 focus:border-gray-400"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold ml-1">Password</label>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-2xl h-12 border-gray-300 focus:ring-0 focus:border-gray-400"
                required
              />
            </div>

            {isLogin && (
              <button type="button" className="text-xs font-bold text-[#111] hover:underline block">
                Forgot your password?
              </button>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-full h-12 bg-[#e60023] hover:bg-[#ad081b] text-white font-bold text-base mt-4 transition-all active:scale-95"
            >
              {loading ? "Logging in..." : isLogin ? "Log in" : "Sign up"}
            </Button>
          </form>

          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[10px] font-bold text-gray-400">OR</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <Button variant="outline" className="w-full rounded-full h-12 border-gray-300 font-bold text-gray-700 hover:bg-gray-50 mb-8">
            Continue with Google (Coming soon)
          </Button>

          <div className="pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs font-bold text-[#111] hover:underline"
            >
              {isLogin ? "Not on Pinterest yet? Sign up" : "Already a member? Log in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}