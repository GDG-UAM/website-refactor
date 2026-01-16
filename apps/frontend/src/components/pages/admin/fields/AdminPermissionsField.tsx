"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { AddButton, DeleteButton, EditButton, SaveButton, CancelButton, CollapsableMenuButton, AcceptButton, InspectButton } from "#/components/Buttons";
import { Select, MenuItem, TextField, Autocomplete, Checkbox, FormControlLabel, CircularProgress } from "@mui/material";
import Modal from "#/components/Modal";
import * as m from "#/paraglide/messages";
import {
    PermissionsList,
    PermissionRuleItem,
    RuleInfo,
    RuleTitle,
    BadgeRow,
    ActionBadge,
    EffectBadge,
    ConditionText,
    ActionRow,
    MobileActionTrigger,
    EmptyState,
    ModalFieldWrapper,
    EffectToggleGroup,
    ModalSubHeading,
    ModalCaption,
    FlexBox,
    MonoText,
    Stack
} from "./AdminPermissionsField.styles";
import { RESOURCE_TREE, ResourceNode } from "./AdminPermissionsResourceTree";
import { FieldContainer, FieldLabel, FieldHeader } from "./AdminFieldTable.styles";
import styled from "styled-components";

const LabelGroupContainer = styled.div`
    border: 1px solid var(--admin-card-border);
    border-radius: 12px;
    padding: 16px;
    background: var(--admin-bg-secondary);
`;

interface SerializablePermission {
    resource: string;
    actions: string[];
    effect: "allow" | "deny";
    conditions?: Record<string, any>;
}

interface AdminPermissionsFieldProps {
    value: SerializablePermission[];
    onChange: (value: SerializablePermission[]) => void;
    label?: string;
    disabled?: boolean;
    required?: boolean;
    readOnly?: boolean;
}

const ACTIONS = ["create", "read", "update", "delete"];

// --- Optimized Tree Walking Utility ---

interface ExplorerLevel {
    pathSoFar: string;
    node: ResourceNode | null;
    options: { label: string; value: string }[] | null;
    isId: boolean;
    selectedValue: string;
}

const getExplorerLevels = (resource: string): ExplorerLevel[] => {
    const segments = resource ? resource.split(".") : [];
    const levels: ExplorerLevel[] = [];

    let currentChildren: any = RESOURCE_TREE;
    let pathAcc: string[] = [];

    // Level 0: Root nodes
    levels.push({
        pathSoFar: "",
        node: null,
        isId: false,
        options: Object.keys(RESOURCE_TREE).map((key) => ({
            label: key === "*" ? m["admin.permissions.form.editor.wildcard"]() : RESOURCE_TREE[key].label || key,
            value: key
        })),
        selectedValue: segments[0] || ""
    });

    // Walk the segments
    for (let i = 0; i < segments.length; i++) {
        const currentSeg = segments[i];
        if (!currentSeg) break;

        // Find the node that defines the structure for this segment
        let node: any = currentChildren[currentSeg];

        // If we selected "*" or an ID, but the tree defines sub-resources under a "{id}" node,
        // we follow the "{id}" node to reveal more levels.
        if ((currentSeg === "*" || !node) && currentChildren["{id}"] && typeof currentChildren["{id}"] === "object") {
            node = currentChildren["{id}"];
        }

        if (node && typeof node === "object" && node.children) {
            const nextSeg = segments[i + 1] || "";
            const childKeys = Object.keys(node.children);
            const isId = childKeys.includes("{id}");

            levels.push({
                pathSoFar: [...pathAcc, currentSeg].join("."),
                node: node,
                isId: isId,
                options: isId
                    ? null
                    : childKeys.map((k) => ({
                          label:
                              k === "*"
                                  ? m["admin.permissions.form.editor.wildcard"]()
                                  : typeof node.children[k] === "object" && node.children[k].label
                                    ? node.children[k].label
                                    : k,
                          value: k
                      })),
                selectedValue: nextSeg
            });

            currentChildren = node.children;
            pathAcc.push(currentSeg);
        } else {
            break;
        }
    }

    return levels;
};

// Global label cache to persist labels across re-renders/searches
const labelCache: Record<string, string> = {
    "*": m["admin.permissions.form.editor.wildcard"]()
};

const StaticSelector: React.FC<{
    options: { label: string; value: string }[];
    value: string;
    onChange: (val: string) => void;
    placeholder: string;
    disabled?: boolean;
}> = ({ options, value, onChange, placeholder, disabled }) => (
    <Select
        size="small"
        value={value}
        displayEmpty
        onChange={(e) => onChange(e.target.value as string)}
        sx={{ width: { xs: "100%", sm: 180 }, maxWidth: "100%" }}
        disabled={disabled}
    >
        <MenuItem value="" disabled>
            {placeholder}
        </MenuItem>
        {options.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
                {opt.value === "*" ? m["admin.permissions.form.editor.wildcard"]() : opt.label}
            </MenuItem>
        ))}
    </Select>
);

const SearchableID: React.FC<{
    node: ResourceNode;
    parents: string[];
    value: string;
    onChange: (val: { label: string; value: string }) => void;
    disabled?: boolean;
}> = ({ node, parents, value, onChange, disabled }) => {
    const [open, setOpen] = useState(false);
    const [options, setOptions] = useState<{ label: string; value: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [inputValue, setInputValue] = useState(value === "*" ? "" : labelCache[value] || value);

    // Update local options whenever cache exists
    useEffect(() => {
        if (value && labelCache[value] && !options.find((o) => o.value === value)) {
            setOptions((prev) => [...prev, { label: labelCache[value], value }]);
        }
    }, [value, options]);

    const performSearch = useCallback(
        async (q: string) => {
            if (!node.search) return;

            // Clean the query: if it's the wildcard label or literal "*", treat as empty search to fetch all
            const cleanQuery = q === labelCache["*"] || q === "*" ? "" : q;

            setLoading(true);
            try {
                const res = await node.search(cleanQuery, parents);
                setOptions((prev) => {
                    const combined = [...res.filter((r) => r.value !== "*")];
                    // Only add wildcard if it's explicitly allowed in children
                    if (node.children && node.children["*"]) {
                        combined.unshift({ label: m["admin.permissions.form.editor.wildcard"](), value: "*" });
                    }
                    if (value && labelCache[value] && value !== "*") {
                        if (!combined.find((o) => o.value === value)) {
                            combined.push({ label: labelCache[value], value });
                        }
                    }
                    return combined;
                });
            } catch (e) {
                setOptions([{ label: m["admin.permissions.form.editor.wildcard"](), value: "*" }]);
            } finally {
                setLoading(false);
            }
        },
        [node, parents, value]
    );

    useEffect(() => {
        if (open) performSearch(inputValue);
    }, [open, performSearch, inputValue]);

    const selectedOption = options.find((o) => o.value === value) || (value && value !== "*" ? { label: labelCache[value] || value, value } : null);

    return (
        <Autocomplete
            size="small"
            disabled={disabled}
            open={open}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            options={options}
            loading={loading}
            value={selectedOption}
            onChange={(_, val) => {
                const final = val || { label: m["admin.permissions.form.editor.wildcard"](), value: "*" };
                labelCache[final.value] = final.label;
                onChange(final);
            }}
            inputValue={inputValue}
            onInputChange={(_, val) => setInputValue(val)}
            isOptionEqualToValue={(opt, val) => opt.value === val?.value}
            getOptionLabel={(opt) => opt.label || opt.value}
            sx={{ width: { xs: "100%", sm: 320 }, maxWidth: "100%" }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    placeholder={m["admin.permissions.form.editor.search_id_placeholder"]()}
                    sx={{
                        "& .MuiInputBase-input": {
                            textOverflow: "ellipsis"
                        }
                    }}
                    InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                            <React.Fragment>
                                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                            </React.Fragment>
                        )
                    }}
                />
            )}
        />
    );
};

export const AdminPermissionsField: React.FC<AdminPermissionsFieldProps> = ({ value = [], onChange, label, disabled = false, required }) => {
    const [editingIdx, setEditingIdx] = useState<number | null>(null);
    const [mobileActionsIdx, setMobileActionsIdx] = useState<number | null>(null);
    const [tempRule, setTempRule] = useState<SerializablePermission | null>(null);
    const [conditionText, setConditionText] = useState("");

    // Initialize conditionText when starting to edit
    useEffect(() => {
        if (editingIdx !== null && tempRule) {
            setConditionText(tempRule.conditions ? JSON.stringify(tempRule.conditions, null, 2) : "");
        } else if (editingIdx === null) {
            setConditionText("");
        }
    }, [editingIdx]);

    const isJsonValid = useMemo(() => {
        const trimmed = conditionText.trim();
        if (!trimmed) return true;
        try {
            JSON.parse(trimmed);
            return true;
        } catch (e) {
            return false;
        }
    }, [conditionText]);

    const addRule = () => {
        setTempRule({ resource: "", actions: ["read"], effect: "allow" });
        setEditingIdx(value.length);
    };

    const removeRule = (idx: number) => {
        const newValue = [...value];
        newValue.splice(idx, 1);
        onChange(newValue);
    };

    const handleSaveRule = () => {
        if (editingIdx !== null && tempRule) {
            const newValue = [...value];
            newValue[editingIdx] = tempRule;
            onChange(newValue);
            setEditingIdx(null);
            setTempRule(null);
        }
    };

    const handleLevelChange = (levelIdx: number, val: { label: string; value: string }) => {
        if (!tempRule) return;
        const segments = tempRule.resource ? tempRule.resource.split(".") : [];
        const newSegments = segments.slice(0, levelIdx);
        if (val.value) newSegments.push(val.value);
        setTempRule({ ...tempRule, resource: newSegments.join(".") });
    };

    const renderExplorer = () => {
        if (!tempRule) return null;
        const levels = getExplorerLevels(tempRule.resource);

        return (
            <ModalFieldWrapper>
                <ModalSubHeading>{m["admin.permissions.form.editor.resource_explorer"]()}</ModalSubHeading>
                <FlexBox $gap={1.5} $flexWrap="wrap" $alignItems="center">
                    {levels.map((lvl, idx) => {
                        const key = `level-${idx}-${lvl.pathSoFar}`;
                        if (lvl.isId) {
                            return (
                                <SearchableID
                                    key={key}
                                    node={lvl.node!}
                                    parents={lvl.pathSoFar.split(".")}
                                    value={lvl.selectedValue}
                                    onChange={(v) => handleLevelChange(idx, v)}
                                    disabled={disabled}
                                />
                            );
                        } else if (lvl.options) {
                            return (
                                <StaticSelector
                                    key={key}
                                    options={lvl.options}
                                    value={lvl.selectedValue}
                                    placeholder={
                                        idx === 0
                                            ? m["admin.permissions.form.editor.resource_placeholder"]()
                                            : m["admin.permissions.form.editor.type_placeholder"]()
                                    }
                                    onChange={(v) => handleLevelChange(idx, { label: v, value: v })}
                                    disabled={disabled}
                                />
                            );
                        }
                        return null;
                    })}
                </FlexBox>
                {tempRule.resource && (
                    <FlexBox
                        $mt={2}
                        $p={1.5}
                        $borderRadius={2}
                        $bgcolor="var(--admin-bg-secondary)"
                        $border="1px solid var(--admin-card-border)"
                        $alignItems="center"
                        $gap={1}
                        style={{ minWidth: 0 }}
                    >
                        <ModalCaption>{m["admin.permissions.form.editor.current_path"]()}</ModalCaption>
                        <MonoText>{tempRule.resource}</MonoText>
                    </FlexBox>
                )}
            </ModalFieldWrapper>
        );
    };

    const getFieldsForPath = (path: string) => {
        const segments = path.split(".");
        let current: any = RESOURCE_TREE;
        let lastFields: string[] = [];
        for (const seg of segments) {
            if (!seg) break;

            let node = current[seg];

            // If we hit a wildcard or an ID, check if the tree defines a structure under "{id}"
            if ((seg === "*" || !node) && current["{id}"]) {
                node = current["{id}"];
            }

            if (node && typeof node === "object") {
                if (node.fields) lastFields = node.fields;
                current = node.children || {};
            } else break;
        }
        return lastFields;
    };

    const toggleAction = (action: string) => {
        if (!tempRule) return;
        let acts = [...tempRule.actions];
        if (action === "manage") {
            acts = acts.includes("manage") ? [] : ["manage", ...ACTIONS];
        } else {
            if (acts.includes(action)) {
                acts = acts.filter((a) => a !== action && a !== "manage");
            } else {
                acts.push(action);
                if (ACTIONS.every((a) => acts.includes(a))) acts.push("manage");
            }
        }
        setTempRule({ ...tempRule, actions: [...new Set(acts)] });
    };

    const isManaged = tempRule?.actions.includes("manage");
    const allCrudSelected = ACTIONS.every((a) => tempRule?.actions.includes(a));
    const manageState = isManaged || allCrudSelected ? true : ACTIONS.some((a) => tempRule?.actions.includes(a)) ? "indeterminate" : false;

    return (
        <FieldContainer>
            <FieldHeader>
                <FieldLabel $disabled={disabled}>
                    {label || m["admin.permissions.form.permissions"]()} {required && <span style={{ color: "var(--google-red)" }}>*</span>}
                </FieldLabel>
                {!disabled && <AddButton onClick={addRule}>{m["admin.permissions.form.editor.add_rule"]()}</AddButton>}
            </FieldHeader>

            <PermissionsList>
                {value.length === 0 && <EmptyState>{m["admin.permissions.form.editor.no_rules"]()}</EmptyState>}
                {value.map((rule, idx) => (
                    <PermissionRuleItem key={idx}>
                        <RuleInfo>
                            <RuleTitle>{rule.resource || "(Root)"}</RuleTitle>
                            <BadgeRow>
                                <EffectBadge $allow={rule.effect === "allow"}>
                                    {rule.effect === "allow"
                                        ? m["admin.permissions.form.editor.effect_allow"]()
                                        : m["admin.permissions.form.editor.effect_deny"]()}
                                </EffectBadge>
                                {rule.actions.includes("manage") ? (
                                    <ActionBadge>{m["admin.permissions.form.editor.action_manage"]()}</ActionBadge>
                                ) : (
                                    rule.actions.map((a) => (
                                        <ActionBadge key={a}>
                                            {m[`admin.permissions.form.editor.action_${a as "read" | "create" | "update" | "delete"}`]?.() || a.toUpperCase()}
                                        </ActionBadge>
                                    ))
                                )}
                                {rule.conditions && (
                                    <ConditionText>
                                        {Object.keys(rule.conditions).length > 0
                                            ? JSON.stringify(rule.conditions)
                                            : m["admin.permissions.form.editor.conditions_none"]()}
                                    </ConditionText>
                                )}
                            </BadgeRow>
                        </RuleInfo>
                        <ActionRow>
                            {disabled ? (
                                <InspectButton
                                    onClick={() => {
                                        setTempRule({ ...rule });
                                        setEditingIdx(idx);
                                    }}
                                    iconSize={20}
                                />
                            ) : (
                                <EditButton
                                    onClick={() => {
                                        setTempRule({ ...rule });
                                        setEditingIdx(idx);
                                    }}
                                    disabled={disabled}
                                    iconSize={20}
                                />
                            )}
                            <DeleteButton onClick={() => removeRule(idx)} confirmationDuration={1000} iconSize={20} disabled={disabled} />
                        </ActionRow>
                        <MobileActionTrigger>
                            <CollapsableMenuButton onClick={() => setMobileActionsIdx(idx)} disabled={disabled} iconSize={20} />
                        </MobileActionTrigger>
                    </PermissionRuleItem>
                ))}
            </PermissionsList>

            <Modal isOpen={mobileActionsIdx !== null} onClose={() => setMobileActionsIdx(null)} title={m["admin.permissions.form.editor.actions"]()} width="xs">
                {mobileActionsIdx !== null && (
                    <Stack $spacing={2}>
                        <EditButton
                            fullWidth
                            onClick={() => {
                                setTempRule({ ...value[mobileActionsIdx] });
                                setEditingIdx(mobileActionsIdx);
                                setMobileActionsIdx(null);
                            }}
                        >
                            {m["buttons.edit"]()}
                        </EditButton>
                        <DeleteButton
                            fullWidth
                            onClick={() => {
                                removeRule(mobileActionsIdx);
                                setMobileActionsIdx(null);
                            }}
                        >
                            {m["buttons.delete"]()}
                        </DeleteButton>
                    </Stack>
                )}
            </Modal>

            <Modal
                isOpen={editingIdx !== null}
                title={m["admin.permissions.form.editor.edit_rule"]()}
                width="md"
                onClose={
                    disabled
                        ? () => {
                              setEditingIdx(null);
                              setTempRule(null);
                          }
                        : undefined
                }
                buttons={
                    disabled
                        ? []
                        : ([
                              <SaveButton key="save" onClick={handleSaveRule} disabled={conditionText.trim() !== "" && !isJsonValid} />,
                              <CancelButton
                                  key="cancel"
                                  onClick={() => {
                                      setEditingIdx(null);
                                      setTempRule(null);
                                  }}
                              />
                          ].filter(Boolean) as React.ReactNode[])
                }
            >
                {tempRule && (
                    <FlexBox $p={1} $direction="column">
                        {renderExplorer()}

                        <ModalSubHeading>{m["admin.permissions.form.editor.effect"]()}</ModalSubHeading>
                        <EffectToggleGroup>
                            <AcceptButton
                                disabled={disabled}
                                color={tempRule.effect === "allow" ? "success" : "default"}
                                onClick={() => setTempRule({ ...tempRule, effect: "allow" })}
                                showColorDisabled
                            >
                                {m["admin.permissions.form.editor.effect_allow"]()}
                            </AcceptButton>
                            <CancelButton
                                disabled={disabled}
                                color={tempRule.effect === "deny" ? "danger" : "default"}
                                onClick={() => setTempRule({ ...tempRule, effect: "deny" })}
                                showColorDisabled
                            >
                                {m["admin.permissions.form.editor.effect_deny"]()}
                            </CancelButton>
                        </EffectToggleGroup>

                        <ModalSubHeading>{m["admin.permissions.form.editor.actions"]()}</ModalSubHeading>
                        <LabelGroupContainer>
                            <Stack $spacing={0.5}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            disabled={disabled}
                                            indeterminate={manageState === "indeterminate"}
                                            checked={manageState === true}
                                            onChange={() => toggleAction("manage")}
                                        />
                                    }
                                    label={<strong>{m["admin.permissions.form.editor.action_manage"]()}</strong>}
                                />
                                <Stack $pl={3} $direction="column" $spacing={0.5}>
                                    {ACTIONS.map((a) => (
                                        <FormControlLabel
                                            key={a}
                                            control={<Checkbox disabled={disabled} checked={tempRule.actions.includes(a)} onChange={() => toggleAction(a)} />}
                                            label={
                                                m[`admin.permissions.form.editor.action_${a as "read" | "create" | "update" | "delete"}`]?.() ||
                                                a.charAt(0).toUpperCase() + a.slice(1)
                                            }
                                        />
                                    ))}
                                </Stack>
                            </Stack>
                        </LabelGroupContainer>

                        {(tempRule.actions.includes("update") || tempRule.actions.includes("manage")) && (
                            <FlexBox $mt={2} $direction="column">
                                <ModalSubHeading>
                                    {tempRule.effect === "allow"
                                        ? m["admin.permissions.form.editor.fields_allowed"]()
                                        : m["admin.permissions.form.editor.fields_denied"]()}
                                </ModalSubHeading>
                                <Autocomplete
                                    multiple
                                    disabled={disabled}
                                    options={getFieldsForPath(tempRule.resource)}
                                    value={tempRule.conditions?.field?.$in || []}
                                    onChange={(_, val) => {
                                        if (!tempRule) return;

                                        let currentConditions: any = {};
                                        try {
                                            if (conditionText.trim()) {
                                                currentConditions = JSON.parse(conditionText);
                                            }
                                        } catch (e) {
                                            currentConditions = tempRule.conditions || {};
                                        }

                                        const newConditions = { ...currentConditions };
                                        if (val.length) newConditions.field = { $in: val };
                                        else delete newConditions.field;

                                        const finalConditions = Object.keys(newConditions).length ? newConditions : undefined;
                                        setTempRule({ ...tempRule, conditions: finalConditions });
                                        setConditionText(finalConditions ? JSON.stringify(finalConditions, null, 2) : "");
                                    }}
                                    renderInput={(p) => (
                                        <TextField
                                            {...p}
                                            size="small"
                                            placeholder={m["admin.permissions.form.editor.fields_placeholder"]()}
                                            sx={{
                                                "& .MuiInputBase-input": {
                                                    textOverflow: "ellipsis"
                                                }
                                            }}
                                        />
                                    )}
                                    sx={{ width: "100%" }}
                                />
                            </FlexBox>
                        )}

                        <FlexBox $mt={2} $direction="column">
                            <ModalSubHeading>{m["admin.permissions.form.editor.conditions"]()} (JSON)</ModalSubHeading>
                            <TextField
                                fullWidth
                                multiline
                                rows={2}
                                disabled={disabled}
                                value={conditionText}
                                onChange={(e) => {
                                    const text = e.target.value;
                                    setConditionText(text);
                                    if (!text.trim()) {
                                        setTempRule((prev) => (prev ? { ...prev, conditions: undefined } : null));
                                        return;
                                    }
                                    try {
                                        const parsed = JSON.parse(text);
                                        setTempRule((prev) => (prev ? { ...prev, conditions: parsed } : null));
                                    } catch (e) {
                                        // Keep current tempRule.conditions until JSON is valid again
                                    }
                                }}
                                error={conditionText.trim() !== "" && !isJsonValid}
                                helperText={conditionText.trim() !== "" && !isJsonValid ? "Invalid JSON" : ""}
                                sx={{ "& .MuiInputBase-root": { fontFamily: "monospace", fontSize: "0.8rem" } }}
                            />
                        </FlexBox>
                    </FlexBox>
                )}
            </Modal>
        </FieldContainer>
    );
};
