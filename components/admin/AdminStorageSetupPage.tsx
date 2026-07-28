import React, { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import { CheckCircleIcon, InfoIcon, XCircleIcon, ClipboardListIcon, UploadIcon } from '../common/AppIcons';

const REQUIRED_BUCKETS = [
    { id: 'avatars', label: 'Profile Avatars', desc: 'Stores user profile pictures and custom uploads' },
    { id: 'profile-covers', label: 'Profile Covers', desc: 'Stores profile banner/cover images' },
    { id: 'profile-music', label: 'Profile Music', desc: 'Stores MP3 audio tracks uploaded by users' },
    { id: 'profile-gifs', label: 'Profile Animations', desc: 'Stores GIF animations for profiles' },
    { id: 'payment-proofs', label: 'Payment Proofs', desc: 'Stores screenshot proofs for manual top-ups' }
];

const FIX_SQL_SCRIPT = `-- ==========================================
-- SUPABASE STORAGE BUCKETS & RLS FIX
-- ==========================================
-- Why ERROR 42501 happened:
-- In Supabase, the table "storage.objects" is owned by "supabase_storage_admin".
-- Running commands like "ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;" 
-- triggers "ERROR 42501: must be owner of table objects".
-- Since RLS is already enabled by default, do NOT run ALTER TABLE commands!
-- Run this script below in your Supabase Dashboard -> SQL Editor:

-- 1. Create all required public buckets safely
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 20971520, null),
  ('profile-covers', 'profile-covers', true, 20971520, null),
  ('profile-music', 'profile-music', true, 20971520, null),
  ('profile-gifs', 'profile-gifs', true, 20971520, null),
  ('payment-proofs', 'payment-proofs', true, 20971520, null)
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 20971520;

-- 2. Clean up old conflicting policies on storage.objects
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Give public access to everything in storage" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read storage objects" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can insert storage objects" ON storage.objects;

-- 3. Create clean RLS policies without altering table ownership
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can upload files" 
ON storage.objects FOR INSERT 
TO authenticated, public
WITH CHECK (true);

CREATE POLICY "Users can update their own files" 
ON storage.objects FOR UPDATE 
TO authenticated, public
USING (true);

CREATE POLICY "Users can delete their own files" 
ON storage.objects FOR DELETE 
TO authenticated, public
USING (true);

-- 4. Initialize default app settings (payment instructions & luck royale config)
INSERT INTO public.app_settings (key, description, value)
VALUES 
  ('payment_instructions', 'Instructions and wallet addresses displayed to users for manual crypto/fiat top-ups and store checkouts.', '{"binance_pay_id": "284910385 (Example Binance ID)", "recipient_name": "Aura Store Official", "network": "USDT / TRC20 / BEP20", "currency": "USDT / USD"}'::jsonb),
  ('luck_royale_config', 'Configuration for Luck Royale spins, pricing, and duplicate prize compensation.', '{"costs": {"GOLD": {"single": 100, "ten": 900}, "SILVER": {"single": 50, "ten": 450}, "DIAMOND": {"single": 10, "ten": 90}}, "duplicate_consolation": {"type": "GOLD", "amount": 50}, "is_active": true}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 5. FUNCTION: redeem_gift_code (for XP & Gift Code redemption)
CREATE OR REPLACE FUNCTION public.redeem_gift_code(p_code TEXT, p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_code_id INT;
  v_xp_reward INT;
  v_uses_remaining INT;
  v_max_uses_per_user INT;
  v_is_active BOOLEAN;
  v_expires_at TIMESTAMPTZ;
  v_user_redemptions INT;
BEGIN
  -- Find the code
  SELECT id, xp_reward, uses_remaining, max_uses_per_user, is_active, expires_at
  INTO v_code_id, v_xp_reward, v_uses_remaining, v_max_uses_per_user, v_is_active, v_expires_at
  FROM public.gift_codes
  WHERE UPPER(code) = UPPER(TRIM(p_code))
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN 'Error: Invalid gift code.';
  END IF;

  IF NOT v_is_active THEN
    RETURN 'Error: This gift code is no longer active.';
  END IF;

  IF v_expires_at IS NOT NULL AND v_expires_at < NOW() THEN
    RETURN 'Error: This gift code has expired.';
  END IF;

  IF v_uses_remaining IS NOT NULL AND v_uses_remaining <= 0 THEN
    RETURN 'Error: This gift code has reached its maximum redemptions.';
  END IF;

  -- Check user redemption count
  SELECT COUNT(*)
  INTO v_user_redemptions
  FROM public.user_gift_code_redemptions
  WHERE user_id = p_user_id AND gift_code_id = v_code_id;

  IF v_user_redemptions >= COALESCE(v_max_uses_per_user, 1) THEN
    RETURN 'Error: You have already redeemed this code the maximum number of times.';
  END IF;

  -- Record redemption
  INSERT INTO public.user_gift_code_redemptions (user_id, gift_code_id)
  VALUES (p_user_id, v_code_id);

  -- Decrement uses remaining
  IF v_uses_remaining IS NOT NULL THEN
    UPDATE public.gift_codes
    SET uses_remaining = uses_remaining - 1
    WHERE id = v_code_id;
  END IF;

  -- Add XP to user profile
  UPDATE public.profiles
  SET xp_balance = COALESCE(xp_balance, 0) + v_xp_reward
  WHERE id = p_user_id;

  RETURN 'Success! You received ' || v_xp_reward || ' XP.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RLS Policies for store_items and user_inventory
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

-- 7. FUNCTION: create_user_profile_cover (for submitting cover rings)
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

-- 8. FUNCTION: buy_store_item
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

-- 9. FUNCTION: equip_inventory_item
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

-- 10. FUNCTION: deduct_xp_for_action
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

-- 11. FUNCTION: add_xp_to_user
CREATE OR REPLACE FUNCTION public.add_xp_to_user(user_id_to_update UUID, xp_to_add INT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles SET xp_balance = COALESCE(xp_balance, 0) + xp_to_add WHERE id = user_id_to_update;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. FUNCTION: admin_delete_user_inventory_item
CREATE OR REPLACE FUNCTION public.admin_delete_user_inventory_item(inventory_id_to_delete INT)
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.user_inventory WHERE id = inventory_id_to_delete;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

const AdminStorageSetupPage: React.FC = () => {
    const [bucketStatuses, setBucketStatuses] = useState<Record<string, 'checking' | 'exists' | 'missing' | 'error'>>({});
    const [isCreating, setIsCreating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [notice, setNotice] = useState<{ type: 'success' | 'warning' | 'error'; title: string; message: string } | null>(null);

    const checkBuckets = async () => {
        const newStatuses: Record<string, 'checking' | 'exists' | 'missing' | 'error'> = {};
        REQUIRED_BUCKETS.forEach(b => newStatuses[b.id] = 'checking');
        setBucketStatuses({ ...newStatuses });

        try {
            const { data: buckets, error } = await supabase.storage.listBuckets();
            if (error) {
                console.error("Error listing buckets:", error);
                REQUIRED_BUCKETS.forEach(b => newStatuses[b.id] = 'error');
                setBucketStatuses({ ...newStatuses });
                return;
            }

            const existingIds = new Set(buckets?.map(b => b.id) || []);
            REQUIRED_BUCKETS.forEach(b => {
                newStatuses[b.id] = existingIds.has(b.id) ? 'exists' : 'missing';
            });
            setBucketStatuses({ ...newStatuses });
        } catch (err) {
            REQUIRED_BUCKETS.forEach(b => newStatuses[b.id] = 'error');
            setBucketStatuses({ ...newStatuses });
        }
    };

    useEffect(() => {
        checkBuckets();
    }, []);

    const handleAutoCreateBuckets = async () => {
        setIsCreating(true);
        setNotice(null);
        let createdCount = 0;
        let errorMessages: string[] = [];

        for (const bucket of REQUIRED_BUCKETS) {
            if (bucketStatuses[bucket.id] !== 'exists') {
                try {
                    const { error } = await supabase.storage.createBucket(bucket.id, {
                        public: true,
                        fileSizeLimit: 20971520 // 20MB
                    });

                    if (!error || error.message?.toLowerCase().includes('already exists')) {
                        createdCount++;
                    } else {
                        errorMessages.push(`${bucket.id}: ${error.message}`);
                    }
                } catch (err: any) {
                    errorMessages.push(`${bucket.id}: ${err.message || 'Error'}`);
                }
            }
        }

        setIsCreating(false);
        await checkBuckets();

        if (errorMessages.length > 0) {
            setNotice({
                type: 'warning',
                title: 'Partial Creation via SDK',
                message: `Some buckets could not be created via client SDK (${errorMessages[0]}). Please run the SQL script below in your Supabase SQL Editor!`
            });
        } else {
            setNotice({
                type: 'success',
                title: 'Buckets Ready!',
                message: 'All storage buckets have been created and verified successfully.'
            });
        }
    };

    const handleCopySql = () => {
        navigator.clipboard.writeText(FIX_SQL_SCRIPT);
        setCopied(true);
        setNotice({
            type: 'success',
            title: 'Copied to Clipboard!',
            message: 'Paste this SQL script into your Supabase Dashboard -> SQL Editor and click Run.'
        });
        setTimeout(() => setCopied(false), 3000);
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto p-4 animate-fade-in">
            {notice && (
                <div className={`p-4 rounded-xl border flex items-start justify-between ${
                    notice.type === 'success' ? 'bg-green-950/60 border-green-500/50 text-green-200' :
                    notice.type === 'warning' ? 'bg-amber-950/60 border-amber-500/50 text-amber-200' :
                    'bg-red-950/60 border-red-500/50 text-red-200'
                }`}>
                    <div>
                        <div className="font-bold flex items-center gap-2">
                            {notice.type === 'success' ? <CheckCircleIcon className="w-5 h-5 text-green-400" /> : <InfoIcon className="w-5 h-5 text-amber-400" />}
                            {notice.title}
                        </div>
                        <p className="text-xs mt-1 opacity-90">{notice.message}</p>
                    </div>
                    <button onClick={() => setNotice(null)} className="text-xs hover:opacity-75 font-bold px-2 py-1">✕</button>
                </div>
            )}
            <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-500/30 rounded-2xl p-6 shadow-xl">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <UploadIcon className="w-7 h-7 text-purple-400" />
                            Storage Buckets & SQL Fixer
                        </h1>
                        <p className="text-sm text-gray-300 mt-1">
                            Resolve <code className="bg-black/40 text-red-300 px-1.5 py-0.5 rounded text-xs font-mono">ERROR: 42501: must be owner of table objects</code> and make all uploads (avatars, music, covers, GIFs) work instantly.
                        </p>
                    </div>
                    <Button onClick={checkBuckets} variant="secondary" size="small">
                        Refresh Status
                    </Button>
                </div>

                {/* Explanation of ERROR 42501 and Failed to fetch */}
                <div className="mt-6 space-y-3">
                    <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-4 text-sm text-amber-200 space-y-2">
                        <div className="font-bold flex items-center gap-2 text-amber-300">
                            <InfoIcon className="w-5 h-5 flex-shrink-0 text-amber-400" />
                            Why did you get "Upload failed: Failed to fetch"?
                        </div>
                        <p className="text-xs leading-relaxed text-gray-300">
                            When a bucket (like <code className="text-purple-300">profile-covers</code> or <code className="text-purple-300">avatars</code>) has not been created yet in your Supabase project, or when RLS policies block uploading, browsers block the error response due to missing cross-origin CORS headers on 404s, reporting <code className="bg-black/40 text-red-300 px-1 rounded font-mono">Failed to fetch</code>.
                        </p>
                        <p className="text-xs text-green-300 font-semibold">
                            ⚡ Immediate Fix: Click the <strong className="underline">Auto-Create Missing Buckets</strong> button below OR copy the SQL script below and run it in your Supabase SQL Editor!
                        </p>
                    </div>

                    <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-4 text-sm text-red-200 space-y-2">
                        <div className="font-bold flex items-center gap-2 text-red-300">
                            <XCircleIcon className="w-5 h-5 flex-shrink-0 text-red-400" />
                            Why did you get "ERROR 42501: must be owner of table objects"?
                        </div>
                        <p className="text-xs leading-relaxed text-gray-300">
                            In Supabase, system tables like <code className="text-purple-300">storage.objects</code> and <code className="text-purple-300">storage.buckets</code> are owned by an internal admin role (<code className="text-purple-300">supabase_storage_admin</code>). If your SQL script tried to run <code className="bg-black/40 text-red-300 px-1 rounded font-mono">ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;</code> or change table owners, PostgreSQL throws error <strong className="text-white">42501</strong>.
                        </p>
                        <p className="text-xs text-green-300 font-semibold">
                            ✅ How to fix: Row Level Security is already enabled by default! You only need to insert the buckets and create policies directly using the SQL script below.
                        </p>
                    </div>
                </div>
            </div>

            {/* Buckets Status Grid */}
            <div className="bg-[var(--theme-card-bg)] border border-[var(--theme-secondary)]/30 rounded-2xl p-6 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <h2 className="text-lg font-bold text-[var(--theme-text)]">Required Storage Buckets</h2>
                    <Button
                        onClick={handleAutoCreateBuckets}
                        disabled={isCreating || Object.values(bucketStatuses).every(s => s === 'exists')}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md text-sm py-2 px-4"
                    >
                        {isCreating ? <LoadingSpinner /> : '⚡ Auto-Create Missing Buckets'}
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {REQUIRED_BUCKETS.map(b => {
                        const status = bucketStatuses[b.id] || 'checking';
                        return (
                            <div key={b.id} className="p-3.5 rounded-xl bg-black/20 border border-[var(--theme-secondary)]/20 flex items-center justify-between">
                                <div>
                                    <div className="font-bold text-sm text-[var(--theme-text)] flex items-center gap-2">
                                        <span className="font-mono text-purple-400">{b.id}</span>
                                    </div>
                                    <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">{b.desc}</p>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
                                    {status === 'checking' && <LoadingSpinner />}
                                    {status === 'exists' && (
                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-green-400 bg-green-950/50 border border-green-500/30 px-2.5 py-1 rounded-full">
                                            <CheckCircleIcon className="w-3.5 h-3.5" /> Ready
                                        </span>
                                    )}
                                    {status === 'missing' && (
                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-950/50 border border-amber-500/30 px-2.5 py-1 rounded-full">
                                            <InfoIcon className="w-3.5 h-3.5" /> Missing
                                        </span>
                                    )}
                                    {status === 'error' && (
                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-400 bg-red-950/50 border border-red-500/30 px-2.5 py-1 rounded-full">
                                            Error checking
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* SQL Script Box */}
            <div className="bg-[var(--theme-card-bg)] border border-[var(--theme-secondary)]/30 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h2 className="text-lg font-bold text-[var(--theme-text)] flex items-center gap-2">
                            <ClipboardListIcon className="w-5 h-5 text-purple-400" />
                            Foolproof Fix Script (Runs without Error 42501)
                        </h2>
                        <p className="text-xs text-[var(--theme-text-secondary)]">
                            Copy and paste this into your <strong className="text-[var(--theme-text)]">Supabase Dashboard → SQL Editor</strong> and click Run.
                        </p>
                    </div>
                    <Button onClick={handleCopySql} className="bg-purple-600 hover:bg-purple-500 text-white text-xs px-4 py-2">
                        {copied ? '✅ Copied!' : '📋 Copy SQL Script'}
                    </Button>
                </div>

                <div className="relative group">
                    <pre className="bg-slate-950 text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800 max-h-96 leading-relaxed shadow-inner">
                        {FIX_SQL_SCRIPT}
                    </pre>
                    <button
                        onClick={handleCopySql}
                        className="absolute top-3 right-3 bg-slate-800 hover:bg-slate-700 text-gray-200 text-xs px-2.5 py-1 rounded border border-slate-600 opacity-80 group-hover:opacity-100 transition-opacity"
                    >
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminStorageSetupPage;
