"use client";

import { AdminEventsFormPage } from "#/components/pages/admin/events/AdminEventsFormPage";
import { api } from "#/lib/eden";
import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import { newErrorToast } from "#/components/Toast";
import * as m from "#/paraglide/messages";
import Loading from "#app/loading.tsx";

export default function Page() {
    const { id } = useParams() as { id: string };
    const [initialData, setInitialData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const { data, error } = await api.admin.events({ id }).get();
                if (!error && data) {
                    setInitialData(data);
                } else {
                    newErrorToast(m["admin.events.toasts.loadError"]());
                }
            } catch (e) {
                console.error(e);
                newErrorToast(m["admin.events.toasts.loadError"]());
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [id]);

    if (loading) return <Loading />;
    if (!initialData) return notFound();

    return <AdminEventsFormPage id={id} initialData={initialData} />;
}
