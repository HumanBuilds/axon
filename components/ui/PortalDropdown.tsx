'use client';

import { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react';
import { Portal } from './Portal';

interface Position {
    top: number | 'auto';
    bottom: number | 'auto';
    left: number;
}

interface PortalDropdownProps {
    triggerRef: React.RefObject<HTMLElement | null>;
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    className?: string;
    maxHeight?: number;
}

export function PortalDropdown({
    triggerRef,
    isOpen,
    onClose,
    children,
    className = '',
    maxHeight = 192,
}: PortalDropdownProps) {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<Position>({ top: 0, bottom: 'auto', left: 0 });

    const calculatePosition = useCallback(() => {
        const trigger = triggerRef.current;
        if (!trigger) return;

        const rect = trigger.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const shouldOpenUp = spaceBelow < maxHeight && spaceAbove > spaceBelow;

        setPosition({
            top: shouldOpenUp ? 'auto' : rect.bottom + 4,
            bottom: shouldOpenUp ? window.innerHeight - rect.top + 4 : 'auto',
            left: rect.left,
        });
    }, [triggerRef, maxHeight]);

    // Calculate position synchronously on open (useLayoutEffect runs before paint)
    useLayoutEffect(() => {
        if (isOpen) {
            calculatePosition();
        }
    }, [isOpen, calculatePosition]);

    // Reposition on scroll/resize
    useEffect(() => {
        if (!isOpen) return;

        const handleScroll = () => calculatePosition();
        const handleResize = () => calculatePosition();

        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleResize);
        };
    }, [isOpen, calculatePosition]);

    // Handle click outside
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            const trigger = triggerRef.current;
            const dropdown = dropdownRef.current;
            const target = e.target as Node;

            if (
                trigger &&
                !trigger.contains(target) &&
                dropdown &&
                !dropdown.contains(target)
            ) {
                onClose();
            }
        };

        // Use setTimeout to avoid immediate closing from the click that opened it
        const timeoutId = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 0);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose, triggerRef]);

    // Handle escape key
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <Portal>
            <div
                ref={dropdownRef}
                className={className}
                style={{
                    position: 'fixed',
                    top: position.top === 'auto' ? undefined : position.top,
                    bottom: position.bottom === 'auto' ? undefined : position.bottom,
                    left: position.left,
                    zIndex: 9999,
                    maxHeight,
                }}
            >
                {children}
            </div>
        </Portal>
    );
}
