export interface AvatarPreset {
    id: string;
    url: string;
    label: string;
    category: 'boys' | 'girls' | 'general';
}

export const AVATAR_PRESETS: AvatarPreset[] = [
    // --- BOYS AVATARS ---
    {
        id: 'boy-1',
        category: 'boys',
        label: 'Cool Anime Boy',
        url: 'https://api.dicebear.com/8.x/lorelei/svg?seed=Liam&backgroundColor=b6e3f4,c0aede,d1d4f9'
    },
    {
        id: 'boy-2',
        category: 'boys',
        label: 'Cyberpunk Kid',
        url: 'https://api.dicebear.com/8.x/adventurer/svg?seed=Felix&backgroundColor=ffdfbf,ffd5dc,d1d4f9'
    },
    {
        id: 'boy-3',
        category: 'boys',
        label: 'Gamer Hero',
        url: 'https://api.dicebear.com/8.x/micah/svg?seed=Oliver&backgroundColor=c0aede,b6e3f4'
    },
    {
        id: 'boy-4',
        category: 'boys',
        label: 'Street Fighter',
        url: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Alex&backgroundColor=65c9ff,262e33'
    },
    {
        id: 'boy-5',
        category: 'boys',
        label: 'Shadow Ninja',
        url: 'https://api.dicebear.com/8.x/lorelei/svg?seed=Shadow&backgroundColor=1e1e24,3b3b4f'
    },
    {
        id: 'boy-6',
        category: 'boys',
        label: 'Neon Adventurer',
        url: 'https://api.dicebear.com/8.x/adventurer/svg?seed=Zane&backgroundColor=ffdfbf,c0aede'
    },
    {
        id: 'boy-7',
        category: 'boys',
        label: 'Lo-Fi Chill Boy',
        url: 'https://api.dicebear.com/8.x/notionists/svg?seed=Kenji&backgroundColor=b6e3f4'
    },
    {
        id: 'boy-8',
        category: 'boys',
        label: 'Mecha Pilot',
        url: 'https://api.dicebear.com/8.x/bottts/svg?seed=Rex&backgroundColor=c0aede,d1d4f9'
    },
    {
        id: 'boy-9',
        category: 'boys',
        label: 'Royal Knight',
        url: 'https://api.dicebear.com/8.x/lorelei/svg?seed=Arthur&backgroundColor=ffd5dc,ffdfbf'
    },
    {
        id: 'boy-10',
        category: 'boys',
        label: 'Urban Skater',
        url: 'https://api.dicebear.com/8.x/micah/svg?seed=Kai&backgroundColor=d1d4f9,b6e3f4'
    },
    {
        id: 'boy-11',
        category: 'boys',
        label: 'Pixel Master',
        url: 'https://api.dicebear.com/8.x/pixel-art/svg?seed=Neo&backgroundColor=b6e3f4,c0aede'
    },
    {
        id: 'boy-12',
        category: 'boys',
        label: 'Galaxy Explorer',
        url: 'https://api.dicebear.com/8.x/adventurer/svg?seed=Orion&backgroundColor=3b3b4f,262e33'
    },

    // --- GIRLS AVATARS ---
    {
        id: 'girl-1',
        category: 'girls',
        label: 'Anime Princess',
        url: 'https://api.dicebear.com/8.x/lorelei/svg?seed=Sophia&backgroundColor=ffd5dc,ffdfbf,c0aede'
    },
    {
        id: 'girl-2',
        category: 'girls',
        label: 'Starlight Mage',
        url: 'https://api.dicebear.com/8.x/adventurer/svg?seed=Luna&backgroundColor=ffd5dc,d1d4f9'
    },
    {
        id: 'girl-3',
        category: 'girls',
        label: 'Cyber Angel',
        url: 'https://api.dicebear.com/8.x/lorelei/svg?seed=Chloe&backgroundColor=b6e3f4,c0aede'
    },
    {
        id: 'girl-4',
        category: 'girls',
        label: 'Kawaii Gamer',
        url: 'https://api.dicebear.com/8.x/micah/svg?seed=Mia&backgroundColor=ffd5dc,ffdfbf'
    },
    {
        id: 'girl-5',
        category: 'girls',
        label: 'Pop Star',
        url: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Emma&backgroundColor=ffdfbf,ffd5dc'
    },
    {
        id: 'girl-6',
        category: 'girls',
        label: 'Enchanted Elf',
        url: 'https://api.dicebear.com/8.x/adventurer/svg?seed=Elara&backgroundColor=d1d4f9,c0aede'
    },
    {
        id: 'girl-7',
        category: 'girls',
        label: 'Lo-Fi Chill Girl',
        url: 'https://api.dicebear.com/8.x/notionists/svg?seed=Aria&backgroundColor=ffd5dc'
    },
    {
        id: 'girl-8',
        category: 'girls',
        label: 'Valkyrie Warrior',
        url: 'https://api.dicebear.com/8.x/lorelei/svg?seed=Freya&backgroundColor=c0aede,b6e3f4'
    },
    {
        id: 'girl-9',
        category: 'girls',
        label: 'Sunny Skater',
        url: 'https://api.dicebear.com/8.x/micah/svg?seed=Hana&backgroundColor=ffdfbf,ffd5dc'
    },
    {
        id: 'girl-10',
        category: 'girls',
        label: 'Moon Maiden',
        url: 'https://api.dicebear.com/8.x/lorelei/svg?seed=Seraphina&backgroundColor=3b3b4f,d1d4f9'
    },
    {
        id: 'girl-11',
        category: 'girls',
        label: 'Pixel Queen',
        url: 'https://api.dicebear.com/8.x/pixel-art/svg?seed=Maya&backgroundColor=ffd5dc,c0aede'
    },
    {
        id: 'girl-12',
        category: 'girls',
        label: 'Cosmic Traveler',
        url: 'https://api.dicebear.com/8.x/adventurer/svg?seed=Nova&backgroundColor=b6e3f4,d1d4f9'
    }
];

export const fetchDatabasePresets = async (supabase: any): Promise<AvatarPreset[]> => {
    try {
        const { data, error } = await supabase
            .from('preset_avatars')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: true });

        if (error || !data || data.length === 0) {
            return AVATAR_PRESETS;
        }

        const dbPresets: AvatarPreset[] = data.map((item: any) => ({
            id: String(item.id),
            url: item.image_url,
            label: item.name,
            category: (item.category === 'girls' || item.category === 'general' ? item.category : 'boys') as 'boys' | 'girls' | 'general'
        }));

        return dbPresets;
    } catch (e) {
        console.warn('Could not load preset_avatars from database, falling back to local presets:', e);
        return AVATAR_PRESETS;
    }
};

