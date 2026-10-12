# Kesh Fitness

Website for Kesh Fitness, a unisex multi gym near Silli Stadium. Built with Next.js 14, Tailwind CSS and Supabase.

## Run locally

```bash
npm install
npm run dev
```

The site works without any setup. The join form, message form, announcements and the admin panel need Supabase (below).

## Supabase setup

**1. Create a project**
- Sign up at [supabase.com](https://supabase.com) and click *New project*.
- Pick a name (e.g. `kesh-fitness`), set a database password (save it somewhere), and choose the **Mumbai (ap-south-1)** region.
- Wait a minute or two for it to finish setting up.

**2. Create the tables**
- Left sidebar → *SQL Editor* → *New query*.
- Paste the whole of [`supabase/schema.sql`](supabase/schema.sql) and click *Run*. It should say "Success. No rows returned".
- This creates: `profiles` (admin role), `join_requests`, `messages`, `notifications`, `products`, a public `products` storage bucket for product photos, the security rules, and live updates for announcements.
- Safe to run again whenever the file changes.
- Then run each file in [`supabase/migrations/`](supabase/migrations/) **in number order** the same way (`002_members.sql` adds Active Members, `003_product_quantity.sql` adds stock quantity, `004_orders_gallery.sql` adds shop orders/payments and the admin photo gallery, `005_unlimited_stock.sql` turns off stock limits, `006_site_content.sql` lets the admin edit the website, `007_join_payments.sql` adds pay-to-join and Personal Training, `008_gym_location.sql` sets the exact gym location, `009_member_billing.sql` adds monthly bills for members, `010_existing_members.sql` lets existing members sign up without paying and adds the joining fee to bills, `011_signup_switch_retention.sql` adds the on/off switch for that and keeps transactions for 24 months). Each file only contains new changes, so you never need to re-run old ones.

**3. Connect the website**
- Left sidebar → *Project Settings* → *API* (or *API Keys*).
- In the project folder, copy `.env.local.example` to a new file named `.env.local` and fill in:
  ```
  NEXT_PUBLIC_SUPABASE_URL=<Project URL>
  NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon / publishable key>
  ```
- Never put the `service_role` / secret key in this file.

**4. Turn off public sign-ups**
- *Authentication* → *Sign In / Providers* → turn off **Allow new users to sign up** → *Save*.
- Only the admin account you create next will be able to log in.

**5. Create the admin account**
- *Authentication* → *Users* → *Add user* → *Create new user*.
- Enter the admin email and a strong password, tick **Auto Confirm User**, then *Create user*.
- Back in the *SQL Editor*, run (with that email):
  ```sql
  update public.profiles set role = 'admin' where email = 'admin@example.com';
  ```

**6. Restart and test**
- Stop and restart `npm run dev` so it picks up `.env.local`.
- Submit the join form and send a message from the home page.
- Click **Login** in the navbar, sign in, and check that both show up in the Admin Panel.
- Send an announcement and check that the bell on the home page lights up.
- In the *Products* tab, add a product with a photo and check it appears in the Shop section.
- In *Active Members*, add a member (or use *Add as member* on a join request).

**When you deploy (e.g. Vercel):** add the same two `NEXT_PUBLIC_SUPABASE_…` variables in the hosting provider's environment settings.

## Who can do what

| | Visitor (no login) | Admin |
|---|---|---|
| View the whole website, light/dark theme | ✓ | ✓ |
| Fill the "Join Kesh Fitness" form | ✓ | ✓ |
| Message the gym and see replies on the site | ✓ | ✓ |
| Announcement bell + live pop-ups | ✓ | ✓ |
| Shop page: order with quantity, pay by UPI or cash, get a receipt | ✓ | ✓ |
| Admin Panel (`/admin`): join requests, messages, replies, call / WhatsApp | | ✓ |
| Active Members: details, fees-paid tracking, active / inactive, Renew / Bill (monthly fee + products) | | ✓ |
| Add, edit, hide and delete products (with photos), mark in / out of stock | | ✓ |
| Transactions: confirm UPI payments (check UTR), mark cash received, cancel, export CSV | | ✓ |
| Gallery: upload, caption, reorder, hide and delete slideshow photos | | ✓ |
| Website: edit home-page text, photos, prices, timings and contact details | | ✓ |
| Send announcements to everyone | | ✓ |

Access rules are enforced in the database with Row Level Security. Visitors can only add join requests and messages, read visible products, and read their own message replies using a secret token saved in their browser. Only the admin can upload or delete product photos.

## Editing content

- Gym details, texts, photos, prices, timings: **Admin → Website** (defaults in [`lib/content.ts`](lib/content.ts))
- UPI ID and service charge: [`lib/site.ts`](lib/site.ts)
- Photos: [`public/images/`](public/images/) (see the README there)
