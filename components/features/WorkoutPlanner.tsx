"use client";
import { useEffect, useState } from "react";
import { Plus, Smartphone, Trash2 } from "lucide-react";
import { DAYS, todayIndex } from "@/lib/format";
import { allExercises, exerciseLibrary } from "@/lib/exercises";
import { KEYS, readJSON, writeJSON } from "@/lib/storage";
import type { Workout } from "@/lib/types";

const emptyForm = { exercise: "", sets: "3", reps: "10", weight: "", notes: "" };
const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export default function WorkoutPlanner() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [day, setDay] = useState(0);
  const [today, setToday] = useState(-1);
  const [form, setForm] = useState(emptyForm);
  const [group, setGroup] = useState("Chest");

  // Load from this device and pick "today" on the client (server time zone may differ).
  useEffect(() => {
    setWorkouts(readJSON<Workout[]>(KEYS.workouts, []));
    const t = todayIndex();
    setToday(t);
    setDay(t);
  }, []);

  const save = (next: Workout[]) => {
    setWorkouts(next);
    writeJSON(KEYS.workouts, next);
  };

  const dayItems = workouts.filter((w) => w.day === day);
  const set = (k: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const exercise = form.exercise.trim();
    if (!exercise) return;
    const sets = Number(form.sets);
    save([
      ...workouts,
      {
        id: newId(),
        day,
        exercise: exercise.slice(0, 80),
        sets: sets > 0 ? Math.min(sets, 20) : null,
        reps: form.reps.trim() || null,
        weight: form.weight.trim() || null,
        notes: form.notes.trim() || null,
      },
    ]);
    setForm({ ...emptyForm, sets: form.sets, reps: form.reps });
  };

  const remove = (id: string) => save(workouts.filter((w) => w.id !== id));

  const clearDay = () => {
    if (confirm(`Clear all exercises for ${DAYS[day]}?`)) save(workouts.filter((w) => w.day !== day));
  };

  return (
    <section id="planner" className="section scroll-mt-16">
      <div className="container-x">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">Free Tool</p>
            <h2 className="heading mt-5">
              Plan Your <span className="text-brand-red">Week</span>
            </h2>
          </div>
          <p className="flex max-w-md items-start gap-2 text-sm text-fg/60">
            <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-brand-red" />
            Build your weekly workout schedule. It&apos;s saved on this phone, with no sign-up needed.
          </p>
        </div>

        <div className="mt-10 border border-brand-line bg-brand-card">
          {/* Day tabs: 7 equal columns so they fit on any phone */}
          <div className="grid grid-cols-7 border-b border-brand-line">
            {DAYS.map((d, i) => {
              const count = workouts.filter((w) => w.day === i).length;
              const active = day === i;
              return (
                <button
                  key={d}
                  onClick={() => setDay(i)}
                  aria-pressed={active}
                  aria-label={`${d}, ${count} exercises`}
                  className={`relative py-3 text-center transition sm:py-4 ${
                    active ? "bg-brand-red text-white" : "text-fg/60 hover:bg-fg/5 hover:text-fg"
                  }`}
                >
                  <span className="block text-[11px] font-bold uppercase tracking-wider sm:text-xs">{d.slice(0, 3)}</span>
                  <span className={`mt-0.5 block text-[10px] ${active ? "text-white/80" : "text-brand-muted"}`}>
                    {count || "–"}
                  </span>
                  {i === today && !active && (
                    <span className="absolute left-1/2 top-1 h-1 w-1 -translate-x-1/2 rounded-full bg-brand-red" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Exercise list */}
            <div className="border-b border-brand-line p-4 sm:p-6 lg:border-b-0 lg:border-r">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-2xl tracking-wide sm:text-3xl">
                  {DAYS[day]} {day === today && <span className="text-brand-red">· Today</span>}
                </h3>
                {dayItems.length > 0 && (
                  <button onClick={clearDay} className="text-xs font-semibold uppercase tracking-wider text-brand-muted hover:text-brand-red">
                    Clear
                  </button>
                )}
              </div>

              {dayItems.length === 0 ? (
                <p className="mt-4 border border-dashed border-brand-line px-4 py-10 text-center text-sm text-brand-muted">
                  Rest day, or add your first exercise.
                </p>
              ) : (
                <ol className="mt-4 divide-y divide-brand-line border border-brand-line">
                  {dayItems.map((w, i) => (
                    <li key={w.id} className="flex items-center gap-3 py-3 pl-3 pr-1 sm:gap-4 sm:pl-4">
                      <span className="font-display text-2xl text-brand-red">{String(i + 1).padStart(2, "0")}</span>
                      <div className="min-w-0 flex-1">
                        <p className="break-words font-semibold">{w.exercise}</p>
                        <p className="text-xs text-brand-muted">
                          {[w.sets && `${w.sets} sets`, w.reps && `${w.reps} reps`, w.weight].filter(Boolean).join(" · ")}
                        </p>
                        {w.notes && <p className="break-words text-xs text-fg/60">{w.notes}</p>}
                      </div>
                      <button
                        onClick={() => remove(w.id)}
                        className="flex h-11 w-11 shrink-0 items-center justify-center text-brand-muted transition hover:text-brand-red"
                        aria-label={`Remove ${w.exercise}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {/* Add exercise */}
            <div className="p-4 sm:p-6">
              <p className="label">Quick add</p>
              <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
                {Object.keys(exerciseLibrary).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGroup(g)}
                    className={`shrink-0 border px-3 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                      group === g ? "border-brand-red text-brand-red" : "border-brand-line text-fg/60 hover:text-fg"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {exerciseLibrary[group].map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setForm({ ...form, exercise: ex })}
                    className={`px-3 py-2 text-xs transition ${
                      form.exercise === ex ? "bg-brand-red text-white" : "bg-fg/5 text-fg/80 hover:bg-fg/10"
                    }`}
                  >
                    + {ex}
                  </button>
                ))}
              </div>

              <form onSubmit={add} className="mt-6 grid grid-cols-3 gap-3">
                <div className="col-span-3">
                  <label htmlFor="exercise" className="label">Exercise</label>
                  <input id="exercise" list="exercise-list" className="input" placeholder="e.g. Bench Press" value={form.exercise} onChange={set("exercise")} maxLength={80} required />
                  <datalist id="exercise-list">
                    {allExercises.map((ex) => (
                      <option key={ex} value={ex} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label htmlFor="sets" className="label">Sets</label>
                  <input id="sets" type="number" inputMode="numeric" min={1} max={20} className="input" value={form.sets} onChange={set("sets")} />
                </div>
                <div>
                  <label htmlFor="reps" className="label">Reps</label>
                  <input id="reps" className="input" placeholder="8-12" value={form.reps} onChange={set("reps")} maxLength={20} />
                </div>
                <div>
                  <label htmlFor="weight" className="label">Weight</label>
                  <input id="weight" className="input" placeholder="20 kg" value={form.weight} onChange={set("weight")} maxLength={20} />
                </div>
                <div className="col-span-3">
                  <label htmlFor="notes" className="label">Notes (optional)</label>
                  <input id="notes" className="input" placeholder="e.g. slow negatives" value={form.notes} onChange={set("notes")} maxLength={200} />
                </div>
                <button type="submit" className="btn-primary col-span-3">
                  <Plus className="h-4 w-4" /> Add to {DAYS[day]}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
