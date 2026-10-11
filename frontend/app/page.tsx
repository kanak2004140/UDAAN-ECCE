import AgeWorlds from "./components/landing/AgeWorlds";
import BrandSplash from "./components/landing/BrandSplash";
import Features from "./components/landing/Features";
import FinalCTA from "./components/landing/FinalCTA";
import Footer from "./components/landing/Footer";
import Hero from "./components/landing/Hero";
import HowItWorks from "./components/landing/HowItWorks";
import Navbar from "./components/landing/Navbar";
import ParentSection from "./components/landing/ParentSection";
import Trust from "./components/landing/Trust";

export default function Home() {
  return (
    <div className="overflow-x-clip font-text text-ink">
      <BrandSplash />
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <AgeWorlds />
        <Features />
        <Trust />
        <ParentSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
