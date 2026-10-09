import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import About from "@/components/About";
import Programs from "@/components/Programs";
import Coach from "@/components/Coach";
import Plans from "@/components/Plans";
import Gallery from "@/components/Gallery";
import Visit from "@/components/Visit";
import JoinCTA from "@/components/JoinCTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <About />
        <Programs />
        <Coach />
        <Plans />
        <Gallery />
        <Visit />
        <JoinCTA />
      </main>
      <Footer />
    </>
  );
}
