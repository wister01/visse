-- =============================================================================
-- TU VISSE? — Schema do banco de dados (Supabase / PostgreSQL)
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------
-- Tabela única `songs`
-- -----------------------------------------------------------------------
create table if not exists public.songs (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  artist      text not null,
  -- Restrição atualizada para o escopo de 3 moods da regra de negócio
  mood        text not null check (mood in ('calmo', 'feliz', 'dancante')),
  youtube_url text,
  insta_url   text,
  cover_url   text,
  created_at  timestamptz not null default now()
);

create index if not exists songs_mood_idx on public.songs (mood);

-- -----------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- -----------------------------------------------------------------------
alter table public.songs enable row level security;

create policy "Qualquer pessoa pode ler músicas"
  on public.songs
  for select
  using (true);

-- -----------------------------------------------------------------------
-- FUNÇÃO RPC Opcional para sorteio direto no banco
-- -----------------------------------------------------------------------
create or replace function public.get_random_song(p_mood text)
returns setof public.songs
language sql
stable
as $$
  select *
  from public.songs
  where mood = p_mood
  order by random()
  limit 1;
$$;

-- -----------------------------------------------------------------------
-- DADOS DE EXEMPLO (seed atualizado para os novos moods)
-- -----------------------------------------------------------------------
insert into public.songs (title, artist, mood, youtube_url, insta_url, cover_url) values
  ('Tarde de Domingo', 'Sombra Leve', 'calmo',
    'https://www.youtube.com/', 'https://www.instagram.com/', null),
  ('Flores da Manhã', 'Luna Lis', 'feliz',
    'https://www.youtube.com/', 'https://www.instagram.com/', null),
  ('Fogo no Rolê', 'Banda Combustão', 'dancante',
    'https://www.youtube.com/', 'https://www.instagram.com/', null)
on conflict do nothing;
