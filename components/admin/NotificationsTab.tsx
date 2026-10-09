"use client";
import { useState } from "react";
import { Loader2, Megaphone, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/format";
import type { Notification } from "@/lib/types";

type Props = {
  notifications: Notification[];
  setNotifications: (n: Notification[]) => void;
};

export default function NotificationsTab({ notifications, setNotifications }: Props) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSent(false);
    const { data, error } = await createClient()
      .from("notifications")
      .insert({ title: title.trim(), body: body.trim() || null })
      .select()
      .single();
    setBusy(false);
    if (error) return setError(error.message);
    setNotifications([data as Notification, ...notifications]);
    setTitle("");
    setBody("");
    setSent(true);
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this announcement for everyone?")) return;
    const { error } = await createClient().from("notifications").delete().eq("id", id);
    if (error) return setError(error.message);
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <form onSubmit={send} className="card self-start p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <Megaphone className="h-5 w-5 text-brand-red" />
          <h2 className="font-display text-3xl tracking-wide">Send Announcement</h2>
        </div>
        <p className="mt-2 text-sm text-fg/60">
          Everyone on the website gets a pop-up right away, and all visitors
          see it in the notification bell.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="n-title" className="label">Title</label>
            <input
              id="n-title"
              className="input"
              placeholder="e.g. Gym closed on Sunday"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              required
            />
          </div>
          <div>
            <label htmlFor="n-body" className="label">Message (optional)</label>
            <textarea
              id="n-body"
              rows={4}
              className="input resize-y"
              placeholder="Add details…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={500}
            />
          </div>
          {error && <p className="text-sm text-brand-red">{error}</p>}
          {sent && <p className="text-sm text-emerald-500">Announcement sent.</p>}
          <button type="submit" disabled={busy || !title.trim()} className="btn-primary w-full">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
            Send Announcement
          </button>
        </div>
      </form>

      <div>
        <p className="label">Sent announcements</p>
        {notifications.length === 0 ? (
          <p className="border border-dashed border-brand-line px-4 py-12 text-center text-sm text-brand-muted">
            Nothing sent yet.
          </p>
        ) : (
          <ul className="divide-y divide-brand-line border border-brand-line">
            {notifications.map((n) => (
              <li key={n.id} className="flex items-start gap-3 bg-brand-card px-4 py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{n.title}</p>
                  {n.body && <p className="mt-1 whitespace-pre-line text-sm text-fg/70">{n.body}</p>}
                  <p className="mt-1.5 text-[11px] uppercase tracking-wider text-brand-muted" suppressHydrationWarning>
                    {timeAgo(n.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => remove(n.id)}
                  className="p-2 text-brand-muted transition hover:text-brand-red"
                  aria-label={`Delete ${n.title}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
