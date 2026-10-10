import { Activity, Apple, Bike, Dumbbell, Flame, HeartPulse, Target, Timer, Trophy, UserCheck, Users, Zap } from "lucide-react";
import type { ProgramIcon as IconName } from "@/lib/content";

const icons = { Activity, Apple, Bike, Dumbbell, Flame, HeartPulse, Target, Timer, Trophy, UserCheck, Users, Zap };

export default function ProgramIcon({ name, className }: { name: IconName; className?: string }) {
  const Icon = icons[name] ?? Dumbbell;
  return <Icon className={className} strokeWidth={1.5} />;
}
