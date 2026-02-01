'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.push('/');
            router.refresh();
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center py-12">
            <div className="card w-full max-w-md bg-base-100 shadow-xl">
                <div className="card-body">
                    <div className="flex flex-col items-center mb-6">
                        <Link href="/" className="text-4xl font-black tracking-tighter mb-2">AXON</Link>
                        <h2 className="text-xl opacity-60">Welcome back</h2>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Email</span>
                            </label>
                            <input
                                type="email"
                                className="input input-bordered"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Password</span>
                            </label>
                            <input
                                type="password"
                                className="input input-bordered"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <label className="label">
                                <a href="#" className="label-text-alt link link-hover">Forgot password?</a>
                            </label>
                        </div>

                        {error && (
                            <div className="alert alert-error text-sm py-2">
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="form-control mt-6">
                            <button
                                className={`btn btn-primary ${loading ? 'loading' : ''}`}
                                disabled={loading}
                            >
                                {loading ? 'Logging in...' : 'Login'}
                            </button>
                        </div>
                    </form>

                    <div className="divider">OR</div>

                    <p className="text-center text-sm opacity-60">
                        Don't have an account? <Link href="/signup" className="link link-primary font-bold">Sign up</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
