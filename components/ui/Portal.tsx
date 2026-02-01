'use client';

import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
    children: React.ReactNode;
}

// Client-side subscription that never changes
const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function Portal({ children }: PortalProps) {
    // useSyncExternalStore handles SSR/hydration safely without causing extra renders
    const isMounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    if (!isMounted) return null;

    return createPortal(children, document.body);
}
