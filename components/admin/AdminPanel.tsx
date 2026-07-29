import React, { useState } from 'react';
import type { Session } from '@supabase/auth-js';
import AdminDashboard from './AdminDashboard';
import UserManagementPage from './UserManagementPage';
import PaymentQueuePage from './PaymentQueuePage';
import AdminStoreItemsPage from './AdminStoreItemsPage';
import ProductsManagementPage from './StoreManagementPage';
import AppSettingsPage from './AppSettingsPage';
import AdminTasksPage from './AdminTasksPage';
import AdminGiftCodesPage from './AdminGiftCodesPage';
import AdminCoverApprovalPage from './AdminCoverApprovalPage';
import AdminLuckRoyalePage from './AdminLuckRoyalePage';
import AdminSellSettingsPage from './AdminSellSettingsPage';
import AdminPresetAvatarsPage from './AdminPresetAvatarsPage';
import AdminStorageSetupPage from './AdminStorageSetupPage';
import { 
    ToolsIcon, ProfileIcon, CreditCardIcon, StoreIcon, SettingsIcon, 
    LogoutIcon, ClipboardListIcon, GiftIcon, PaintBrushIcon, CheckCircleIcon, TicketIcon, CoinIcon, UploadIcon
} from '../common/AppIcons';

interface AdminPanelProps {
    session: Session;
    onExitAdminView: () => void;
}

type AdminView = 'dashboard' | 'users' | 'payments' | 'products' | 'store_items' | 'settings' | 'tasks' | 'gift_codes' | 'cover_approvals' | 'luck_royale' | 'sell_settings' | 'preset_avatars' | 'storage_setup';

const AdminPanel: React.FC<AdminPanelProps> = ({ session, onExitAdminView }) => {
    const [view, setView] = useState<AdminView>('dashboard');

    const navItems: { id: AdminView; label: string; icon: React.ReactNode; tag?: string }[] = [
        { id: 'dashboard', label: 'Dashboard', icon: <ToolsIcon className="w-4 h-4"/>, tag: 'SYS' },
        { id: 'storage_setup', label: 'Storage & SQL Fix', icon: <UploadIcon className="w-4 h-4"/>, tag: 'SQL' },
        { id: 'users', label: 'User Manager', icon: <ProfileIcon className="w-4 h-4"/>, tag: 'USERS' },
        { id: 'preset_avatars', label: 'Preset Avatars', icon: <ProfileIcon className="w-4 h-4"/>, tag: 'IMG' },
        { id: 'payments', label: 'Payment Queue', icon: <CreditCardIcon className="w-4 h-4"/>, tag: 'TRX' },
        { id: 'cover_approvals', label: 'Cover Approvals', icon: <CheckCircleIcon className="w-4 h-4"/>, tag: 'CVR' },
        { id: 'products', label: 'Top-Up Products', icon: <PaintBrushIcon className="w-4 h-4"/>, tag: 'TOP' },
        { id: 'store_items', label: 'Bazaar Items', icon: <StoreIcon className="w-4 h-4"/>, tag: 'SHOP' },
        { id: 'sell_settings', label: 'Sell Settings', icon: <CoinIcon className="w-4 h-4"/>, tag: 'RATES' },
        { id: 'luck_royale', label: 'Luck Royale', icon: <TicketIcon className="w-4 h-4"/>, tag: 'SPIN' },
        { id: 'tasks', label: 'Task Engine', icon: <ClipboardListIcon className="w-4 h-4"/>, tag: 'TASKS' },
        { id: 'gift_codes', label: 'Gift Codes', icon: <GiftIcon className="w-4 h-4"/>, tag: 'GIFT' },
        { id: 'settings', label: 'App Config', icon: <SettingsIcon className="w-4 h-4"/>, tag: 'CFG' },
    ];

    const pages: Record<AdminView, React.ReactNode> = {
        dashboard: <AdminDashboard />,
        storage_setup: <AdminStorageSetupPage />,
        users: <UserManagementPage session={session} />,
        preset_avatars: <AdminPresetAvatarsPage />,
        payments: <PaymentQueuePage session={session} />,
        products: <ProductsManagementPage session={session} />,
        store_items: <AdminStoreItemsPage session={session} />,
        tasks: <AdminTasksPage />,
        gift_codes: <AdminGiftCodesPage session={session} />,
        settings: <AppSettingsPage />,
        cover_approvals: <AdminCoverApprovalPage session={session} />,
        luck_royale: <AdminLuckRoyalePage session={session} />,
        sell_settings: <AdminSellSettingsPage />,
    };

    const currentNavItem = navItems.find(item => item.id === view);

    return (
        <div className="min-h-screen flex bg-slate-100 font-sans text-slate-900 select-none">
            {/* Binance Light + Yellow Styled Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 shadow-sm">
                <div className="p-4 border-b border-slate-900 bg-yellow-400 text-slate-950 flex items-center justify-between">
                    <div>
                        <div className="text-base font-black tracking-wider text-slate-950 flex items-center gap-2">
                            <span className="inline-block w-3 h-3 bg-slate-950 rounded-none"></span>
                            NAXXIVO ADMIN
                        </div>
                        <div className="text-[10px] text-slate-800 font-mono font-bold tracking-tight mt-0.5">
                            BINANCE LIGHT PANEL • v3.0
                        </div>
                    </div>
                </div>

                {/* Sidebar Nav Buttons */}
                <nav className="flex-1 p-2.5 space-y-1.5 overflow-y-auto no-scrollbar">
                    {navItems.map(item => {
                        const active = view === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setView(item.id)}
                                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold border transition-none text-left rounded-none ${
                                    active
                                        ? 'bg-yellow-400 text-slate-950 border-slate-900 shadow-sm font-black'
                                        : 'bg-white hover:bg-yellow-50 text-slate-700 border-slate-200/90 hover:border-yellow-300'
                                }`}
                            >
                                <div className="flex items-center space-x-2.5 min-w-0">
                                    <span className={active ? 'text-slate-950' : 'text-slate-500'}>{item.icon}</span>
                                    <span className="truncate">{item.label}</span>
                                </div>
                                {item.tag && (
                                    <span className={`text-[9px] px-1.5 py-0.5 border font-mono ${
                                        active 
                                            ? 'bg-slate-950 text-yellow-400 border-slate-900 font-bold' 
                                            : 'bg-slate-100 text-slate-500 border-slate-200'
                                    }`}>
                                        {item.tag}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Exit Button */}
                <div className="p-3 border-t border-slate-200 bg-slate-50">
                    <button 
                        onClick={onExitAdminView} 
                        className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white border border-rose-700 text-xs font-bold transition-none"
                    >
                        <LogoutIcon className="w-4 h-4" />
                        <span>RETURN TO APP</span>
                    </button>
                </div>
            </aside>

            {/* Main Area */}
            <main className="flex-1 flex flex-col min-w-0 bg-slate-100 overflow-hidden">
                <header className="h-12 bg-white border-b border-slate-200 px-5 flex items-center justify-between shrink-0 shadow-sm">
                    <div className="flex items-center space-x-2 text-xs font-bold">
                        <span className="text-slate-400 font-mono">ADMIN</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-slate-900 font-extrabold flex items-center gap-1.5">
                            <span className="p-1 bg-yellow-400 text-slate-950 border border-slate-900 text-[10px]">
                                {currentNavItem?.icon}
                            </span>
                            <span>{currentNavItem?.label.toUpperCase()}</span>
                        </span>
                    </div>

                    <div className="flex items-center space-x-3 text-xs">
                        <div className="hidden sm:flex items-center space-x-2 text-[10px] text-slate-700 bg-yellow-50 px-2.5 py-1 border border-yellow-300 font-mono">
                            <span className="w-2 h-2 rounded-none bg-yellow-500 animate-pulse"></span>
                            <span className="font-bold text-slate-900">BINANCE LIGHT THEME ACTIVE</span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 p-4 sm:p-5 overflow-y-auto">
                    <div className="bg-white border border-slate-200 p-4 sm:p-5 shadow-sm min-h-full">
                        {pages[view]}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminPanel;
