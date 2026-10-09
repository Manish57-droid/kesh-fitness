# Kesh Fitness

Website for Kesh Fitness, a unisex multi gym near Silli Stadium. Built with Next.js 14, Tailwind CSS and Supabase.

## Run locally

```bash
npm install
npm run dev
```

The site and the workout planner work without any setup. The message form, announcements and the admin panel need Supabase (below).

## Supabase setup (messages, announcements, admin)

1. Create a free project at [supabase.com](https://supabase.com).
2. **Database:** open *SQL Editor → New query*, paste all of [`supabase/schema.sql`](supabase/schema.sql), and click *Run*.
3. **Keys:** copy `.env.local.example` to `.env.local` and fill in the values from *Project Settings → API*:
   - `NEXT_PUBLIC_SUPABASE_URL`: the Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: the `anon` / publishable key
4. **Block public sign-ups:** in *Authentication → Sign In / Providers*, turn off *Allow new users to sign up*.
5. **Create the admin:** *Authentication → Users → Add user → Create new user* (tick *Auto Confirm User*), then run:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```
6. Restart `npm run dev` and sign in at `/admin/login` (there's also a small *Admin* link in the footer).

## Who can do what

| | Visitor (no login) | Admin |
|---|---|---|
| View the whole website, light/dark theme | ✓ | ✓ |
| Weekly workout planner (saved on their own phone) | ✓ | ✓ |
| Message the gym and see replies on the site | ✓ | ✓ |
| Announcement bell + live pop-ups | ✓ | ✓ |
| Admin Panel (`/admin`): read, reply to, call or WhatsApp senders | | ✓ |
| Send announcements to everyone | | ✓ |

Access rules are enforced in the database with Row Level Security. Visitors can only send messages and read their own replies, using a secret token saved in their browser.

## Editing content

- Gym details (address, phone, WhatsApp, timings, social links): [`lib/site.ts`](lib/site.ts)
- Photos: see [`public/images/README.md`](public/images/README.md)
- Exercise suggestions in the planner: [`lib/exercises.ts`](lib/exercises.ts)
