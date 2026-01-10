"use client";

import React, { useState } from "react";
import { AddButton, DeleteButton, UpButton, DownButton } from "#/components/Buttons";
import { TextField, MenuItem, Select, FormControl, InputLabel } from "@mui/material";
import { CarouselElement, CarouselElementType, CarouselSlide } from "./IntermissionForm.types";
import * as m from "#/paraglide/messages";
import {
    EditorContainer,
    SlideConfigRow,
    MainGrid,
    LayoutTreePanel,
    PropertyPanel,
    PanelTitle,
    PanelDivider,
    TreeItem,
    ElementTypeIcon,
    ElementContent,
    ElementTitle,
    ElementSub,
    ActionBox,
    PropSection,
    PropRow,
    HelperText,
    AddButtonsRow,
    SmallLabel
} from "./CarouselEditor.styles";

const DEFAULT_PROPS: Record<CarouselElementType, CarouselElement["props"]> = {
    container: { direction: "column", gap: 20, alignItems: "center", justifyContent: "center" },
    text: { content: "Sample Text", variant: "h2", align: "center" },
    qr: { value: "https://gdguam.es", size: 250, cornerSize: 100, logoSize: 25 },
    image: { url: "", alt: "", height: "200px", objectFit: "contain" },
    spacer: { grow: 1 }
};

const createNewElement = (type: CarouselElementType): CarouselElement => ({
    id: Math.random().toString(36).substr(2, 9),
    type,
    props: { ...DEFAULT_PROPS[type] },
    children: type === "container" ? [] : undefined
});

export const CarouselEditor: React.FC<{
    slide: CarouselSlide;
    onChange: (slide: CarouselSlide) => void;
    readOnly?: boolean;
}> = ({ slide, onChange, readOnly = false }) => {
    const [selectedId, setSelectedId] = useState<string | null>(slide.root.id);

    const findElement = (root: CarouselElement, id: string): CarouselElement | null => {
        if (root.id === id) return root;
        if (root.children) {
            for (const child of root.children) {
                const found = findElement(child, id);
                if (found) return found;
            }
        }
        return null;
    };

    const updateElement = (root: CarouselElement, id: string, updater: (el: CarouselElement) => CarouselElement): CarouselElement => {
        if (root.id === id) return updater(root);
        if (root.children) {
            return {
                ...root,
                children: root.children.map((child: CarouselElement) => updateElement(child, id, updater))
            };
        }
        return root;
    };

    const deleteElement = (root: CarouselElement, id: string): CarouselElement | null => {
        if (root.id === id) return null;
        if (root.children) {
            return {
                ...root,
                children: root.children
                    .filter((child: CarouselElement) => child.id !== id)
                    .map((child: CarouselElement) => deleteElement(child, id) as CarouselElement)
            };
        }
        return root;
    };

    const addElement = (parentId: string, type: CarouselElementType) => {
        const newEl = createNewElement(type);
        const newRoot = updateElement(slide.root, parentId, (parent) => ({
            ...parent,
            children: [...(parent.children || []), newEl]
        }));
        onChange({ ...slide, root: newRoot });
        setSelectedId(newEl.id);
    };

    const removeElement = (id: string) => {
        if (id === slide.root.id) return;
        const newRoot = deleteElement(slide.root, id);
        if (newRoot) {
            onChange({ ...slide, root: newRoot });
            setSelectedId(slide.root.id);
        }
    };

    const moveElement = (id: string, direction: "up" | "down") => {
        const findParent = (root: CarouselElement, targetId: string): CarouselElement | null => {
            if (root.children?.some((c: CarouselElement) => c.id === targetId)) return root;
            if (root.children) {
                for (const child of root.children) {
                    const p = findParent(child, targetId);
                    if (p) return p;
                }
            }
            return null;
        };

        const parent = findParent(slide.root, id);
        if (!parent || !parent.children) return;

        const index = parent.children.findIndex((c: CarouselElement) => c.id === id);
        const newChildren = [...parent.children];
        if (direction === "up" && index > 0) {
            [newChildren[index], newChildren[index - 1]] = [newChildren[index - 1], newChildren[index]];
        } else if (direction === "down" && index < newChildren.length - 1) {
            [newChildren[index], newChildren[index + 1]] = [newChildren[index + 1], newChildren[index]];
        }

        const newRoot = updateElement(slide.root, parent.id, (p) => ({ ...p, children: newChildren }));
        onChange({ ...slide, root: newRoot });
    };

    const handlePropChange = (id: string, propKey: keyof CarouselElement["props"], value: CarouselElement["props"][keyof CarouselElement["props"]]) => {
        const newRoot = updateElement(slide.root, id, (el) => ({
            ...el,
            props: { ...el.props, [propKey]: value }
        }));
        onChange({ ...slide, root: newRoot });
    };

    const selectedElement = selectedId ? findElement(slide.root, selectedId) : null;

    const renderTree = (element: CarouselElement, depth: number = 0, isFirst: boolean = true, isLast: boolean = true) => (
        <React.Fragment key={element.id}>
            <TreeItem $depth={depth} $selected={selectedId === element.id} onClick={() => setSelectedId(element.id)}>
                <ElementTypeIcon $type={element.type}>
                    {element.type === "container" && "CO"}
                    {element.type === "text" && "TX"}
                    {element.type === "qr" && "QR"}
                    {element.type === "image" && "IM"}
                    {element.type === "spacer" && "SP"}
                </ElementTypeIcon>
                <ElementContent>
                    <ElementTitle>{m[`admin.hackathons.intermission.elementTypes.${element.type}`]?.() || element.type}</ElementTitle>
                    <ElementSub>
                        {element.type === "text"
                            ? element.props.content
                            : element.type === "qr"
                              ? element.props.value
                              : element.type === "image"
                                ? element.props.url || m["admin.hackathons.intermission.helpers.noImage"]()
                                : element.type === "container"
                                  ? `${m[`admin.hackathons.intermission.values.${element.props.direction || "column"}`]?.() || element.props.direction} (${element.children?.length || 0})`
                                  : ""}
                    </ElementSub>
                </ElementContent>
                <ActionBox>
                    <UpButton iconSize={20} onClick={() => moveElement(element.id, "up")} disabled={readOnly || isFirst} />
                    <DownButton iconSize={20} onClick={() => moveElement(element.id, "down")} disabled={readOnly || isLast} />
                    {element.id !== slide.root.id && <DeleteButton iconSize={20} onClick={() => removeElement(element.id)} disabled={readOnly} />}
                </ActionBox>
            </TreeItem>
            {element.children?.map((child: CarouselElement, idx: number) => renderTree(child, depth + 1, idx === 0, idx === element.children!.length - 1))}
        </React.Fragment>
    );

    return (
        <EditorContainer>
            <SlideConfigRow>
                <TextField
                    label={m["admin.hackathons.intermission.fields.carouselLabel"]()}
                    value={slide.label || ""}
                    onChange={(e) => onChange({ ...slide, label: e.target.value })}
                    size="small"
                    fullWidth
                    disabled={readOnly}
                />
                <TextField
                    label={m["admin.hackathons.intermission.fields.carouselDuration"]()}
                    type="number"
                    value={slide.duration}
                    onChange={(e) => onChange({ ...slide, duration: parseInt(e.target.value) })}
                    size="small"
                    sx={{ width: { xs: "100%", sm: 120 } }}
                    disabled={readOnly}
                />
            </SlideConfigRow>

            <MainGrid>
                <LayoutTreePanel>
                    <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <PanelTitle>{m["admin.hackathons.intermission.sections.layoutTree"]()}</PanelTitle>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "max-content" }}>{renderTree(slide.root)}</div>
                </LayoutTreePanel>

                <PropertyPanel>
                    <PanelTitle>
                        {m["admin.hackathons.intermission.sections.properties"]()}
                        {selectedElement ? `: ${m[`admin.hackathons.intermission.elementTypes.${selectedElement.type}`]?.() || selectedElement.type}` : ""}
                    </PanelTitle>
                    <PanelDivider />
                    {selectedElement ? (
                        <PropSection>
                            {selectedElement.type === "container" && (
                                <>
                                    <FormControl fullWidth size="small" disabled={readOnly}>
                                        <InputLabel>{m["admin.hackathons.intermission.fields.direction"]()}</InputLabel>
                                        <Select
                                            value={selectedElement.props.direction || "column"}
                                            label={m["admin.hackathons.intermission.fields.direction"]()}
                                            onChange={(e) => handlePropChange(selectedElement.id, "direction", e.target.value)}
                                        >
                                            <MenuItem value="column">{m["admin.hackathons.intermission.values.column"]()}</MenuItem>
                                            <MenuItem value="row">{m["admin.hackathons.intermission.values.row"]()}</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <TextField
                                        label={m["admin.hackathons.intermission.fields.gap"]()}
                                        type="number"
                                        fullWidth
                                        size="small"
                                        value={selectedElement.props.gap}
                                        onChange={(e) => handlePropChange(selectedElement.id, "gap", parseInt(e.target.value))}
                                        disabled={readOnly}
                                    />
                                    <FormControl fullWidth size="small" disabled={readOnly}>
                                        <InputLabel>{m["admin.hackathons.intermission.fields.alignItems"]()}</InputLabel>
                                        <Select
                                            value={selectedElement.props.alignItems || "stretch"}
                                            label={m["admin.hackathons.intermission.fields.alignItems"]()}
                                            onChange={(e) => handlePropChange(selectedElement.id, "alignItems", e.target.value)}
                                        >
                                            <MenuItem value="flex-start">{m["admin.hackathons.intermission.values.start"]()}</MenuItem>
                                            <MenuItem value="center">{m["admin.hackathons.intermission.values.center"]()}</MenuItem>
                                            <MenuItem value="flex-end">{m["admin.hackathons.intermission.values.end"]()}</MenuItem>
                                            <MenuItem value="stretch">{m["admin.hackathons.intermission.values.stretch"]()}</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <FormControl fullWidth size="small" disabled={readOnly}>
                                        <InputLabel>{m["admin.hackathons.intermission.fields.justifyContent"]()}</InputLabel>
                                        <Select
                                            value={selectedElement.props.justifyContent || "flex-start"}
                                            label={m["admin.hackathons.intermission.fields.justifyContent"]()}
                                            onChange={(e) => handlePropChange(selectedElement.id, "justifyContent", e.target.value)}
                                        >
                                            <MenuItem value="flex-start">{m["admin.hackathons.intermission.values.start"]()}</MenuItem>
                                            <MenuItem value="center">{m["admin.hackathons.intermission.values.center"]()}</MenuItem>
                                            <MenuItem value="flex-end">{m["admin.hackathons.intermission.values.end"]()}</MenuItem>
                                            <MenuItem value="space-between">{m["admin.hackathons.intermission.values.spaceBetween"]()}</MenuItem>
                                            <MenuItem value="space-around">{m["admin.hackathons.intermission.values.spaceAround"]()}</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <TextField
                                        label={m["admin.hackathons.intermission.fields.padding"]()}
                                        fullWidth
                                        size="small"
                                        value={selectedElement.props.padding || ""}
                                        onChange={(e) => handlePropChange(selectedElement.id, "padding", e.target.value)}
                                        disabled={readOnly}
                                    />
                                    {!readOnly && (
                                        <div>
                                            <SmallLabel>{m["admin.hackathons.intermission.helpers.addChild"]()}</SmallLabel>
                                            <AddButtonsRow>
                                                <AddButton iconSize={20} onClick={() => addElement(selectedElement.id, "text")}>
                                                    {m["admin.hackathons.intermission.elementTypes.text"]()}
                                                </AddButton>
                                                <AddButton iconSize={20} onClick={() => addElement(selectedElement.id, "qr")}>
                                                    {m["admin.hackathons.intermission.elementTypes.qr"]()}
                                                </AddButton>
                                                <AddButton iconSize={20} onClick={() => addElement(selectedElement.id, "image")}>
                                                    {m["admin.hackathons.intermission.elementTypes.image"]()}
                                                </AddButton>
                                                <AddButton iconSize={20} onClick={() => addElement(selectedElement.id, "container")}>
                                                    {m["admin.hackathons.intermission.elementTypes.container"]()}
                                                </AddButton>
                                                <AddButton iconSize={20} onClick={() => addElement(selectedElement.id, "spacer")}>
                                                    {m["admin.hackathons.intermission.elementTypes.spacer"]()}
                                                </AddButton>
                                            </AddButtonsRow>
                                        </div>
                                    )}
                                </>
                            )}

                            {selectedElement.type === "text" && (
                                <>
                                    <TextField
                                        label={m["admin.hackathons.intermission.fields.content"]()}
                                        fullWidth
                                        multiline
                                        rows={4}
                                        size="small"
                                        value={selectedElement.props.content}
                                        onChange={(e) => handlePropChange(selectedElement.id, "content", e.target.value)}
                                        disabled={readOnly}
                                    />
                                    <FormControl fullWidth size="small" disabled={readOnly}>
                                        <InputLabel>{m["admin.hackathons.intermission.fields.variant"]()}</InputLabel>
                                        <Select
                                            value={selectedElement.props.variant || "body"}
                                            label={m["admin.hackathons.intermission.fields.variant"]()}
                                            onChange={(e) => handlePropChange(selectedElement.id, "variant", e.target.value)}
                                        >
                                            <MenuItem value="h1">{m["admin.hackathons.intermission.values.h1"]()}</MenuItem>
                                            <MenuItem value="h2">{m["admin.hackathons.intermission.values.h2"]()}</MenuItem>
                                            <MenuItem value="h3">{m["admin.hackathons.intermission.values.h3"]()}</MenuItem>
                                            <MenuItem value="body">{m["admin.hackathons.intermission.values.body"]()}</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <TextField
                                        label={m["admin.hackathons.intermission.fields.fontSize"]()}
                                        fullWidth
                                        size="small"
                                        placeholder="e.g. 1.2rem, 24px"
                                        value={selectedElement.props.fontSize || ""}
                                        onChange={(e) => handlePropChange(selectedElement.id, "fontSize", e.target.value)}
                                        disabled={readOnly}
                                    />
                                    <TextField
                                        label={m["admin.hackathons.intermission.fields.fontWeight"]()}
                                        fullWidth
                                        size="small"
                                        placeholder="e.g. 400, 700, bold"
                                        value={selectedElement.props.fontWeight || ""}
                                        onChange={(e) => handlePropChange(selectedElement.id, "fontWeight", e.target.value)}
                                        disabled={readOnly}
                                    />
                                    <FormControl fullWidth size="small" disabled={readOnly}>
                                        <InputLabel>{m["admin.hackathons.intermission.fields.alignment"]()}</InputLabel>
                                        <Select
                                            value={selectedElement.props.align || "left"}
                                            label={m["admin.hackathons.intermission.fields.alignment"]()}
                                            onChange={(e) => handlePropChange(selectedElement.id, "align", e.target.value)}
                                        >
                                            <MenuItem value="left">{m["admin.hackathons.intermission.values.left"]()}</MenuItem>
                                            <MenuItem value="center">{m["admin.hackathons.intermission.values.center"]()}</MenuItem>
                                            <MenuItem value="right">{m["admin.hackathons.intermission.values.right"]()}</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <TextField
                                        label={m["admin.hackathons.intermission.fields.color"]()}
                                        fullWidth
                                        size="small"
                                        placeholder="e.g. #000, rgba(0,0,0,0.8)"
                                        value={selectedElement.props.color || ""}
                                        onChange={(e) => handlePropChange(selectedElement.id, "color", e.target.value)}
                                        disabled={readOnly}
                                    />
                                </>
                            )}

                            {selectedElement.type === "qr" && (
                                <>
                                    <TextField
                                        label={m["admin.hackathons.intermission.fields.qrValue"]()}
                                        fullWidth
                                        size="small"
                                        value={selectedElement.props.value}
                                        onChange={(e) => handlePropChange(selectedElement.id, "value", e.target.value)}
                                        disabled={readOnly}
                                    />
                                    <PropRow>
                                        <TextField
                                            label={m["admin.hackathons.intermission.fields.size"]()}
                                            type="number"
                                            fullWidth
                                            size="small"
                                            value={selectedElement.props.size}
                                            onChange={(e) => handlePropChange(selectedElement.id, "size", parseInt(e.target.value))}
                                            disabled={readOnly}
                                        />
                                        <TextField
                                            label={m["admin.hackathons.intermission.fields.cornerSize"]()}
                                            type="number"
                                            fullWidth
                                            size="small"
                                            value={selectedElement.props.cornerSize}
                                            onChange={(e) => handlePropChange(selectedElement.id, "cornerSize", parseInt(e.target.value))}
                                            disabled={readOnly}
                                        />
                                    </PropRow>
                                    <div>
                                        <TextField
                                            label={m["admin.hackathons.intermission.fields.cornerColor"]()}
                                            fullWidth
                                            size="small"
                                            placeholder="e.g. #4285F4"
                                            value={selectedElement.props.cornerColor || ""}
                                            onChange={(e) => handlePropChange(selectedElement.id, "cornerColor", e.target.value)}
                                            disabled={readOnly}
                                        />
                                        <HelperText>{m["admin.hackathons.intermission.helpers.googleColors"]()}</HelperText>
                                    </div>
                                    <TextField
                                        label={m["admin.hackathons.intermission.fields.logoUrl"]()}
                                        fullWidth
                                        size="small"
                                        placeholder="https://..."
                                        value={selectedElement.props.logoUrl || ""}
                                        onChange={(e) => handlePropChange(selectedElement.id, "logoUrl", e.target.value)}
                                        disabled={readOnly}
                                    />
                                    <div>
                                        <TextField
                                            label={m["admin.hackathons.intermission.fields.logoSize"]()}
                                            type="number"
                                            fullWidth
                                            size="small"
                                            value={selectedElement.props.logoSize || 25}
                                            onChange={(e) => handlePropChange(selectedElement.id, "logoSize", parseInt(e.target.value))}
                                            disabled={readOnly}
                                        />
                                        <HelperText>{m["admin.hackathons.intermission.helpers.recommendedSize"]()}</HelperText>
                                    </div>
                                </>
                            )}

                            {selectedElement.type === "image" && (
                                <>
                                    <TextField
                                        label={m["admin.hackathons.intermission.fields.imageUrl"]()}
                                        fullWidth
                                        size="small"
                                        value={selectedElement.props.url}
                                        onChange={(e) => handlePropChange(selectedElement.id, "url", e.target.value)}
                                        disabled={readOnly}
                                    />
                                    <TextField
                                        label={m["admin.hackathons.intermission.fields.height"]()}
                                        fullWidth
                                        size="small"
                                        placeholder="e.g. 200px, 50%"
                                        value={selectedElement.props.height || ""}
                                        onChange={(e) => handlePropChange(selectedElement.id, "height", e.target.value)}
                                        disabled={readOnly}
                                    />
                                    <FormControl fullWidth size="small" disabled={readOnly}>
                                        <InputLabel>{m["admin.hackathons.intermission.fields.objectFit"]()}</InputLabel>
                                        <Select
                                            value={selectedElement.props.objectFit || "contain"}
                                            label={m["admin.hackathons.intermission.fields.objectFit"]()}
                                            onChange={(e) => handlePropChange(selectedElement.id, "objectFit", e.target.value)}
                                        >
                                            <MenuItem value="contain">{m["admin.hackathons.intermission.values.contain"]()}</MenuItem>
                                            <MenuItem value="cover">{m["admin.hackathons.intermission.values.cover"]()}</MenuItem>
                                        </Select>
                                    </FormControl>
                                </>
                            )}

                            {selectedElement.type === "spacer" && (
                                <TextField
                                    label={m["admin.hackathons.intermission.fields.flexGrow"]()}
                                    type="number"
                                    fullWidth
                                    size="small"
                                    value={selectedElement.props.grow}
                                    onChange={(e) => handlePropChange(selectedElement.id, "grow", parseInt(e.target.value))}
                                    disabled={readOnly}
                                />
                            )}

                            <PanelDivider />

                            <div>
                                <TextField
                                    label={m["admin.hackathons.intermission.fields.flexBasis"]()}
                                    type="number"
                                    fullWidth
                                    size="small"
                                    placeholder="Auto"
                                    value={selectedElement.props.flex ?? ""}
                                    onChange={(e) => handlePropChange(selectedElement.id, "flex", e.target.value ? parseInt(e.target.value) : undefined)}
                                    disabled={readOnly}
                                />
                                <HelperText>{m["admin.hackathons.intermission.helpers.flexBasis"]()}</HelperText>
                            </div>
                        </PropSection>
                    ) : (
                        <div style={{ padding: "32px 0", textAlign: "center", color: "#666" }}>
                            <span style={{ fontSize: "0.875rem" }}>{m["admin.hackathons.intermission.helpers.selectElement"]()}</span>
                        </div>
                    )}
                </PropertyPanel>
            </MainGrid>
        </EditorContainer>
    );
};
