-- Kesh Fitness · migration 008: exact gym location
-- Run in Supabase → SQL Editor → New query → Run. Safe to run again.
--
-- Points the website map at the "Kesh fitness gym" listing on Google Maps
-- (Ranchi - Purulia Rd, nearby Silli Stadium, Silli, Nayakjabla, Jharkhand 835102).
-- Only updates content already saved in Admin → Website; you can still change it there.

update public.site_content
set data = jsonb_set(
      jsonb_set(
        jsonb_set(
          data,
          '{gym,mapPin}', '"23.3629739, 85.8522274"', true),
        '{gym,mapQuery}', '"Kesh fitness gym, Ranchi - Purulia Rd, Silli, Jharkhand 835102"', true),
      '{gym,address}', '"Ranchi – Purulia Road, near Silli Stadium, Silli, Jharkhand 835102"', true)
where key = 'home' and data ? 'gym';
