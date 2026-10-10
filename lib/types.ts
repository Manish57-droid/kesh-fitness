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
  plan: "gym" | "cardio" | "personal";
  timing: "morning" | "evening" | null;
  goal: string | null;
  area: string | null;
  notes: string | null;
  status: JoinStatus;
  created_at: string;
  // Payment (migration 007). Older requests may have nulls.
  token: string;
  receipt_no: string;
  joining_fee: number | null;
  monthly_fee: number | null;
  amount: number | null;
  payment_method: PaymentMethod | null;
  payment_status: OrderStatus;
  utr: string | null;
  paid_at: string | null;
};

/** A visitor's own join request, as returned by get_join_request(token). */
export type PublicJoinRequest = Pick<
  JoinRequest,
  "receipt_no" | "name" | "phone" | "plan" | "joining_fee" | "monthly_fee" | "amount" | "payment_method" | "payment_status" | "utr" | "paid_at" | "status" | "created_at"
>;

/** A shop product. Prices are whole rupees. */
export type Product = {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  mrp: number | null;
  image_url: string | null;
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
  plan: "gym" | "cardio" | "personal" | null;
  joined_on: string;
  paid_until: string | null;
  emergency_contact: string | null;
  notes: string | null;
  is_active: boolean;
  join_request_id: number | null;
  created_at: string;
  updated_at: string;
};

export type OrderStatus = "pending" | "verifying" | "paid" | "cancelled";
export type PaymentMethod = "upi" | "cash";

/** A shop order as the admin sees it (migration 004). Amounts are whole rupees. */
export type Order = {
  id: number;
  receipt_no: string;
  token: string;
  customer_name: string;
  customer_phone: string;
  product_id: number | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  service_charge: number;
  total: number;
  payment_method: PaymentMethod;
  status: OrderStatus;
  utr: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

/** A customer's own order, as returned by get_order(token). */
export type PublicOrder = Omit<Order, "id" | "token" | "product_id" | "updated_at">;

/** A photo in the website gallery slideshow (migration 004). */
export type GalleryPhoto = {
  id: number;
  image_url: string;
  caption: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};
