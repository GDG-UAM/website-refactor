"use client";

import React, { ReactNode } from "react";
import { TextField, Switch, FormControlLabel, MenuItem } from "@mui/material";
import { usePermissions } from "#/providers/PermissionsProvider";
import { Form, Actions, FieldWrapper, HelpText } from "./AdminFormBuilder.styles";
import { SaveButton, CancelButton } from "#/components/Buttons";

export type FieldConfig<T> = {
    name: keyof T & string;
    label: string;
    type: "text" | "number" | "switch" | "select" | "multiline" | "url" | "date";
    required?: boolean;
    options?: { label: string; value: any }[];
    helperText?: string;
    placeholder?: string;
    rows?: number;
    pattern?: string;
    fontFamily?: string;
    disabled?: boolean;
    gridColumn?: string;
};

interface AdminFormBuilderProps<T> {
    id?: string;
    resource: string;
    action: "create" | "update";
    fields: FieldConfig<T>[];
    data: T;
    onChange: (data: T) => void;
    onSubmit: (data: T) => void;
    onCancel?: () => void;
    submitting?: boolean;
    submitLabel?: string;
    cancelLabel?: string;
    savingLabel?: string;
    footerActions?: ReactNode;
}

export function AdminFormBuilder<T extends Record<string, any>>({
    id: resourceId,
    resource,
    action,
    fields,
    data,
    onChange,
    onSubmit,
    onCancel,
    submitting,
    submitLabel,
    cancelLabel,
    savingLabel,
    footerActions
}: AdminFormBuilderProps<T>) {
    const { ability } = usePermissions();

    // Use translations if available, otherwise fallback
    const t = (key: string) => key;

    const handleSubmit = () => {
        // Filter out data that the user doesn't have permission to modify
        const finalData = { ...data };
        fields.forEach((field) => {
            const canEdit = ability.can(action, resourceId ? `${resource}.${resourceId}` : resource, { field: field.name });
            if (!canEdit) {
                delete finalData[field.name];
            }
        });

        onSubmit(finalData);
    };

    const renderField = (field: FieldConfig<T>) => {
        const subject = resourceId ? `${resource}.${resourceId}` : resource;
        const canEdit = ability.can(action, subject, { field: field.name }) && !field.disabled;
        const value = data[field.name];

        const commonProps = {
            label: field.label,
            fullWidth: true,
            disabled: !canEdit || submitting,
            required: field.required,
            helperText: field.helperText,
            placeholder: field.placeholder,
            size: "small" as const
        };

        switch (field.type) {
            case "switch":
                return (
                    <FieldWrapper key={field.name}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={!!value}
                                    onChange={(e) => onChange({ ...data, [field.name]: e.target.checked })}
                                    disabled={!canEdit || submitting}
                                />
                            }
                            label={field.label}
                        />
                        {field.helperText && <HelpText>{field.helperText}</HelpText>}
                    </FieldWrapper>
                );

            case "select":
                return (
                    <TextField
                        key={field.name}
                        {...commonProps}
                        select
                        value={value || ""}
                        onChange={(e) => onChange({ ...data, [field.name]: e.target.value })}
                    >
                        {field.options?.map((opt) => (
                            <MenuItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </MenuItem>
                        ))}
                    </TextField>
                );

            case "multiline":
                return (
                    <TextField
                        key={field.name}
                        {...commonProps}
                        multiline
                        rows={field.rows || 3}
                        value={value || ""}
                        onChange={(e) => onChange({ ...data, [field.name]: e.target.value })}
                    />
                );

            case "url":
            case "date":
            case "number":
            case "text":
            default:
                return (
                    <TextField
                        key={field.name}
                        {...commonProps}
                        type={field.type === "url" ? "url" : field.type === "date" ? "date" : field.type === "number" ? "number" : "text"}
                        value={value ?? ""}
                        onChange={(e) => onChange({ ...data, [field.name]: e.target.value })}
                        inputProps={{
                            pattern: field.pattern,
                            style: { fontFamily: field.fontFamily },
                            shrink: field.type === "date" ? true : undefined
                        }}
                        InputLabelProps={field.type === "date" ? { shrink: true } : undefined}
                    />
                );
        }
    };

    return (
        <Form>
            {fields.map(renderField)}

            <Actions>
                <SaveButton onClick={handleSubmit} disabled={submitting}>
                    {submitting ? savingLabel || "Saving..." : submitLabel || "Save"}
                </SaveButton>
                {onCancel && (
                    <CancelButton onClick={onCancel} disabled={submitting}>
                        {cancelLabel || "Cancel"}
                    </CancelButton>
                )}
                {footerActions}
            </Actions>
        </Form>
    );
}
