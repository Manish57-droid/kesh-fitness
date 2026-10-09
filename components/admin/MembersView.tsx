"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Database, MapPin, MessageCircle, Pencil, Phone, Plus, Search, Trash2, UserX, UserCheck } from "lucide-react";
import MemberForm from "./MemberForm";
import { whatsappLink } from "./MessagesView";
import { createClient } from "@/lib/supabase/client";
import { addMonths, daysBetween, formatDay, todayISO } from "@/lib/format";
import { pricing, rupees } from "@/lib/site";
import type { JoinRequest, Member } from "@/lib/types";

type Filter = "active" | "due" | "inactive" | "all";

type Props = {
  initial: Member[];
  fromRequest: JoinRequest | null;
  tableMissing: boolean;
};

export default function MembersView({ initial, fromRequest, tableMissing }: Props) {
  const router = useRouter();
  const [members, setMembers] = useState(initial);
  const [filter, setFilter] = useState<Filter>("active");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Member | "new" | null>(fromRequest ? "new" : null);
  const [error, setError] = useState("");
  // Fee status depends on the viewer's date, so it's only computed in the browser.
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => setToday(todayISO()), []);

  if (tableMissing) {
    return (
      <div className="card flex flex-col items-center p-8 text-center">
        <Database className="h-10 w-10 text-brand-red" strokeWidth={1.5} />
        <p className="mt-4 font-display text-2xl tracking-wide">Members table not set up yet</p>
        <p className="mt-2 max-w-md text-sm text-fg/70">
          Run <code className="text-brand-red">supabase/migrations/002_members.sql</code> in the Supabase SQL Editor, then
          refresh this page.
        </p>
      </div>
    );
  }

  /** Days until fees are due (negative = overdue), or null if not tracked. */
  const dueIn = (m: Member) => (today && m.paid_until ? daysBetween(today, m.paid_until) : null);
  const isDue = (m: Member) => {
    const d = dueIn(m);
    return d !== null && d < 0;
  };

  const active = members.filter((m) => m.is_active);
  const counts = {
    active: active.length,
    due: active.filter(isDue).length,
    inactive: members.length - active.length,
    all: members.length,
  };

  const q = query.trim().toLowerCase();
  const shown = members.filter((m) => {
    const byFilter =
      filter === "all" ||
      (filter === "active" && m.is_active) ||
      (filter === "inactive" && !m.is_active) ||
      (filter === "due" && m.is_active && isDue(m));
    const byQuery =
      !q || m.name.toLowerCase().includes(q) || m.phone.includes(q) || m.address.toLowerCase().includes(q);
    return byFilter && byQuery;
  });

  const replace = (saved: Member) => {
    const exists = members.some((m) => m.id === saved.id);
    const next = exists ? members.map((m) => (m.id === saved.id ? saved : m)) : [...members, saved];
    setMembers(next.sort((a, b) => a.name.localeCompare(b.name)));
  };

  const patch = async (m: Member, changes: Partial<Member>) => {
    setError("");
    const { data, error } = await createClient().from("members").update(changes).eq("id", m.id).select().single();
    if (error) return setError(error.message);
    replace(data as Member);
  };

  // Extends fees by one month from the later of today and the current paid-until date.
  const addMonthPaid = (m: Member) => {
    const base = today && (!m.paid_until || m.paid_until < today) ? today : m.paid_until ?? todayISO();
    patch(m, { paid_until: addMonths(base, 1) });
  };

  const remove = async (m: Member) => {
    if (!confirm(`Delete ${m.name}? To keep their record, mark them inactive instead.`)) return;
    setError("");
    const { error } = await createClient().from("members").delete().eq("id", m.id);
    if (error) return setError(error.message);
    setMembers(members.filter((x) => x.id !== m.id));
  };

  const closeForm = () => {
    setEditing(null);
    // Drop ?from=… so a refresh doesn't reopen the pre-filled form.
    if (fromRequest) router.replace("/admin/members");
  };

  const feeBadge = (m: Member) => {
    const d = dueIn(m);
    if (d === null) return null;
    if (d < 0) return <span className="bg-brand-red px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">Fees due · {-d}d late</span>;
    if (d <= 5) return <span className="bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">Due in {d}d</span>;
    return <span className="bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">Paid</span>;
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Active", value: counts.active },
          { label: "Fees due", value: counts.due, red: counts.due > 0 },
          { label: "Inactive", value: counts.inactive },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <p className={`font-display text-4xl leading-none ${s.red ? "text-brand-red" : ""}`}>{s.value}</p>
            <p className="mt-1 text-[11px] uppercase tracking-wider text-brand-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {(["active", "due", "inactive", "all"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 border px-3 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                filter === f ? "border-brand-red text-brand-red" : "border-brand-line text-fg/60 hover:text-fg"
              }`}
            >
              {f === "due" ? "Fees due" : f} · {counts[f]}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
            <input className="input pl-9" placeholder="Search name, phone, address" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <button onClick={() => setEditing("new")} className="btn-primary">
            <Plus className="h-4 w-4" /> Add Member
          </button>
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-brand-red">{error}</p>}

      {shown.length === 0 ? (
        <p className="mt-6 border border-dashed border-brand-line px-4 py-12 text-center text-sm text-brand-muted">
          {members.length === 0 ? "No members yet. Add your first one." : "No members match."}
        </p>
      ) : (
        <ul className="mt-4 grid gap-3 lg:grid-cols-2">
          {shown.map((m) => {
            const plan = pricing.plans.find((p) => p.id === m.plan);
            const extras = [
              plan && `${plan.name} · ${rupees(plan.monthly)}/mo`,
              m.age && `${m.age} yrs`,
              m.gender && m.gender[0].toUpperCase() + m.gender.slice(1),
              `Joined ${formatDay(m.joined_on)}`,
              m.paid_until && `Paid till ${formatDay(m.paid_until)}`,
            ].filter(Boolean);

            return (
              <li key={m.id} className={`card flex flex-col p-4 sm:p-5 ${m.is_active ? "" : "opacity-60"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold">{m.name}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {!m.is_active && (
                        <span className="bg-fg/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">Inactive</span>
                      )}
                      {m.is_active && feeBadge(m)}
                    </div>
                  </div>
                  <div className="-mr-2 -mt-1 flex">
                    <button onClick={() => setEditing(m)} className="p-2 text-brand-muted hover:text-fg" aria-label={`Edit ${m.name}`}>
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => remove(m)} className="p-2 text-brand-muted hover:text-brand-red" aria-label={`Delete ${m.name}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="mt-3 flex items-start gap-2 text-sm text-fg/80">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-red" /> <span className="break-words">{m.address}</span>
                </p>
                <p className="mt-2 text-xs text-brand-muted">{extras.join(" · ")}</p>
                {m.email && <p className="mt-1 truncate text-xs text-brand-muted">{m.email}</p>}
                {m.emergency_contact && (
                  <p className="mt-1 text-xs text-brand-muted">Emergency: {m.emergency_contact}</p>
                )}
                {m.notes && (
                  <p className="mt-3 whitespace-pre-line break-words border-l-2 border-amber-500 bg-fg/5 px-3 py-2 text-sm">{m.notes}</p>
                )}

                <div className="mt-4 flex flex-wrap gap-2 border-t border-brand-line pt-4">
                  <a href={`tel:${m.phone.replace(/\s/g, "")}`} className="btn-ghost btn-sm">
                    <Phone className="h-3.5 w-3.5" /> {m.phone}
                  </a>
                  <a href={whatsappLink(m.phone)} target="_blank" rel="noreferrer" className="btn-ghost btn-sm">
                    <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                  </a>
                  {m.is_active && (
                    <button onClick={() => addMonthPaid(m)} className="btn-ghost btn-sm" title="Extend fees paid by one month">
                      <CalendarPlus className="h-3.5 w-3.5" /> +1 month paid
                    </button>
                  )}
                  <button onClick={() => patch(m, { is_active: !m.is_active })} className="btn-ghost btn-sm">
                    {m.is_active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                    {m.is_active ? "Mark inactive" : "Mark active"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <MemberForm
          member={editing === "new" ? null : editing}
          fromRequest={editing === "new" ? fromRequest : null}
          onClose={closeForm}
          onSaved={(saved) => {
            replace(saved);
            closeForm();
          }}
        />
      )}
    </div>
  );
}
