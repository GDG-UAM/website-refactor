"use client";

import { ReactNode, useState } from "react";
import { TextField, Switch, FormControlLabel, MenuItem } from "@mui/material";
import { usePermissions } from "#/providers/PermissionsProvider";
import {
    Form,
    Actions,
    FieldWrapper,
    HelpText,
    PreviewContainer,
    PreviewTitle,
    FormHeader,
    FormTitle,
    LockWarning,
    SectionDivider,
    LocalizedSection,
    LocaleSelector,
    LocaleLabel
} from "./AdminFormBuilder.styles";
import { SaveButton, CancelButton, PlainButton } from "#/components/Buttons";
import * as m from "#/paraglide/messages";
import { locales } from "#/paraglide/runtime";
import { motion, AnimatePresence } from "framer-motion";
import CustomMarkdownTextArea from "#/components/markdown/CustomMarkdownTextArea";
import RenderMarkdown from "#/components/markdown/RenderMarkdown";
import { AdminUserSelector } from "./AdminUserSelector";
import { AdminTableField } from "./fields/AdminTableField";
import { AdminCarouselField } from "./fields/AdminCarouselField";

const getShortLanguageName = (locale: string) => {
    const langKey = `navbar.lang.manualLanguages.${locale}` as keyof typeof m;
    const fullLangName = typeof m[langKey] === "function" ? (m[langKey] as Function)() : locale.toUpperCase();
    return (fullLangName as string).split(" (")[0];
};

export type FieldConfig<T> = {
    name: keyof T & string;
    label: string;
    type: "text" | "number" | "switch" | "select" | "multiline" | "url" | "date" | "datetime" | "markdown" | "user-selector" | "carousel" | "table";
    required?: boolean;
    options?: { label: string; value: any }[];
    roles?: ("user" | "team" | "organizer")[];
    columns?: any[];
    addButtonLabel?: string;
    emptyMessage?: string;
    helperText?: string;
    placeholder?: string;
    rows?: number;
    pattern?: string;
    fontFamily?: string;
    disabled?: boolean;
    gridColumn?: string;
    allowRawStrings?: boolean;
    validate?: (value: any) => string | boolean;
};

interface AdminFormBuilderProps<T> {
    id?: string;
    resource: string;
    action: "create" | "update";
    fields: FieldConfig<T>[];
    localizedFields?: FieldConfig<T>[];
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

const localeVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 30 : -30,
        opacity: 0
    }),
    center: {
        x: 0,
        opacity: 1
    },
    exit: (direction: number) => ({
        x: direction > 0 ? -30 : 30,
        opacity: 0
    })
} as const;

export function AdminFormBuilder<T extends Record<string, any>>({
    id: resourceId,
    resource,
    action,
    fields,
    localizedFields,
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
    const sortedLocales = [...locales].sort((a, b) => {
        if (a === "es") return -1;
        if (b === "es") return 1;
        return 0;
    });
    const [activeLocale, setActiveLocale] = useState<(typeof locales)[number]>(sortedLocales[0]);
    const [prevLocale, setPrevLocale] = useState<(typeof locales)[number]>(sortedLocales[0]);
    const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

    const activeIndex = sortedLocales.indexOf(activeLocale);
    const prevIndex = sortedLocales.indexOf(prevLocale);
    const direction = activeIndex > prevIndex ? 1 : -1;

    const handleLocaleChange = (newLocale: (typeof locales)[number]) => {
        if (newLocale === activeLocale) return;
        setPrevLocale(activeLocale);
        setActiveLocale(newLocale);
    };

    const subject = resourceId ? `${resource}.${resourceId}` : resource;
    const canUpdateResource = action === "update" ? ability.canUpdateAnyField(subject, data) : true;
    const isActuallyDisabled = disabled || (action === "update" && !canUpdateResource);

    const isFieldMissing = (f: FieldConfig<T>, val: any) => {
        return f.required && (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0));
    };

    const getBaseLabel = (l: string) => l.split(" (")[0];
    const missingFieldGroups: Record<string, string[]> = {};

    fields.forEach((f) => {
        if (isFieldMissing(f, data[f.name])) {
            const base = getBaseLabel(f.label);
            if (!missingFieldGroups[base]) missingFieldGroups[base] = [];
        }
    });

    localizedFields?.forEach((f) => {
        if (!f.required) return;
        const base = getBaseLabel(f.label);
        sortedLocales.forEach((locale) => {
            const val = data[f.name]?.[locale];
            if (!val || (typeof val === "string" && val.trim() === "")) {
                if (!missingFieldGroups[base]) missingFieldGroups[base] = [];
                missingFieldGroups[base].push(getShortLanguageName(locale));
            }
        });
    });

    const formattedMissingItems = Object.entries(missingFieldGroups).map(([label, langs]) => {
        if (langs.length === 0) return label;
        return `${label} (${langs.join(", ")})`;
    });

    const validationErrors: string[] = [];
    [...fields, ...(localizedFields || [])].forEach((f) => {
        if (f.validate) {
            const result = f.validate(data[f.name]);
            if (typeof result === "string") {
                validationErrors.push(`${f.label}: ${result}`);
            } else if (result === false) {
                validationErrors.push(`${f.label}: Invalid value`);
            }
        }
    });

    const isFormValid = formattedMissingItems.length === 0 && validationErrors.length === 0;

    const saveButtonTooltip = isActuallyDisabled
        ? m["admin.form.view_only_warning"]()
        : formattedMissingItems.length > 0
          ? m["admin.form.required_fields_error"]({ fields: formattedMissingItems.join(", ") })
          : validationErrors.length > 0
            ? validationErrors.join("\n")
            : "";

    const handleSubmit = () => {
        if (!isFormValid) return;

        // Filter out data that the user doesn't have permission to modify
        const finalData = { ...data };
        [...fields, ...(localizedFields || [])].forEach((field) => {
            const canEdit = ability.can(action, resourceId ? `${resource}.${resourceId}` : resource, { field: field.name });
            if (!canEdit) {
                delete finalData[field.name];
            }
        });

        onSubmit(finalData);
    };

    const renderField = (field: FieldConfig<T>, isLocalized = false) => {
        const subject = resourceId ? `${resource}.${resourceId}` : resource;
        const canEdit = ability.can(action, subject, { field: field.name }) && !field.disabled;

        let value = data[field.name];
        if (isLocalized) {
            value = (value && typeof value === "object" ? value[activeLocale] : "") || "";
        }

        const handleFieldChange = (val: any) => {
            if (!touchedFields.has(field.name)) {
                const newTouched = new Set(touchedFields);
                newTouched.add(field.name);
                setTouchedFields(newTouched);
            }
            if (isLocalized) {
                const currentLocalizedValue = (data[field.name] && typeof data[field.name] === "object" ? { ...data[field.name] } : {}) as Record<string, any>;
                onChange({
                    ...data,
                    [field.name]: {
                        ...currentLocalizedValue,
                        [activeLocale]: val
                    }
                });
            } else {
                onChange({ ...data, [field.name]: val });
            }
        };

        const isFieldValid = !isFieldMissing(field, value);
        const showError = !!(field.required && !isFieldValid && touchedFields.has(field.name));

        const commonProps = {
            label: isLocalized ? `${field.label} (${getShortLanguageName(activeLocale)})` : field.label,
            fullWidth: true,
            disabled: !canEdit || submitting || isActuallyDisabled,
            required: field.required,
            placeholder: field.placeholder,
            size: "small" as const,
            error: showError,
            onBlur: () => {
                if (!touchedFields.has(field.name)) {
                    const newTouched = new Set(touchedFields);
                    newTouched.add(field.name);
                    setTouchedFields(newTouched);
                }
            }
        };

        const renderInput = () => {
            switch (field.type) {
                case "switch":
                    return (
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={!!value}
                                    onChange={(e) => handleFieldChange(e.target.checked)}
                                    disabled={!canEdit || submitting || isActuallyDisabled}
                                />
                            }
                            label={field.label}
                        />
                    );

                case "select":
                    return (
                        <TextField {...commonProps} select value={value || ""} onChange={(e) => handleFieldChange(e.target.value)}>
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
                                label={commonProps.label}
                                value={value || ""}
                                onChange={(val) => handleFieldChange(val)}
                                placeholder={field.placeholder}
                                minRows={field.rows || 10}
                                disabled={submitting || isActuallyDisabled || !canEdit}
                                error={showError}
                                onBlur={commonProps.onBlur}
                                required={field.required}
                            />
                            {value && !isActuallyDisabled && (
                                <PreviewContainer>
                                    <PreviewTitle>Preview ({getShortLanguageName(activeLocale)})</PreviewTitle>
                                    <RenderMarkdown markdown={value} />
                                </PreviewContainer>
                            )}
                        </>
                    );
                case "user-selector":
                    return (
                        <AdminUserSelector
                            {...commonProps}
                            value={value || []}
                            roles={field.roles}
                            allowRawStrings={field.allowRawStrings}
                            onChange={(val) => handleFieldChange(val)}
                        />
                    );
                case "multiline":
                    return (
                        <TextField {...commonProps} multiline rows={field.rows || 3} value={value || ""} onChange={(e) => handleFieldChange(e.target.value)} />
                    );

                case "table":
                    return (
                        <AdminTableField
                            {...commonProps}
                            value={value || []}
                            onChange={(val) => handleFieldChange(val)}
                            columns={field.columns || []}
                            addButtonLabel={field.addButtonLabel}
                            emptyMessage={field.emptyMessage}
                            subject={subject}
                        />
                    );

                case "carousel":
                    return (
                        <AdminCarouselField
                            {...commonProps}
                            value={value || []}
                            onChange={(val) => handleFieldChange(val)}
                            inspectMode={disabled && ability.canUpdateAnyField(`admin.hackathons.${resourceId}.intermission.carousel`, { carousel: value })}
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
                            value={field.type === "date" && typeof value === "string" ? value.split("T")[0] : (value ?? "")}
                            onChange={(e) => {
                                const val = e.target.value;
                                handleFieldChange(field.type === "number" ? (val === "" ? 0 : Number(val)) : val);
                            }}
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
            <FieldWrapper key={`${field.name}_${isLocalized ? activeLocale : "base"}`} $gridColumn={field.gridColumn}>
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

            {fields.map((f) => renderField(f))}

            {localizedFields && localizedFields.length > 0 && (
                <>
                    <SectionDivider />
                    <LocaleSelector>
                        <LocaleLabel>{m["admin.form.languages"]?.()}</LocaleLabel>
                        {sortedLocales.map((locale) => {
                            const shortLangName = getShortLanguageName(locale);

                            return (
                                <PlainButton
                                    key={locale}
                                    type="button"
                                    slim
                                    color={activeLocale === locale ? "primary" : "default"}
                                    onClick={() => handleLocaleChange(locale)}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <img
                                            src={`https://hatscripts.github.io/circle-flags/flags/language/${locale}.svg`}
                                            alt={`${locale} flag`}
                                            style={{ width: 18, height: 18, borderRadius: "50%" }}
                                        />
                                        <span>{shortLangName}</span>
                                    </div>
                                </PlainButton>
                            );
                        })}
                    </LocaleSelector>
                    <LocalizedSection style={{ position: "relative" }}>
                        <AnimatePresence mode="popLayout" custom={direction}>
                            <motion.div
                                key={activeLocale}
                                custom={direction}
                                variants={localeVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{
                                    x: { type: "spring", stiffness: 350, damping: 30 },
                                    opacity: { duration: 0.2 }
                                }}
                                style={{
                                    width: "100%",
                                    display: "grid",
                                    gridTemplateColumns: "repeat(12, 1fr)",
                                    gap: "30px"
                                }}
                            >
                                {localizedFields.map((f) => renderField(f, true))}
                            </motion.div>
                        </AnimatePresence>
                    </LocalizedSection>
                </>
            )}

            <Actions>
                <SaveButton onClick={handleSubmit} disabled={submitting || isActuallyDisabled || !isFormValid} tooltip={saveButtonTooltip}>
                    {submitting ? savingLabel || m["admin.form.saving"]() : submitLabel || m["admin.form.save"]()}
                </SaveButton>
                {onCancel && (
                    <CancelButton onClick={onCancel} disabled={submitting}>
                        {cancelLabel || m["admin.form.cancel"]()}
                    </CancelButton>
                )}
                {footerActions}
            </Actions>
        </Form>
    );
}
