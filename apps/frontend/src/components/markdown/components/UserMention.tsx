"use client";

import { api } from "#/lib/eden";
import React from "react";
import { Mention, Avatar, UserLink } from "./UserMention.styles";
import { m } from "#/paraglide/messages";
import { usePermissions } from "#/providers/PermissionsProvider";

async function getMention(userId: string) {
    const { data } = await api.users.mentions({ id: userId }).get();
    return data;
}

const userMentionCache = new Map<string, NonNullable<Awaited<ReturnType<typeof getMention>>> | null>();

export default React.memo(function UserMention({ userId, isAdmin, authorFormat }: { userId?: string | null; isAdmin?: boolean; authorFormat?: boolean }) {
    const { can } = usePermissions();
    const cacheKey = `${userId}-${isAdmin ? "admin" : "user"}`;
    const [data, setData] = React.useState<NonNullable<Awaited<ReturnType<typeof getMention>>> | null>(userId ? userMentionCache.get(cacheKey) || null : null);
    const [loading, setLoading] = React.useState<boolean>(Boolean(userId && !userMentionCache.has(cacheKey)));

    React.useEffect(() => {
        if (!userId) return;

        // Already cached?
        if (userMentionCache.has(cacheKey)) {
            setData(userMentionCache.get(cacheKey) || null);
            setLoading(false);
            return;
        }

        let ignore = false;
        setLoading(true);

        const fetchData = async () => {
            try {
                const data = await getMention(userId);

                if (!ignore) {
                    setData(data);
                    setLoading(false);
                }
                return;
            } catch {
                if (!ignore) {
                    setData(null);
                    setLoading(false);
                    userMentionCache.set(cacheKey, null);
                }
            }
        };

        fetchData();

        return () => {
            ignore = true;
        };
    }, [cacheKey, isAdmin, userId]);

    // Loading placeholder using i18n
    if (loading) return <Mention $authorFormat={authorFormat}>{m["mentions.loading"]()}</Mention>;

    // Deleted user (empty object)
    if (data && Object.keys(data).length === 0) return <Mention $authorFormat={authorFormat}>{m["mentions.deleted"]()}</Mention>;

    // Restricted: id present but no name
    if (data && data._id && !data.name) return <Mention $authorFormat={authorFormat}>{m["mentions.restricted"]()}</Mention>;

    // Displayable user
    if (data && data._id && data.name) {
        const showImage = Boolean(data.image);
        const canSee = can("read", `users.${data._id}`);
        const linkable = data.showProfilePublicly || canSee;
        const dotted = !data.showProfilePublicly && canSee;

        const content = (
            <Mention $loaded $isLink={linkable} $isDotted={dotted} $authorFormat={authorFormat} data-no-ai-translate>
                {showImage ? <Avatar width={18} height={18} src={data.image} alt={data.name} /> : null}
                {data.name}
            </Mention>
        );

        if (linkable) {
            return <UserLink href={`/user/${encodeURIComponent(data._id)}`}>{content}</UserLink>;
        }
        return content;
    }

    // Fallback
    return <Mention $authorFormat={authorFormat}>{m["mentions.loading"]()}</Mention>;
});
