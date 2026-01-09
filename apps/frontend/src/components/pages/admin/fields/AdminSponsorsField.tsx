"use client";

import React from "react";
import { TextField } from "@mui/material";
import { AddButton, DeleteButton } from "#/components/Buttons";
import { SponsorEntry } from "../hakathons/intermission/IntermissionForm.types";
import * as m from "#/paraglide/messages";
import { FieldTableWrapper, FieldTable, FieldContainer, FieldLabel, FieldHeader } from "./AdminFieldTable.styles";
import { ActionRow, EmptyState } from "./AdminTableField.styles";

interface AdminSponsorsFieldProps {
    value: SponsorEntry[];
    onChange: (value: SponsorEntry[]) => void;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    error?: boolean;
    onBlur?: () => void;
    required?: boolean;
}

export const AdminSponsorsField: React.FC<AdminSponsorsFieldProps> = ({ value = [], onChange, label, disabled, error, onBlur, required }) => {
    const addEntry = () => {
        const newEntry: SponsorEntry = { name: "", logoUrl: "", tier: 1 };
        onChange([...value, newEntry]);
    };

    const removeEntry = (idx: number) => {
        const newValue = [...value];
        newValue.splice(idx, 1);
        onChange(newValue);
    };

    const updateEntry = (idx: number, entry: SponsorEntry) => {
        const newValue = [...value];
        newValue[idx] = entry;
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
                        {m["admin.hackathons.intermission.actions.addSponsor"]()}
                    </AddButton>
                )}
            </FieldHeader>
            <FieldTableWrapper>
                <FieldTable>
                    <thead>
                        <tr>
                            <th>{m["admin.hackathons.intermission.fields.sponsorName"]()}</th>
                            <th>{m["admin.hackathons.intermission.fields.logoUrl"]()}</th>
                            <th style={{ width: "90px" }}>{m["admin.hackathons.intermission.fields.tier"]()}</th>
                            <th style={{ width: "60px", textAlign: "right" }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {value.map((entry, idx) => (
                            <tr key={idx}>
                                <td>
                                    <TextField
                                        size="small"
                                        value={entry.name}
                                        onChange={(e) => updateEntry(idx, { ...entry, name: e.target.value })}
                                        disabled={disabled}
                                        fullWidth
                                        placeholder={m["admin.hackathons.intermission.fields.sponsorName"]()}
                                        inputProps={{ style: { fontSize: "0.875rem" } }}
                                    />
                                </td>
                                <td>
                                    <TextField
                                        size="small"
                                        value={entry.logoUrl}
                                        onChange={(e) => updateEntry(idx, { ...entry, logoUrl: e.target.value })}
                                        disabled={disabled}
                                        fullWidth
                                        placeholder="https://..."
                                        inputProps={{ style: { fontSize: "0.875rem" } }}
                                    />
                                </td>
                                <td>
                                    <TextField
                                        size="small"
                                        type="number"
                                        value={entry.tier}
                                        onChange={(e) => updateEntry(idx, { ...entry, tier: parseInt(e.target.value) || 1 })}
                                        disabled={disabled}
                                        fullWidth
                                        inputProps={{ style: { fontSize: "0.875rem" } }}
                                    />
                                </td>
                                <td>
                                    <ActionRow style={{ justifyContent: "flex-end" }}>
                                        <DeleteButton onClick={() => removeEntry(idx)} disabled={disabled} iconSize={18} />
                                    </ActionRow>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </FieldTable>
                {value.length === 0 && <EmptyState>{m["admin.hackathons.intermission.helpers.noSponsors"]()}</EmptyState>}
            </FieldTableWrapper>
        </FieldContainer>
    );
};
