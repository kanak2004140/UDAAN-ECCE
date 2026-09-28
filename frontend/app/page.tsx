import Navbar from "./components/landing/Navbar";
import BrandSplash from "./components/landing/BrandSplash";
import Hero from "./components/landing/Hero";
import WhatIsEcce from "./components/landing/WhatIsEcce";
import Features from "./components/landing/Features";
import AgeWorlds from "./components/landing/AgeWorlds";
import ParentSection from "./components/landing/ParentSection";
import FinalCTA from "./components/landing/FinalCTA";

export default function Home() {
  return (
    <main>
      <BrandSplash />
      <Navbar />
      <Hero />
      <WhatIsEcce />
      <Features />
      <AgeWorlds />
      <ParentSection />
      <FinalCTA />
    </main>
  );
}