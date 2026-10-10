"use client";
import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { todayISO } from "@/lib/format";
import type { PlanContent } from "@/lib/content";
import type { JoinRequest, Member } from "@/lib/types";

type Props = {
  member: Member | null; // null = adding
  fromRequest?: JoinRequest | null; // pre-fill from a join request
  onClose: () => void;
  onSaved: (m: Member) => void;
  plans: PlanContent[];
};

export default function MemberForm({ member, fromRequest, onClose, onSaved, plans }: Props) {
  const src = member ?? fromRequest;
  const [form, setForm] = useState({
    name: src?.name ?? "",
    phone: src?.phone ?? "",
    address: member?.address ?? fromRequest?.area ?? "",
    email: src?.email ?? "",
    age: src?.age?.toString() ?? "",
    gender: src?.gender ?? "",
    plan: src?.plan ?? "",
    joined_on: member?.joined_on ?? todayISO(),
    paid_until: member?.paid_until ?? "",
    emergency_contact: member?.emergency_contact ?? "",
    notes: member?.notes ?? fromRequest?.notes ?? "",
    is_active: member?.is_active ?? true,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const row = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      email: form.email.trim() || null,
      age: form.age ? Number(form.age) : null,
      gender: form.gender || null,
      plan: form.plan || null,
      joined_on: form.joined_on || todayISO(),
      paid_until: form.paid_until || null,
      emergency_contact: form.emergency_contact.trim() || null,
      notes: form.notes.trim() || null,
      is_active: form.is_active,
      ...(member ? {} : { join_request_id: fromRequest?.id ?? null }),
    };

    const supabase = createClient();
    const query = member
      ? supabase.from("members").update(row).eq("id", member.id)
      : supabase.from("members").insert(row);
    const { data, error } = await query.select().single();
    if (error) {
      setBusy(false);
      return setError(error.message);
    }
    // Adding someone from a join request marks that request as joined.
    if (!member && fromRequest) {
      await supabase.from("join_requests").update({ status: "joined" }).eq("id", fromRequest.id);
    }
    setBusy(false);
    onSaved(data as Member);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 sm:items-center sm:p-4" onClick={onClose}>
      <form
        onSubmit={save}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92svh] w-full flex-col border border-brand-line bg-brand-card sm:max-w-2xl"
      >
        <div className="flex items-center justify-between border-b border-brand-line px-4 py-3 sm:px-6">
          <h2 className="font-display text-2xl tracking-wide">{member ? "Edit Member" : "Add Member"}</h2>
          <button type="button" onClick={onClose} className="-mr-2 p-2 text-brand-muted hover:text-fg" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
          {fromRequest && !member && (
            <p className="border-l-2 border-brand-red bg-fg/5 px-3 py-2 text-xs text-fg/80">
              Filled in from {fromRequest.name}&apos;s join request. It will be marked as Joined when you save.
            </p>
          )}

          <fieldset className="grid gap-3 sm:grid-cols-2">
            <legend className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-red">Required</legend>
            <div className="sm:col-span-2">
              <label htmlFor="m-name" className="label">Full name *</label>
              <input id="m-name" className="input" value={form.name} onChange={set("name")} required maxLength={60} />
            </div>
            <div>
              <label htmlFor="m-phone" className="label">Phone *</label>
              <input id="m-phone" type="tel" inputMode="tel" className="input" value={form.phone} onChange={set("phone")} required pattern="[0-9+\s\-]{10,15}" title="10–15 digits" maxLength={15} />
            </div>
            <div>
              <label htmlFor="m-address" className="label">Address *</label>
              <input id="m-address" className="input" value={form.address} onChange={set("address")} required maxLength={200} placeholder="House, street, area" />
            </div>
          </fieldset>

          <fieldset className="grid gap-3 sm:grid-cols-2">
            <legend className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-muted">Membership (optional)</legend>
            <div>
              <label htmlFor="m-plan" className="label">Plan</label>
              <select id="m-plan" className="input" value={form.plan} onChange={set("plan")}>
                <option value="">Not set</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} (₹{p.monthly}/mo)</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="m-joined" className="label">Joined on</label>
              <input id="m-joined" type="date" className="input" value={form.joined_on} onChange={set("joined_on")} />
            </div>
            <div>
              <label htmlFor="m-paid" className="label">Fees paid until</label>
              <input id="m-paid" type="date" className="input" value={form.paid_until} onChange={set("paid_until")} />
            </div>
            <label className="flex cursor-pointer items-center gap-3 self-end border border-brand-line p-3">
              <input type="checkbox" checked={form.is_active} onChange={set("is_active")} className="h-5 w-5 accent-[#E11D2A]" />
              <span className="text-sm font-semibold">Active member</span>
            </label>
          </fieldset>

          <fieldset className="grid gap-3 sm:grid-cols-2">
            <legend className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-muted">Other details (optional)</legend>
            <div>
              <label htmlFor="m-email" className="label">Email</label>
              <input id="m-email" type="email" className="input" value={form.email} onChange={set("email")} maxLength={100} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="m-age" className="label">Age</label>
                <input id="m-age" type="number" inputMode="numeric" min={10} max={90} className="input" value={form.age} onChange={set("age")} />
              </div>
              <div>
                <label htmlFor="m-gender" className="label">Gender</label>
                <select id="m-gender" className="input" value={form.gender} onChange={set("gender")}>
                  <option value="">–</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="m-emergency" className="label">Emergency contact</label>
              <input id="m-emergency" className="input" value={form.emergency_contact} onChange={set("emergency_contact")} maxLength={60} placeholder="Name and phone" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="m-notes" className="label">Notes</label>
              <textarea id="m-notes" rows={3} className="input resize-y" value={form.notes} onChange={set("notes")} maxLength={500} placeholder="Health issues, goals, anything else" />
            </div>
          </fieldset>

          {error && <p className="text-sm text-brand-red">{error}</p>}
        </div>

        <div className="flex gap-3 border-t border-brand-line p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-6 sm:pb-4">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">
            Cancel
          </button>
          <button type="submit" disabled={busy} className="btn-primary flex-1">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {member ? "Save Changes" : "Add Member"}
          </button>
        </div>
      </form>
    </div>
  );
}
