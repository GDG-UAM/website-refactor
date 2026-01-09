"use client";

import { AdminNavigationTypes, AdminNavigationButton, OpenLinkButton } from "#/components/Buttons";
import { useRouter } from "next/navigation";
import { Container, Content, Grid, Title, Category, CategoryTitle, ButtonList, ButtonRow } from "./AdminNavigation.styles";

interface AdminContentProps {
    title: string;
    categories: {
        title: string;
        buttons: {
            label: string;
            type: AdminNavigationTypes;
            href: string;
            disabled?: boolean;
            openLinkHref?: string;
        }[];
    }[];
}

export default function AdminContent({ title, categories }: AdminContentProps) {
    const router = useRouter();

    const handleNavigation = (href: string) => {
        router.push(href);
    };

    return (
        <Container>
            <Content>
                <Title>{title}</Title>

                <Grid>
                    {categories.map((category) => (
                        <Category key={"category-" + category.title}>
                            <CategoryTitle>{category.title}</CategoryTitle>
                            <ButtonList key={"button-list-" + category.title}>
                                {category.buttons.map((button) =>
                                    button.openLinkHref ? (
                                        <ButtonRow key={button.href + "-" + button.openLinkHref}>
                                            <AdminNavigationButton
                                                key={button.href}
                                                onClick={() => handleNavigation(button.href)}
                                                type={button.type}
                                                disabled={button.disabled}
                                            >
                                                {button.label}
                                            </AdminNavigationButton>
                                            <OpenLinkButton key={button.openLinkHref} href={button.openLinkHref} color="secondary" />
                                        </ButtonRow>
                                    ) : (
                                        <AdminNavigationButton
                                            key={button.href}
                                            type={button.type}
                                            onClick={() => handleNavigation(button.href)}
                                            disabled={button.disabled}
                                        >
                                            {button.label}
                                        </AdminNavigationButton>
                                    )
                                )}
                            </ButtonList>
                        </Category>
                    ))}
                </Grid>
            </Content>
        </Container>
    );
}
