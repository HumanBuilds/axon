import Link from 'next/link';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-base-100 flex flex-col">
            <header className="navbar bg-base-200 shadow-sm px-4">
                <div className="flex-1">
                    <Link href="/" className="btn btn-ghost text-xl font-bold tracking-tighter">
                        AXON
                    </Link>
                </div>
                <div className="flex-none gap-2">
                    <Link href="/decks" className="btn btn-ghost">Decks</Link>
                    <div className="dropdown dropdown-end">
                        <div tabIndex={0} role="button" className="btn btn-ghost btn-square avatar">
                            <div className="w-10 rounded bg-neutral text-neutral-content flex items-center justify-center">
                                <span>U</span>
                            </div>
                        </div>
                        <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
                            <li><a>Profile</a></li>
                            <li><a>Settings</a></li>
                            <li><a>Logout</a></li>
                        </ul>
                    </div>
                </div>
            </header>
            <main className="flex-1">
                {children}
            </main>
            <footer className="footer footer-center p-4 bg-base-300 text-base-content text-xs opacity-50">
                <aside>
                    <p>Axon Flashcards © 2026 - Powered by FSRS</p>
                </aside>
            </footer>
        </div>
    );
}
