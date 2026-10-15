"use client";
import { useEffect, useState } from "react";
import { Check, Loader2, MessageCircle, Phone, Reply, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/format";
import type { Message } from "@/lib/types";

type Filter = "all" | "unread" | "unreplied";

type Props = {
  initial: Message[];
};

/** wa.me needs digits only; assume India (+91) for 10-digit numbers. */
export const whatsappLink = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits.length === 10 ? `91${digits}` : digits}`;
};

export default function MessagesView({ initial }: Props) {
  const [messages, setMessages] = useState(initial);

  // Fresh data from a background refresh (RefreshIfStale) replaces the list.
  useEffect(() => setMessages(initial), [initial]);
  const [filter, setFilter] = useState<Filter>("all");
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState("");

  const shown = messages.filter((m) =>
    filter === "unread" ? !m.is_read : filter === "unreplied" ? !m.reply : true
  );

  const update = async (id: number, patch: Partial<Message>) => {
    setBusy(id);
    setError("");
    const { error } = await createClient().from("messages").update(patch).eq("id", id);
    setBusy(null);
    if (error) {
      setError(error.message);
      return false;
    }
    setMessages(messages.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    return true;
  };

  const sendReply = async (id: number) => {
    const reply = drafts[id]?.trim();
    if (!reply) return;
    if (await update(id, { reply, replied_at: new Date().toISOString(), is_read: true })) {
      setDrafts((d) => ({ ...d, [id]: "" }));
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this message?")) return;
    const { error } = await createClient().from("messages").delete().eq("id", id);
    if (error) return setError(error.message);
    setMessages(messages.filter((m) => m.id !== id));
  };

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto">
        {(["all", "unread", "unreplied"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 border px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
              filter === f ? "border-brand-red text-brand-red" : "border-brand-line text-fg/60 hover:text-fg"
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      {error && <p className="mt-3 text-sm text-brand-red">{error}</p>}

      {shown.length === 0 ? (
        <p className="mt-6 border border-dashed border-brand-line px-4 py-12 text-center text-sm text-brand-muted">
          No messages here.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {shown.map((m) => (
            <li key={m.id} className={`card p-4 sm:p-6 ${m.is_read ? "" : "border-l-4 border-l-brand-red"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{m.name}</p>
                  <p className="text-[11px] uppercase tracking-wider text-brand-muted" suppressHydrationWarning>
                    {timeAgo(m.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => remove(m.id)}
                  className="-mr-2 -mt-1 p-2 text-brand-muted transition hover:text-brand-red"
                  aria-label={`Delete message from ${m.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <p className="mt-3 whitespace-pre-line break-words text-sm">{m.body}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {m.phone && (
                  <>
                    <a href={`tel:${m.phone.replace(/\s/g, "")}`} className="btn-ghost btn-sm">
                      <Phone className="h-3.5 w-3.5" /> {m.phone}
                    </a>
                    <a href={whatsappLink(m.phone)} target="_blank" rel="noreferrer" className="btn-ghost btn-sm">
                      <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                    </a>
                  </>
                )}
                {!m.is_read && (
                  <button onClick={() => update(m.id, { is_read: true })} disabled={busy === m.id} className="btn-ghost btn-sm">
                    <Check className="h-3.5 w-3.5" /> Mark read
                  </button>
                )}
              </div>

              {m.reply ? (
                <div className="mt-4 border-l-2 border-brand-red bg-fg/5 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-red">
                    Your reply · <span suppressHydrationWarning>{timeAgo(m.replied_at)}</span>
                  </p>
                  <p className="mt-1 whitespace-pre-line break-words text-sm text-fg/80">{m.reply}</p>
                </div>
              ) : (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <textarea
                    rows={2}
                    className="input flex-1 resize-y"
                    placeholder="Write a reply (shown to them on the website)…"
                    value={drafts[m.id] ?? ""}
                    onChange={(e) => setDrafts((d) => ({ ...d, [m.id]: e.target.value }))}
                    maxLength={1000}
                  />
                  <button
                    onClick={() => sendReply(m.id)}
                    disabled={busy === m.id || !drafts[m.id]?.trim()}
                    className="btn-primary btn-sm sm:self-end"
                  >
                    {busy === m.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Reply className="h-3.5 w-3.5" />}
                    Reply
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
