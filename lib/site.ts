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
  ownerInstagram: "https://www.instagram.com/fit_kesh_official/",
  ownerHandle: "fit_kesh_official",
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

/** Best "join" link: WhatsApp if configured, otherwise Instagram DM. */
export const joinHref = site.whatsapp
  ? `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(
      "Hi! I'd like to join Kesh Fitness."
    )}`
  : site.instagramDM;
