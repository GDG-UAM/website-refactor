"use client";
import { api } from "#/lib/eden";

import React, { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import UserMention from "./components/UserMention";
import { NextButton, BackButton, AcceptButton } from "#/components/Buttons";
import { buildEmbedTag, detectTrigger, findEmbeds, protectEmbeds, type Embed, type Trigger } from "#/lib/markdownSyntax";
import { caretOffset } from "./editor/caret";
import { COMPONENT_REGISTRY, findComponent, type ComponentConfig } from "./editor/componentRegistry";
import { EmbedCovers } from "./editor/EmbedCovers";
import { HighlightLayer } from "./editor/HighlightLayer";
import {
    Wrapper,
    Label,
    Surface,
    TextArea,
    Dropdown,
    Search,
    Item,
    Avatar,
    Empty,
    PropInput,
    CheckboxWrapper,
    Checkbox,
    PropLabel,
    PopoverHeading,
    StepCounter,
    SubmitButtonWrapper
} from "./CustomMarkdownTextArea.styles";

/**
 * Markdown field with syntax highlighting, `@mention` and `/component` autocomplete, and embed tags
 * shown as clickable chips.
 *
 * ## How it's drawn
 * A real textarea with transparent ink sits on top of `HighlightLayer`, which paints the same text
 * with markdown decoration (see `lib/markdownSyntax.ts` for the rule that keeps the two aligned).
 * `EmbedCovers` draws the chip labels over embed tags. The textarea grows to fit its content, so the
 * page scrolls rather than the field and the layers never need scroll syncing.
 *
 * ## Embeds are atomic
 * An edit that touches any part of a tag removes the whole tag, the caret can't rest inside one, and
 * arrow keys jump over them. Clicking a chip opens its editor.
 */

const CARET_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"]);

type UserLite = { _id: string; name: string; displayName?: string | null; image?: string | null };

type Range = { start: number; end: number };

type EditState =
    | { kind: "mention"; range: Range; query: string }
    | {
          kind: "props";
          componentId: ComponentConfig["id"];
          collected: Record<string, string | undefined>;
          index: number;
          input: string;
          range: Range;
          /** Set when editing an existing tag; holds its attributes so ones without a prop (e.g. `blur`) survive. */
          original?: Record<string, string>;
      };

const initialPropInput = (prop: ComponentConfig["props"][number], collected: Record<string, string | undefined>) =>
    collected[prop.name] ?? (prop.type === "boolean" ? String(prop.default ?? true) : "");

export default function CustomMarkdownTextArea({
    value,
    onChange,
    label,
    minRows = 10,
    placeholder,
    disabled,
    error,
    onBlur,
    required
}: {
    value: string;
    onChange: (val: string) => void;
    label?: string;
    minRows?: number;
    placeholder?: string;
    disabled?: boolean;
    error?: boolean;
    onBlur?: () => void;
    required?: boolean;
}) {
    const taRef = useRef<HTMLTextAreaElement | null>(null);
    const wrapRef = useRef<HTMLDivElement | null>(null);
    const layerRef = useRef<HTMLDivElement | null>(null);
    const listboxId = useId();

    const [isFocused, setIsFocused] = useState(false);
    /** The `@`/`/` token being typed, while its suggestion list is open. */
    const [trigger, setTrigger] = useState<Trigger | null>(null);
    const [edit, setEdit] = useState<EditState | null>(null);
    const [anchor, setAnchor] = useState({ top: 0, left: 0 });
    const [active, setActive] = useState(0);
    const [users, setUsers] = useState<UserLite[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    /** A token dismissed with Escape stays closed until the caret leaves it. */
    const dismissedRef = useRef<number | null>(null);
    /** Where the caret belongs after `protectEmbeds` rewrote the text under it. */
    const pendingCaretRef = useRef<number | null>(null);

    const embeds = useMemo(() => findEmbeds(value), [value]);
    const embedInside = useCallback((pos: number) => embeds.find((t) => pos > t.start && pos < t.end), [embeds]);

    /* ---- positioning ------------------------------------------------------------------------- */

    /** A point just below the character at `index`, relative to the wrapper. */
    const anchorAt = useCallback((index: number) => {
        const ta = taRef.current;
        const wrap = wrapRef.current;
        if (!ta || !wrap) return { top: 0, left: 0 };
        const offset = caretOffset(ta, index);
        const lineHeight = parseFloat(getComputedStyle(ta).lineHeight) || 20;
        const taBox = ta.getBoundingClientRect();
        const wrapBox = wrap.getBoundingClientRect();
        return { top: taBox.top - wrapBox.top + offset.top + lineHeight + 4, left: taBox.left - wrapBox.left + offset.left };
    }, []);

    /* Grow the textarea to its content (never below `minRows`) instead of scrolling inside it. The
       wrapper's height is pinned while measuring so the page doesn't jump when the box collapses. */
    const autoGrow = useCallback(() => {
        const ta = taRef.current;
        const wrap = wrapRef.current;
        if (!ta || !wrap) return;
        const styles = getComputedStyle(ta);
        const lineHeight = parseFloat(styles.lineHeight) || 20;
        const floor = lineHeight * minRows + parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
        wrap.style.minHeight = `${wrap.offsetHeight}px`;
        ta.style.height = "auto";
        ta.style.height = `${Math.max(ta.scrollHeight, floor)}px`;
        wrap.style.minHeight = "";
    }, [minRows]);

    useLayoutEffect(autoGrow, [autoGrow, value]);

    useEffect(() => {
        const wrap = wrapRef.current;
        if (!wrap) return;
        let width = wrap.clientWidth;
        const observer = new ResizeObserver(() => {
            if (wrap.clientWidth === width) return;
            width = wrap.clientWidth;
            autoGrow();
        });
        observer.observe(wrap);
        return () => observer.disconnect();
    }, [autoGrow]);

    useLayoutEffect(() => {
        const ta = taRef.current;
        const caret = pendingCaretRef.current;
        if (!ta || caret === null) return;
        pendingCaretRef.current = null;
        ta.setSelectionRange(caret, caret);
    }, [value]);

    /* ---- triggers ---------------------------------------------------------------------------- */

    const refreshTrigger = useCallback(() => {
        const ta = taRef.current;
        if (!ta || disabled || document.activeElement !== ta || ta.selectionStart !== ta.selectionEnd) {
            setTrigger(null);
            return;
        }
        const caret = ta.selectionStart;
        let next = detectTrigger(value, caret);
        if (next && embedInside(next.start)) next = null;
        if (!next) dismissedRef.current = null;
        else if (dismissedRef.current === next.start) next = null;

        setTrigger((prev) => (prev && next && prev.kind === next.kind && prev.start === next.start && prev.query === next.query ? prev : next));
        if (next) setAnchor(anchorAt(next.start));
    }, [value, disabled, embedInside, anchorAt]);

    useEffect(refreshTrigger, [refreshTrigger]);

    const listOpen = !!trigger && !edit;
    const mentionQuery = edit?.kind === "mention" ? edit.query : trigger?.kind === "mention" && !edit ? trigger.query : null;

    const filteredComponents = useMemo(() => {
        if (trigger?.kind !== "component") return [];
        const q = trigger.query.toLowerCase();
        return COMPONENT_REGISTRY.filter((c) => c.insertable && (!q || c.label.toLowerCase().includes(q) || c.id.includes(q)));
    }, [trigger]);

    const options: Array<{ id: string; user?: UserLite; component?: ComponentConfig }> =
        mentionQuery !== null ? users.map((u) => ({ id: u._id, user: u })) : listOpen ? filteredComponents.map((c) => ({ id: c.id, component: c })) : [];

    useEffect(() => setActive(0), [trigger?.kind, trigger?.query, edit?.kind]);

    // Debounced user search, for both a typed `@query` and the search box of a mention being edited.
    useEffect(() => {
        if (mentionQuery === null) return;
        let ignore = false;
        setUsersLoading(true);
        const timer = setTimeout(async () => {
            try {
                const { data, error } = await api.admin.users.get({ query: { search: mentionQuery || undefined, pageSize: 10 } });
                if (!ignore && !error) setUsers((data.items || []) as UserLite[]);
            } catch {
            } finally {
                if (!ignore) setUsersLoading(false);
            }
        }, 150);
        return () => {
            ignore = true;
            clearTimeout(timer);
        };
    }, [mentionQuery]);

    /* ---- editing the text -------------------------------------------------------------------- */

    const close = useCallback(() => {
        setTrigger(null);
        setEdit(null);
    }, []);

    /** Replace `range` with `text`, then put the caret after it. */
    const replaceRange = (range: Range, text: string) => {
        const ta = taRef.current;
        onChange(value.slice(0, range.start) + text + value.slice(range.end));
        const position = range.start + text.length;
        requestAnimationFrame(() => {
            ta?.focus();
            ta?.setSelectionRange(position, position);
        });
    };

    const pickUser = (user: UserLite, range: Range) => {
        replaceRange(range, buildEmbedTag("user", { "data-id": user._id }));
        close();
    };

    const startProps = (component: ComponentConfig, range: Range, original?: Record<string, string>) => {
        if (component.props.length === 0) {
            replaceRange(range, buildEmbedTag(component.id, {}));
            close();
            return;
        }
        const collected: Record<string, string | undefined> = original ? { ...original } : {};
        setTrigger(null);
        setEdit({ kind: "props", componentId: component.id, collected, index: 0, input: initialPropInput(component.props[0], collected), range, original });
        setAnchor(anchorAt(range.start));
    };

    const pickOption = (index: number) => {
        const option = options[index];
        const ta = taRef.current;
        if (!option) return;
        if (edit?.kind === "mention" && option.user) return pickUser(option.user, edit.range);
        if (!trigger || !ta) return;
        const range = { start: trigger.start, end: ta.selectionStart };
        if (option.user) pickUser(option.user, range);
        else if (option.component) startProps(option.component, range);
    };

    const onEmbedClick = (embed: Embed) => {
        const range = { start: embed.start, end: embed.end };
        if (embed.tag === "user") {
            setTrigger(null);
            setEdit({ kind: "mention", range, query: "" });
            setAnchor(anchorAt(embed.start));
            return;
        }
        const component = findComponent(embed.tag);
        if (component) startProps(component, range, embed.attrs);
    };

    const propsComponent = edit?.kind === "props" ? findComponent(edit.componentId) : undefined;
    const currentProp = edit?.kind === "props" && propsComponent ? propsComponent.props[edit.index] : undefined;
    const propBlocked = !!currentProp?.required && !(edit?.kind === "props" && edit.input.trim());

    const submitProp = () => {
        if (edit?.kind !== "props" || !propsComponent || !currentProp || propBlocked) return;
        const fallback = currentProp.placeHolderOnly
            ? undefined
            : currentProp.type === "boolean"
              ? String(currentProp.default ?? true)
              : String(currentProp.default ?? "");
        const collected = { ...edit.collected, [currentProp.name]: edit.input || fallback || undefined };

        if (edit.index < propsComponent.props.length - 1) {
            const nextProp = propsComponent.props[edit.index + 1];
            setEdit({ ...edit, collected, index: edit.index + 1, input: initialPropInput(nextProp, collected) });
            return;
        }

        const attrs: Record<string, string | undefined> = {};
        // Attributes the form doesn't know about survive an edit…
        for (const [key, val] of Object.entries(edit.original ?? {})) {
            if (!propsComponent.props.some((p) => p.name === key)) attrs[key] = val;
        }
        // …except an image's derived data, which describes the old source.
        if (propsComponent.id === "mdimg" && edit.original?.src !== collected.src) {
            delete attrs.blur;
            delete attrs.width;
            delete attrs.height;
        }
        for (const prop of propsComponent.props) attrs[prop.name] = collected[prop.name];

        replaceRange(edit.range, buildEmbedTag(propsComponent.id, attrs));
        close();
    };

    const backProp = () => {
        if (edit?.kind !== "props" || !propsComponent) return;
        if (edit.index > 0) {
            const prevProp = propsComponent.props[edit.index - 1];
            setEdit({ ...edit, index: edit.index - 1, input: initialPropInput(prevProp, edit.collected) });
        } else if (edit.original) {
            close();
        } else {
            // Back to the component list: put the caret back on the `/query` token.
            setEdit(null);
            requestAnimationFrame(() => {
                taRef.current?.focus();
                taRef.current?.setSelectionRange(edit.range.end, edit.range.end);
                refreshTrigger();
            });
        }
    };

    /* ---- keyboard, caret, focus -------------------------------------------------------------- */

    const listKeys = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            e.preventDefault();
            if (trigger) dismissedRef.current = trigger.start;
            close();
            return true;
        }
        if (!options.length) return false;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => (i + 1) % options.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => (i - 1 + options.length) % options.length);
        } else if (e.key === "Enter" || e.key === "Tab") {
            // Only while the list is open — everywhere else Enter is a new line and must never be stolen.
            e.preventDefault();
            pickOption(active);
        } else {
            return false;
        }
        return true;
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (listOpen && listKeys(e)) return;

        // Jump over embeds with the arrow keys. With Shift held, the selection snap below extends instead.
        if (e.shiftKey || e.altKey || e.metaKey) return;
        const ta = e.currentTarget;
        if (ta.selectionStart !== ta.selectionEnd) return;
        const pos = ta.selectionStart;
        const hit = e.key === "ArrowRight" ? embeds.find((t) => t.start === pos) : e.key === "ArrowLeft" ? embeds.find((t) => t.end === pos) : undefined;
        if (hit) {
            e.preventDefault();
            const next = e.key === "ArrowRight" ? hit.end : hit.start;
            ta.setSelectionRange(next, next);
        }
    };

    /** Keep the caret out of embeds, and widen a selection that ends inside one to cover it. */
    const snapSelection = () => {
        const ta = taRef.current;
        if (!ta) return;
        const { selectionStart: s, selectionEnd: e } = ta;
        if (s === e) {
            const hit = embedInside(s);
            if (hit) {
                const pos = s - hit.start <= hit.end - s ? hit.start : hit.end;
                ta.setSelectionRange(pos, pos);
            }
            return;
        }
        const hs = embedInside(s);
        const he = embedInside(e);
        if (hs || he) ta.setSelectionRange(hs ? hs.start : s, he ? he.end : e, ta.selectionDirection);
    };

    const onKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (!CARET_KEYS.has(e.key)) return;
        snapSelection();
        refreshTrigger();
    };

    // Click outside closes everything.
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) close();
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [close]);

    /* ---- render ------------------------------------------------------------------------------ */

    const optionId = (id: string) => `${listboxId}-${id}`;
    const activeOption = options[active];
    const popupStyle: React.CSSProperties = { top: anchor.top, left: `clamp(0px, ${anchor.left}px, max(0px, calc(100% - 320px)))` };

    const renderEmbedLabel = (embed: Embed) => {
        if (embed.tag === "user") return <UserMention userId={embed.attrs["data-id"] ?? null} isAdmin />;
        const component = findComponent(embed.tag);
        return component ? component.render(embed.attrs) : embed.raw;
    };

    const userItems = (range?: Range) =>
        users.map((u, idx) => (
            <Item
                key={u._id}
                id={optionId(u._id)}
                $active={idx === active}
                role="option"
                aria-selected={idx === active}
                onMouseEnter={() => setActive(idx)}
                onMouseDown={(e) => {
                    // Keep focus in the textarea; a blur would close the list before the pick lands.
                    e.preventDefault();
                    if (range) pickUser(u, range);
                    else pickOption(idx);
                }}
            >
                <Avatar src={u.image || "/logo/32x32.webp"} alt={u.image ? u.name : ""} />
                <span>{u.displayName || u.name}</span>
            </Item>
        ));

    return (
        <Wrapper ref={wrapRef}>
            <Surface $disabled={disabled} $error={error}>
                {label && (
                    <Label $shrink={isFocused || !!value} $disabled={disabled} $error={error}>
                        {label}
                        {required && <span style={error ? { color: "var(--google-red)", marginLeft: 4 } : undefined}>{error ? "*" : " *"}</span>}
                    </Label>
                )}
                <HighlightLayer ref={layerRef} value={value} disabled={disabled} />
                <TextArea
                    ref={taRef}
                    value={value}
                    rows={minRows}
                    disabled={disabled}
                    placeholder={placeholder}
                    spellCheck
                    $hideUnfocusedPlaceholder={!!label}
                    role="combobox"
                    aria-label={label}
                    aria-invalid={error || undefined}
                    aria-expanded={listOpen && options.length > 0}
                    aria-controls={listOpen ? listboxId : undefined}
                    aria-autocomplete="list"
                    aria-activedescendant={listOpen && activeOption ? optionId(activeOption.id) : undefined}
                    onChange={(e) => {
                        const next = protectEmbeds(value, e.target.value);
                        if (next.caret !== undefined) pendingCaretRef.current = next.caret;
                        onChange(next.value);
                    }}
                    onKeyDown={onKeyDown}
                    onKeyUp={onKeyUp}
                    onMouseUp={snapSelection}
                    onClick={refreshTrigger}
                    onSelect={snapSelection}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => {
                        setIsFocused(false);
                        setTimeout(() => setTrigger(null), 150);
                        onBlur?.();
                    }}
                />
                <EmbedCovers layerRef={layerRef} embeds={embeds} value={value} disabled={disabled} renderLabel={renderEmbedLabel} onEmbedClick={onEmbedClick} />
            </Surface>

            {listOpen && trigger?.kind === "mention" && (
                <Dropdown id={listboxId} role="listbox" aria-label="Mention users" style={popupStyle}>
                    {userItems()}
                    {users.length === 0 && <Empty>{usersLoading ? "Searching…" : "No users"}</Empty>}
                </Dropdown>
            )}

            {listOpen && trigger?.kind === "component" && (
                <Dropdown id={listboxId} role="listbox" aria-label="Insert component" style={popupStyle}>
                    {filteredComponents.map((comp, idx) => (
                        <Item
                            key={comp.id}
                            id={optionId(comp.id)}
                            $active={idx === active}
                            role="option"
                            aria-selected={idx === active}
                            onMouseEnter={() => setActive(idx)}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                pickOption(idx);
                            }}
                        >
                            <span>{comp.label}</span>
                        </Item>
                    ))}
                    {filteredComponents.length === 0 && <Empty>No components</Empty>}
                </Dropdown>
            )}

            {edit?.kind === "mention" && (
                <Dropdown style={popupStyle}>
                    <PopoverHeading>Editing mention</PopoverHeading>
                    <Search
                        autoFocus
                        placeholder="Search users..."
                        value={edit.query}
                        role="combobox"
                        aria-expanded={users.length > 0}
                        aria-controls={listboxId}
                        aria-autocomplete="list"
                        aria-activedescendant={activeOption ? optionId(activeOption.id) : undefined}
                        onChange={(e) => setEdit({ ...edit, query: e.target.value })}
                        onKeyDown={(e) => listKeys(e)}
                    />
                    <div id={listboxId} role="listbox" aria-label="Mention users">
                        {userItems(edit.range)}
                    </div>
                    {users.length === 0 && <Empty>{usersLoading ? "Searching…" : "No users"}</Empty>}
                </Dropdown>
            )}

            {edit?.kind === "props" && propsComponent && currentProp && (
                <Dropdown style={popupStyle}>
                    {edit.original && <PopoverHeading>Editing {propsComponent.label}</PopoverHeading>}
                    {currentProp.type === "boolean" ? (
                        <CheckboxWrapper>
                            <Checkbox
                                type="checkbox"
                                checked={edit.input !== "false"}
                                onChange={(e) => setEdit({ ...edit, input: e.target.checked ? "true" : "false" })}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        submitProp();
                                    } else if (e.key === "Escape") {
                                        e.preventDefault();
                                        close();
                                    }
                                }}
                                autoFocus
                            />
                            <span style={{ fontSize: 14, color: "var(--foreground)" }}>{currentProp.label}</span>
                        </CheckboxWrapper>
                    ) : (
                        <>
                            <PropLabel>
                                {currentProp.label}
                                {currentProp.required && <span style={{ color: "var(--google-red)" }}> *</span>}
                            </PropLabel>
                            <PropInput
                                // Remount per step so autoFocus applies to each field.
                                key={`${propsComponent.id}-${currentProp.name}`}
                                type={currentProp.type === "number" ? "number" : "text"}
                                value={edit.input}
                                onChange={(e) => setEdit({ ...edit, input: e.target.value })}
                                placeholder={currentProp.default !== undefined ? `Default: ${currentProp.default}` : ""}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        submitProp();
                                    } else if (e.key === "Escape") {
                                        e.preventDefault();
                                        close();
                                    }
                                }}
                                autoFocus
                            />
                        </>
                    )}
                    <StepCounter>
                        Step {edit.index + 1} of {propsComponent.props.length}
                    </StepCounter>
                    <SubmitButtonWrapper>
                        <BackButton onClick={backProp} iconSize={20} />
                        {edit.index < propsComponent.props.length - 1 ? (
                            <NextButton onClick={submitProp} iconSize={20} disabled={propBlocked} />
                        ) : (
                            <AcceptButton onClick={submitProp} iconSize={20} color="success" disabled={propBlocked} />
                        )}
                    </SubmitButtonWrapper>
                </Dropdown>
            )}
        </Wrapper>
    );
}
