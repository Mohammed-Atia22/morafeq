import HeroSection from "../components/landing/HeroSection";
import StatsBar from "../components/landing/StatsBar";
import FeaturedListings from "../components/landing/FeaturedListings";
import HowItWorks from "../components/landing/HowItWorks";
import OwnerCTA from "../components/landing/OwnerCTA";
import TrustBar from "../components/landing/TrustBar";
import Footer from "../components/landing/Footer";

const Landing = () => {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <StatsBar />
      <FeaturedListings />
      <HowItWorks />
      <OwnerCTA />
      <TrustBar />
      <Footer />
    </main>
  );
};

export default Landing;