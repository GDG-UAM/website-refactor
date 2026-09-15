import React from "react";
import { buildSectionMetadata } from "#/lib/metadata";

export async function generateMetadata() {
    return buildSectionMetadata("links");
}

export default function LinksLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
