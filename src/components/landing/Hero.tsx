import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";

const Hero = () => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    console.log("Hero Login button clicked, navigating to /auth");
    try {
      navigate("/auth");
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  return (
    <section className="relative min-h-screen bg-gray-900 flex items-center justify-center overflow-hidden">
      {/* Background with subtle green shapes */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-32 h-32 bg-green-500/10 rounded-full blur-xl"></div>
        <div className="absolute top-40 right-40 w-24 h-24 bg-green-400/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-green-600/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-40 right-20 w-28 h-28 bg-green-500/10 rounded-full blur-xl"></div>
      </div>
      
      {/* Blurred person working on laptop */}
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-green-400/20 to-transparent rounded-full blur-3xl"></div>
      
      {/* Main content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
          Unlock Your Potential with Expert Guidance
        </h1>
        
        <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed">
          Connect with experienced mentors in your field and accelerate your personal and professional growth.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <Button 
            onClick={() => navigate("/find-mentor")}
            className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 text-lg rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
          >
            Find a Mentor
          </Button>
          
          <Button 
            onClick={() => navigate("/become-mentor")}
            variant="outline"
            className="border-2 border-green-500 text-green-500 hover:bg-green-500 hover:text-white px-8 py-4 text-lg rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
          >
            Become a Mentor
          </Button>
        </div>

        {/* Login Section */}
        <div className="text-center">
          <p className="text-white/60 mb-4 text-lg">
            Already have an account?
          </p>
          <Button
            onClick={handleLoginClick}
            variant="ghost"
            className="text-green-400 hover:text-green-300 hover:bg-green-500/10 px-6 py-3 text-lg font-medium transition-all duration-200"
          >
            <LogIn className="w-5 h-5 mr-2" />
            Login / Sign Up
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;