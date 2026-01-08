"use client";

import React, { ReactNode } from "react";
import { TextField, Switch, FormControlLabel, MenuItem } from "@mui/material";
import { usePermissions } from "#/providers/PermissionsProvider";
import { Form, Actions, FieldWrapper, HelpText, PreviewContainer, PreviewTitle, FormHeader, FormTitle, LockWarning } from "./AdminFormBuilder.styles";
import { SaveButton, CancelButton } from "#/components/Buttons";
import * as m from "#/paraglide/messages";
import CustomMarkdownTextArea from "#/components/markdown/CustomMarkdownTextArea";
import RenderMarkdown from "#/components/markdown/RenderMarkdown";

export type FieldConfig<T> = {
    name: keyof T & string;
    label: string;
    type: "text" | "number" | "switch" | "select" | "multiline" | "url" | "date" | "datetime" | "markdown";
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
    disabled?: boolean;
    submitLabel?: string;
    cancelLabel?: string;
    savingLabel?: string;
    footerActions?: ReactNode;
    title?: string;
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
    disabled = false,
    submitLabel,
    cancelLabel,
    savingLabel,
    footerActions,
    title
}: AdminFormBuilderProps<T>) {
    const { ability } = usePermissions();
    const subject = resourceId ? `${resource}.${resourceId}` : resource;
    const canUpdateResource = action === "update" ? ability.canUpdateAnyField(subject, data) : true;
    const isActuallyDisabled = disabled || (action === "update" && !canUpdateResource);

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
            disabled: !canEdit || submitting || isActuallyDisabled,
            required: field.required,
            placeholder: field.placeholder,
            size: "small" as const
        };

        const renderInput = () => {
            switch (field.type) {
                case "switch":
                    return (
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={!!value}
                                    onChange={(e) => onChange({ ...data, [field.name]: e.target.checked })}
                                    disabled={!canEdit || submitting || isActuallyDisabled}
                                />
                            }
                            label={field.label}
                        />
                    );

                case "select":
                    return (
                        <TextField {...commonProps} select value={value || ""} onChange={(e) => onChange({ ...data, [field.name]: e.target.value })}>
                            {field.options?.map((opt) => (
                                <MenuItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </MenuItem>
                            ))}
                        </TextField>
                    );

                case "markdown":
                    return (
                        <>
                            <CustomMarkdownTextArea
                                label={field.label}
                                value={value || ""}
                                onChange={(val) => onChange({ ...data, [field.name]: val })}
                                placeholder={field.placeholder}
                                minRows={field.rows || 10}
                                disabled={submitting || isActuallyDisabled || !canEdit}
                            />
                            {value && !isActuallyDisabled && (
                                <PreviewContainer>
                                    <PreviewTitle>Preview</PreviewTitle>
                                    <RenderMarkdown markdown={value} />
                                </PreviewContainer>
                            )}
                        </>
                    );
                case "multiline":
                    return (
                        <TextField
                            {...commonProps}
                            multiline
                            rows={field.rows || 3}
                            value={value || ""}
                            onChange={(e) => onChange({ ...data, [field.name]: e.target.value })}
                        />
                    );

                case "date":
                case "datetime":
                case "number":
                case "text":
                default:
                    return (
                        <TextField
                            {...commonProps}
                            type={
                                field.type === "url"
                                    ? "url"
                                    : field.type === "date"
                                      ? "date"
                                      : field.type === "datetime"
                                        ? "datetime-local"
                                        : field.type === "number"
                                          ? "number"
                                          : "text"
                            }
                            value={value ?? ""}
                            onChange={(e) => onChange({ ...data, [field.name]: e.target.value })}
                            inputProps={{
                                pattern: field.pattern,
                                style: { fontFamily: field.fontFamily }
                            }}
                            InputLabelProps={field.type === "date" || field.type === "datetime" ? { shrink: true } : undefined}
                        />
                    );
            }
        };

        return (
            <FieldWrapper key={field.name} $gridColumn={field.gridColumn}>
                {renderInput()}
                {field.type !== "switch" && field.helperText && <HelpText>{field.helperText}</HelpText>}
            </FieldWrapper>
        );
    };

    return (
        <Form>
            {(title || isActuallyDisabled) && (
                <FormHeader>
                    {title && <FormTitle>{title}</FormTitle>}
                    {isActuallyDisabled && (
                        <LockWarning>
                            <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor">
                                <path d="m40-120 440-760 440 760H40Zm138-80h604L480-720 178-200Zm302-40q17 0 28.5-11.5T520-280q0-17-11.5-28.5T480-320q-17 0-28.5 11.5T440-280q0 17 11.5 28.5T480-240Zm-40-120h80v-200h-80v200Zm40-100Z" />
                            </svg>
                            {m["admin.form.view_only_warning"]?.() || "This form is in view-only mode."}
                        </LockWarning>
                    )}
                </FormHeader>
            )}
            {fields.map(renderField)}

            <Actions>
                <SaveButton onClick={handleSubmit} disabled={submitting || isActuallyDisabled}>
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
