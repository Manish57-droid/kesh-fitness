"use client";
import { useId, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Plus, RotateCcw, Trash2 } from "lucide-react";
import Photo from "../../Photo";
import { createClient } from "@/lib/supabase/client";
import { resizeImage } from "@/lib/image";

// Small form building blocks for the website content editor.

export function Text({
  label,
  value,
  onChange,
  hint,
  placeholder,
  maxLength = 120,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  placeholder?: string;
  maxLength?: number;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <input id={id} className="input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength} />
      {hint && <p className="mt-1 text-xs text-brand-muted">{hint}</p>}
    </div>
  );
}

export function Area({
  label,
  value,
  onChange,
  hint,
  rows = 3,
  maxLength = 600,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  rows?: number;
  maxLength?: number;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <textarea id={id} rows={rows} className="input resize-y" value={value} onChange={(e) => onChange(e.target.value)} maxLength={maxLength} />
      {hint && <p className="mt-1 text-xs text-brand-muted">{hint}</p>}
    </div>
  );
}

export function Num({ label, value, onChange, hint }: { label: string; value: number; onChange: (v: number) => void; hint?: string }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        className="input"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Math.max(0, Math.round(Number(e.target.value) || 0)))}
      />
      {hint && <p className="mt-1 text-xs text-brand-muted">{hint}</p>}
    </div>
  );
}

export function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 border border-brand-line p-3">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-5 w-5 accent-[#E11D2A]" />
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {hint && <span className="block text-xs text-brand-muted">{hint}</span>}
      </span>
    </label>
  );
}

/** One entry per line, e.g. plan perks or running words. */
export function Lines({ label, value, onChange, hint, rows = 4 }: { label: string; value: string[]; onChange: (v: string[]) => void; hint?: string; rows?: number }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <textarea
        id={id}
        rows={rows}
        className="input resize-y"
        value={value.join("\n")}
        onChange={(e) => onChange(e.target.value.split("\n"))}
        onBlur={(e) => onChange(e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))}
      />
      <p className="mt-1 text-xs text-brand-muted">{hint ?? "One per line."}</p>
    </div>
  );
}

/** A list of items with add / remove / move up / move down. */
export function List<T>({
  label,
  items,
  onChange,
  newItem,
  max = 20,
  min = 0,
  addLabel = "Add",
  render,
}: {
  label: string;
  items: T[];
  onChange: (v: T[]) => void;
  newItem: () => T;
  max?: number;
  min?: number;
  addLabel?: string;
  render: (item: T, set: (v: T) => void, index: number) => React.ReactNode;
}) {
  const move = (i: number, dir: -1 | 1) => {
    const next = [...items];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    onChange(next);
  };
  return (
    <div>
      <p className="label">{label}</p>
      <ol className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="border border-brand-line bg-brand-black/40 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-widest text-brand-muted">#{i + 1}</span>
              <div className="flex">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="p-2 text-brand-muted hover:text-fg disabled:opacity-30" aria-label="Move up">
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} className="p-2 text-brand-muted hover:text-fg disabled:opacity-30" aria-label="Move down">
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onChange(items.filter((_, j) => j !== i))}
                  disabled={items.length <= min}
                  className="p-2 text-brand-muted hover:text-brand-red disabled:opacity-30"
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            {render(item, (v) => onChange(items.map((x, j) => (j === i ? v : x))), i)}
          </li>
        ))}
      </ol>
      {items.length < max && (
        <button type="button" onClick={() => onChange([...items, newItem()])} className="btn-ghost btn-sm mt-3">
          <Plus className="h-3.5 w-3.5" /> {addLabel}
        </button>
      )}
    </div>
  );
}

/** Photo picker that uploads to the `site` storage bucket. */
export function ImageField({
  label,
  value,
  defaultValue,
  onChange,
  aspect = "aspect-[4/5]",
}: {
  label: string;
  value: string;
  defaultValue: string;
  onChange: (url: string) => void;
  aspect?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const upload = async (file: File) => {
    setBusy(true);
    setError("");
    try {
      const supabase = createClient();
      const blob = await resizeImage(file, 1800, 0.85);
      const ext = blob.type === "image/webp" ? "webp" : file.name.split(".").pop() || "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("site").upload(path, blob, { contentType: blob.type });
      if (error) throw error;
      onChange(supabase.storage.from("site").getPublicUrl(path).data.publicUrl);
    } catch (err) {
      setError(`Upload failed: ${(err as Error).message}`);
    }
    setBusy(false);
  };

  return (
    <div>
      <p className="label">{label}</p>
      <div className="flex items-start gap-4">
        <Photo src={value} alt={label} className={`w-28 shrink-0 border border-brand-line sm:w-36 ${aspect}`} />
        <div className="space-y-2">
          <button type="button" onClick={() => input.current?.click()} disabled={busy} className="btn-ghost btn-sm">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
            {busy ? "Uploading…" : "Change photo"}
          </button>
          {value !== defaultValue && (
            <button type="button" onClick={() => onChange(defaultValue)} className="flex items-center gap-1.5 text-xs text-brand-muted hover:text-fg">
              <RotateCcw className="h-3 w-3" /> Use original photo
            </button>
          )}
          <p className="text-xs text-brand-muted">JPG, PNG or WebP. Resized automatically.</p>
          {error && <p className="text-xs text-brand-red">{error}</p>}
        </div>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
