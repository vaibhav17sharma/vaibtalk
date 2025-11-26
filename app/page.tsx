import Footer from "@/components/common/Footer";
import CTASection from "@/components/landing/CTASection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HeroSection from "@/components/landing/HeroSection";
import TestimonialSection from "@/components/landing/TestimonialSection";

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen bg-black text-white selection:bg-purple-500/30">
      <HeroSection />
      <FeaturesSection />
      <TestimonialSection />
      <CTASection />
      <Footer />
    </main>
  );
}
