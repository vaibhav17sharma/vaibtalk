"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Quote } from "lucide-react";
import { useEffect, useState } from "react";

const testimonials = [
  {
    quote: "The most futuristic chat experience I've ever used. The UI is insane!",
    author: "Alex Chen",
    role: "Digital Creator",
    avatar: "AC"
  },
  {
    quote: "My friends and I switched to VaibTalk and never looked back. The video quality is unmatched.",
    author: "Maya Johnson",
    role: "Content Creator",
    avatar: "MJ"
  },
  {
    quote: "File sharing has never been this easy and stylish. The future is here!",
    author: "Jamal Williams",
    role: "Tech Enthusiast",
    avatar: "JW"
  }
];

export default function TestimonialSection() {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );
    
    const element = document.getElementById("testimonial-section");
    if (element) {
      observer.observe(element);
    }
    
    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);
  
  return (
    <section id="testimonial-section" className="w-full py-20 px-4 md:px-6 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full filter blur-[80px] animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-cyan-500/20 rounded-full filter blur-[80px] animate-pulse" style={{ animationDelay: "1.5s" }}></div>
      </div>
      
      <div className="container relative z-10 mx-auto">
        <div className="text-center mb-16">
          <h2 
            className={cn(
              "text-3xl md:text-4xl font-bold mb-4 transition-all duration-700",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            )}
          >
            What Gen Z Says
          </h2>
          <p 
            className={cn(
              "text-muted-foreground max-w-2xl mx-auto text-lg transition-all duration-700 delay-100",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            )}
          >
            Don't just take our word for it. See what our users have to say about the VaibTalk experience.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index} 
              className={cn(
                "bg-background/50 backdrop-blur-sm border-purple-500/20 relative transition-all duration-700",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10",
                { "delay-200": index === 0, "delay-300": index === 1, "delay-400": index === 2 }
              )}
            >
              <CardContent className="pt-6">
                <Quote className="text-purple-400 mb-4 w-8 h-8" />
                <p className="mb-6 text-lg">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white">
                      {testimonial.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">{testimonial.author}</h4>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}