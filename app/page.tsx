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
import { getContent } from "@/lib/content-server";

// Re-built when the admin saves content (see /api/revalidate), and at least every 10 minutes.
export const revalidate = 600;

export default async function Home() {
  const c = await getContent();
  return (
    <>
      <Navbar />
      <main>
        <Hero c={c.hero} address={c.gym.address} />
        <Marquee words={c.marquee} />
        <About c={c.about} />
        <Programs c={c.programs} />
        <WorkoutPlanner />
        <Coach c={c.coach} gym={c.gym} />
        <Plans c={c.plans} email={c.gym.email} />
        <JoinForm plans={c.plans} gymName={c.gym.name} />
        <Shop preview />
        <Gallery instagramHandle={c.gym.instagramHandle} />
        <MessageGym gym={c.gym} />
        <Visit gym={c.gym} />
        <JoinCTA c={c.joinCta} />
      </main>
      <Footer gym={c.gym} />
      <MobileNav />
    </>
  );
}
