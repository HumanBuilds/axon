'use client';

import { getDisplayName, isExecutableLanguage, POPULAR_LANGUAGES } from '@/lib/code/languages';
import { PortalDropdown } from './PortalDropdown';

type Variant = 'dark' | 'light';

interface LanguageSelectDropdownProps {
    triggerRef: React.RefObject<HTMLElement | null>;
    isOpen: boolean;
    onClose: () => void;
    onSelect: (language: string) => void;
    currentLanguage?: string;
    variant?: Variant;
}

const variantStyles: Record<Variant, { container: string; item: string; itemActive: string; badge: string }> = {
    dark: {
        container: 'bg-[#1c2128] border border-white/10 rounded-lg shadow-xl p-1 min-w-36 overflow-hidden pb-3',
        item: 'text-white/60 hover:bg-white/5 hover:text-white',
        itemActive: 'bg-white/10 text-white',
        badge: 'text-[8px] font-bold uppercase text-green-500/60',
    },
    light: {
        container: 'bg-base-100 border border-base-300 rounded-lg shadow-xl p-2 min-w-48 overflow-hidden pb-3',
        item: 'hover:bg-base-200',
        itemActive: 'bg-base-200',
        badge: 'text-[9px] font-bold uppercase tracking-wider text-green-500 opacity-60',
    },
};

export function LanguageSelectDropdown({
    triggerRef,
    isOpen,
    onClose,
    onSelect,
    currentLanguage,
    variant = 'dark',
}: LanguageSelectDropdownProps) {
    const styles = variantStyles[variant];

    const handleSelect = (lang: string) => {
        onSelect(lang);
        onClose();
    };

    return (
        <PortalDropdown
            triggerRef={triggerRef}
            isOpen={isOpen}
            onClose={onClose}
            className={styles.container}
        >
            {variant === 'light' && (
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 px-2 py-1">
                    Select Language
                </div>
            )}
            <div className="max-h-46 overflow-y-auto">
                {POPULAR_LANGUAGES.map((lang) => (
                    <button
                        key={lang}
                        type="button"
                        onClick={() => handleSelect(lang)}
                        className={`w-full text-left px-2 rounded flex items-center justify-between gap-2 ${variant === 'light' ? 'py-1.5 text-sm' : 'py-1 text-xs'
                            } ${lang === currentLanguage ? styles.itemActive : styles.item}`}
                    >
                        <span>{getDisplayName(lang)}</span>
                        {isExecutableLanguage(lang) && (
                            <span className={styles.badge}>Run</span>
                        )}
                    </button>
                ))}
            </div>
        </PortalDropdown>
    );
}
