import { serverApi } from "#/lib/eden-server";
import { redirect, notFound } from "next/navigation";
import { NextRequest } from "next/server";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    let destination: string | undefined;

    try {
        const { data, error } = await serverApi.links({ slug }).get();

        if (!error && data?.destination) {
            destination = data.destination;
        }
    } catch (err) {
        console.error(`Error fetching link for slug: ${slug}`, err);
    }

    if (!destination) {
        notFound();
    }

    redirect(destination);
}
