import React, { useState } from 'react';
import { supabase } from '../../integrations/supabase/client';
import Button from '../common/Button';
import Input from '../common/Input';
import { BackArrowIcon } from '../common/AppIcons';
import type { NotificationDetails } from '../common/NotificationPopup';

interface PasswordSecurityPageProps {
    onBack: () => void;
    showNotification: (details: NotificationDetails) => void;
}

const PasswordSecurityPage: React.FC<PasswordSecurityPageProps> = ({ onBack, showNotification }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSavePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsSaving(true);
        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (updateError) throw updateError;
            
            showNotification({
                type: 'success',
                title: 'Password Updated',
                message: 'Your password has been changed successfully.'
            });
            onBack();

        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--theme-bg)]">
            <header className="flex items-center p-4 border-b border-[var(--theme-secondary)]/30 bg-[var(--theme-header-bg)] sticky top-0 z-10">
                <button onClick={onBack} className="text-[var(--theme-header-text)] hover:opacity-80"><BackArrowIcon /></button>
                <h1 className="text-xl font-bold text-[var(--theme-header-text)] mx-auto">Security & Password</h1>
                <div className="w-6"></div>
            </header>
            
            <main className="p-4">
                <form onSubmit={handleSavePassword} className="space-y-6 bg-[var(--theme-card-bg)] p-6 rounded-2xl shadow-sm">
                    <Input
                        id="newPassword"
                        label="New Password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={isSaving}
                        required
                        autoComplete="new-password"
                    />
                    <Input
                        id="confirmPassword"
                        label="Confirm New Password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isSaving}
                        required
                        autoComplete="new-password"
                    />
                    
                    {error && <p className="text-red-500 text-sm text-center pt-2">{error}</p>}

                    <div className="pt-2">
                        <Button type="submit" disabled={isSaving || !newPassword}>
                            {isSaving ? 'Saving...' : 'Save Password'}
                        </Button>
                    </div>
                </form>
            </main>
        </div>
    );
};

export default PasswordSecurityPage;