import type { Metadata } from "next";
import * as m from "#/paraglide/messages";

export async function buildSectionMetadata(section: string, entityName: string = "", descriptionOverride: string = ""): Promise<Metadata> {
    // @ts-ignore
    const sectionNameFn = m[`${section}.pageTitle`];
    const sectionName = sectionNameFn ? sectionNameFn() : undefined;
    const preTitle = entityName ? `${entityName} - ` : "";
    const title = preTitle + (sectionName ? `${sectionName} - ${m["metadata.title"]()}` : m["metadata.title"]());

    if (descriptionOverride) {
        return { title, description: descriptionOverride } satisfies Metadata;
    }

    // @ts-ignore
    const sectionDescriptionFn = m[`${section}.pageDescription`];
    const sectionDescription = sectionDescriptionFn ? sectionDescriptionFn() : undefined;
    const description = sectionDescription ?? m["metadata.description"]();

    return { title, description } satisfies Metadata;
}
