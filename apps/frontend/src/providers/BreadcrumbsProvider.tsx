"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";

export type BreadcrumbItem = {
    label: string;
    href?: string;
};

interface BreadcrumbsContextType {
    register: (id: string, items: BreadcrumbItem[]) => void;
    unregister: (id: string) => void;
    items: BreadcrumbItem[];
}

const BreadcrumbsContext = createContext<BreadcrumbsContextType | undefined>(undefined);

export function BreadcrumbsProvider({ children }: { children: React.ReactNode }) {
    const [registry, setRegistry] = useState<Record<string, BreadcrumbItem[]>>({});

    const register = useCallback((id: string, items: BreadcrumbItem[]) => {
        setRegistry((prev) => ({ ...prev, [id]: items }));
    }, []);

    const unregister = useCallback((id: string) => {
        setRegistry((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    }, []);

    // Sort by href length or depth to ensure root is always first
    const items = useMemo(() => {
        return Object.values(registry)
            .flat()
            .sort((a, b) => {
                const depthA = a.href?.split("/").length || 0;
                const depthB = b.href?.split("/").length || 0;
                return depthA - depthB;
            });
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
