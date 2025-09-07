import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";

const Header = () => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    console.log("Login button clicked, navigating to /auth");
    try {
      navigate("/auth");
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded-sm flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm transform rotate-45"></div>
            </div>
            <span className="text-xl font-bold text-white">GrowthHub</span>
          </div>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#" className="text-white hover:text-green-400 transition-colors duration-200">
              Home
            </a>
            <a href="#" className="text-white hover:text-green-400 transition-colors duration-200">
              Mentors
            </a>
            <a href="#" className="text-white hover:text-green-400 transition-colors duration-200">
              Mentees
            </a>
            <a href="#" className="text-white hover:text-green-400 transition-colors duration-200">
              Resources
            </a>
          </nav>
          
          {/* Right side: Login Icon + Call-to-Action Buttons */}
          <div className="flex items-center gap-4">
            {/* Login Icon Button */}
            <Button
              onClick={handleLoginClick}
              variant="ghost"
              size="sm"
              className="text-white hover:text-green-400 hover:bg-gray-800/50 transition-all duration-200 p-2"
              title="Login / Sign Up"
            >
              <LogIn className="w-5 h-5" />
            </Button>
            
            {/* Call-to-Action Buttons */}
            <Button 
              onClick={() => navigate("/become-mentor")}
              variant="outline"
              className="border-2 border-green-500 text-green-500 hover:bg-green-500 hover:text-white transition-all duration-200"
            >
              Become a Mentor
            </Button>
            <Button 
              onClick={() => navigate("/find-mentor")}
              className="bg-green-500 hover:bg-green-600 text-white transition-all duration-200"
            >
              Find a Mentor
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
