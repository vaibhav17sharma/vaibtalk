import Footer from "@/components/common/Footer";
import FeatureCard from "@/components/landing/FeatureCard";
import HeroSection from "@/components/landing/HeroSection";
import TestimonialSection from "@/components/landing/TestimonialSection";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageSquare, Share2, Video } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <div className="flex flex-col items-center">
        <HeroSection />

        {/* Features section */}
        <section className="w-full py-20 px-4 md:px-6 bg-black/40">
          <div className="container mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-purple-500">
              Futuristic Communication
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Experience next-gen communication with cutting-edge WebRTC
              technology that keeps you connected in style.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 container mx-auto">
            <FeatureCard
              icon={<MessageSquare className="w-10 h-10 text-cyan-400" />}
              title="Real-time Chat"
              description="Exchange messages instantly with futuristic UI and typing indicators."
              link="/chat"
            />
            <FeatureCard
              icon={<Video className="w-10 h-10 text-purple-400" />}
              title="Video Calls"
              description="Crystal clear video with immersive backgrounds and effects."
              link="/call"
            />
            <FeatureCard
              icon={<Share2 className="w-10 h-10 text-pink-400" />}
              title="P2P File Sharing"
              description="Share files directly without size limits or intermediaries."
              link="/chat"
            />
          </div>
        </section>

        <TestimonialSection />

        {/* CTA section */}
        <section className="w-full py-20 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-cyan-900/20 z-0"></div>
          <div className="container relative z-10 mx-auto flex flex-col items-center text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to Experience The Future?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              Join VaibTalk today and revolutionize the way you connect with
              friends and colleagues.
            </p>
            <Link href="/chat">
              <Button
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 group"
              >
                Get Started
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
