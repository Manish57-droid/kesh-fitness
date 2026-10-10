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

export type JoinStatus = "new" | "contacted" | "joined" | "not_interested";

/** A membership sign-up from the join form. */
export type JoinRequest = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  age: number | null;
  gender: "male" | "female" | "other" | null;
  plan: "gym" | "cardio";
  timing: "morning" | "evening" | null;
  goal: string | null;
  area: string | null;
  notes: string | null;
  status: JoinStatus;
  created_at: string;
};

/** A shop product. Prices are whole rupees. */
export type Product = {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  mrp: number | null;
  image_url: string | null;
  in_stock: boolean;
  quantity: number; // units in stock (migration 003)
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

/** A gym member, managed by the admin. Dates are "YYYY-MM-DD". */
export type Member = {
  id: number;
  name: string;
  phone: string;
  address: string;
  email: string | null;
  age: number | null;
  gender: "male" | "female" | "other" | null;
  plan: "gym" | "cardio" | null;
  joined_on: string;
  paid_until: string | null;
  emergency_contact: string | null;
  notes: string | null;
  is_active: boolean;
  join_request_id: number | null;
  created_at: string;
  updated_at: string;
};
