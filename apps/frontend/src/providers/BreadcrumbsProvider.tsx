"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";

export type BreadcrumbItem = {
    label: string;
    href?: string;
    warning?: string | boolean;
    noTranslate?: boolean;
};

interface BreadcrumbsContextType {
    register: (id: string, items: BreadcrumbItem[]) => void;
    unregister: (id: string) => void;
    items: BreadcrumbItem[];
}

const BreadcrumbsContext = createContext<BreadcrumbsContextType | undefined>(undefined);

export function BreadcrumbsProvider({ children }: { children: React.ReactNode }) {
    const [registry, setRegistry] = useState<Record<string, { items: BreadcrumbItem[]; order: number }>>({});
    const counter = React.useRef(0);

    const register = useCallback((id: string, items: BreadcrumbItem[]) => {
        setRegistry((prev) => {
            const order = prev[id]?.order ?? counter.current++;
            return { ...prev, [id]: { items, order } };
        });
    }, []);

    const unregister = useCallback((id: string) => {
        setRegistry((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    }, []);

    // Sort by href length or depth to ensure root is always first
    // Items without href (current page) should be last
    const items = useMemo(() => {
        const groups = Object.entries(registry).map(([id, group]) => {
            const depths = group.items.map((it) => (it.href ? it.href.split("/").length : Infinity));
            const minDepth = Math.min(...depths);
            return { items: group.items, minDepth, order: group.order };
        });

        return groups
            .sort((a, b) => {
                if (a.minDepth !== b.minDepth) return a.minDepth - b.minDepth;
                return a.order - b.order;
            })
            .flatMap((g) => g.items);
    }, [registry]);

    return <BreadcrumbsContext.Provider value={{ register, unregister, items }}>{children}</BreadcrumbsContext.Provider>;
}

export function useBreadcrumbs() {
    const context = useContext(BreadcrumbsContext);
    if (!context) {
        throw new Error("useBreadcrumbs must be used within a BreadcrumbsProvider");
    }
    return context;
}

/**
 * Hook to register breadcrumbs within a layout or page
 */
export function useRegisterBreadcrumbs(items: BreadcrumbItem[]) {
    const { register, unregister } = useBreadcrumbs();
    const id = React.useId();

    React.useEffect(() => {
        register(id, items);
        return () => unregister(id);
    }, [id, register, unregister, JSON.stringify(items)]);
}
/**
 * Component version for use in Server Components
 */
export function RegisterBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
    useRegisterBreadcrumbs(items);
    return null;
}
