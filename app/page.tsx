import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import About from "@/components/About";
import Programs from "@/components/Programs";
import WorkoutPlanner from "@/components/features/WorkoutPlanner";
import Coach from "@/components/Coach";
import Plans from "@/components/Plans";
import JoinForm from "@/components/features/JoinForm";
import Shop from "@/components/features/Shop";
import Gallery from "@/components/Gallery";
import MessageGym from "@/components/features/MessageGym";
import Visit from "@/components/Visit";
import JoinCTA from "@/components/JoinCTA";
import Footer from "@/components/Footer";
import MobileNav from "@/components/MobileNav";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <About />
        <Programs />
        <WorkoutPlanner />
        <Coach />
        <Plans />
        <JoinForm />
        <Shop />
        <Gallery />
        <MessageGym />
        <Visit />
        <JoinCTA />
      </main>
      <Footer />
      <MobileNav />
    </>
  );
}
