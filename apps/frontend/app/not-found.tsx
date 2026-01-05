"use client";

import * as m from "#/paraglide/messages";
import { Container, Title, Message } from "./not-found.styles";

export default function NotFound() {
    return (
        <Container>
            <Title>{m["notFound.title"]()}</Title>
            <Message>{m["notFound.message"]()}</Message>
        </Container>
    );
}
