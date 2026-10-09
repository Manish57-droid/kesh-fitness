export type Role = "user" | "admin";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: Role;
  created_at: string;
};

/** A planner entry, stored in the visitor's browser. */
export type Workout = {
  id: string;
  day: number; // 0 = Monday … 6 = Sunday
  exercise: string;
  sets: number | null;
  reps: string | null;
  weight: string | null;
  notes: string | null;
};

/** A visitor's message as the admin sees it. */
export type Message = {
  id: number;
  name: string;
  phone: string | null;
  body: string;
  is_read: boolean;
  reply: string | null;
  replied_at: string | null;
  created_at: string;
};

/** A visitor's own message as returned by get_my_messages. */
export type MyMessage = Pick<Message, "id" | "body" | "is_read" | "reply" | "replied_at" | "created_at">;

export type Notification = {
  id: number;
  title: string;
  body: string | null;
  created_by: string | null;
  created_at: string;
};
