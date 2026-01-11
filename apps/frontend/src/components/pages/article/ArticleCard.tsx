"use client";

import { memo, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArticleType, Article } from "#/providers/ArticlesProvider";
import LocalTimeWithSettings from "#/components/LocalTimeWithSettings";
import { blurHashToDataURL, isValidBlurHash } from "#/lib/utils/blurhashClient";
import { Card, Content, Description, EnsureWidth, ImageWrapper, Meta, Title } from "./ArticleCard.styles";

const Icon = ({ path }: { path: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="currentColor" aria-hidden>
        <path d={path} />
    </svg>
);

type ArticleCardProps = {
    type?: ArticleType;
    article?: Article;
    skeleton?: boolean;
    //   status?: ArticleStatus;
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 260,
            damping: 20
        }
    }
} as const;

// function ArticleCardImpl({ type, article, skeleton, status }: ArticleCardProps) {
function ArticleCardImpl({ type, article, skeleton }: ArticleCardProps) {
    // Decode BlurHash to data URL on the client
    // Use stored dimensions if available, otherwise use card dimensions
    const blurDataURL = useMemo(() => {
        if (!article?.coverImageBlurHash || !isValidBlurHash(article.coverImageBlurHash)) return undefined;
        const width = article.coverImageWidth || 350;
        const height = article.coverImageHeight || 150;
        return blurHashToDataURL(article.coverImageBlurHash, width, height);
    }, [article?.coverImageBlurHash, article?.coverImageWidth, article?.coverImageHeight]);

    if (!article && !skeleton) return null;
    const href = !skeleton && article ? `/${type}/${article.slug}` : "#";
    const description = article?.excerpt || "";

    return (
        // <Card $skeleton={skeleton} $status={status}>
        <Card
            $skeleton={skeleton}
            variants={itemVariants}
            whileHover={!skeleton ? { scale: 1.02, boxShadow: "0 12px 40px rgba(0, 0, 0, 0.15)" } : {}}
            whileTap={!skeleton ? { scale: 0.98 } : {}}
        >
            <ImageWrapper $skeleton={skeleton}>
                {!skeleton && article ? (
                    <Link href={href} aria-label={article.title} style={{ display: "block", width: "100%", height: "100%" }}>
                        <Image
                            src={article.coverImage || "/logo/196x196.webp"}
                            alt={article.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 350px"
                            style={{ objectFit: "cover" }}
                            placeholder={blurDataURL ? "blur" : "empty"}
                            blurDataURL={blurDataURL}
                        />
                    </Link>
                ) : null}
            </ImageWrapper>

            <Link
                href={href}
                style={{ textDecoration: "none", pointerEvents: skeleton ? "none" : "auto", width: "100%" }}
                aria-label={article?.title || "Article"}
            >
                <Content>
                    <Title $skeleton={skeleton}>
                        {skeleton ? (
                            <>
                                <div />
                                <div />
                            </>
                        ) : (
                            article?.title
                        )}
                    </Title>

                    <Meta $skeleton={skeleton}>
                        {skeleton ? (
                            <div style={{ marginTop: 8 }} />
                        ) : article?.publishedAt ? (
                            <>
                                <Icon path="M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Zm0 0v-80 80Z" />
                                <LocalTimeWithSettings iso={new Date(article.publishedAt).toISOString()} dateOnly={true} />
                            </>
                        ) : null}
                    </Meta>

                    {skeleton ? (
                        <Description $skeleton>
                            <div />
                            <div />
                            <div />
                            <EnsureWidth>{"⠀ ".repeat(100)}</EnsureWidth>
                        </Description>
                    ) : (
                        <Description>
                            {description}
                            <EnsureWidth>{"⠀ ".repeat(100)}</EnsureWidth>
                        </Description>
                    )}
                </Content>
            </Link>
        </Card>
    );
}

export const ArticleCard = memo(ArticleCardImpl);
