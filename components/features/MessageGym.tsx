"use client";
import { useEffect, useState } from "react";
import { Instagram, Loader2, MessageCircle, Phone, Send } from "lucide-react";
import DumbbellArt from "../DumbbellArt";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { PREFILL_MESSAGE_EVENT } from "@/lib/events";
import { KEYS, readJSON, writeJSON } from "@/lib/storage";
import { timeAgo } from "@/lib/format";
import { site } from "@/lib/site";
import type { MyMessage } from "@/lib/types";

export default function MessageGym() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [mine, setMine] = useState<MyMessage[]>([]);

  // Show this visitor's earlier messages (and any replies) using tokens saved on their phone.
  useEffect(() => {
    const tokens = readJSON<string[]>(KEYS.messageTokens, []);
    if (!isSupabaseConfigured || tokens.length === 0) return;
    createClient()
      .rpc("get_my_messages", { p_tokens: tokens })
      .then(({ data }) => setMine((data as MyMessage[]) ?? []));
  }, []);

  // "Order" buttons in the Shop pre-fill the message.
  useEffect(() => {
    const onPrefill = (e: Event) => {
      setBody((e as CustomEvent<string>).detail);
      setSent(false);
    };
    window.addEventListener(PREFILL_MESSAGE_EVENT, onPrefill);
    return () => window.removeEventListener(PREFILL_MESSAGE_EVENT, onPrefill);
  }, []);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) return setError("Messaging isn't set up yet. Please reach us on Instagram.");
    setBusy(true);
    setError("");
    setSent(false);
    const { data, error } = await createClient()
      .rpc("send_message", { p_name: name, p_phone: phone, p_body: body })
      .single<{ id: number; token: string }>();
    setBusy(false);
    if (error || !data) return setError("Couldn't send your message. Please try again.");

    const tokens = readJSON<string[]>(KEYS.messageTokens, []);
    writeJSON(KEYS.messageTokens, [data.token, ...tokens].slice(0, 50));
    setMine([
      { id: data.id, body: body.trim(), is_read: false, reply: null, replied_at: null, created_at: new Date().toISOString() },
      ...mine,
    ]);
    setBody("");
    setSent(true);
  };

  const quick = [
    site.phone && { href: `tel:${site.phone.replace(/\s/g, "")}`, label: "Call", Icon: Phone },
    site.whatsapp && { href: `https://wa.me/${site.whatsapp}`, label: "WhatsApp", Icon: MessageCircle },
    { href: site.instagramDM, label: "Instagram", Icon: Instagram },
  ].filter(Boolean) as { href: string; label: string; Icon: typeof Phone }[];

  return (
    <section id="contact" className="section bg-dumbbells scroll-mt-16 bg-brand-ink">
      <div className="container-x grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
        <div>
          <p className="eyebrow">Get in Touch</p>
          <h2 className="heading mt-5">
            Message the <span className="text-brand-red">Gym</span>
          </h2>
          <p className="mt-5 max-w-md text-fg/70">
            Questions about plans, timings, diet or training? Send us a message. We&apos;ll reply right here
            on the website, or call you back if you leave your number.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {quick.map(({ href, label, Icon }) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" className="btn-ghost btn-sm">
                <Icon className="h-4 w-4" /> {label}
              </a>
            ))}
          </div>
          <DumbbellArt className="mt-16 hidden w-72 rotate-[16deg] text-brand-red/20 lg:block" />
        </div>

        <div>
          <form onSubmit={send} className="card space-y-4 p-4 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="m-name" className="label">Your name</label>
                <input id="m-name" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required autoComplete="name" />
              </div>
              <div>
                <label htmlFor="m-phone" className="label">Phone (optional)</label>
                <input id="m-phone" type="tel" inputMode="tel" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} autoComplete="tel" placeholder="For a call back" />
              </div>
            </div>
            <div>
              <label htmlFor="m-body" className="label">Message</label>
              <textarea id="m-body" rows={4} className="input resize-y" value={body} onChange={(e) => setBody(e.target.value)} maxLength={1000} required placeholder="Type your question…" />
            </div>
            {error && <p className="text-sm text-brand-red">{error}</p>}
            {sent && <p className="text-sm text-emerald-500">Message sent! Check back here for our reply.</p>}
            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send Message
            </button>
          </form>

          {mine.length > 0 && (
            <div className="mt-6">
              <p className="label">Your messages</p>
              <ul className="space-y-3">
                {mine.map((m) => (
                  <li key={m.id} className="card p-4">
                    <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-wider">
                      <span className="text-brand-muted">{timeAgo(m.created_at)}</span>
                      <span className={m.reply ? "text-emerald-500" : "text-brand-muted"}>
                        {m.reply ? "Replied" : m.is_read ? "Seen" : "Sent"}
                      </span>
                    </div>
                    <p className="mt-1.5 whitespace-pre-line break-words text-sm">{m.body}</p>
                    {m.reply && (
                      <div className="mt-3 border-l-2 border-brand-red bg-fg/5 px-3 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-red">{site.name}</p>
                        <p className="mt-1 whitespace-pre-line break-words text-sm text-fg/80">{m.reply}</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
