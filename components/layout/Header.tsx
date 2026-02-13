'use client';

import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';

export function Header() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setLoading(false);
        };
        getUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [supabase.auth]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    return (
        <header className="sticky top-0 z-50 w-full bg-base-100 border-b-2 border-neutral">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                <Link href="/" className="flex items-center gap-2.5">
                    <img src="/assets/logo.svg" alt="Axon logo" className="w-8 h-8" />
                    <span className="text-xl font-bold tracking-tight text-primary">
                        Axon
                    </span>
                </Link>
                <div className="flex-none flex items-center gap-2">
                    {loading ? (
                        <div className="w-20 h-8 bg-base-300 animate-pulse"></div>
                    ) : user ? (
                        <div className="flex items-center gap-2">
                            <div className="dropdown dropdown-end">
                                <div tabIndex={0} role="button" className="btn btn-ghost btn-square avatar">
                                    <div className="w-10 bg-neutral text-neutral-content flex items-center justify-center">
                                        <span>{user.email?.[0].toUpperCase()}</span>
                                    </div>
                                </div>
                                <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 border-2 border-neutral w-52">
                                    <li className="menu-title px-4 py-2 opacity-50 text-xs uppercase font-bold tracking-widest">{user.email}</li>
                                    <li><a>Profile</a></li>
                                    <li><a>Settings</a></li>
                                    <div className="divider my-1"></div>
                                    <li><button onClick={handleLogout} className="text-error font-bold">Logout</button></li>
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link href="/login" className="btn btn-ghost btn-sm">Login</Link>
                            <Link href="/signup" className="btn btn-primary btn-sm px-6">Sign Up</Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
