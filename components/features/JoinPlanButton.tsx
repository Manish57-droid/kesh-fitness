"use client";
import { PLAN_EVENT } from "@/lib/events";
import type { PlanId } from "@/lib/site";

/** Jumps to the join form with this plan pre-selected. */
export default function JoinPlanButton({
  plan,
  className,
  children,
}: {
  plan: PlanId;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href="#join"
      className={className}
      onClick={() => window.dispatchEvent(new CustomEvent<PlanId>(PLAN_EVENT, { detail: plan }))}
    >
      {children}
    </a>
  );
}
