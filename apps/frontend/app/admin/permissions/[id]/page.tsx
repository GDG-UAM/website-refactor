"use client";

import { AdminPermissionsFormPage } from "#/components/pages/admin/permissions/AdminPermissionsFormPage";
import { api } from "#/lib/eden";
import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import { newErrorToast } from "#/components/Toast";
import Loading from "#app/loading.tsx";

export default function Page() {
    const { id } = useParams() as { id: string };
    const [initialData, setInitialData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const { data, error } = await api.admin.permissions({ id }).get();
                if (!error && data) {
                    setInitialData(data);
                } else {
                    newErrorToast("Failed to load template");
                }
            } catch (e) {
                console.error(e);
                newErrorToast("Failed to load template");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [id]);

    if (loading) return <Loading />;
    if (!initialData) return notFound();

    return <AdminPermissionsFormPage id={id} initialData={initialData} />;
}
