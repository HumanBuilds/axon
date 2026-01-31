'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const supabase = createClient();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            setSuccess(true);
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-transparent">
                <div className="card w-full max-w-md bg-base-100 shadow-xl text-center">
                    <div className="card-body">
                        <h2 className="text-3xl font-black mb-4">Check your email!</h2>
                        <p className="opacity-60 mb-8">
                            We've sent a confirmation link to <strong>{email}</strong>. Please verify your account to get started.
                        </p>
                        <Link href="/login" className="btn btn-primary">
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-transparent">
            <div className="card w-full max-w-md bg-base-100 shadow-xl">
                <div className="card-body">
                    <div className="flex flex-col items-center mb-6">
                        <Link href="/" className="text-4xl font-black tracking-tighter mb-2">AXON</Link>
                        <h2 className="text-xl opacity-60">Create your account</h2>
                    </div>

                    <form onSubmit={handleSignup} className="space-y-4">
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
                            <p className="text-xs opacity-50 mt-2 px-1">
                                Must be at least 6 characters long.
                            </p>
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
                                {loading ? 'Creating account...' : 'Sign Up'}
                            </button>
                        </div>
                    </form>

                    <div className="divider">OR</div>

                    <p className="text-center text-sm opacity-60">
                        Already have an account? <Link href="/login" className="link link-primary font-bold">Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
