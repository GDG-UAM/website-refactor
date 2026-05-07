"use client";

import { useEffect, useState } from "react";
import { api } from "#/lib/eden";
import { useSession } from "#/providers/SessionProvider";

export function useIsJudge() {
    const { data: session } = useSession();
    const [isJudge, setIsJudge] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!session?.user) {
            setIsJudge(false);
            setLoading(false);
            return;
        }

        async function check() {
            try {
                const { data } = await api.evaluations["is-judge"].get();
                if (!data) {
                    console.error("No data received from is-judge endpoint");
                    setIsJudge(false);
                    return;
                }
                if ("isJudge" in data) {
                    setIsJudge(!!data.isJudge);
                } else if (data.error) {
                    console.error("Error from is-judge endpoint:", data.error);
                    setIsJudge(false);
                } else {
                    console.warn("Unexpected response from is-judge endpoint:", data);
                    setIsJudge(false);
                }
            } catch (e) {
                console.error("Failed to check judge status:", e);
                setIsJudge(false);
            } finally {
                setLoading(false);
            }
        }

        check();
    }, [session]);

    return { isJudge, loading };
}
