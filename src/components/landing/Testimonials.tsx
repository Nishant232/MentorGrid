import { Star, Quote } from "lucide-react"

const Testimonials = () => {
  const testimonials = [
    {
      title: "From Aspiring Designer to Lead UX",
      quote: "My mentor helped me transition from graphic design to UX/UI. Within 6 months, I landed a senior role at a top tech company.",
      name: "Sarah L."
    },
    {
      title: "Career Pivot Success Story",
      quote: "Switching from marketing to product management seemed impossible. My mentor's guidance made it happen in just 8 months.",
      name: "Michael R."
    },
    {
      title: "Startup Founder's Journey",
      quote: "Building my first startup was overwhelming. My mentor's experience and advice saved me from countless mistakes.",
      name: "Alex Chen"
    }
  ];

  return (
    <section className="py-20 bg-gray-900">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Success Stories
          </h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Real stories from mentees who have transformed their careers.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:transform hover:scale-105"
            >
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <div className="w-8 h-8 bg-green-500 rounded-full"></div>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
                {testimonial.title}
              </h3>
              
              <p className="text-gray-700 leading-relaxed mb-6 text-center">
                "{testimonial.quote}"
              </p>
              
              <p className="text-green-600 font-semibold text-center">
                - {testimonial.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;