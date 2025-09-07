import Header from "@/components/landing/Header"
import Hero from "@/components/landing/Hero"
import HowItWorks from "@/components/landing/HowItWorks"
import Categories from "@/components/landing/Categories"
import Testimonials from "@/components/landing/Testimonials"
import LeaderboardPreview from "@/components/landing/LeaderboardPreview"
import Footer from "@/components/landing/Footer"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { LogIn } from "lucide-react"

const Index = () => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    console.log("Journey section Login button clicked, navigating to /auth");
    try {
      navigate("/auth");
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <div id="how-it-works"><HowItWorks /></div>
      <div id="categories"><Categories /></div>
      <div id="testimonials"><Testimonials /></div>
      <div id="leaderboard"><LeaderboardPreview /></div>
      
      {/* Ready to Start Your Journey Section */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-12">
            Join our community of learners and connect with experienced mentors today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={() => navigate("/find-mentor")}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 text-lg rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
            >
              Find a Mentor
            </Button>
            <Button 
              onClick={handleLoginClick}
              variant="outline"
              className="border-2 border-green-500 text-green-500 hover:bg-green-500 hover:text-white px-8 py-4 text-lg rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Login / Sign Up
            </Button>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Index;
