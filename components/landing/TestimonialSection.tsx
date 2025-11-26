"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    quote: "The most futuristic chat experience I've ever used. The UI is insane!",
    author: "Alex Chen",
    role: "Digital Creator",
    avatar: "AC",
    color: "from-cyan-500 to-blue-500"
  },
  {
    quote: "My friends and I switched to VaibTalk and never looked back. The video quality is unmatched.",
    author: "Maya Johnson",
    role: "Content Creator",
    avatar: "MJ",
    color: "from-purple-500 to-pink-500"
  },
  {
    quote: "File sharing has never been this easy and stylish. The future is here!",
    author: "Jamal Williams",
    role: "Tech Enthusiast",
    avatar: "JW",
    color: "from-amber-500 to-orange-500"
  }
];

export default function TestimonialSection() {
  return (
    <section className="w-full py-16 md:py-24 px-4 md:px-6 relative overflow-hidden bg-black">
      {/* Animated background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/3 right-1/4 w-64 h-64 md:w-96 md:h-96 bg-purple-900/20 rounded-full filter blur-[80px] md:blur-[120px] opacity-50"></div>
        <div className="absolute bottom-1/4 left-1/3 w-48 h-48 md:w-80 md:h-80 bg-cyan-900/20 rounded-full filter blur-[60px] md:blur-[120px] opacity-50"></div>
      </div>
      
      <div className="container relative z-10 mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-5xl font-bold mb-4 md:mb-6"
          >
            What Gen Z Says
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-muted-foreground max-w-2xl mx-auto text-base md:text-xl"
          >
            Don't just take our word for it. See what our users have to say about the VaibTalk experience.
          </motion.p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
            >
              <Card className="h-full bg-white/5 backdrop-blur-md border-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-1">
                <CardContent className="pt-8 px-6 pb-8 flex flex-col h-full">
                  <div className="mb-6 flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  
                  <Quote className="text-white/20 mb-4 w-10 h-10" />
                  
                  <p className="mb-8 text-lg text-white/90 leading-relaxed flex-grow">
                    "{testimonial.quote}"
                  </p>
                  
                  <div className="flex items-center gap-4 mt-auto">
                    <Avatar className="h-12 w-12 border-2 border-white/10">
                      <AvatarFallback className={cn("text-white font-bold bg-gradient-to-br", testimonial.color)}>
                        {testimonial.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-bold text-white">{testimonial.author}</h4>
                      <p className="text-sm text-white/50">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}