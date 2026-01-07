// "use client";

// import React, { useCallback, useEffect, useRef, useState } from "react";
// import { Box, FormControl, MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
// import { DEBOUNCE_COMMIT_MS, ErrorIcon } from "./common";
// import * as m from "#/paraglide/messages";
// import type { UserSettings } from "#/providers/SettingsProvider";

// type EventsSettings = UserSettings["events"];

// const EventsSection: React.FC<{
//     value?: EventsSettings;
//     onChange: (v: Partial<EventsSettings>) => void;
// }> = ({ value, onChange }) => {
//     const [dietary, setDietary] = useState((value?.dietary || "").trim());
//     const [tshirt, setTshirt] = useState<EventsSettings["tshirtSize"]>(value?.tshirtSize || "M");
//     const originalRef = useRef<EventsSettings | undefined>(value);
//     const [errors, setErrors] = useState<Record<string, string>>({});
//     const dirtyRef = useRef<{ dietary: boolean }>({ dietary: false });
//     useEffect(() => {
//         if (!value) return;
//         if (!dirtyRef.current.dietary || value.dietary === dietary) {
//             setDietary((prev) => (errors.dietary ? prev : value.dietary || ""));
//             if (value.dietary === dietary) dirtyRef.current.dietary = false;
//         }
//         setTshirt(value.tshirtSize);
//         originalRef.current = value;
//         setErrors((prev) => {
//             if (value.dietary && value.dietary.length <= 200) {
//                 const { dietary: d, ...rest } = prev;
//                 void d;
//                 return rest;
//             }
//             return prev;
//         });
//     }, [value, errors.dietary, dietary]);
//     const commit = useCallback(() => {
//         const orig = originalRef.current;
//         if (!orig) {
//             const trimmed = dietary.trim();
//             onChange({ dietary: trimmed || undefined, tshirtSize: tshirt });
//             return;
//         }
//         const patch: Partial<EventsSettings> = {};
//         const trimmed = dietary.trim();
//         if ((trimmed || "") !== (orig.dietary || "").trim()) {
//             if (trimmed === "") {
//                 setErrors((p) => {
//                     const c = { ...p };
//                     delete c.dietary;
//                     return c;
//                 });
//                 patch.dietary = "";
//             } else {
//                 // Validate dietary field (max 200 characters)
//                 if (trimmed.length > 200) {
//                     setErrors((p) => ({
//                         ...p,
//                         dietary: m["settings.events.errors.dietaryMax"]()
//                     }));
//                 } else {
//                     setErrors((p) => {
//                         const c = { ...p };
//                         delete c.dietary;
//                         return c;
//                     });
//                     patch.dietary = trimmed;
//                 }
//             }
//         }
//         if (tshirt !== orig.tshirtSize) patch.tshirtSize = tshirt;
//         if (Object.keys(patch).length) onChange(patch);
//     }, [dietary, tshirt, onChange]);
//     useEffect(() => {
//         const handle = setTimeout(() => commit(), DEBOUNCE_COMMIT_MS);
//         return () => clearTimeout(handle);
//     }, [dietary, tshirt, commit]);
//     return (
//         <Stack spacing={3}>
//             <Box>
//                 <Typography variant="h6" gutterBottom>
//                     {m["settings.events.dietary"]()}
//                 </Typography>
//                 <TextField
//                     size="small"
//                     fullWidth
//                     value={dietary}
//                     placeholder={m["settings.events.dietaryPlaceholder"]()}
//                     onChange={(e) => {
//                         dirtyRef.current.dietary = true;
//                         setDietary(e.target.value);
//                     }}
//                     onBlur={commit}
//                     error={!!errors.dietary}
//                     helperText={errors.dietary}
//                     InputProps={{
//                         endAdornment: errors.dietary ? <ErrorIcon /> : undefined
//                     }}
//                 />
//             </Box>
//             <Box>
//                 <Typography variant="h6" gutterBottom>
//                     {m["settings.events.tshirt"]()}
//                 </Typography>
//                 <FormControl size="small">
//                     <Select
//                         value={tshirt}
//                         style={{ background: "var(--color-white)" }}
//                         onChange={(e) => {
//                             const v = e.target.value as EventsSettings["tshirtSize"];
//                             setTshirt(v);
//                             onChange({ dietary: dietary || undefined, tshirtSize: v });
//                         }}
//                     >
//                         {["XS", "S", "M", "L", "XL", "XXL"].map((s) => (
//                             <MenuItem key={s} value={s}>
//                                 {s}
//                             </MenuItem>
//                         ))}
//                     </Select>
//                 </FormControl>
//             </Box>
//         </Stack>
//     );
// };

// export default EventsSection;
