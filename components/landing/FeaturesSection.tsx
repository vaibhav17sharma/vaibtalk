"use client";

import FeatureCard from "@/components/landing/FeatureCard";
import { motion } from "framer-motion";
import { Globe, MessageSquare, Share2, Shield, Video, Zap } from "lucide-react";

const features = [
  {
    icon: <MessageSquare className="w-6 h-6 text-cyan-400" />,
    title: "Real-time Chat",
    description: "Exchange messages instantly with futuristic UI, typing indicators, and read receipts.",
    link: "/chat",
  },
  {
    icon: <Video className="w-6 h-6 text-purple-400" />,
    title: "HD Video Calls",
    description: "Crystal clear video calls with low latency and immersive backgrounds.",
    link: "/call",
  },
  {
    icon: <Share2 className="w-6 h-6 text-pink-400" />,
    title: "P2P File Sharing",
    description: "Share files directly between devices without size limits or cloud storage.",
    link: "/chat",
  },
  {
    icon: <Shield className="w-6 h-6 text-emerald-400" />,
    title: "End-to-End Encrypted",
    description: "Your conversations are private and secure with state-of-the-art encryption.",
    link: "/chat",
  },
  {
    icon: <Zap className="w-6 h-6 text-yellow-400" />,
    title: "Lightning Fast",
    description: "Built on modern web technologies for instant loading and smooth performance.",
    link: "/chat",
  },
  {
    icon: <Globe className="w-6 h-6 text-blue-400" />,
    title: "Global Connectivity",
    description: "Connect with anyone, anywhere in the world with our distributed network.",
    link: "/chat",
  },
];

export default function FeaturesSection() {
  return (
    <section className="w-full py-16 md:py-24 px-4 md:px-6 bg-black relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 z-0 mix-blend-overlay"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[800px] md:h-[800px] bg-purple-900/10 rounded-full blur-[80px] md:blur-[120px] pointer-events-none"></div>
      
      <div className="container mx-auto relative z-10">
        <div className="text-center mb-12 md:mb-16 max-w-3xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/60"
          >
            Futuristic Communication
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-muted-foreground text-base md:text-xl leading-relaxed"
          >
            Experience next-gen communication with cutting-edge WebRTC
            technology that keeps you connected in style.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              link={feature.link}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
