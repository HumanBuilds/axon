'use client';

import Link from 'next/link';

export function Sidebar() {
    return (
        <aside className="hidden lg:flex flex-col w-64 gap-6 shrink-0">
            <div className="flex flex-col gap-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-base-content/70 mb-2 px-3">
                    Library
                </p>
                <nav className="flex flex-col gap-1">
                    <Link
                        href="/"
                        className="flex items-center gap-3 px-3 py-2 bg-primary/10 text-primary font-semibold text-sm"
                    >
                        <span className="material-symbols-outlined text-[20px]">layers</span>
                        All Decks
                    </Link>
                    <a
                        href="#"
                        className="flex items-center gap-3 px-3 py-2 text-base-content/70 hover:bg-base-100 hover:text-base-content transition-colors text-sm"
                    >
                        <span className="material-symbols-outlined text-[20px]">schedule</span>
                        Recent
                    </a>
                    <a
                        href="#"
                        className="flex items-center gap-3 px-3 py-2 text-base-content/70 hover:bg-base-100 hover:text-base-content transition-colors text-sm"
                    >
                        <span className="material-symbols-outlined text-[20px]">star_outline</span>
                        Starred
                    </a>
                    <a
                        href="#"
                        className="flex items-center gap-3 px-3 py-2 text-base-content/70 hover:bg-base-100 hover:text-base-content transition-colors text-sm"
                    >
                        <span className="material-symbols-outlined text-[20px]">folder_open</span>
                        Folders
                    </a>
                </nav>
            </div>
        </aside>
    );
}
