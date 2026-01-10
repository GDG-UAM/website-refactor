"use client";

import { useState } from "react";
import { TextField, Checkbox, MenuItem } from "@mui/material";
import { AddButton, DeleteButton, UpButton, DownButton } from "#/components/Buttons";
import { usePermissions } from "#/providers/PermissionsProvider";
import { FieldContainer, FieldLabel, FieldHeader, FieldTableWrapper, FieldTable, ActionRow, EmptyState } from "./AdminFieldTable.styles";

export type TableColumn<T> = {
    name: keyof T & string;
    label: string;
    type: "text" | "number" | "select" | "date" | "time" | "datetime" | "checkbox";
    options?: { label: string; value: any }[];
    required?: boolean;
    width?: string;
    minWidth?: string;
    placeholder?: string;
};

const getDefaultMinWidth = (type: string): string => {
    switch (type) {
        case "checkbox":
            return "50px";
        case "number":
            return "100px";
        case "date":
            return "150px";
        case "time":
            return "120px";
        case "datetime":
            return "200px";
        case "select":
            return "150px";
        default:
            return "200px";
    }
};

interface AdminTableFieldProps<T> {
    value: T[];
    onChange: (value: T[]) => void;
    columns: TableColumn<T>[];
    label?: string;
    disabled?: boolean;
    required?: boolean;
    subject?: string;
    emptyMessage?: string;
    addButtonLabel?: string;
    action?: "update" | "create";
}

export function AdminTableField<T extends Record<string, any>>({
    value = [],
    onChange,
    columns,
    label,
    disabled,
    required,
    subject,
    emptyMessage,
    addButtonLabel,
    action = "update"
}: AdminTableFieldProps<T>) {
    const { ability } = usePermissions();
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const addRow = () => {
        const newRow = {} as T;
        columns.forEach((col) => {
            if (col.type === "checkbox") newRow[col.name] = false as any;
            else if (col.type === "number") newRow[col.name] = 0 as any;
            else newRow[col.name] = "" as any;
        });
        onChange([...value, newRow]);
    };

    const removeRow = (idx: number) => {
        const newValue = [...value];
        newValue.splice(idx, 1);

        setTouched((prev) => {
            const next: Record<string, boolean> = {};
            Object.entries(prev).forEach(([key, val]) => {
                const parts = key.split("-");
                const rowIdx = parseInt(parts[0]);
                const colName = parts.slice(1).join("-");
                if (rowIdx < idx) {
                    next[key] = val;
                } else if (rowIdx > idx) {
                    next[`${rowIdx - 1}-${colName}`] = val;
                }
            });
            return next;
        });

        onChange(newValue);
    };

    const updateRow = (idx: number, row: T) => {
        const newValue = [...value];
        newValue[idx] = row;
        onChange(newValue);
    };

    const moveRow = (idx: number, direction: "up" | "down") => {
        const targetIdx = direction === "up" ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= value.length) return;

        const newValue = [...value];
        [newValue[idx], newValue[targetIdx]] = [newValue[targetIdx], newValue[idx]];

        setTouched((prev) => {
            const next = { ...prev };
            columns.forEach((col) => {
                const keyA = `${idx}-${col.name}`;
                const keyB = `${targetIdx}-${col.name}`;
                const valA = prev[keyA];
                const valB = prev[keyB];

                if (valA !== undefined) next[keyB] = valA;
                else delete next[keyB];

                if (valB !== undefined) next[keyA] = valB;
                else delete next[keyA];
            });
            return next;
        });

        onChange(newValue);
    };

    const markTouched = (idx: number, colName: string) => {
        setTouched((prev) => ({ ...prev, [`${idx}-${colName}`]: true }));
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
                    <AddButton onClick={addRow} iconSize={20}>
                        {addButtonLabel || "Add Row"}
                    </AddButton>
                )}
            </FieldHeader>
            <FieldTableWrapper>
                <FieldTable $disabled={disabled}>
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th key={col.name} style={{ width: col.width, minWidth: col.minWidth || col.width || getDefaultMinWidth(col.type) }}>
                                    {col.label} {col.required && <span style={{ color: "var(--google-red)" }}>*</span>}
                                </th>
                            ))}
                            <th style={{ width: "129.6px", minWidth: "129.6px", textAlign: "right" }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {value.map((row, idx) => (
                            <tr key={idx}>
                                {columns.map((col) => {
                                    const canEditField = !disabled && (subject ? ability.can(action, subject, { field: col.name }) : true);
                                    const fieldKey = `${idx}-${col.name}`;
                                    const isTouched = touched[fieldKey];
                                    const hasError = !!(col.required && isTouched && !row[col.name]);

                                    const commonProps = {
                                        size: "small" as const,
                                        disabled: !canEditField,
                                        fullWidth: true,
                                        inputProps: { style: { fontSize: "0.875rem" } },
                                        placeholder: col.placeholder,
                                        onBlur: () => markTouched(idx, col.name),
                                        error: hasError
                                    };

                                    return (
                                        <td key={col.name}>
                                            {col.type === "checkbox" ? (
                                                <Checkbox
                                                    checked={!!row[col.name]}
                                                    onChange={(e) => updateRow(idx, { ...row, [col.name]: e.target.checked })}
                                                    onBlur={() => markTouched(idx, col.name)}
                                                    disabled={!canEditField}
                                                    size="small"
                                                />
                                            ) : col.type === "select" ? (
                                                <TextField
                                                    {...commonProps}
                                                    select
                                                    value={row[col.name] ?? ""}
                                                    onChange={(e) => updateRow(idx, { ...row, [col.name]: e.target.value })}
                                                >
                                                    {col.options?.map((opt) => (
                                                        <MenuItem key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </MenuItem>
                                                    ))}
                                                </TextField>
                                            ) : (
                                                <TextField
                                                    {...commonProps}
                                                    type={
                                                        col.type === "date"
                                                            ? "date"
                                                            : col.type === "time"
                                                              ? "time"
                                                              : col.type === "datetime"
                                                                ? "datetime-local"
                                                                : col.type === "number"
                                                                  ? "number"
                                                                  : "text"
                                                    }
                                                    value={row[col.name] ?? ""}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        updateRow(idx, {
                                                            ...row,
                                                            [col.name]: col.type === "number" ? (val === "" ? 0 : Number(val)) : val
                                                        });
                                                    }}
                                                    InputLabelProps={
                                                        col.type === "date" || col.type === "time" || col.type === "datetime" ? { shrink: true } : undefined
                                                    }
                                                />
                                            )}
                                        </td>
                                    );
                                })}
                                <td>
                                    <ActionRow style={{ justifyContent: "flex-end" }}>
                                        <UpButton onClick={() => moveRow(idx, "up")} disabled={disabled || idx === 0} iconSize={18} />
                                        <DownButton onClick={() => moveRow(idx, "down")} disabled={disabled || idx === value.length - 1} iconSize={18} />
                                        <DeleteButton
                                            onClick={() => removeRow(idx)}
                                            disabled={disabled || (subject !== undefined && !ability.can("delete", subject, { row: idx }))}
                                            iconSize={18}
                                        />
                                    </ActionRow>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </FieldTable>
                {value.length === 0 && <EmptyState>{emptyMessage || "No entries yet."}</EmptyState>}
            </FieldTableWrapper>
        </FieldContainer>
    );
}
