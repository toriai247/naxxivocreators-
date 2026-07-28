import React, { useState } from 'react';
import type { Session } from '@supabase/auth-js';
import AdminDashboard from './AdminDashboard';
import UserManagementPage from './UserManagementPage';
import PaymentQueuePage from './PaymentQueuePage';
import AdminStoreItemsPage from './AdminStoreItemsPage'; // Manages store_items (Bazaar)
import ProductsManagementPage from './StoreManagementPage'; // Manages products (TopUp)
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
import { motion, AnimatePresence } from 'framer-motion';

interface AdminPanelProps {
    session: Session;
    onExitAdminView: () => void;
}

type AdminView = 'dashboard' | 'users' | 'payments' | 'products' | 'store_items' | 'settings' | 'tasks' | 'gift_codes' | 'cover_approvals' | 'luck_royale' | 'sell_settings' | 'preset_avatars' | 'storage_setup';

const AdminPanel: React.FC<AdminPanelProps> = ({ session, onExitAdminView }) => {
    const [view, setView] = useState<AdminView>('dashboard');

    // FIX: The type for the icon property was too specific (JSX.Element), causing a namespace conflict. Changed to React.ReactNode for better compatibility.
    const navItems: { id: AdminView; label: string; icon: React.ReactNode }[] = [
        { id: 'dashboard', label: 'Dashboard', icon: <ToolsIcon className="w-5 h-5"/> },
        { id: 'storage_setup', label: 'Storage & SQL Fix', icon: <UploadIcon className="w-5 h-5"/> },
        { id: 'users', label: 'Users', icon: <ProfileIcon className="w-5 h-5"/> },
        { id: 'preset_avatars', label: 'Preset Avatars', icon: <ProfileIcon className="w-5 h-5"/> },
        { id: 'payments', label: 'Payments', icon: <CreditCardIcon className="w-5 h-5"/> },
        { id: 'cover_approvals', label: 'Cover Approvals', icon: <CheckCircleIcon className="w-5 h-5"/> },
        { id: 'products', label: 'Top-Up Products', icon: <PaintBrushIcon className="w-5 h-5"/> },
        { id: 'store_items', label: 'Bazaar Items', icon: <StoreIcon className="w-5 h-5"/> },
        { id: 'sell_settings', label: 'Sell Settings', icon: <CoinIcon className="w-5 h-5"/> },
        { id: 'luck_royale', label: 'Luck Royale', icon: <TicketIcon className="w-5 h-5"/> },
        { id: 'tasks', label: 'Tasks', icon: <ClipboardListIcon className="w-5 h-5"/> },
        { id: 'gift_codes', label: 'Gift Codes', icon: <GiftIcon className="w-5 h-5"/> },
        { id: 'settings', label: 'App Settings', icon: <SettingsIcon className="w-5 h-5"/> },
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
        <div className="min-h-screen flex bg-[var(--theme-bg)] font-sans text-[var(--theme-text)]">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-md flex flex-col flex-shrink-0 border-r border-[var(--theme-secondary)]">
                <div className="p-5 text-2xl font-bold font-logo text-center border-b border-[var(--theme-secondary)] text-[var(--theme-text)]">
                    Naxxivo
                    <span className="block text-xs font-sans font-semibold text-gray-400 tracking-wider">ADMIN</span>
                </div>
                <nav className="flex-1 px-4 py-4 space-y-2">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setView(item.id)}
                            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${
                                view === item.id 
                                ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-lg shadow-[var(--theme-primary)]/30' 
                                : 'text-[var(--theme-text-secondary)] hover:bg-[var(--theme-secondary-hover)]'
                            }`}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-[var(--theme-secondary)]">
                    <button onClick={onExitAdminView} className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors text-sm font-medium">
                        <LogoutIcon className="w-5 h-5" />
                        <span>Return to App</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                 <header className="bg-white/80 backdrop-blur-sm shadow-sm p-5 border-b border-[var(--theme-secondary)] flex items-center space-x-4">
                    {currentNavItem && <div className="text-[var(--theme-primary)]">{currentNavItem.icon}</div>}
                    <h1 className="text-xl font-bold text-[var(--theme-text)] capitalize">
                        {currentNavItem?.label || view.replace(/_/g, ' ')}
                    </h1>
                </header>
                <div className="flex-1 p-6 overflow-y-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={view}
                            {...{
                                initial: { opacity: 0, y: 20 },
                                animate: { opacity: 1, y: 0 },
                                exit: { opacity: 0, y: -20 },
                                transition: { duration: 0.2 },
                            } as any}
                             className="bg-white p-6 rounded-lg shadow-sm"
                        >
                            {pages[view]}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

export default AdminPanel;
