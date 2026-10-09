"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { KEYS, readJSON, writeJSON } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/format";
import { useClickOutside } from "@/lib/useClickOutside";
import type { Notification } from "@/lib/types";

export default function NotificationBell() {
  const [items, setItems] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<Set<number>>(new Set());
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<Notification | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, open, close);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    setReadIds(new Set(readJSON<number[]>(KEYS.readNotifications, [])));

    supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setItems((data as Notification[]) ?? []));

    // New announcements arrive live while the visitor is on the site.
    const channel = supabase
      .channel("notifications-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (payload) => {
        const n = payload.new as Notification;
        setItems((prev) => [n, ...prev.filter((p) => p.id !== n.id)].slice(0, 20));
        setToast(n);
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "notifications" }, (payload) => {
        const id = (payload.old as { id: number }).id;
        setItems((prev) => prev.filter((p) => p.id !== id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 7000);
    return () => clearTimeout(t);
  }, [toast]);

  const unread = items.filter((n) => !readIds.has(n.id));

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && unread.length) {
      // Keep only ids still in the feed so storage doesn't grow forever.
      const ids = items.map((n) => n.id);
      setReadIds(new Set(ids));
      writeJSON(KEYS.readNotifications, ids);
    }
  };

  if (!isSupabaseConfigured) return null;

  return (
    <>
      <div ref={ref} className="relative">
        <button onClick={toggle} className="icon-btn" aria-label={`Notifications (${unread.length} unread)`}>
          <Bell className="h-4 w-4" />
          {unread.length > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-red px-1 text-[10px] font-bold text-white">
              {unread.length > 9 ? "9+" : unread.length}
            </span>
          )}
        </button>

        {open && (
          <div className="fixed inset-x-4 top-20 border border-brand-line bg-brand-card shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80">
            <p className="border-b border-brand-line px-4 py-3 font-display text-xl tracking-wide">Notifications</p>
            <ul className="max-h-96 divide-y divide-brand-line overflow-y-auto">
              {items.length === 0 && (
                <li className="px-4 py-8 text-center text-sm text-brand-muted">No notifications yet.</li>
              )}
              {items.map((n) => (
                <li key={n.id} className="px-4 py-3">
                  <p className="text-sm font-semibold">{n.title}</p>
                  {n.body && <p className="mt-1 whitespace-pre-line text-sm text-fg/70">{n.body}</p>}
                  <p className="mt-1.5 text-[11px] uppercase tracking-wider text-brand-muted">
                    {timeAgo(n.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {toast && (
        <div
          role="status"
          className="fixed bottom-20 right-4 z-[60] lg:bottom-4 w-[calc(100%-2rem)] max-w-sm animate-fade-up border-l-4 border-brand-red bg-brand-card p-4 shadow-2xl"
        >
          <div className="flex items-start gap-3">
            <Bell className="mt-0.5 h-4 w-4 shrink-0 text-brand-red" />
            <div className="flex-1">
              <p className="text-sm font-semibold">{toast.title}</p>
              {toast.body && <p className="mt-1 line-clamp-3 text-sm text-fg/70">{toast.body}</p>}
            </div>
            <button onClick={() => setToast(null)} aria-label="Dismiss" className="text-brand-muted hover:text-fg">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
