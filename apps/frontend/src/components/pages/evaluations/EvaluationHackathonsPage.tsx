"use client";

import { useEffect, useState } from "react";
import { api } from "#/lib/eden";
import AdminNavigation from "../admin/AdminNavigation";
import { Container } from "../admin/AdminPage.styles";
import * as m from "#/paraglide/messages";

export function EvaluationHackathonsPage() {
    const [hackathons, setHackathons] = useState<{ _id: string; title: string; slug: string }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const { data, error } = await api.evaluations.hackathons.get();
                if (!error && data) setHackathons(data as any);
            } catch (e) {
                console.error("Failed to load hackathons:", e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading) return <Container>{m["evaluations.hackathonsLoading"]()}</Container>;

    const categories = [
        {
            title: m["evaluations.selectHackathon"](),
            buttons: hackathons.map(h => ({
                label: h.title,
                type: "hackathons" as const,
                href: `/evaluations/${h._id}`,
                noTranslate: true
            }))
        }
    ];

    return (
        <AdminNavigation
            title={m["evaluations.pageTitle"]()}
            categories={categories}
        />
    );
}
