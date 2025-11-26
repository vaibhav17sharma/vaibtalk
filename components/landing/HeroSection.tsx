"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-black pt-20 pb-10">
      {/* Animated background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/40 via-black to-black"></div>
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut" 
          }}
          className="absolute top-1/4 left-1/4 w-64 h-64 md:w-96 md:h-96 bg-purple-600/20 rounded-full filter blur-[80px] md:blur-[120px]"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ 
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-1/3 right-1/4 w-48 h-48 md:w-64 md:h-64 bg-cyan-600/20 rounded-full filter blur-[60px] md:blur-[100px]"
        />
      </div>
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 z-0 mix-blend-overlay"></div>
      
      <div className="container relative z-10 px-4 md:px-6 mx-auto flex flex-col items-center">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <span className="inline-flex items-center gap-2 text-xs md:text-sm font-medium px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-purple-300">
              <Sparkles className="w-3 h-3" />
              THE FUTURE OF COMMUNICATION
            </span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tight"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-white/90 to-white/50">
              Connect Like
            </span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
              Never Before
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed"
          >
            Experience the next generation of communication with VaibTalk. 
            Chat, video call, and share files with a futuristic interface designed for the modern web.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <Link href="/chat" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 border-0 shadow-lg shadow-purple-500/25 transition-all duration-300 hover:scale-105">
                Start Chatting 
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/call" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 text-base border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-sm transition-all duration-300 hover:scale-105">
                Try Video Call
              </Button>
            </Link>
          </motion.div>
        </div>
        
        {/* Hero image/mockup */}
        <motion.div 
          initial={{ opacity: 0, y: 40, rotateX: 20 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.8, delay: 0.4, type: "spring" }}
          className="mt-20 relative w-full max-w-5xl mx-auto perspective-1000"
        >
          <div className="relative rounded-xl border border-white/10 bg-black/50 backdrop-blur-xl shadow-2xl shadow-purple-500/10 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* Mockup Header */}
            <div className="h-10 border-b border-white/10 bg-white/5 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
              <div className="ml-4 h-5 w-32 md:w-64 rounded-full bg-white/5"></div>
            </div>
            
            {/* Mockup Content */}
            <div className="aspect-video w-full bg-black/40 relative overflow-hidden">
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center px-4">
                    <div className="w-16 h-16 md:w-20 md:h-20 mx-auto bg-gradient-to-tr from-cyan-500 to-purple-600 rounded-2xl mb-4 flex items-center justify-center shadow-lg shadow-purple-500/20">
                      <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-white" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Welcome to VaibTalk</h3>
                    <p className="text-sm md:text-base text-white/50">The future of connection starts here.</p>
                  </div>
               </div>
               
               {/* Floating UI Elements - Hidden on very small screens, shown on sm+ */}
               <motion.div 
                 animate={{ y: [0, -10, 0] }}
                 transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                 className="hidden sm:block absolute top-10 left-10 p-3 md:p-4 rounded-xl bg-black/60 border border-white/10 backdrop-blur-md w-40 md:w-48"
               >
                 <div className="flex items-center gap-3 mb-2">
                   <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-r from-pink-500 to-rose-500"></div>
                   <div className="h-2 md:h-3 w-16 md:w-20 bg-white/20 rounded-full"></div>
                 </div>
                 <div className="h-1.5 md:h-2 w-full bg-white/10 rounded-full mb-2"></div>
                 <div className="h-1.5 md:h-2 w-2/3 bg-white/10 rounded-full"></div>
               </motion.div>

               <motion.div 
                 animate={{ y: [0, 10, 0] }}
                 transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                 className="hidden sm:block absolute bottom-10 right-10 p-3 md:p-4 rounded-xl bg-black/60 border border-white/10 backdrop-blur-md w-48 md:w-56"
               >
                 <div className="flex items-center justify-between mb-3">
                    <div className="text-[10px] md:text-xs text-white/60">File Transfer</div>
                    <div className="text-[10px] md:text-xs text-cyan-400">85%</div>
                 </div>
                 <div className="h-1 md:h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full w-[85%] bg-cyan-500 rounded-full"></div>
                 </div>
               </motion.div>
            </div>
          </div>
          
          {/* Glow effects */}
          <div className="absolute -top-20 -left-20 w-48 h-48 md:w-64 md:h-64 bg-cyan-500/20 rounded-full filter blur-[60px] md:blur-[80px] -z-10"></div>
          <div className="absolute -bottom-20 -right-20 w-48 h-48 md:w-64 md:h-64 bg-purple-500/20 rounded-full filter blur-[60px] md:blur-[80px] -z-10"></div>
        </motion.div>
      </div>
    </section>
  );
}