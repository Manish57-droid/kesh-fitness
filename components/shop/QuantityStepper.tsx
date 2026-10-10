"use client";
import { Minus, Plus } from "lucide-react";

type Props = { value: number; min?: number; max: number; onChange: (n: number) => void };

export default function QuantityStepper({ value, min = 1, max, onChange }: Props) {
  return (
    <div className="inline-flex items-center border border-brand-line">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="flex h-12 w-12 items-center justify-center transition hover:bg-fg/5 disabled:opacity-30"
        aria-label="Decrease quantity"
      >
        <Minus className="h-5 w-5" />
      </button>
      <span className="w-14 text-center font-display text-3xl" aria-live="polite" aria-label={`Quantity ${value}`}>
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="flex h-12 w-12 items-center justify-center transition hover:bg-fg/5 disabled:opacity-30"
        aria-label="Increase quantity"
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  );
}
