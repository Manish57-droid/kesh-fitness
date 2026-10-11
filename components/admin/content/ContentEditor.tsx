"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, Loader2, RotateCcw, Save } from "lucide-react";
import { Area, ImageField, Lines, List, Num, Text, Toggle } from "./fields";
import ProgramIcon from "../../ProgramIcon";
import { createClient } from "@/lib/supabase/client";
import { PROGRAM_ICONS, defaultContent, parsePin, type ProgramIcon as IconName, type SiteContent } from "@/lib/content";

const SECTIONS = [
  { id: "gym", label: "Gym details & timings" },
  { id: "hero", label: "Top banner" },
  { id: "marquee", label: "Running words" },
  { id: "about", label: "About" },
  { id: "programs", label: "Programs" },
  { id: "coach", label: "Coach" },
  { id: "plans", label: "Plans & prices" },
  { id: "joinCta", label: "Join banner" },
] as const;
type SectionId = (typeof SECTIONS)[number]["id"];

export default function ContentEditor({ initial, tableMissing }: { initial: SiteContent; tableMissing: boolean }) {
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [section, setSection] = useState<SectionId>("gym");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const onLeave = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  if (tableMissing) {
    return (
      <div className="card p-8 text-center">
        <p className="font-display text-2xl tracking-wide">Website editor not set up yet</p>
        <p className="mt-2 text-sm text-fg/70">
          Run <code className="text-brand-red">supabase/migrations/006_site_content.sql</code> in the Supabase SQL Editor, then refresh.
        </p>
      </div>
    );
  }

  const set = <K extends keyof SiteContent>(key: K, value: SiteContent[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const patch = <K extends keyof SiteContent>(key: K, changes: Partial<SiteContent[K]>) =>
    setDraft((d) => ({ ...d, [key]: { ...(d[key] as object), ...changes } as SiteContent[K] }));

  const save = async () => {
    setBusy(true);
    setError("");
    setNotice("");
    const clean = tidy(draft);
    const { error } = await createClient().from("site_content").upsert({ key: "home", data: clean });
    if (error) {
      setBusy(false);
      return setError(error.message);
    }
    await fetch("/api/revalidate", { method: "POST" }).catch(() => {});
    setSaved(clean);
    setDraft(clean);
    setBusy(false);
    setNotice("Saved. The website is updated.");
    setTimeout(() => setNotice(""), 4000);
  };

  const resetSection = () => {
    if (confirm("Reset this section to the original website content? (You still need to Save.)")) {
      set(section, defaultContent[section]);
    }
  };

  const g = draft.gym;
  const d = defaultContent;

  return (
    <div className="pb-24">
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Section list */}
        <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`shrink-0 border px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider transition lg:border-0 lg:border-l-2 lg:px-4 lg:py-3 ${
                section === s.id
                  ? "border-brand-red text-brand-red lg:bg-brand-red/10"
                  : "border-brand-line text-fg/60 hover:text-fg lg:border-transparent"
              }`}
            >
              {s.label}
            </button>
          ))}
          <a href="/" target="_blank" rel="noreferrer" className="hidden items-center gap-2 px-4 py-3 text-xs text-brand-muted hover:text-fg lg:flex">
            <ExternalLink className="h-3.5 w-3.5" /> Open website
          </a>
        </nav>

        {/* Editor */}
        <div className="card space-y-5 p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3 border-b border-brand-line pb-4">
            <h2 className="font-display text-2xl tracking-wide">{SECTIONS.find((s) => s.id === section)?.label}</h2>
            <button onClick={resetSection} className="flex items-center gap-1.5 text-xs text-brand-muted hover:text-fg">
              <RotateCcw className="h-3.5 w-3.5" /> Reset section
            </button>
          </div>

          {section === "gym" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Text label="Gym name" value={g.name} onChange={(v) => patch("gym", { name: v })} />
                <Text label="Team name" value={g.team} onChange={(v) => patch("gym", { team: v })} />
                <Text label="Tagline" value={g.tagline} onChange={(v) => patch("gym", { tagline: v })} />
                <Text label="Address" value={g.address} onChange={(v) => patch("gym", { address: v })} />
                <Text label="Google Maps link" value={g.mapUrl} onChange={(v) => patch("gym", { mapUrl: v.trim() })} maxLength={300} placeholder="https://maps.app.goo.gl/…" hint="Used for the Get Directions button. In Google Maps tap Share → Copy link." />
                <Text
                  label="Map pin (latitude, longitude)"
                  value={g.mapPin}
                  onChange={(v) => patch("gym", { mapPin: v })}
                  placeholder="23.3456, 85.8312"
                  maxLength={40}
                  hint={g.mapPin && !parsePin(g.mapPin) ? "Format: latitude, longitude (e.g. 23.3456, 85.8312)" : "Exact pin on the website map. In Google Maps, long-press the gym and copy the numbers shown."}
                />
                <Text label="Map search (if no pin)" value={g.mapQuery} onChange={(v) => patch("gym", { mapQuery: v })} hint="Used for the map only when the pin above is empty." />
                <Text label="Phone" value={g.phone} onChange={(v) => patch("gym", { phone: v })} placeholder="+91 98765 43210" hint="Leave empty to hide." />
                <Text label="Trainer email" value={g.email} onChange={(v) => patch("gym", { email: v.trim() })} placeholder="name@gmail.com" maxLength={100} hint="Used for online coaching enquiries and contact. Leave empty to hide." />
                <Text label="WhatsApp number" value={g.whatsapp} onChange={(v) => patch("gym", { whatsapp: v.replace(/\D/g, "") })} placeholder="919876543210" hint="Digits with country code. Leave empty to hide." />
                <Text label="Instagram username" value={g.instagramHandle} onChange={(v) => patch("gym", { instagramHandle: v.replace(/^@/, "").trim() })} />
                <Text label="YouTube link" value={g.youtube} onChange={(v) => patch("gym", { youtube: v })} maxLength={200} hint="Leave empty to hide." />
              </div>
              <List
                label="Gym timings"
                items={g.hours}
                onChange={(v) => patch("gym", { hours: v })}
                newItem={() => ({ days: "", slots: [""] })}
                max={7}
                addLabel="Add row"
                render={(row, setRow) => (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Text label="Days" value={row.days} onChange={(v) => setRow({ ...row, days: v })} placeholder="Monday – Saturday" />
                    <Lines label="Times" value={row.slots} onChange={(v) => setRow({ ...row, slots: v })} rows={2} hint="One time slot per line, or “Closed”." />
                  </div>
                )}
              />
            </>
          )}

          {section === "hero" && (
            <>
              <Text label="Small text above the headline" value={draft.hero.eyebrow} onChange={(v) => patch("hero", { eyebrow: v })} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Text label="Headline line 1" value={draft.hero.line1} onChange={(v) => patch("hero", { line1: v })} maxLength={40} />
                <Text label="Headline line 2 (red)" value={draft.hero.line2} onChange={(v) => patch("hero", { line2: v })} maxLength={40} />
              </div>
              <Area label="Intro text" value={draft.hero.text} onChange={(v) => patch("hero", { text: v })} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Text label="Main button" value={draft.hero.primaryCta} onChange={(v) => patch("hero", { primaryCta: v })} maxLength={30} />
                <Text label="Second button" value={draft.hero.secondaryCta} onChange={(v) => patch("hero", { secondaryCta: v })} maxLength={30} />
              </div>
              <ImageField label="Banner photo" value={draft.hero.image} defaultValue={d.hero.image} onChange={(v) => patch("hero", { image: v })} />
            </>
          )}

          {section === "marquee" && (
            <Lines label="Words in the red scrolling strip" value={draft.marquee} onChange={(v) => set("marquee", v)} rows={8} hint="One word or short phrase per line." />
          )}

          {section === "about" && (
            <>
              <Text label="Small heading" value={draft.about.eyebrow} onChange={(v) => patch("about", { eyebrow: v })} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Text label="Title" value={draft.about.title} onChange={(v) => patch("about", { title: v })} maxLength={60} />
                <Text label="Title, red part" value={draft.about.highlight} onChange={(v) => patch("about", { highlight: v })} maxLength={40} />
              </div>
              <List
                label="Paragraphs"
                items={draft.about.paragraphs}
                onChange={(v) => patch("about", { paragraphs: v })}
                newItem={() => ""}
                max={5}
                addLabel="Add paragraph"
                render={(p, setP) => <Area label="Text" value={p} onChange={setP} rows={4} />}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Text label="Red badge number" value={draft.about.badgeValue} onChange={(v) => patch("about", { badgeValue: v })} maxLength={10} hint="Leave empty to hide the badge." />
                <Text label="Red badge text" value={draft.about.badgeLabel} onChange={(v) => patch("about", { badgeLabel: v })} maxLength={30} />
              </div>
              <List
                label="Highlights (up to 3)"
                items={draft.about.stats}
                onChange={(v) => patch("about", { stats: v })}
                newItem={() => ({ value: "", label: "" })}
                max={3}
                addLabel="Add highlight"
                render={(s, setS) => (
                  <div className="grid grid-cols-2 gap-3">
                    <Text label="Big text" value={s.value} onChange={(v) => setS({ ...s, value: v })} maxLength={12} />
                    <Text label="Small text" value={s.label} onChange={(v) => setS({ ...s, label: v })} maxLength={24} />
                  </div>
                )}
              />
              <ImageField label="Photo" value={draft.about.image} defaultValue={d.about.image} onChange={(v) => patch("about", { image: v })} />
            </>
          )}

          {section === "programs" && (
            <>
              <Text label="Small heading" value={draft.programs.eyebrow} onChange={(v) => patch("programs", { eyebrow: v })} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Text label="Title" value={draft.programs.title} onChange={(v) => patch("programs", { title: v })} maxLength={60} />
                <Text label="Title, red part" value={draft.programs.highlight} onChange={(v) => patch("programs", { highlight: v })} maxLength={40} />
              </div>
              <Area label="Intro text" value={draft.programs.text} onChange={(v) => patch("programs", { text: v })} />
              <List
                label="Programs"
                items={draft.programs.items}
                onChange={(v) => patch("programs", { items: v })}
                newItem={() => ({ icon: "Dumbbell" as IconName, title: "", text: "" })}
                max={12}
                addLabel="Add program"
                render={(item, setItem) => (
                  <div className="space-y-3">
                    <div>
                      <p className="label">Icon</p>
                      <div className="flex flex-wrap gap-1.5">
                        {PROGRAM_ICONS.map((icon) => (
                          <button
                            key={icon}
                            type="button"
                            onClick={() => setItem({ ...item, icon })}
                            className={`flex h-10 w-10 items-center justify-center border transition ${
                              item.icon === icon ? "border-brand-red bg-brand-red/10 text-brand-red" : "border-brand-line text-fg/60 hover:text-fg"
                            }`}
                            aria-label={icon}
                            aria-pressed={item.icon === icon}
                          >
                            <ProgramIcon name={icon} className="h-5 w-5" />
                          </button>
                        ))}
                      </div>
                    </div>
                    <Text label="Title" value={item.title} onChange={(v) => setItem({ ...item, title: v })} maxLength={40} />
                    <Area label="Description" value={item.text} onChange={(v) => setItem({ ...item, text: v })} rows={2} maxLength={200} />
                  </div>
                )}
              />
            </>
          )}

          {section === "coach" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Text label="Small heading" value={draft.coach.eyebrow} onChange={(v) => patch("coach", { eyebrow: v })} />
                <Text label="Coach name" value={draft.coach.name} onChange={(v) => patch("coach", { name: v })} maxLength={30} hint="Shown as “Meet …”." />
              </div>
              <List
                label="Paragraphs"
                items={draft.coach.paragraphs}
                onChange={(v) => patch("coach", { paragraphs: v })}
                newItem={() => ""}
                max={5}
                addLabel="Add paragraph"
                render={(p, setP) => <Area label="Text" value={p} onChange={setP} rows={4} />}
              />
              <ImageField label="Coach photo" value={draft.coach.image} defaultValue={d.coach.image} onChange={(v) => patch("coach", { image: v })} />
              <Toggle
                label="Show before / after photo"
                checked={draft.coach.showTransformation}
                onChange={(v) => patch("coach", { showTransformation: v })}
              />
              {draft.coach.showTransformation && (
                <ImageField
                  label="Before / after photo"
                  value={draft.coach.transformationImage}
                  defaultValue={d.coach.transformationImage}
                  onChange={(v) => patch("coach", { transformationImage: v })}
                  aspect="aspect-[781/672]"
                />
              )}
            </>
          )}

          {section === "plans" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Text label="Small heading" value={draft.plans.eyebrow} onChange={(v) => patch("plans", { eyebrow: v })} />
                <Num label="Joining fee (₹)" value={draft.plans.joiningFee} onChange={(v) => patch("plans", { joiningFee: v })} hint="One-time. 0 hides it." />
                <Text label="Title" value={draft.plans.title} onChange={(v) => patch("plans", { title: v })} maxLength={40} />
                <Text label="Title, red part" value={draft.plans.highlight} onChange={(v) => patch("plans", { highlight: v })} maxLength={30} />
              </div>
              <Text label="Subtitle" value={draft.plans.subtitle} onChange={(v) => patch("plans", { subtitle: v })} />
              {draft.plans.items.map((plan, i) => {
                const setPlan = (changes: Partial<typeof plan>) =>
                  patch("plans", { items: draft.plans.items.map((p, j) => (j === i ? { ...p, ...changes } : p)) });
                return (
                  <div key={plan.id} className="space-y-3 border border-brand-line bg-brand-black/40 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-brand-muted">Plan {i + 1}</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Text label="Plan name" value={plan.name} onChange={(v) => setPlan({ name: v })} maxLength={30} />
                      <Num label="Monthly fee (₹)" value={plan.monthly} onChange={(v) => setPlan({ monthly: v })} />
                    </div>
                    <Lines label="What's included" value={plan.perks} onChange={(v) => setPlan({ perks: v })} />
                    <Toggle label="Mark as “Most Popular”" checked={plan.featured} onChange={(v) => setPlan({ featured: v })} />
                  </div>
                );
              })}
              <p className="text-xs text-brand-muted">
                There are always three plans, because join requests and members are linked to them. Prices here are used for the join form
                and the amount people pay to join.
              </p>
              <div className="space-y-3 border border-brand-red/50 bg-brand-red/5 p-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-brand-red">Online competition coaching</p>
                <Toggle label="Show on website" checked={draft.plans.online.enabled} onChange={(v) => patch("plans", { online: { ...draft.plans.online, enabled: v } })} />
                <div className="grid gap-3 sm:grid-cols-3">
                  <Text label="Title" value={draft.plans.online.title} onChange={(v) => patch("plans", { online: { ...draft.plans.online, title: v } })} maxLength={40} />
                  <Num label="Price (₹)" value={draft.plans.online.price} onChange={(v) => patch("plans", { online: { ...draft.plans.online, price: v } })} />
                  <Text label="Duration" value={draft.plans.online.duration} onChange={(v) => patch("plans", { online: { ...draft.plans.online, duration: v } })} maxLength={30} />
                </div>
                <Area label="Description" value={draft.plans.online.text} onChange={(v) => patch("plans", { online: { ...draft.plans.online, text: v } })} />
                <Lines label="What's included" value={draft.plans.online.perks} onChange={(v) => patch("plans", { online: { ...draft.plans.online, perks: v } })} />
                <p className="text-xs text-brand-muted">Visitors tap “Email the trainer”, which uses the trainer email from Gym details.</p>
              </div>
            </>
          )}

          {section === "joinCta" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Text label="Headline line 1" value={draft.joinCta.line1} onChange={(v) => patch("joinCta", { line1: v })} maxLength={40} />
                <Text label="Headline line 2" value={draft.joinCta.line2} onChange={(v) => patch("joinCta", { line2: v })} maxLength={40} />
              </div>
              <Area label="Text" value={draft.joinCta.text} onChange={(v) => patch("joinCta", { text: v })} />
              <Text label="Button" value={draft.joinCta.button} onChange={(v) => patch("joinCta", { button: v })} maxLength={30} />
            </>
          )}
        </div>
      </div>

      {/* Save bar (sits above the admin tab bar on phones) */}
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-brand-line bg-brand-card/95 backdrop-blur-md lg:bottom-0">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <p className="min-w-0 text-sm">
            {error ? (
              <span className="text-brand-red">{error}</span>
            ) : notice ? (
              <span className="flex items-center gap-1.5 text-emerald-500">
                <CheckCircle2 className="h-4 w-4" /> {notice}
              </span>
            ) : dirty ? (
              <span className="text-amber-500">Unsaved changes</span>
            ) : (
              <span className="text-brand-muted">All changes saved</span>
            )}
          </p>
          <div className="flex shrink-0 gap-2">
            {dirty && (
              <button onClick={() => setDraft(saved)} className="btn-ghost btn-sm">
                Discard
              </button>
            )}
            <button onClick={save} disabled={!dirty || busy} className="btn-primary btn-sm">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Trims text and drops empty list entries before saving. */
function tidy(c: SiteContent): SiteContent {
  const lines = (list: string[]) => list.map((s) => s.trim()).filter(Boolean);
  return {
    ...c,
    gym: { ...c.gym, hours: c.gym.hours.filter((h) => h.days.trim()).map((h) => ({ days: h.days.trim(), slots: lines(h.slots) })) },
    marquee: lines(c.marquee),
    about: { ...c.about, paragraphs: lines(c.about.paragraphs), stats: c.about.stats.filter((s) => s.value.trim() || s.label.trim()) },
    programs: { ...c.programs, items: c.programs.items.filter((p) => p.title.trim()) },
    coach: { ...c.coach, paragraphs: lines(c.coach.paragraphs) },
    plans: {
      ...c.plans,
      items: c.plans.items.map((p) => ({ ...p, perks: lines(p.perks) })),
      online: { ...c.plans.online, perks: lines(c.plans.online.perks) },
    },
  };
}
