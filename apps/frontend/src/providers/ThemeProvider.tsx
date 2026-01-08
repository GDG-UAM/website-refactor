"use client";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { ReactNode } from "react";

const COLOR_MAP = {
    primary: "var(--button-primary-bg)",
    info: "var(--button-primary-bg)",
    secondary: "var(--button-secondary-bg)",
    success: "var(--button-success-bg)",
    warning: "var(--button-warning-bg)",
    error: "var(--button-danger-bg)",
    default: "var(--button-default-bg)"
};

const resolveColor = (color: keyof typeof COLOR_MAP, disabled?: boolean) => {
    const base = COLOR_MAP[color] ?? COLOR_MAP.default;
    return disabled ? `color-mix(in srgb, ${base}, transparent 50%)` : base;
};

/**
 * Custom MUI theme that uses CSS variables for colors.
 * This allows the theme to react to accessibility settings like daltonism modes.
 */
export function CustomThemeProvider({ children }: { children: ReactNode }) {
    const theme = createTheme({
        cssVariables: true,
        typography: {
            allVariants: {
                fontFamily: "var(--font-body), sans-serif"
            }
        },
        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        textTransform: "none" // Disable uppercase transformation
                    }
                }
            },
            MuiTextField: {
                styleOverrides: {
                    root: {
                        "& .MuiOutlinedInput-root": {
                            "& fieldset": {
                                borderColor: "var(--google-extra-light-gray)"
                            },
                            "&:hover fieldset": {
                                borderColor: "var(--google-light-gray)"
                            },
                            "&.Mui-focused fieldset": {
                                borderColor: "var(--google-blue)"
                            }
                        }
                    }
                }
            },
            MuiSelect: {
                styleOverrides: {
                    root: {
                        "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "var(--google-extra-light-gray)"
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "var(--google-light-gray)"
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "var(--google-blue)"
                        }
                    },
                    icon: {
                        color: "var(--google-light-gray)"
                    }
                }
            },
            MuiMenuItem: {
                styleOverrides: {
                    root: {
                        "&.Mui-selected": {
                            backgroundColor: "var(--google-super-light-gray)",
                            "&:hover": {
                                backgroundColor: "var(--google-extra-light-gray)"
                            }
                        },
                        "&:hover": {
                            backgroundColor: "var(--google-super-light-gray)"
                        }
                    }
                }
            },
            MuiMenu: {
                styleOverrides: {
                    paper: {
                        borderColor: "var(--google-extra-light-gray)"
                    }
                }
            },
            MuiCheckbox: {
                styleOverrides: {
                    root: {
                        color: "var(--google-light-gray)",
                        "&.Mui-checked": {
                            color: "var(--google-blue)"
                        }
                    }
                }
            },
            MuiRadio: {
                styleOverrides: {
                    root: {
                        color: "var(--google-light-gray)",
                        "&.Mui-checked": {
                            color: "var(--google-blue)"
                        }
                    }
                }
            },
            MuiSwitch: {
                styleOverrides: {
                    switchBase: {
                        color: "var(--google-light-gray)",
                        "&.Mui-checked": {
                            color: "var(--google-blue)",
                            "& + .MuiSwitch-track": {
                                backgroundColor: "var(--google-blue)"
                            }
                        }
                    },
                    track: {
                        backgroundColor: "var(--google-extra-light-gray)"
                    }
                }
            },
            MuiInputLabel: {
                styleOverrides: {
                    root: {
                        color: "var(--google-light-gray)",
                        "&.Mui-focused": {
                            color: "var(--google-blue)"
                        }
                    }
                }
            },
            MuiOutlinedInput: {
                styleOverrides: {
                    root: {
                        "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "var(--google-extra-light-gray)"
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "var(--google-light-gray)"
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "var(--google-blue)"
                        }
                    }
                }
            },
            MuiDialog: {
                styleOverrides: {
                    paper: {
                        backgroundColor: "var(--color-white)"
                    }
                }
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundColor: "var(--color-white)"
                    }
                }
            },
            MuiDivider: {
                styleOverrides: {
                    root: {
                        borderColor: "var(--google-extra-light-gray)"
                    }
                }
            },
            MuiChip: {
                styleOverrides: {
                    root: ({ ownerState }) => {
                        const color = ownerState.color ?? "default";
                        const resolved = resolveColor(color, ownerState.disabled);

                        if (ownerState.variant === "outlined") {
                            return {
                                color: resolved,
                                borderColor: resolved
                            };
                        }

                        // filled (default)
                        return {
                            backgroundColor: resolved
                        };
                    },

                    deleteIcon: ({ ownerState }) => {
                        const color = ownerState.color ?? "default";
                        const resolved = resolveColor(color, ownerState.disabled);

                        return {
                            color: resolved,
                            "&:hover": {
                                color: resolved
                            }
                        };
                    }
                }
            },
            MuiSlider: {
                styleOverrides: {
                    root: {
                        color: "var(--google-blue)"
                    },
                    thumb: {
                        "&:hover, &.Mui-focusVisible": {
                            boxShadow: "0 0 0 8px rgba(26, 115, 232, 0.16)"
                        }
                    }
                }
            },
            MuiTab: {
                styleOverrides: {
                    root: {
                        color: "var(--google-light-gray)",
                        "&.Mui-selected": {
                            color: "var(--google-blue)"
                        }
                    }
                }
            },
            MuiTabs: {
                styleOverrides: {
                    indicator: {
                        backgroundColor: '"var(--google-blue)"'
                    }
                }
            }
        }
    });

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
        </ThemeProvider>
    );
}
