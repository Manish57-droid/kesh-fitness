"use client";
import { useState } from "react";
import { Bell, Inbox, Mail, Megaphone, Reply } from "lucide-react";
import MessagesTab from "./MessagesTab";
import NotificationsTab from "./NotificationsTab";
import type { Message, Notification } from "@/lib/types";

type Tab = "messages" | "notifications";

type Props = {
  initialMessages: Message[];
  initialNotifications: Notification[];
};

export default function AdminPanel({ initialMessages, initialNotifications }: Props) {
  const [tab, setTab] = useState<Tab>("messages");
  const [messages, setMessages] = useState(initialMessages);
  const [notifications, setNotifications] = useState(initialNotifications);

  const unread = messages.filter((m) => !m.is_read).length;
  const stats = [
    { icon: Inbox, label: "Total messages", value: messages.length },
    { icon: Mail, label: "Unread", value: unread },
    { icon: Reply, label: "Awaiting reply", value: messages.filter((m) => !m.reply).length },
    { icon: Megaphone, label: "Announcements", value: notifications.length },
  ];

  const tabs: { id: Tab; label: string; icon: typeof Bell; count?: number }[] = [
    { id: "messages", label: "Messages", icon: Inbox, count: unread || undefined },
    { id: "notifications", label: "Announcements", icon: Bell },
  ];

  return (
    <div className="mt-8 md:mt-10">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="card p-4 sm:p-6">
            <Icon className="h-5 w-5 text-brand-red" />
            <p className="mt-3 font-display text-4xl leading-none sm:mt-4 sm:text-5xl">{value}</p>
            <p className="mt-1 text-[11px] uppercase tracking-wider text-brand-muted sm:text-xs">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-2 border-b border-brand-line sm:flex sm:gap-6 md:mt-10">
        {tabs.map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center justify-center gap-2 border-b-2 pb-3 text-sm font-semibold uppercase tracking-wider transition sm:justify-start ${
              tab === id ? "border-brand-red text-fg" : "border-transparent text-brand-muted hover:text-fg"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            {count !== undefined && (
              <span className="rounded-full bg-brand-red px-2 py-0.5 text-[10px] text-white">{count}</span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "messages" && <MessagesTab messages={messages} setMessages={setMessages} />}
        {tab === "notifications" && (
          <NotificationsTab notifications={notifications} setNotifications={setNotifications} />
        )}
      </div>
    </div>
  );
}
