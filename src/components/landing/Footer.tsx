import { Twitter, Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 py-16">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-6 md:mb-0">
            <div className="w-8 h-8 bg-green-500 rounded-sm flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm transform rotate-45"></div>
            </div>
            <span className="text-2xl font-bold text-white">GrowthHub</span>
          </div>
          
          {/* Navigation */}
          <div className="flex gap-8 mb-6 md:mb-0">
            <a href="#" className="text-white hover:text-green-400 transition-colors duration-200">
              About
            </a>
            <a href="#" className="text-white hover:text-green-400 transition-colors duration-200">
              Contact
            </a>
            <a href="#" className="text-white hover:text-green-400 transition-colors duration-200">
              Careers
            </a>
          </div>
          
          {/* Social Media */}
          <div className="flex gap-4">
            <a href="#" className="text-white hover:text-green-400 transition-colors duration-200">
              <Twitter className="w-6 h-6" />
            </a>
            <a href="#" className="text-white hover:text-green-400 transition-colors duration-200">
              <Linkedin className="w-6 h-6" />
            </a>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-700 text-center">
          <p className="text-white/60 text-sm">
            © 2024 GrowthHub. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;