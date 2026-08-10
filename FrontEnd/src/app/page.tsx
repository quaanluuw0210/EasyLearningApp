import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import Features from "@/components/sections/Features";
import CityCoverFlowWidget from "@/components/CityCoverFlowWidget";
import TestimonialMarquee from "@/components/sections/TestimonialMarquee";
import HowItWorks from "@/components/sections/HowItWorks";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <CityCoverFlowWidget />
        <TestimonialMarquee />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
}