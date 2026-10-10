// Central place for all gym details. Edit values here and the whole site updates.

export const site = {
  name: "Kesh Fitness",
  team: "Team Invincible Kesh",
  tagline: "Unisex Multi Gym",
  address: "Near Silli Stadium, Silli, Jharkhand",
  mapQuery: "Silli Stadium, Silli, Jharkhand",

  // TODO: add real contact numbers. Leave empty to hide.
  phone: "", // e.g. "+91 98765 43210"
  whatsapp: "", // digits only with country code, e.g. "919876543210"

  instagram: "https://www.instagram.com/teaminvinciblekesh/",
  instagramHandle: "teaminvinciblekesh",
  instagramDM: "https://ig.me/m/teaminvinciblekesh",
  youtube: "https://youtube.com/channel/UCvp9plbiQ0P2nbGCDHeLPqQ",

  // TODO: confirm real gym timings.
  hours: [
    { days: "Monday – Saturday", slots: ["5:00 AM – 10:00 AM", "4:00 PM – 9:00 PM"] },
    { days: "Sunday", slots: ["Closed"] },
  ],

  stats: [
    { value: "Multi", label: "Gym Setup" },
    { value: "Unisex", label: "Men & Women" },
    { value: "6 Days", label: "A Week" },
  ],
};

// Prices in rupees.
export const pricing = {
  joiningFee: 1000,
  plans: [
    {
      id: "gym",
      name: "Gym",
      monthly: 500,
      perks: ["Full access to weights & machines", "Strength training area", "Form & workout guidance"],
    },
    {
      id: "cardio",
      name: "Gym + Cardio",
      monthly: 800,
      perks: ["Everything in the Gym plan", "Treadmill & cardio machines", "Fat-loss friendly routines"],
      featured: true,
    },
  ],
};

export type PlanId = (typeof pricing.plans)[number]["id"];

export const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

// UPI payments for shop orders.
export const payment = {
  upiId: "7209101608@ptyes",
  payeeName: "KESH FITNESS",
  /** Added once per order. Keep in sync with place_order() in migration 004. */
  serviceCharge: 1,
};

/**
 * UPI deep link that opens any UPI app with the amount filled in and the receipt number
 * in the payment note. Encoded by hand (spaces as %20) because some UPI apps show "+" literally.
 */
export const upiLink = (amount: number, receiptNo: string) =>
  "upi://pay?" +
  Object.entries({
    pa: payment.upiId,
    pn: payment.payeeName,
    am: amount.toFixed(2),
    cu: "INR",
    tn: `Kesh Fitness ${receiptNo}`,
  })
    .map(([k, v]) => `${k}=${encodeURIComponent(v).replace(/%40/g, "@")}`)
    .join("&");

/** All "Join" buttons lead to the membership form on the home page. */
export const joinHref = "/#join";
