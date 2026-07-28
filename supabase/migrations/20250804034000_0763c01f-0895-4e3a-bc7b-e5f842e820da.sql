-- Enable RLS on tables that don't have it enabled yet
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_versions ENABLE ROW LEVEL SECURITY;