-- SNIPZY : table des profils + sécurité (RLS) + suppression de compte
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'gratuit' check (plan in ('gratuit','pro','studio')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Chacun ne peut LIRE que sa propre ligne. Personne ne peut modifier son plan depuis le site.
create policy "lire son profil" on public.profiles
  for select to authenticated using (auth.uid() = id);

grant select on public.profiles to authenticated;

-- Crée automatiquement un profil à chaque nouvelle inscription
create function public.creer_profil() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end $$;

create trigger a_la_creation_du_compte after insert on auth.users
  for each row execute function public.creer_profil();

-- Permet à un utilisateur connecté de supprimer son propre compte
create function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
begin
  delete from auth.users where id = auth.uid();
end $$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
