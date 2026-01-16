import { api } from "#/lib/eden";

export interface ResourceNode {
    label: string;
    path: string;
    children?: Record<string, ResourceNode | "id" | "wildcard">;
    fields?: string[];
    // Declarative searcher for nodes that represent an id type
    search?: (query: string, parents: string[]) => Promise<{ label: string; value: string }[]>;
}

export const RESOURCE_TREE: Record<string, ResourceNode> = {
    users: {
        label: "Users (Public)",
        path: "users",
        children: {
            "{id}": "id",
            "*": "wildcard"
        },
        search: async (search: string) => {
            const { data } = await api.admin.users.get({ query: { search, pageSize: 50 } });
            return (data?.items || []).map((u) => ({
                label: `${u.displayName || u.name} (${u.email})`,
                value: u._id
            }));
        }
    },
    admin: {
        label: "Admin",
        path: "admin",
        children: {
            "*": "wildcard",
            users: {
                label: "Users",
                path: "admin.users",
                children: {
                    "{id}": "id",
                    "*": "wildcard"
                },
                fields: ["role", "templatesUsed", "individualPermissions"],
                search: async (search: string) => {
                    const { data } = await api.admin.users.get({ query: { search, pageSize: 50 } });
                    return (data?.items || []).map((u) => ({
                        label: `${u.displayName || u.name} (${u.email})`,
                        value: u._id
                    }));
                }
            },
            links: {
                label: "Links",
                path: "admin.links",
                children: {
                    "{id}": "id",
                    "*": "wildcard"
                },
                fields: ["title", "slug", "destination", "description"],
                search: async (search: string) => {
                    const { data } = await api.admin.links.get({ query: { search, pageSize: 50 } });
                    return (data?.items || []).map((l) => ({ label: l.title, value: l._id }));
                }
            },
            events: {
                label: "Events",
                path: "admin.events",
                children: {
                    "{id}": "id",
                    "*": "wildcard"
                },
                fields: ["title", "slug", "description", "date", "location", "image", "status", "url", "blogUrl", "markdownContent"],
                search: async (search: string) => {
                    const { data } = await api.admin.events.get({ query: { search, pageSize: 50 } });
                    return (data?.items || []).map((e) => ({ label: e.title, value: e._id }));
                }
            },
            articles: {
                label: "Articles",
                path: "admin.articles",
                children: {
                    blog: {
                        label: "Blog",
                        path: "admin.articles.blog",
                        children: {
                            "{id}": "id",
                            "*": "wildcard"
                        },
                        search: async (search: string) => {
                            const { data } = await api.admin.articles.get({ query: { type: "blog", search, pageSize: 50 } });
                            return (data?.items || []).map((a) => ({ label: (a.title as any).en || (a.title as any).es || a._id, value: a._id }));
                        },
                        fields: ["title", "slug", "coverImage", "status", "publishedAt", "authors", "excerpt", "content"]
                    },
                    newsletter: {
                        label: "Newsletter",
                        path: "admin.articles.newsletter",
                        children: {
                            "{id}": "id",
                            "*": "wildcard"
                        },
                        search: async (search: string) => {
                            const { data } = await api.admin.articles.get({ query: { type: "newsletter", search, pageSize: 50 } });
                            return (data?.items || []).map((a) => ({ label: (a.title as any).en || (a.title as any).es || a._id, value: a._id }));
                        },
                        fields: ["title", "slug", "coverImage", "status", "publishedAt", "excerpt", "content"]
                    }
                },
                fields: ["title", "slug", "coverImage", "status", "publishedAt", "authors", "excerpt", "content"]
            },
            certificates: {
                label: "Certificates",
                path: "admin.certificates",
                children: {
                    "{id}": "id",
                    "*": "wildcard"
                },
                fields: ["recipientUserId", "title", "designId", "description", "startDate", "endDate", "type", "signatures", "metadata"],
                search: async (search: string) => {
                    const { data } = await api.admin.certificates.get({ query: { search, pageSize: 50 } });
                    return (data?.items || []).map((c) => ({ label: `Cert: ${c._id}`, value: c._id }));
                }
            },
            permissions: {
                label: "Permissions",
                path: "admin.permissions",
                children: {
                    "{id}": "id",
                    "*": "wildcard"
                },
                fields: ["name", "description", "permissions"],
                search: async (search: string) => {
                    const { data } = await api.admin.permissions.get();
                    return (data || [])
                        .filter((p) => (p as any).name.toLowerCase().includes(search.toLowerCase()))
                        .map((p) => ({ label: (p as any).name, value: (p as any)._id }));
                }
            },
            hackathons: {
                label: "Hackathons",
                path: "admin.hackathons",
                children: {
                    "{id}": {
                        label: "Specific Hackathon",
                        path: "admin.hackathons.{id}",
                        children: {
                            "*": "wildcard",
                            teams: {
                                label: "Teams",
                                path: "admin.hackathons.{id}.teams",
                                children: {
                                    "{id}": {
                                        label: "Specific Team",
                                        path: "admin.hackathons.{id}.teams.{id}",
                                        children: {
                                            "*": "wildcard",
                                            certificates: {
                                                label: "Certificates",
                                                path: "admin.hackathons.{id}.teams.{id}.certificates",
                                                children: {
                                                    "{id}": {
                                                        label: "Specific Certificate",
                                                        path: "admin.hackathons.{id}.teams.{id}.certificates.{id}",
                                                        fields: ["description", "type", "metadata", "signatures"]
                                                    },
                                                    "*": "wildcard"
                                                },
                                                fields: ["description", "type", "metadata", "signatures"],
                                                search: async (search, parents) => {
                                                    const hackathonId = parents[2];
                                                    const teamId = parents[4];
                                                    const { data } = await api.admin.certificates.templates.get({
                                                        query: { hackathonId, teamId, search, pageSize: 50 }
                                                    });
                                                    return (data?.items || []).map((c) => ({
                                                        label: `Cert: ${c._id}`,
                                                        value: c._id
                                                    }));
                                                }
                                            }
                                        }
                                    },
                                    "*": "wildcard"
                                },
                                fields: ["name", "trackId", "projectDescription", "users", "password"],
                                search: async (search, parents) => {
                                    const hackathonId = parents[2];
                                    const { data } = await api.admin.teams.get({ query: { hackathonId, search, pageSize: 50 } });
                                    return (data?.items || []).map((t) => ({ label: t.name, value: t._id }));
                                }
                            },
                            intermission: {
                                label: "Intermission",
                                path: "admin.hackathons.{id}.intermission",
                                fields: ["organizerLogoUrl", "schedule", "carousel", "sponsors"]
                            },
                            certificateDefaults: {
                                label: "Certificate Defaults",
                                path: "admin.hackathons.{id}.certificateDefaults",
                                fields: ["title", "designId", "sgnatures"]
                            },
                            tracks: {
                                label: "Tracks",
                                path: "admin.hackathons.{id}.tracks",
                                children: {
                                    "{id}": "id",
                                    "*": "wildcard"
                                },
                                fields: ["name", "judges", "rubric"],
                                search: async (search, parents) => {
                                    const hackathonId = parents[2];
                                    const { data } = await api.admin.hackathons({ id: hackathonId }).tracks.get({ query: { search } });
                                    return (data?.items || []).map((t) => ({ label: t.name, value: t._id }));
                                }
                            }
                        }
                    },
                    "*": "wildcard"
                },
                fields: ["title", "slug", "date", "endDate", "location", "intermission", "certificateDefaults"],
                search: async (search: string) => {
                    const { data } = await api.admin.hackathons.get({ query: { search, pageSize: 50 } });
                    return (data?.items || []).map((h) => ({ label: h.title, value: h._id }));
                }
            }
        }
    }
};
