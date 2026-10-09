"use client";
import { useState } from "react";
import Link from "next/link";
import { Mail, MessageCircle, Phone, Search, Trash2, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate, timeAgo } from "@/lib/format";
import { pricing, rupees } from "@/lib/site";
import { whatsappLink } from "./MessagesView";
import type { JoinRequest, JoinStatus } from "@/lib/types";

const statuses: { id: JoinStatus; label: string; className: string }[] = [
  { id: "new", label: "New", className: "bg-brand-red text-white" },
  { id: "contacted", label: "Contacted", className: "bg-amber-500 text-black" },
  { id: "joined", label: "Joined", className: "bg-emerald-600 text-white" },
  { id: "not_interested", label: "Not interested", className: "bg-fg/15 text-fg" },
];

type Props = {
  initial: JoinRequest[];
};

export default function JoinRequestsView({ initial }: Props) {
  const [requests, setRequests] = useState(initial);
  const [filter, setFilter] = useState<JoinStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  const q = query.trim().toLowerCase();
  const shown = requests.filter(
    (r) =>
      (filter === "all" || r.status === filter) &&
      (!q || r.name.toLowerCase().includes(q) || r.phone.includes(q) || r.area?.toLowerCase().includes(q))
  );

  const setStatus = async (id: number, status: JoinStatus) => {
    setError("");
    const { error } = await createClient().from("join_requests").update({ status }).eq("id", id);
    if (error) return setError(error.message);
    setRequests(requests.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this join request?")) return;
    const { error } = await createClient().from("join_requests").delete().eq("id", id);
    if (error) return setError(error.message);
    setRequests(requests.filter((r) => r.id !== id));
  };

  const count = (s: JoinStatus) => requests.filter((r) => r.status === s).length;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {[{ id: "all" as const, label: "All", n: requests.length }, ...statuses.map((s) => ({ ...s, n: count(s.id) }))].map(
            (f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`shrink-0 border px-3 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                  filter === f.id ? "border-brand-red text-brand-red" : "border-brand-line text-fg/60 hover:text-fg"
                }`}
              >
                {f.label} · {f.n}
              </button>
            )
          )}
        </div>
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
          <input className="input pl-9" placeholder="Search name, phone, area" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-brand-red">{error}</p>}

      {shown.length === 0 ? (
        <p className="mt-6 border border-dashed border-brand-line px-4 py-12 text-center text-sm text-brand-muted">
          No join requests here.
        </p>
      ) : (
        <ul className="mt-4 grid gap-3 lg:grid-cols-2">
          {shown.map((r) => {
            const plan = pricing.plans.find((p) => p.id === r.plan);
            const details = [
              ["Plan", plan ? `${plan.name} · ${rupees(plan.monthly)}/mo` : r.plan],
              ["Age", r.age],
              ["Gender", r.gender && r.gender[0].toUpperCase() + r.gender.slice(1)],
              ["Timing", r.timing && r.timing[0].toUpperCase() + r.timing.slice(1)],
              ["Goal", r.goal],
              ["Area", r.area],
            ].filter(([, v]) => v) as [string, string | number][];

            return (
              <li key={r.id} className={`card flex flex-col p-4 sm:p-5 ${r.status === "new" ? "border-l-4 border-l-brand-red" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold">{r.name}</p>
                    <p className="text-[11px] uppercase tracking-wider text-brand-muted" suppressHydrationWarning>
                      {timeAgo(r.created_at)} · {formatDate(r.created_at)}
                    </p>
                  </div>
                  <button
                    onClick={() => remove(r.id)}
                    className="-mr-2 -mt-1 p-2 text-brand-muted transition hover:text-brand-red"
                    aria-label={`Delete request from ${r.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {details.map(([k, v]) => (
                    <div key={k} className="min-w-0">
                      <dt className="text-[11px] uppercase tracking-wider text-brand-muted">{k}</dt>
                      <dd className="truncate">{v}</dd>
                    </div>
                  ))}
                </dl>
                {r.notes && (
                  <p className="mt-3 whitespace-pre-line break-words border-l-2 border-amber-500 bg-fg/5 px-3 py-2 text-sm">
                    {r.notes}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <a href={`tel:${r.phone.replace(/\s/g, "")}`} className="btn-ghost btn-sm">
                    <Phone className="h-3.5 w-3.5" /> {r.phone}
                  </a>
                  <a href={whatsappLink(r.phone)} target="_blank" rel="noreferrer" className="btn-ghost btn-sm">
                    <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                  </a>
                  {r.email && (
                    <a href={`mailto:${r.email}`} className="btn-ghost btn-sm">
                      <Mail className="h-3.5 w-3.5" /> Email
                    </a>
                  )}
                  {r.status !== "joined" && r.status !== "not_interested" && (
                    <Link href={`/admin/members?from=${r.id}`} className="btn-primary btn-sm">
                      <UserPlus className="h-3.5 w-3.5" /> Add as member
                    </Link>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-1.5 border-t border-brand-line pt-4 sm:grid-cols-4">
                  {statuses.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStatus(r.id, s.id)}
                      aria-pressed={r.status === s.id}
                      className={`min-h-[40px] px-2 text-[11px] font-semibold uppercase tracking-wider transition ${
                        r.status === s.id ? s.className : "border border-brand-line text-fg/60 hover:text-fg"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
