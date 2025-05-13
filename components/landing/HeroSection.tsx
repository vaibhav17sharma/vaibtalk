"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
  }, []);
  
  return (
    <section className="relative w-full py-24 md:py-32 overflow-hidden bg-black">
      {/* Animated background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black to-transparent opacity-80"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full filter blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-cyan-500/30 rounded-full filter blur-[100px] animate-pulse" style={{ animationDelay: "1s" }}></div>
      </div>
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/grid.png')] bg-repeat opacity-20 z-0"></div>
      
      <div className="container relative z-10 px-4 md:px-6 mx-auto">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          <div 
            className={cn(
              "mb-6 transition-all duration-1000 ease-out transform",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            )}
          >
            <span className="inline-block text-xs md:text-sm font-medium px-3 py-1 rounded-full bg-muted mb-4">
              THE FUTURE OF COMMUNICATION IS HERE
            </span>
          </div>
          
          <h1 
            className={cn(
              "text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 transition-all duration-1000 delay-150 ease-out transform",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            )}
          >
            Connect Like Never Before
          </h1>
          
          <p 
            className={cn(
              "text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl transition-all duration-1000 delay-300 ease-out transform",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            )}
          >
            Experience the next generation of communication with VaibTalk. Chat, video call, and share files with a futuristic interface designed for Gen Z.
          </p>
          
          <div 
            className={cn(
              "flex flex-col sm:flex-row gap-4 transition-all duration-1000 delay-500 ease-out transform",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            )}
          >
            <Link href="/chat">
              <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 group">
                Start Chatting 
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/call">
              <Button size="lg" variant="outline" className="border-purple-500/50 hover:bg-purple-500/10">
                Try Video Call
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Hero image/mockup */}
        <div 
          className={cn(
            "mt-16 relative max-w-5xl mx-auto transition-all duration-1000 delay-700 ease-out transform",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}
        >
          <div className="relative overflow-hidden rounded-xl border border-purple-500/20 shadow-2xl shadow-purple-500/10">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10"></div>
            <img 
              src="https://images.pexels.com/photos/8439097/pexels-photo-8439097.jpeg" 
              alt="VaibTalk Interface" 
              className="w-full h-auto"
            />
          </div>
          
          {/* Glowing orbs for decoration */}
          <div className="absolute -top-4 -left-4 w-24 h-24 bg-cyan-500/30 rounded-full filter blur-[40px] animate-pulse"></div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-purple-500/30 rounded-full filter blur-[40px] animate-pulse" style={{ animationDelay: "1.5s" }}></div>
        </div>
      </div>
    </section>
  );
}