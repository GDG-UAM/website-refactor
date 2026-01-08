"use client";

import { useRef } from "react";
import RenderMarkdown from "#/components/markdown/RenderMarkdown";
import UserMention from "#/components/markdown/components/UserMention";
import LocalTimeWithSettings from "#/components/LocalTimeWithSettings";
import type { FullArticle, ArticleType } from "#/providers/ArticlesProvider";
import CoverImage from "#/components/CoverImage";
import { PageContainer, Title, Meta, ImageWrap } from "./ArticlePage.styles";
import { m } from "#/paraglide/messages";
import { RichText } from "#/components/RichText";

export default function ArticlePage({ type, article }: { type: ArticleType; article: FullArticle }) {
    const articleRef = useRef<HTMLDivElement | null>(null);
    const pageRef = useRef<HTMLElement | null>(null);

    return (
        <PageContainer ref={pageRef}>
            {/* <ReadingProgress containerRef={articleRef} pageContainerRef={pageRef} /> */}
            <article>
                <Title>{article.title}</Title>
                <Meta>
                    {type === "blog" && article.authors.length > 0 && (
                        <p>
                            {m[`${type}.authors`]()}:{" "}
                            {article.authors.map((author: string, i: number) => (
                                <span key={author.toString()}>
                                    <UserMention userId={author.toString()} authorFormat />
                                    {i < article.authors.length - 1 ? ", " : null}
                                </span>
                            ))}
                        </p>
                    )}
                    <p>
                        <RichText
                            text={m[`${type}.publishedOn`]()}
                            components={{
                                date: article.publishedAt ? (
                                    <LocalTimeWithSettings iso={new Date(article.publishedAt).toISOString()} dateOnly={false} fullMonth />
                                ) : (
                                    ""
                                )
                            }}
                        />
                    </p>
                </Meta>
                {article.coverImage ? (
                    <ImageWrap
                        style={{
                            aspectRatio:
                                article.coverImageWidth && article.coverImageHeight ? `${article.coverImageWidth} / ${article.coverImageHeight}` : "16 / 9"
                        }}
                    >
                        <CoverImage
                            src={article.coverImage}
                            alt={article.title}
                            blurHash={article.coverImageBlurHash}
                            width={article.coverImageWidth || 1200}
                            height={article.coverImageHeight || 675}
                            style={{
                                objectFit: "cover",
                                width: "100%",
                                height: "100%",
                                borderRadius: 12
                            }}
                        />
                    </ImageWrap>
                ) : null}
                <div ref={articleRef}>
                    <RenderMarkdown markdown={article.content} />
                </div>
            </article>
        </PageContainer>
    );
}
