import React, { useState } from 'react';
import { supabase } from '../../integrations/supabase/client';
import Button from '../common/Button';
import { BackArrowIcon, GoogleIcon, FacebookIcon, AppleIcon } from '../common/AppIcons';
import Input from '../common/Input';

interface AuthFormProps {
    mode: 'login' | 'signup';
    onSetMode: (mode: 'onboarding' | 'login' | 'signup') => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ mode, onSetMode }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [gender, setGender] = useState<'male' | 'female' | ''>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const isSignUp = mode === 'signup';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);
        setLoading(true);

        if (isSignUp) {
            if (!gender) {
                setError("Please select a gender.");
                setLoading(false);
                return;
            }

            const MALE_AVATAR = "https://i.pinimg.com/736x/01/7d/62/017d6298b0df4bc489d1a71857e6712a.jpg";
            const FEMALE_AVATAR = "https://i.pinimg.com/736x/82/59/37/825937c65e1e21ae4aaf25f167706c60.jpg";
            
            const photoUrl = gender === 'male' ? MALE_AVATAR : FEMALE_AVATAR;

            const { data, error: signUpError } = await (supabase.auth as any).signUp({
                email,
                password,
                options: {
                    data: { name, username, photo_url: photoUrl, gender: gender },
                },
            });
            if (signUpError) {
                setError(signUpError.message);
            } else if (data.user) {
                setMessage("Registration successful! Please check your email to confirm your account.");
            }
        } else {
            const { error: signInError } = await (supabase.auth as any).signInWithPassword({
                email,
                password,
            });
            if (signInError) {
                setError(signInError.message);
            }
        }
        setLoading(false);
    };

    const handleOAuthSignIn = async (provider: 'google' | 'facebook' | 'apple') => {
        setLoading(true);
        const { error } = await (supabase.auth as any).signInWithOAuth({
            provider: provider,
            options: {
                redirectTo: window.location.origin,
            },
        });
        if (error) {
            setError(error.message);
            setLoading(false);
        }
    };

    const toggleMode = () => {
        onSetMode(isSignUp ? 'login' : 'signup');
        setError(null);
        setMessage(null);
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-[var(--theme-bg)]">
            <div className="w-full max-w-md bg-[var(--theme-card-bg)] rounded-2xl shadow-lg border border-[var(--theme-secondary)]">
                <header className="flex items-center p-4 border-b border-[var(--theme-secondary)]">
                    <button onClick={() => onSetMode('onboarding')} className="p-2 rounded-full hover:bg-[var(--theme-secondary)] transition-colors">
                        <BackArrowIcon />
                    </button>
                    <h1 className="text-xl font-bold text-center flex-grow text-[var(--theme-text)]">
                        {isSignUp ? "Create Account" : "Welcome Back"}
                    </h1>
                    <div className="w-10"></div> {/* Spacer */}
                </header>

                <main className="p-8">
                    {message ? (
                        <div className="text-green-700 bg-green-100 p-4 rounded-lg my-4 text-center">
                            <p className="font-semibold">Success!</p>
                            <p>{message}</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {isSignUp && (
                                <>
                                    <Input id="name" label="Full Name" type="text" value={name} onChange={e => setName(e.target.value)} required disabled={loading} />
                                    <Input id="username" label="Username" type="text" value={username} onChange={e => setUsername(e.target.value)} required disabled={loading} />
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--theme-text-secondary)] mb-2">Gender</label>
                                        <div className="flex gap-4">
                                            {(['male', 'female'] as const).map((g) => (
                                                <label key={g} className="flex items-center gap-2 cursor-pointer p-1">
                                                    <input
                                                        type="radio"
                                                        name="gender"
                                                        value={g}
                                                        checked={gender === g}
                                                        onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                                                        className="h-4 w-4 text-[var(--theme-primary)] border-[var(--theme-input-border)] focus:ring-[var(--theme-primary)]"
                                                        required
                                                    />
                                                    <span className="capitalize text-[var(--theme-text)]">{g}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                            <Input id="email" label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} autoComplete="email" />
                            <Input id="password" label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} autoComplete={isSignUp ? "new-password" : "current-password"} />
                            
                            {!isSignUp && <a href="#" className="block text-right text-sm text-[var(--theme-primary)] hover:underline">Forgot Password?</a>}

                            {error && <p className="text-red-500 text-sm text-center pt-2">{error}</p>}

                            <div className="pt-2">
                                <Button type="submit" disabled={loading} variant="primary">
                                    {loading ? "Processing..." : (isSignUp ? "Sign Up" : "Login")}
                                </Button>
                            </div>
                        </form>
                    )}

                    {!message && (
                        <>
                            <div className="relative flex py-5 items-center">
                                <div className="flex-grow border-t border-[var(--theme-secondary)]"></div>
                                <span className="flex-shrink mx-4 text-xs uppercase text-[var(--theme-text-secondary)]">Or continue with</span>
                                <div className="flex-grow border-t border-[var(--theme-secondary)]"></div>
                            </div>
                            
                            <div className="flex items-center justify-center space-x-3">
                                <button onClick={() => handleOAuthSignIn('google')} disabled={loading} className="w-12 h-12 flex items-center justify-center rounded-full border border-[var(--theme-secondary)] hover:bg-[var(--theme-secondary)] transition-colors"><GoogleIcon /></button>
                                <button onClick={() => handleOAuthSignIn('facebook')} disabled={loading} className="w-12 h-12 flex items-center justify-center rounded-full border border-[var(--theme-secondary)] hover:bg-[var(--theme-secondary)] transition-colors"><FacebookIcon /></button>
                                <button onClick={() => handleOAuthSignIn('apple')} disabled={loading} className="w-12 h-12 flex items-center justify-center rounded-full border border-[var(--theme-secondary)] hover:bg-[var(--theme-secondary)] transition-colors"><AppleIcon /></button>
                            </div>
                        </>
                    )}
                </main>
                
                <footer className="text-center text-sm text-[var(--theme-text-secondary)] p-6 bg-[var(--theme-card-bg-alt)] rounded-b-2xl">
                    {isSignUp ? "Already have an account?" : "Don't have an account?"}{' '}
                    <button onClick={toggleMode} className="font-semibold text-[var(--theme-primary)] hover:underline">
                        {isSignUp ? "Log in" : "Sign up"}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default AuthForm;