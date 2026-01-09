import React, { useState, useEffect, useRef } from "react";
import { api } from "#/lib/eden";
import { Wrapper, Label, Control, Chip, ChipLabel, RemoveButton, Input, Dropdown, DropdownItem, NoResults, Avatar } from "./AdminUserSelector.styles";
import * as m from "#/paraglide/messages";

interface UserLite {
    _id: string;
    name: string;
    displayName?: string;
    email: string;
    image?: string;
}

interface AdminUserSelectorProps {
    value: string[];
    onChange: (value: string[]) => void;
    onBlur?: () => void;
    roles?: ("user" | "team" | "organizer")[];
    label?: string;
    disabled?: boolean;
    error?: boolean;
    required?: boolean;
    placeholder?: string;
}

const DEFAULT_ROLES: ("user" | "team" | "organizer")[] = ["team", "organizer"];

export const AdminUserSelector: React.FC<AdminUserSelectorProps> = ({
    value = [],
    onChange,
    onBlur,
    roles = DEFAULT_ROLES,
    label,
    disabled,
    error,
    required,
    placeholder
}) => {
    const [q, setQ] = useState("");
    const [results, setResults] = useState<UserLite[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<UserLite[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickAway = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                if (showDropdown) {
                    setShowDropdown(false);
                    setQ(""); // Ignore remaining text
                    onBlur?.();
                }
            }
        };
        document.addEventListener("mousedown", handleClickAway);
        return () => document.removeEventListener("mousedown", handleClickAway);
    }, [showDropdown, onBlur]);

    const valueKey = JSON.stringify(value);

    // Fetch initial user data for existing IDs
    useEffect(() => {
        const fetchInitialUsers = async () => {
            if (value.length === 0) {
                if (selectedUsers.length > 0) setSelectedUsers([]);
                return;
            }

            // Check if we already have the correct users in selectedUsers
            const currentIds = selectedUsers.map((u) => u._id);
            const isMatch = value.length === currentIds.length && value.every((id) => currentIds.includes(id));
            if (isMatch) return;

            try {
                const { data } = await api.admin.users.get({
                    query: { roles, pageSize: 100 }
                });

                if (data) {
                    const loaded = data.items.filter((u: UserLite) => value.includes(u._id));
                    setSelectedUsers(loaded);
                }
            } catch (err) {
                console.error("Failed to fetch initial authors", err);
            }
        };

        fetchInitialUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [valueKey, roles]);

    const [debouncedQ, setDebouncedQ] = useState(q);
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQ(q), 500);
        return () => clearTimeout(timer);
    }, [q]);

    // Search effect matching CustomMarkdownTextArea pattern
    useEffect(() => {
        if (!debouncedQ.trim() || !showDropdown) {
            if (results.length > 0) setResults([]);
            return;
        }

        let ignore = false;
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const { data, error: apiError } = await api.admin.users.get({
                    query: {
                        roles,
                        search: debouncedQ || undefined,
                        pageSize: 10
                    }
                });

                if (apiError) return;
                if (!ignore && data) {
                    setResults(data.items.filter((u: UserLite) => !value.includes(u._id)));
                }
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                if (!ignore) setLoading(false);
            }
        };

        fetchUsers();
        return () => {
            ignore = true;
        };
    }, [debouncedQ, showDropdown, roles, valueKey]);

    const handleSelect = (user: UserLite) => {
        const newValue = [...value, user._id];
        setSelectedUsers((prev) => [...prev, user]);
        onChange(newValue);
        setQ("");
        setResults([]);
        setShowDropdown(false);
        inputRef.current?.focus();
    };

    const handleRemove = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newValue = value.filter((v) => v !== id);
        setSelectedUsers((prev) => prev.filter((u: UserLite) => u._id !== id));
        onChange(newValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            setHighlightedIndex((prev) => (prev + 1) % Math.max(results.length, 1));
            setShowDropdown(true);
        } else if (e.key === "ArrowUp") {
            setHighlightedIndex((prev) => (prev - 1 + results.length) % Math.max(results.length, 1));
        } else if (e.key === "Enter" && showDropdown && results[highlightedIndex]) {
            e.preventDefault();
            handleSelect(results[highlightedIndex]);
        } else if (e.key === "Escape") {
            setShowDropdown(false);
        } else if (e.key === "Backspace" && !q && value.length > 0) {
            const lastId = value[value.length - 1];
            handleRemove(lastId, e as any);
        }
    };

    const isShrink = value.length > 0 || !!q || showDropdown;

    return (
        <Wrapper ref={wrapperRef} $disabled={disabled} $error={error}>
            <Label $shrink={isShrink} $disabled={disabled} $error={error} $focused={showDropdown}>
                {label}
                {required && error ? <span style={{ color: "var(--google-red)", marginLeft: "4px" }}>*</span> : " *"}
            </Label>
            <Control $disabled={disabled} $error={error} $focused={showDropdown} onClick={() => !disabled && inputRef.current?.focus()}>
                {selectedUsers.map((user) => (
                    <Chip key={user._id}>
                        {user.image && <Avatar src={user.image} alt={user.name} />}
                        <ChipLabel title={user.name}>{user.displayName || user.name}</ChipLabel>
                        {!disabled && <RemoveButton onClick={(e) => handleRemove(user._id, e)}>×</RemoveButton>}
                    </Chip>
                ))}
                <Input
                    ref={inputRef}
                    value={q}
                    onChange={(e) => {
                        setQ(e.target.value);
                        setShowDropdown(true);
                        setHighlightedIndex(0);
                    }}
                    onFocus={() => !disabled && setShowDropdown(true)}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    placeholder={value.length === 0 ? placeholder : ""}
                />
            </Control>

            {showDropdown && (q.trim() || results.length > 0) && (
                <Dropdown>
                    {results.length > 0 ? (
                        results.map((user, idx) => (
                            <DropdownItem
                                key={user._id}
                                $active={idx === highlightedIndex}
                                onClick={() => handleSelect(user)}
                                onMouseEnter={() => setHighlightedIndex(idx)}
                            >
                                <Avatar src={user.image || "/default-avatar.png"} alt={user.name} />
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                    <span style={{ fontSize: "14px", fontWeight: 500 }}>{user.displayName || user.name}</span>
                                    <span style={{ fontSize: "12px", color: "#6b7280" }}>{user.email}</span>
                                </div>
                            </DropdownItem>
                        ))
                    ) : loading ? (
                        <NoResults>{m["admin.userSelector.searching"]()}</NoResults>
                    ) : q.trim() ? (
                        <NoResults>{m["admin.userSelector.noResults"]()}</NoResults>
                    ) : null}
                </Dropdown>
            )}
        </Wrapper>
    );
};
