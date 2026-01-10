"use client";

import { AdminCertificatesFormPage } from "#/components/pages/admin/hackathons/certificates/AdminCertificatesFormPage";
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
                const { data, error } = await api.admin.hackathons({ id }).get();
                if (!error && data) {
                    setInitialData(data);
                } else {
                    newErrorToast(m["admin.hackathons.toasts.loadError"]());
                }
            } catch (e) {
                console.error(e);
                newErrorToast(m["admin.hackathons.toasts.loadError"]());
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [id]);

    if (loading) return <Loading />;
    if (!initialData) return notFound();

    return <AdminCertificatesFormPage id={id} initialData={initialData} />;
}
