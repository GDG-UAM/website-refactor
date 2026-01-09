"use client";

import React from "react";
import { TextField } from "@mui/material";
import { AddButton, DeleteButton, UpButton, DownButton } from "#/components/Buttons";
import { ScheduleEntry } from "../hakathons/intermission/IntermissionForm.types";
import * as m from "#/paraglide/messages";
import { FieldContainer, FieldLabel, FieldHeader, FieldTableWrapper, FieldTable } from "./AdminFieldTable.styles";
import { ActionRow, EmptyState } from "./AdminTableField.styles";

interface AdminScheduleFieldProps {
    value: ScheduleEntry[];
    onChange: (value: ScheduleEntry[]) => void;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    error?: boolean;
    onBlur?: () => void;
    required?: boolean;
}

export const AdminScheduleField: React.FC<AdminScheduleFieldProps> = ({ value = [], onChange, label, disabled, error, onBlur, required }) => {
    const addEntry = () => {
        const lastEntry = value[value.length - 1];
        const startTime = lastEntry?.endTime || "12:00";
        const newEntry: ScheduleEntry = { startTime, title: "" };
        onChange([...value, newEntry]);
    };

    const removeEntry = (idx: number) => {
        const newValue = [...value];
        newValue.splice(idx, 1);
        onChange(newValue);
    };

    const updateEntry = (idx: number, entry: ScheduleEntry) => {
        const newValue = [...value];
        newValue[idx] = entry;
        onChange(newValue);
    };

    const moveEntry = (idx: number, direction: "up" | "down") => {
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
                    <FieldLabel>
                        {label} {required && <span style={{ color: "var(--google-red)" }}>*</span>}
                    </FieldLabel>
                )}
                {!disabled && (
                    <AddButton onClick={addEntry} iconSize={20}>
                        {m["admin.hackathons.intermission.actions.addActivity"]()}
                    </AddButton>
                )}
            </FieldHeader>
            <FieldTableWrapper>
                <FieldTable>
                    <thead>
                        <tr>
                            <th style={{ width: "110px" }}>{m["admin.hackathons.intermission.fields.startTime"]()}</th>
                            <th style={{ width: "110px" }}>{m["admin.hackathons.intermission.fields.endTime"]()}</th>
                            <th>{m["admin.hackathons.intermission.fields.title"]()}</th>
                            <th style={{ width: "140px", textAlign: "right" }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {value.map((entry, idx) => (
                            <tr key={idx}>
                                <td>
                                    <TextField
                                        size="small"
                                        type="time"
                                        value={entry.startTime}
                                        onChange={(e) => updateEntry(idx, { ...entry, startTime: e.target.value })}
                                        disabled={disabled}
                                        fullWidth
                                        inputProps={{ style: { fontSize: "0.875rem" } }}
                                    />
                                </td>
                                <td>
                                    <TextField
                                        size="small"
                                        type="time"
                                        value={entry.endTime || ""}
                                        onChange={(e) => updateEntry(idx, { ...entry, endTime: e.target.value })}
                                        disabled={disabled}
                                        fullWidth
                                        inputProps={{ style: { fontSize: "0.875rem" } }}
                                    />
                                </td>
                                <td>
                                    <TextField
                                        size="small"
                                        value={entry.title}
                                        onChange={(e) => updateEntry(idx, { ...entry, title: e.target.value })}
                                        disabled={disabled}
                                        fullWidth
                                        placeholder={m["admin.hackathons.intermission.fields.title"]()}
                                        inputProps={{ style: { fontSize: "0.875rem" } }}
                                    />
                                </td>
                                <td>
                                    <ActionRow style={{ justifyContent: "flex-end" }}>
                                        <UpButton onClick={() => moveEntry(idx, "up")} disabled={disabled || idx === 0} iconSize={18} />
                                        <DownButton onClick={() => moveEntry(idx, "down")} disabled={disabled || idx === value.length - 1} iconSize={18} />
                                        <DeleteButton onClick={() => removeEntry(idx)} disabled={disabled} iconSize={18} />
                                    </ActionRow>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </FieldTable>
                {value.length === 0 && <EmptyState>{m["admin.hackathons.intermission.helpers.noSchedule"]()}</EmptyState>}
            </FieldTableWrapper>
        </FieldContainer>
    );
};
