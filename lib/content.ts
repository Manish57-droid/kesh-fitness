// Editable landing-page content. The admin edits it at /admin/content; it's stored in the
// `site_content` table (migration 006). Anything not saved there falls back to these defaults.

export const PROGRAM_ICONS = [
  "Dumbbell", "Flame", "Trophy", "HeartPulse", "UserCheck", "Users", "Zap", "Target", "Timer", "Bike", "Apple", "Activity",
] as const;
export type ProgramIcon = (typeof PROGRAM_ICONS)[number];

export type PlanContent = {
  id: "gym" | "cardio"; // fixed: join requests and members refer to these ids
  name: string;
  monthly: number;
  perks: string[];
  featured: boolean;
};

export type GymDetails = {
  name: string;
  team: string;
  tagline: string;
  address: string;
  mapQuery: string;
  phone: string; // empty = hidden
  whatsapp: string; // digits with country code, e.g. 919876543210; empty = hidden
  instagramHandle: string;
  youtube: string;
  hours: { days: string; slots: string[] }[];
};

export type SiteContent = {
  gym: GymDetails;
  hero: { eyebrow: string; line1: string; line2: string; text: string; primaryCta: string; secondaryCta: string; image: string };
  marquee: string[];
  about: {
    eyebrow: string;
    title: string;
    highlight: string;
    paragraphs: string[];
    badgeValue: string;
    badgeLabel: string;
    stats: { value: string; label: string }[];
    image: string;
  };
  programs: {
    eyebrow: string;
    title: string;
    highlight: string;
    text: string;
    items: { icon: ProgramIcon; title: string; text: string }[];
  };
  coach: {
    eyebrow: string;
    name: string;
    paragraphs: string[];
    image: string;
    transformationImage: string;
    showTransformation: boolean;
  };
  plans: { eyebrow: string; title: string; highlight: string; subtitle: string; joiningFee: number; items: PlanContent[] };
  joinCta: { line1: string; line2: string; text: string; button: string };
};

export const defaultContent: SiteContent = {
  gym: {
    name: "Kesh Fitness",
    team: "Team Invincible Kesh",
    tagline: "Unisex Multi Gym",
    address: "Near Silli Stadium, Silli, Jharkhand",
    mapQuery: "Silli Stadium, Silli, Jharkhand",
    phone: "",
    whatsapp: "",
    instagramHandle: "teaminvinciblekesh",
    youtube: "https://youtube.com/channel/UCvp9plbiQ0P2nbGCDHeLPqQ",
    hours: [
      { days: "Monday – Saturday", slots: ["5:00 AM – 10:00 AM", "4:00 PM – 9:00 PM"] },
      { days: "Sunday", slots: ["Closed"] },
    ],
  },
  hero: {
    eyebrow: "Unisex Multi Gym",
    line1: "Train Hard.",
    line2: "Stay Invincible.",
    text: "Your neighbourhood gym for real strength, fat loss and muscle gain, with coaching from Team Invincible Kesh. Everyone is welcome, whether it's your first day or your hundredth.",
    primaryCta: "Start Your Journey",
    secondaryCta: "View Plans",
    image: "/images/hero.jpg",
  },
  marquee: ["Strength", "Discipline", "Consistency", "Power", "Sweat", "Invincible"],
  about: {
    eyebrow: "About the Gym",
    title: "More Than a Gym.",
    highlight: "A Team.",
    paragraphs: [
      "Kesh Fitness is a unisex multi gym near Silli Stadium, built for people who want results without the fuss. We have the equipment, the energy and the coaching to get you there.",
      "Train alongside Team Invincible Kesh, a community that pushes each other every single day. Beginners get guidance on form and routine, and experienced lifters get the space to go heavy.",
    ],
    badgeValue: "110+",
    badgeLabel: "Strong Community",
    stats: [
      { value: "Multi", label: "Gym Setup" },
      { value: "Unisex", label: "Men & Women" },
      { value: "6 Days", label: "A Week" },
    ],
    image: "/images/about.jpg",
  },
  programs: {
    eyebrow: "What We Offer",
    title: "Programs Built For",
    highlight: "Results",
    text: "Whatever your goal, there's a plan for you. Talk to us and we'll help you pick the right starting point.",
    items: [
      { icon: "Dumbbell", title: "Strength Training", text: "Free weights, machines and compound lifts to build raw strength the right way." },
      { icon: "Flame", title: "Fat Loss", text: "High-energy workouts and practical diet guidance to burn fat and keep it off." },
      { icon: "Trophy", title: "Muscle Gain", text: "Structured hypertrophy splits and nutrition tips for steady, visible gains." },
      { icon: "HeartPulse", title: "Cardio & Conditioning", text: "Improve stamina, heart health and endurance with cardio and circuit training." },
      { icon: "UserCheck", title: "Personal Guidance", text: "One-on-one attention on form, routines and progress, ideal for beginners." },
      { icon: "Users", title: "Unisex Gym", text: "A safe, respectful space where men and women train side by side." },
    ],
  },
  coach: {
    eyebrow: "Owner & Head Coach",
    name: "Kesh",
    paragraphs: [
      "The founder of Kesh Fitness and the force behind Team Invincible Kesh. Kesh built this gym to give the Silli community a place to train seriously, with honest coaching, hard work and zero shortcuts.",
      "From your first squat to your next personal record, you'll get guidance on technique, training splits and diet so every session counts.",
    ],
    image: "/images/coach.jpg",
    transformationImage: "/images/transformation.jpg",
    showTransformation: true,
  },
  plans: {
    eyebrow: "Membership",
    title: "Pick Your",
    highlight: "Plan",
    subtitle: "Simple monthly plans. No hidden charges.",
    joiningFee: 1000,
    items: [
      {
        id: "gym",
        name: "Gym",
        monthly: 500,
        perks: ["Full access to weights & machines", "Strength training area", "Form & workout guidance"],
        featured: false,
      },
      {
        id: "cardio",
        name: "Gym + Cardio",
        monthly: 800,
        perks: ["Everything in the Gym plan", "Treadmill & cardio machines", "Fat-loss friendly routines"],
        featured: true,
      },
    ],
  },
  joinCta: {
    line1: "Your First Workout",
    line2: "Starts Today.",
    text: "Drop by the gym or send us a message. We'll show you around and help you get started.",
    button: "Join Kesh Fitness",
  },
};

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Saved content over the defaults, one section at a time, so new fields always have a value. */
export function mergeContent(saved: unknown): SiteContent {
  if (!isObject(saved)) return defaultContent;
  const out: Record<string, unknown> = { ...defaultContent };
  for (const [key, def] of Object.entries(defaultContent)) {
    const value = saved[key];
    if (value === undefined) continue;
    out[key] = isObject(def) && isObject(value) ? { ...def, ...value } : Array.isArray(def) && Array.isArray(value) ? value : def;
  }
  const merged = out as SiteContent;
  // Plans must always be exactly the two fixed ids.
  merged.plans.items = defaultContent.plans.items.map(
    (d) => ({ ...d, ...(merged.plans.items.find((p) => p?.id === d.id) ?? {}) }) as PlanContent
  );
  return merged;
}

// Derived values used across the site.
export const instagramUrl = (g: GymDetails) => `https://www.instagram.com/${g.instagramHandle}/`;
export const instagramDM = (g: GymDetails) => `https://ig.me/m/${g.instagramHandle}`;

/** Cache tag for the saved content; the admin save calls revalidateTag with it. */
export const CONTENT_TAG = "site-content";
