import React from "react";

interface RichTextProps {
    text: string;
    components: Record<string, React.ReactNode>;
}

export const RichText = ({ text, components }: RichTextProps) => {
    const parts = text.split(/(\[[a-zA-Z0-9]+\])/);

    return (
        <>
            {parts.map((part, i) => {
                const match = part.match(/(\[[a-zA-Z0-9]+\])/);
                if (match) {
                    const key = match[1].slice(1, -1); // Remove brackets
                    return <React.Fragment key={i}>{components[key] || part}</React.Fragment>;
                }
                return part;
            })}
        </>
    );
};
