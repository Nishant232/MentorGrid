import { User, Settings, Sprout } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: <User className="w-8 h-8 text-green-500" />,
      title: "1. Sign Up",
      description: "Create your profile and tell us about your goals and interests."
    },
    {
      icon: <Settings className="w-8 h-8 text-green-500" />,
      title: "2. Get Matched",
      description: "Our smart matching algorithm connects you with the perfect mentor."
    },
    {
      icon: <Sprout className="w-8 h-8 text-green-500" />,
      title: "3. Learn & Grow",
      description: "Engage in personalized sessions and achieve your aspirations."
    }
  ];

  return (
    <section className="py-20 bg-gray-900">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            How It Works
          </h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            A simple, streamlined process to connect you with your ideal mentor.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div
              key={index}
              className="bg-gray-800/50 border-2 border-green-500/30 rounded-xl p-8 text-center hover:border-green-500/60 transition-all duration-300 hover:transform hover:scale-105"
            >
              <div className="flex justify-center mb-6">
                {step.icon}
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                {step.title}
              </h3>
              <p className="text-white/80 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;