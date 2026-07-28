-- Fix RLS policies for games and related tables
CREATE POLICY "Users can view games they participate in" 
ON public.games 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM game_players 
    WHERE game_players.game_id = games.id 
    AND game_players.player_id = auth.uid()
  )
);

CREATE POLICY "Users can create games" 
ON public.games 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update games they participate in" 
ON public.games 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM game_players 
    WHERE game_players.game_id = games.id 
    AND game_players.player_id = auth.uid()
  )
);

-- Game players policies
CREATE POLICY "Users can view game players for games they participate in" 
ON public.game_players 
FOR SELECT 
USING (
  player_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM game_players gp2 
    WHERE gp2.game_id = game_players.game_id 
    AND gp2.player_id = auth.uid()
  )
);

CREATE POLICY "Users can join games" 
ON public.game_players 
FOR INSERT 
WITH CHECK (player_id = auth.uid());

CREATE POLICY "Users can update their own game player records" 
ON public.game_players 
FOR UPDATE 
USING (player_id = auth.uid());

-- Game moves policies  
CREATE POLICY "Users can view moves for games they participate in" 
ON public.game_moves 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM game_players 
    WHERE game_players.game_id = game_moves.game_id 
    AND game_players.player_id = auth.uid()
  )
);

CREATE POLICY "Users can create moves for games they participate in" 
ON public.game_moves 
FOR INSERT 
WITH CHECK (
  player_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM game_players 
    WHERE game_players.game_id = game_moves.game_id 
    AND game_players.player_id = auth.uid()
  )
);

-- Site management policies
CREATE POLICY "Users can manage their own sites" 
ON public.user_sites 
FOR ALL 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own site pages" 
ON public.site_pages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_sites 
    WHERE user_sites.id = site_pages.site_id 
    AND user_sites.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their own site pages" 
ON public.site_pages 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_sites 
    WHERE user_sites.id = site_pages.site_id 
    AND user_sites.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own site pages" 
ON public.site_pages 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM user_sites 
    WHERE user_sites.id = site_pages.site_id 
    AND user_sites.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own site pages" 
ON public.site_pages 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM user_sites 
    WHERE user_sites.id = site_pages.site_id 
    AND user_sites.user_id = auth.uid()
  )
);

-- Page components policies
CREATE POLICY "Users can view components for their pages" 
ON public.page_components 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM site_pages sp
    JOIN user_sites us ON sp.site_id = us.id
    WHERE sp.id = page_components.page_id 
    AND us.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage components for their pages" 
ON public.page_components 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM site_pages sp
    JOIN user_sites us ON sp.site_id = us.id
    WHERE sp.id = page_components.page_id 
    AND us.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM site_pages sp
    JOIN user_sites us ON sp.site_id = us.id
    WHERE sp.id = page_components.page_id 
    AND us.user_id = auth.uid()
  )
);

-- Site versions policies
CREATE POLICY "Users can view versions of their sites" 
ON public.site_versions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_sites 
    WHERE user_sites.id = site_versions.site_id 
    AND user_sites.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create versions of their sites" 
ON public.site_versions 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_sites 
    WHERE user_sites.id = site_versions.site_id 
    AND user_sites.user_id = auth.uid()
  )
);

-- Secure database functions
CREATE OR REPLACE FUNCTION public.transfer_xp_on_game_end()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
    v_winner_xp_change INT;
    v_loser_id UUID;
    v_xp_amount_per_game INT := 100;
BEGIN
    IF NEW.status = 'finished' AND NEW.winner_id IS NOT NULL AND OLD.status != 'finished' THEN
        SELECT gp.player_id INTO v_loser_id
        FROM public.game_players gp
        WHERE gp.game_id = NEW.id
          AND gp.player_id != NEW.winner_id;

        IF v_loser_id IS NOT NULL THEN
            UPDATE public.profiles
            SET xp_balance = xp_balance + v_xp_amount_per_game
            WHERE id = NEW.winner_id;

            UPDATE public.profiles
            SET xp_balance = GREATEST(xp_balance - v_xp_amount_per_game, 0)
            WHERE id = v_loser_id;

            RAISE NOTICE 'XP Transferred: Game ID %, Winner %, Loser %', NEW.id, NEW.winner_id, v_loser_id;
        END IF;
    ELSIF NEW.status = 'finished' AND NEW.winner_id IS NULL AND OLD.status != 'finished' THEN
        RAISE NOTICE 'Game ID % ended in a draw. No XP change.', NEW.id;
    END IF;

    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;