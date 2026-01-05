"use client";

import React from "react";
import * as m from "#/paraglide/messages";
import { LoadingContainer, Loader, LoadingText } from "./loading.styles";

const Loading: React.FC = () => {
    return (
        <LoadingContainer>
            <Loader />
            <LoadingText>{m["loading.text"]()}</LoadingText>
        </LoadingContainer>
    );
};

export default Loading;
