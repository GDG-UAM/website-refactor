import { buildSectionMetadata } from "#/lib/metadata";
import UserProfile from "#/components/pages/user/UserProfile";
import { serverApi } from "#/lib/eden-server";
import { notFound } from "next/navigation";
import { cache } from "react";

// Helper to fetch user data - wrapped with cache to deduplicate requests
const getUserData = cache(async (userId: string) => {
    const { data, error } = await serverApi.users({ userId }).get();
    if (error) {
        return null;
    }
    return data;
});

// Extract type from API response
export type UserProfileData = NonNullable<Awaited<ReturnType<typeof getUserData>>>;

export async function generateMetadata(context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    const data = await getUserData(id);
    if (!data) {
        return buildSectionMetadata("userProfile", "", "");
    }
    const name = data.name;
    const description = data.shortBio?.slice(0, 160) || "";
    return buildSectionMetadata("userProfile", name, description);
}

export default async function UserProfilePage(context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    const data = await getUserData(id);

    if (!data) {
        notFound();
    }

    return <UserProfile data={data} />;
}
