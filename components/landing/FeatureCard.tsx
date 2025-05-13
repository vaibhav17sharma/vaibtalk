"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
}

export default function FeatureCard({ icon, title, description, link }: FeatureCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <Card 
      className={cn(
        "overflow-hidden border-purple-500/20 transition-all duration-300",
        isHovered ? "bg-gradient-to-br from-background via-background to-purple-900/10 shadow-lg shadow-purple-500/5 scale-[1.02]" : "bg-black/40"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="relative">
        <div 
          className={cn(
            "absolute inset-0 bg-gradient-to-r opacity-0 transition-opacity duration-300",
            isHovered ? "opacity-10" : "opacity-0"
          )}
          style={{ background: "linear-gradient(to right, #00FFFF, #FF00FF)" }}
        ></div>
        <div className="flex items-center justify-center h-16 w-16 rounded-lg bg-muted relative z-10">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="pb-6">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-4 line-clamp-2">{description}</p>
        <Link href={link}>
          <Button 
            variant="ghost" 
            className={cn(
              "pl-0 group gap-2 transition-colors",
              isHovered ? "text-purple-400" : "text-foreground"
            )}
          >
            Explore
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}