"use client";

import React from "react";
import { LoadingContainer, Loader } from "./loading.styles";

const Loading: React.FC = () => {
    return (
        <LoadingContainer>
            <Loader />
        </LoadingContainer>
    );
};

export default Loading;
