"use client";

import { useState, useEffect, ReactNode } from "react";
import { TextField, MenuItem } from "@mui/material";
import { ReloadButton, BackButton, NextButton } from "#/components/Buttons";
import { AdminTableColumn } from "./AdminTableFactories";
import { Wrapper, Card, TableWrapper, Controls, Table, Footer, PaginationControls, RowActions, LoadingSpinner } from "./AdminTable.styles";
import { motion, AnimatePresence } from "framer-motion";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05
        }
    }
} as const;

const rowVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 400,
            damping: 30
        }
    },
    exit: {
        opacity: 0,
        y: 10,
        transition: {
            duration: 0.2
        }
    }
} as const;

export interface AdminTableFilter {
    key: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { label: string; value: string }[];
    minWidth?: string;
}

export interface AdminTablePagination {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
}

interface AdminTableProps<T> {
    columns: AdminTableColumn<T>[];
    data: T[];
    loading?: boolean;
    onReload?: () => void;
    reloadLabel?: string;
    headerActions?: ReactNode;
    rowActions?: (item: T) => ReactNode;
    search?: {
        value: string;
        onChange: (value: string) => void;
        placeholder?: string;
    };
    filters?: AdminTableFilter[];
    pagination?: AdminTablePagination;
    emptyMessage?: string;
    noResultsMessage?: string;
    footerInfo?: ReactNode;
}

export function AdminTable<T extends { _id?: string | { toString: () => string } }>({
    columns,
    data,
    loading,
    onReload,
    reloadLabel,
    headerActions,
    rowActions,
    search,
    filters,
    pagination,
    emptyMessage = "No items found",
    noResultsMessage = "No results match your search"
}: AdminTableProps<T>) {
    const [internalReloading, setInternalReloading] = useState(false);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const [prevPage, setPrevPage] = useState(pagination?.page || 1);
    const [direction, setDirection] = useState(0);

    const showPagination = pagination && pagination.total > pagination.pageSize;
    const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 1;

    // Sync internal reloading state and track pagination direction
    useEffect(() => {
        if (!loading) {
            setInternalReloading(false);
            if (data.length > 0) {
                setHasLoadedOnce(true);
            }
        }

        if (pagination && pagination.page !== prevPage) {
            setDirection(pagination.page > prevPage ? 1 : -1);
            setPrevPage(pagination.page);
        } else if (!pagination) {
            setDirection(0);
        }
    }, [loading, data.length, pagination?.page, prevPage, pagination]);

    const handleReload = () => {
        if (onReload) {
            setInternalReloading(true);
            onReload();
        }
    };

    const showSpinner = (loading && !hasLoadedOnce) || internalReloading;

    const pageVariants = {
        enter: (d: number) => ({
            x: d > 0 ? 50 : d < 0 ? -50 : 0,
            opacity: 0
        }),
        center: {
            x: 0,
            opacity: 1
        },
        exit: (d: number) => ({
            x: d > 0 ? -50 : d < 0 ? 50 : 0,
            opacity: 0
        })
    };

    return (
        <Wrapper>
            <Controls>
                {onReload && <ReloadButton onClick={handleReload}>{reloadLabel || "Reload"}</ReloadButton>}
                {headerActions}
                {filters?.map((filter) => (
                    <TextField
                        key={filter.key}
                        select
                        size="small"
                        label={filter.label}
                        value={filter.value}
                        onChange={(e) => filter.onChange(e.target.value)}
                        style={{ minWidth: filter.minWidth || "120px" }}
                    >
                        {filter.options.map((opt) => (
                            <MenuItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </MenuItem>
                        ))}
                    </TextField>
                ))}
                {search && (
                    <TextField
                        className="search-field"
                        size="small"
                        placeholder={search.placeholder || "Search..."}
                        value={search.value}
                        onChange={(e) => search.onChange(e.target.value)}
                        style={{ marginLeft: "auto", minWidth: "250px" }}
                    />
                )}
            </Controls>

            <Card style={{ position: "relative", overflow: "hidden" }}>
                <AnimatePresence mode="popLayout" custom={direction} initial={false}>
                    <motion.div
                        key={pagination?.page || "single-page"}
                        custom={direction}
                        variants={pageVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 }
                        }}
                    >
                        {showSpinner ? (
                            <div style={{ padding: "40px", textAlign: "center" }}>
                                <LoadingSpinner />
                            </div>
                        ) : data.length === 0 ? (
                            <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>
                                {search?.value || (filters && filters.some((f) => f.value && f.value !== "all" && f.value !== ""))
                                    ? noResultsMessage
                                    : emptyMessage}
                            </div>
                        ) : (
                            <TableWrapper>
                                <Table>
                                    <thead>
                                        <tr>
                                            {columns.map((col) => (
                                                <th
                                                    key={col.key}
                                                    style={{
                                                        textAlign: col.align || "left",
                                                        width: col.width
                                                    }}
                                                >
                                                    {col.header}
                                                </th>
                                            ))}
                                            {rowActions && <th style={{ textAlign: "right", width: "1px", whiteSpace: "nowrap" }}></th>}
                                        </tr>
                                    </thead>
                                    <motion.tbody>
                                        <AnimatePresence>
                                            {data.map((item, idx) => (
                                                <motion.tr
                                                    key={item._id?.toString() || idx}
                                                    variants={rowVariants}
                                                    initial="hidden"
                                                    animate="visible"
                                                    exit="exit"
                                                    layout="position"
                                                >
                                                    {columns.map((col) => (
                                                        <td
                                                            key={col.key}
                                                            style={{
                                                                textAlign: col.align || "left"
                                                            }}
                                                        >
                                                            {col.render(item)}
                                                        </td>
                                                    ))}
                                                    {rowActions && (
                                                        <td style={{ width: "1px", whiteSpace: "nowrap" }}>
                                                            <RowActions>{rowActions(item)}</RowActions>
                                                        </td>
                                                    )}
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                    </motion.tbody>
                                </Table>
                            </TableWrapper>
                        )}
                    </motion.div>
                </AnimatePresence>
            </Card>

            {(data.length > 0 || pagination) && (
                <Footer>
                    <div>{pagination ? `Showing ${data.length} of ${pagination.total}` : `Showing ${data.length} items`}</div>
                    {showPagination && (
                        <PaginationControls>
                            <BackButton onClick={() => pagination.onPageChange(pagination.page - 1)} disabled={pagination.page <= 1} iconSize={18} />
                            <span>
                                {pagination.page} / {totalPages}
                            </span>
                            <NextButton onClick={() => pagination.onPageChange(pagination.page + 1)} disabled={pagination.page >= totalPages} iconSize={18} />
                        </PaginationControls>
                    )}
                </Footer>
            )}
        </Wrapper>
    );
}
