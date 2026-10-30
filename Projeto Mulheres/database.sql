create extension if not exists pgcrypto;

create table if not exists public.prayer_requests (
  id uuid primary key default gen_random_uuid(),
  request text not null check (char_length(request) between 1 and 2000),
  consent boolean not null default false check (consent = true),
  created_at timestamptz not null default now()
);

alter table public.prayer_requests enable row level security;

revoke all on table public.prayer_requests from anon, authenticated;
grant insert (request, consent) on table public.prayer_requests to anon, authenticated;

drop policy if exists "Visitors can submit consented prayer requests" on public.prayer_requests;
create policy "Visitors can submit consented prayer requests"
on public.prayer_requests
for insert
to anon, authenticated
with check (consent = true and char_length(request) between 1 and 2000);
