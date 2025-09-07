import { Code, Briefcase, Rocket, PieChart, Palette, Users, ArrowRight } from "lucide-react"
import { EnhancedButton } from "@/components/ui/enhanced-button"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

const Categories = () => {
  const navigate = useNavigate();
  const categories = [
    "AI/ML",
    "Career Development", 
    "Product Management",
    "Design",
    "Entrepreneurship",
    "Marketing"
  ];

  return (
    <section className="py-20 bg-gray-800">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Explore Mentorship Categories
          </h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Find guidance in the areas that matter most to you.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6 max-w-4xl mx-auto">
          {categories.map((category, index) => (
            <div
              key={index}
              className="px-6 py-3 bg-gray-700/50 hover:bg-gray-700 rounded-full border border-green-500/30 hover:border-green-500 transition-all duration-300 cursor-pointer group"
              onClick={() => navigate(`/find-mentor?expertise=${category}`)}
            >
              <span className="text-green-400 group-hover:text-green-300 font-medium text-lg transition-colors duration-300">
                {category}
              </span>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Button 
            onClick={() => navigate('/categories')} 
            variant="outline" 
            className="text-white border-green-500 hover:bg-green-500 hover:text-white group"
          >
            <span>View all categories</span>
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Categories;