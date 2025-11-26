"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
  delay?: number;
}

export default function FeatureCard({ icon, title, description, link, delay = 0 }: FeatureCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative h-full"
    >
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-2xl blur-xl transition-opacity duration-500",
        isHovered ? "opacity-100" : "opacity-0"
      )} />
      
      <div className="relative h-full bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-6 overflow-hidden transition-all duration-300 hover:border-white/20 hover:bg-black/60">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <ArrowRight className="w-24 h-24 -rotate-45" />
        </div>
        
        <div className="mb-6 inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        
        <h3 className="text-xl font-bold mb-3 text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-purple-400 transition-all">
          {title}
        </h3>
        
        <p className="text-muted-foreground mb-6 leading-relaxed">
          {description}
        </p>
        
        <Link href={link} className="inline-flex items-center text-sm font-medium text-white/70 hover:text-white transition-colors">
          Explore Feature 
          <ArrowRight className={cn(
            "ml-2 w-4 h-4 transition-transform duration-300",
            isHovered ? "translate-x-1" : ""
          )} />
        </Link>
      </div>
    </motion.div>
  );
}