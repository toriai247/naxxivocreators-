-- ==============================================================================
-- MISSING RPC FUNCTIONS AND RLS POLICIES FOR STORE & COVER RING UPLOADS
-- ==============================================================================

-- 1. RLS Policies for store_items and user_inventory
ALTER TABLE IF EXISTS public.store_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view store items" ON public.store_items;
DROP POLICY IF EXISTS "Users can insert cover items" ON public.store_items;
DROP POLICY IF EXISTS "Admins can manage store items" ON public.store_items;

CREATE POLICY "Public can view store items" ON public.store_items FOR SELECT USING (true);
CREATE POLICY "Users can insert cover items" ON public.store_items FOR INSERT WITH CHECK (auth.uid() = created_by_user_id);
CREATE POLICY "Admins can manage store items" ON public.store_items FOR ALL USING (true);

ALTER TABLE IF EXISTS public.user_inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own inventory" ON public.user_inventory;
DROP POLICY IF EXISTS "Users can insert into own inventory" ON public.user_inventory;
DROP POLICY IF EXISTS "Admins can manage inventory" ON public.user_inventory;

CREATE POLICY "Users can view own inventory" ON public.user_inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert into own inventory" ON public.user_inventory FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage inventory" ON public.user_inventory FOR ALL USING (true);

-- 2. FUNCTION: create_user_profile_cover (for submitting cover rings)
CREATE OR REPLACE FUNCTION public.create_user_profile_cover(
  p_name TEXT,
  p_description TEXT,
  p_preview_url TEXT
)
RETURNS TEXT AS $$
DECLARE
  v_user_id UUID;
  v_current_xp INT;
  v_cost INT := 25000;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN 'Error: You must be logged in to submit a cover.';
  END IF;

  SELECT COALESCE(xp_balance, 0) INTO v_current_xp
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_current_xp < v_cost THEN
    RETURN 'Error: Insufficient XP balance. You need 25,000 XP to submit a cover.';
  END IF;

  UPDATE public.profiles
  SET xp_balance = xp_balance - v_cost
  WHERE id = v_user_id;

  INSERT INTO public.store_items (
    name,
    description,
    category,
    price,
    preview_url,
    is_active,
    is_approved,
    created_by_user_id
  ) VALUES (
    p_name,
    p_description,
    'PROFILE_COVER',
    0,
    p_preview_url,
    false,
    false,
    v_user_id
  );

  RETURN 'Submission successful! Your cover is now under review.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. FUNCTION: buy_store_item
CREATE OR REPLACE FUNCTION public.buy_store_item(p_item_id INT)
RETURNS TEXT AS $$
DECLARE
  v_user_id UUID;
  v_item RECORD;
  v_user_xp INT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN 'Error: You must be logged in to buy items.';
  END IF;

  SELECT * INTO v_item FROM public.store_items WHERE id = p_item_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN 'Error: Item not found or inactive.';
  END IF;

  IF EXISTS (SELECT 1 FROM public.user_inventory WHERE user_id = v_user_id AND item_id = p_item_id) THEN
    RETURN 'Error: You already own this item.';
  END IF;

  SELECT COALESCE(xp_balance, 0) INTO v_user_xp FROM public.profiles WHERE id = v_user_id;
  IF v_user_xp < COALESCE(v_item.price, 0) THEN
    RETURN 'Error: Insufficient XP to buy this item.';
  END IF;

  UPDATE public.profiles SET xp_balance = xp_balance - COALESCE(v_item.price, 0) WHERE id = v_user_id;
  INSERT INTO public.user_inventory (user_id, item_id) VALUES (v_user_id, p_item_id);

  RETURN 'Success! Item purchased.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. FUNCTION: equip_inventory_item
CREATE OR REPLACE FUNCTION public.equip_inventory_item(p_inventory_id BIGINT)
RETURNS TEXT AS $$
DECLARE
  v_user_id UUID;
  v_inv RECORD;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN 'Error: Not logged in.';
  END IF;

  SELECT ui.*, si.category, si.id as store_item_id
  INTO v_inv
  FROM public.user_inventory ui
  JOIN public.store_items si ON si.id = ui.item_id
  WHERE ui.id = p_inventory_id AND ui.user_id = v_user_id;

  IF NOT FOUND THEN
    RETURN 'Error: Inventory item not found.';
  END IF;

  IF v_inv.category = 'PROFILE_COVER' THEN
    UPDATE public.profiles SET active_cover_id = v_inv.store_item_id WHERE id = v_user_id;
    RETURN 'Cover equipped successfully!';
  ELSE
    RETURN 'Item equipped successfully!';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. FUNCTION: deduct_xp_for_action
CREATE OR REPLACE FUNCTION public.deduct_xp_for_action(p_cost INT, p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_xp INT;
BEGIN
  IF auth.uid() IS NULL AND p_user_id IS NULL THEN
    RETURN 'Error: Unauthorized';
  END IF;
  
  SELECT COALESCE(xp_balance, 0) INTO v_xp FROM public.profiles WHERE id = COALESCE(p_user_id, auth.uid());
  IF v_xp < p_cost THEN
    RETURN 'Error: Insufficient XP.';
  END IF;

  UPDATE public.profiles SET xp_balance = xp_balance - p_cost WHERE id = COALESCE(p_user_id, auth.uid());
  RETURN 'Success';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. FUNCTION: add_xp_to_user
CREATE OR REPLACE FUNCTION public.add_xp_to_user(user_id_to_update UUID, xp_to_add INT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles SET xp_balance = COALESCE(xp_balance, 0) + xp_to_add WHERE id = user_id_to_update;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. FUNCTION: admin_delete_user_inventory_item
CREATE OR REPLACE FUNCTION public.admin_delete_user_inventory_item(inventory_id_to_delete INT)
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.user_inventory WHERE id = inventory_id_to_delete;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
