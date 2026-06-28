import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Equipment from "@/components/Equipment";
import Branches from "@/components/Branches";
import Timings from "@/components/Timings";
import Membership from "@/components/Membership";
import Trainers from "@/components/Trainers";
import Testimonials from "@/components/Testimonials";
import Gallery from "@/components/Gallery";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Equipment />
        <Branches />
        <Timings />
        <Membership />
        <Trainers />
        <Testimonials />
        <Gallery />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
