"use client";

import React, { useState } from "react";
import {
    AddButton,
    DeleteButton,
    UpButton,
    DownButton,
    EditButton,
    InspectButton,
    HideButton,
    ViewButton,
    SaveButton,
    CancelButton,
    CollapsableMenuButton
} from "#/components/Buttons";
import { CarouselSlide } from "../hackathons/intermission/IntermissionForm.types";
import { CarouselEditor } from "../hackathons/intermission/CarouselEditor";
import Modal from "#/components/Modal";
import * as m from "#/paraglide/messages";
import { FieldContainer, FieldLabel, FieldHeader } from "./AdminFieldTable.styles";
import {
    CarouselList,
    CarouselPreview,
    SlideInfo,
    SlideTitle,
    BadgeRow,
    DurationBadge,
    HiddenText,
    ActionRow,
    MobileActionTrigger,
    MobileButtonList,
    EmptyState
} from "./AdminCarouselField.styles";

interface AdminCarouselFieldProps {
    value: CarouselSlide[];
    onChange: (value: CarouselSlide[]) => void;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    error?: boolean;
    onBlur?: () => void;
    required?: boolean;
    inspectMode?: boolean;
}

export const AdminCarouselField: React.FC<AdminCarouselFieldProps> = ({
    value = [],
    onChange,
    label,
    disabled,
    error,
    onBlur,
    required,
    inspectMode = false
}) => {
    const [editingIdx, setEditingIdx] = useState<number | null>(null);
    const [mobileActionsIdx, setMobileActionsIdx] = useState<number | null>(null);

    const addSlide = () => {
        const newSlide: CarouselSlide = {
            id: Math.random().toString(36).substr(2, 9),
            duration: 10,
            root: {
                id: "root",
                type: "container",
                props: { direction: "column", gap: 20, alignItems: "center", justifyContent: "center" },
                children: []
            },
            label: `Slide ${value.length + 1}`
        };
        onChange([...value, newSlide]);
        setEditingIdx(value.length);
    };

    const removeSlide = (idx: number) => {
        const newValue = [...value];
        newValue.splice(idx, 1);
        onChange(newValue);
    };

    const updateSlide = (idx: number, slide: CarouselSlide) => {
        const newValue = [...value];
        newValue[idx] = slide;
        onChange(newValue);
    };

    const toggleHideSlide = (idx: number) => {
        const newValue = [...value];
        newValue[idx] = { ...newValue[idx], hidden: !newValue[idx].hidden };
        onChange(newValue);
    };

    const moveSlide = (idx: number, direction: "up" | "down") => {
        const newValue = [...value];
        if (direction === "up" && idx > 0) {
            [newValue[idx], newValue[idx - 1]] = [newValue[idx - 1], newValue[idx]];
        } else if (direction === "down" && idx < newValue.length - 1) {
            [newValue[idx], newValue[idx + 1]] = [newValue[idx + 1], newValue[idx]];
        }
        onChange(newValue);
    };

    return (
        <FieldContainer>
            <FieldHeader>
                {label && (
                    <FieldLabel $disabled={disabled}>
                        {label} {required && <span style={{ color: "var(--google-red)" }}>*</span>}
                    </FieldLabel>
                )}
                {!disabled && (
                    <AddButton onClick={addSlide} iconSize={20}>
                        {m["admin.hackathons.intermission.actions.addSlide"]()}
                    </AddButton>
                )}
            </FieldHeader>

            <CarouselList>
                {value.map((slide, idx) => (
                    <CarouselPreview key={slide.id}>
                        <SlideInfo $hidden={slide.hidden}>
                            <SlideTitle>{slide.label || `${m["admin.hackathons.intermission.elementTypes.slide"]()} ${idx + 1}`}</SlideTitle>
                            <BadgeRow>
                                <DurationBadge>{slide.duration}s</DurationBadge>
                                {slide.hidden && <HiddenText>{m["admin.hackathons.intermission.values.hidden"]()}</HiddenText>}
                            </BadgeRow>
                        </SlideInfo>
                        <ActionRow>
                            <UpButton onClick={() => moveSlide(idx, "up")} disabled={disabled || idx === 0} iconSize={20} />
                            <DownButton onClick={() => moveSlide(idx, "down")} disabled={disabled || idx === value.length - 1} iconSize={20} />

                            {slide.hidden ? (
                                <ViewButton
                                    onClick={() => toggleHideSlide(idx)}
                                    disabled={disabled}
                                    confirmationDuration={500}
                                    tooltip={m["admin.hackathons.intermission.actions.show"]()}
                                    iconSize={20}
                                />
                            ) : (
                                <HideButton
                                    onClick={() => toggleHideSlide(idx)}
                                    disabled={disabled}
                                    confirmationDuration={500}
                                    tooltip={m["admin.hackathons.intermission.actions.hide"]()}
                                    iconSize={20}
                                />
                            )}
                            {inspectMode ? (
                                <InspectButton onClick={() => setEditingIdx(idx)} iconSize={20} />
                            ) : (
                                <EditButton onClick={() => setEditingIdx(idx)} disabled={disabled} iconSize={20} />
                            )}
                            <DeleteButton onClick={() => removeSlide(idx)} disabled={disabled} confirmationDuration={1000} iconSize={20} />
                        </ActionRow>

                        <MobileActionTrigger>
                            <CollapsableMenuButton onClick={() => setMobileActionsIdx(idx)} disabled={disabled} iconSize={20} />
                        </MobileActionTrigger>
                    </CarouselPreview>
                ))}

                {value.length === 0 && <EmptyState>{m["admin.hackathons.intermission.helpers.noCarousel"]()}</EmptyState>}
            </CarouselList>

            <Modal
                isOpen={editingIdx !== null}
                onClose={disabled || inspectMode ? () => setEditingIdx(null) : undefined}
                title={m["admin.hackathons.intermission.sections.carouselEditor"]()}
                width="lg"
                buttons={
                    disabled || inspectMode
                        ? undefined
                        : [
                              <SaveButton key="done" onClick={() => setEditingIdx(null)} disabled={disabled || inspectMode}>
                                  {m["admin.hackathons.intermission.actions.done"]()}
                              </SaveButton>,
                              <CancelButton key="cancel" onClick={() => setEditingIdx(null)}>
                                  {m["admin.hackathons.intermission.actions.cancel"]()}
                              </CancelButton>
                          ]
                }
            >
                {editingIdx !== null && (
                    <CarouselEditor slide={value[editingIdx]} onChange={(slide) => updateSlide(editingIdx, slide)} readOnly={inspectMode} />
                )}
            </Modal>
            <Modal
                isOpen={mobileActionsIdx !== null}
                title={
                    mobileActionsIdx !== null
                        ? value[mobileActionsIdx]?.label || `${m["admin.hackathons.intermission.elementTypes.slide"]()} ${mobileActionsIdx + 1}`
                        : ""
                }
                onClose={() => setMobileActionsIdx(null)}
                width="sm"
            >
                {mobileActionsIdx !== null && (
                    <MobileButtonList>
                        <UpButton
                            onClick={() => {
                                moveSlide(mobileActionsIdx, "up");
                                setMobileActionsIdx(null);
                            }}
                            disabled={disabled || mobileActionsIdx === 0}
                            iconSize={24}
                            fullWidth
                            justify="flex-start"
                        >
                            {m["buttons.up"]()}
                        </UpButton>
                        <DownButton
                            onClick={() => {
                                moveSlide(mobileActionsIdx, "down");
                                setMobileActionsIdx(null);
                            }}
                            disabled={disabled || mobileActionsIdx === value.length - 1}
                            iconSize={24}
                            fullWidth
                            justify="flex-start"
                        >
                            {m["buttons.down"]()}
                        </DownButton>

                        {value[mobileActionsIdx].hidden ? (
                            <ViewButton
                                onClick={() => {
                                    toggleHideSlide(mobileActionsIdx);
                                    setMobileActionsIdx(null);
                                }}
                                disabled={disabled}
                                confirmationDuration={500}
                                iconSize={24}
                                fullWidth
                                justify="flex-start"
                            >
                                {m["admin.hackathons.intermission.actions.show"]()}
                            </ViewButton>
                        ) : (
                            <HideButton
                                onClick={() => {
                                    toggleHideSlide(mobileActionsIdx);
                                    setMobileActionsIdx(null);
                                }}
                                disabled={disabled}
                                confirmationDuration={500}
                                iconSize={24}
                                fullWidth
                                justify="flex-start"
                            >
                                {m["admin.hackathons.intermission.actions.hide"]()}
                            </HideButton>
                        )}

                        {inspectMode ? (
                            <InspectButton
                                onClick={() => {
                                    setEditingIdx(mobileActionsIdx);
                                    setMobileActionsIdx(null);
                                }}
                                iconSize={24}
                                fullWidth
                                justify="flex-start"
                            >
                                {m["buttons.inspect"]()}
                            </InspectButton>
                        ) : (
                            <EditButton
                                onClick={() => {
                                    setEditingIdx(mobileActionsIdx);
                                    setMobileActionsIdx(null);
                                }}
                                disabled={disabled}
                                iconSize={24}
                                fullWidth
                                justify="flex-start"
                            >
                                {m["buttons.edit"]()}
                            </EditButton>
                        )}

                        <DeleteButton
                            onClick={() => {
                                removeSlide(mobileActionsIdx);
                                setMobileActionsIdx(null);
                            }}
                            disabled={disabled}
                            confirmationDuration={1000}
                            iconSize={24}
                            fullWidth
                            justify="flex-start"
                        >
                            {m["buttons.delete"]()}
                        </DeleteButton>
                    </MobileButtonList>
                )}
            </Modal>
        </FieldContainer>
    );
};
