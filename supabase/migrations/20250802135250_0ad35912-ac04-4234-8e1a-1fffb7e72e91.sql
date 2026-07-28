-- Enable RLS on all tables and create appropriate policies

-- Posts table
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all posts" 
ON public.posts 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own posts" 
ON public.posts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" 
ON public.posts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" 
ON public.posts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Comments table
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all comments" 
ON public.comments 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own comments" 
ON public.comments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
ON public.comments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON public.comments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Likes table
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all likes" 
ON public.likes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own likes" 
ON public.likes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" 
ON public.likes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Follows table
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all follows" 
ON public.follows 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own follows" 
ON public.follows 
FOR INSERT 
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows" 
ON public.follows 
FOR DELETE 
USING (auth.uid() = follower_id);

-- Messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages" 
ON public.messages 
FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can insert their own messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own messages" 
ON public.messages 
FOR UPDATE 
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Market tables
ALTER TABLE public.market_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view market categories" 
ON public.market_categories 
FOR SELECT 
USING (true);

ALTER TABLE public.market_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all market products" 
ON public.market_products 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own products" 
ON public.market_products 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products" 
ON public.market_products 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products" 
ON public.market_products 
FOR DELETE 
USING (auth.uid() = user_id);

ALTER TABLE public.market_product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all product images" 
ON public.market_product_images 
FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their product images" 
ON public.market_product_images 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.market_products 
    WHERE id = market_product_images.product_id 
    AND user_id = auth.uid()
  )
);

-- Game and XP tables
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own game sessions" 
ON public.game_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own game sessions" 
ON public.game_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own XP transactions" 
ON public.xp_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert XP transactions" 
ON public.xp_transactions 
FOR INSERT 
WITH CHECK (true);

-- Anime tables
ALTER TABLE public.anime_series ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all anime series" 
ON public.anime_series 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own anime series" 
ON public.anime_series 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own anime series" 
ON public.anime_series 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own anime series" 
ON public.anime_series 
FOR DELETE 
USING (auth.uid() = user_id);

ALTER TABLE public.anime_episodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all anime episodes" 
ON public.anime_episodes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can manage episodes of their series" 
ON public.anime_episodes 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.anime_series 
    WHERE id = anime_episodes.series_id 
    AND user_id = auth.uid()
  )
);