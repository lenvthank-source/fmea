# Rule: UI Theme & Design System Specification

## 1. Core Design Philosophy
FMEApex unifies two design philosophies across its interface:
1. **Public Marketing & Educational Experience (`/*`, `/learn/*`, `/product`, `/pricing`, `/about`)**:
   - Inspired by **Ventriloc** luxury editorial design.
   - Warm ivory canvas (`#FAF9F6`), Plus Jakarta Sans headings, high-contrast dark graphite (`#18181B`), electric orange primary accents (`#FF682C`), and laiton brass standard tokens (`#816729`).
   - Floating translucent fluid glass capsule header with live animated gradient orbs and slap-cap `FREE` badges.
2. **Authenticated Quality Engineering Workspace (`/app/*`)**:
   - Inspired by **Shadcn Admin** space-optimized density.
   - Pure white card surfaces (`#FFFFFF`), dark graphite primary action buttons (`#09090b`), muted labels (`#71717a`), light zinc borders (`#e4e4e7`), and segmented pill tab bars (`#f4f4f5`).
   - Strict spacing optimization: zero margin clumping, no wasted vertical padding, clear visual hierarchy, and readable typography at density.

---

## 2. Global Color Tokens & CSS Variables

| Token Role | Hex Code | Usage Context |
|---|---|---|
| **Public Canvas** | `#FAF9F6` | Main background for landing, product, pricing, learn pages. |
| **Workspace Canvas** | `#FFFFFF` / `#FAFAFA` | Internal dashboard background and cards. |
| **Heading / Primary Text** | `#18181B` (Public) / `#09090b` (App) | Titles, h1-h4 headings, table headers. |
| **Body Text** | `#52525B` (Public) / `#27272a` (App) | Paragraphs, descriptions, table body text. |
| **Muted Text / Hints** | `#71717A` / `#A1A1AA` | Subtitles, labels, keyboard shortcut badges. |
| **Subtle Borders** | `#E5E0D8` (Public) / `#E4E4E7` (App) | Card borders, table dividers, input borders. |
| **Segmented Tab Pill** | `#F4F4F5` | Background container for segmented tab bars. |
| **Primary Accent (Orange)** | `#FF682C` | CTAs, high-AP action alerts, simulator toggles. |
| **Standard Accent (Gold)** | `#816729` | AIAG-VDA standard badges, compliance chips. |
| **High AP / Error** | `#EF4444` (`#FEF2F2` bg) | High Action Priority, destructive actions, error banners. |
| **Medium AP / Warning** | `#F59E0B` (`#FFFBEB` bg) | Medium Action Priority, review-required flags. |
| **Low AP / Success** | `#10B981` (`#ECFDF5` bg) | Low Action Priority, verified controls, resolved items. |

---

## 3. Strict Architectural Rules for UI Migration

### 3.1 CSS Layering & Specificity (Tailwind v4 + Emotion)
- **Mandatory `@layer` wrapping**: ALL custom global styles in `index.css` must reside inside `@layer base { ... }` or `@layer components { ... }`. Never write unlayered wildcard resets (`* { margin: 0; padding: 0 }`), as unlayered CSS overrides all Tailwind utilities.
- **Emotion specificity injection**: All MUI themes must be wrapped with `<StyledEngineProvider injectFirst>` in `ColorModeContext.tsx` to prevent Emotion styles from overriding Tailwind utility classes.

### 3.2 Form Spacing & Density
- **FORBIDDEN**: Never use `margin="normal"` on MUI `TextField` inside Grid layouts. It introduces uncontrollable vertical offsets and clumps.
- **MANDATORY**: Always use `size="small"` on inputs in internal `/app/*` screens.
- **MANDATORY**: Use uniform Grid spacing: `spacing={2.5}` for dialogs and standard forms.
- **Input Styling**: All inputs must feature `borderRadius: '8px'`, border `#e4e4e7`, hover `#d4d4d8`, and focused `#09090b`.

---

## 4. Standard Component Patterns & Code Examples

### 4.1 Page Header Pattern
Every workspace page must start with a clean 2-column header layout:
```tsx
<Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
  <Box>
    <Typography variant="h4" component="h1" sx={{ fontWeight: 800, letterSpacing: '-0.03em', color: '#09090b', fontSize: { xs: '1.5rem', sm: '1.875rem' } }}>
      [Page Title]
    </Typography>
    <Typography variant="body2" sx={{ color: '#71717a', fontWeight: 500, mt: 0.5 }}>
      [Single-sentence clear description of purpose and workflow step]
    </Typography>
  </Box>
  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
    {/* Page-level Action Buttons */}
    <Button
      variant="contained"
      startIcon={<AddIcon fontSize="small" />}
      onClick={handleAction}
      sx={{
        borderRadius: '8px',
        height: 38,
        px: 2.5,
        fontWeight: 600,
        textTransform: 'none',
        fontSize: '0.825rem',
        bgcolor: '#09090b',
        color: '#ffffff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        '&:hover': { bgcolor: '#27272a', boxShadow: 'none' }
      }}
    >
      [Primary Action]
    </Button>
  </Stack>
</Box>
```

### 4.2 Segmented Pill Tab Bar Pattern
Do NOT use default MUI underline tabs. Use Shadcn-style segmented pills:
```tsx
<Box sx={{ mb: 3 }}>
  <Paper
    sx={{
      display: 'inline-flex',
      p: 0.5,
      borderRadius: '8px',
      bgcolor: '#f4f4f5',
      border: '1px solid #e4e4e7',
      boxShadow: 'none',
    }}
  >
    <Tabs
      value={activeTab}
      onChange={(_, val) => setActiveTab(val)}
      sx={{
        minHeight: 34,
        '& .MuiTabs-indicator': { display: 'none' },
        '& .MuiTab-root': {
          minHeight: 32,
          px: 2,
          py: 0.5,
          borderRadius: '6px',
          fontSize: '0.8rem',
          fontWeight: 600,
          textTransform: 'none',
          color: '#71717a',
          transition: 'all 0.15s',
          '&.Mui-selected': {
            bgcolor: '#ffffff',
            color: '#09090b',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          },
        },
      }}
    >
      <Tab label="Tab One" />
      <Tab label="Tab Two" />
    </Tabs>
  </Paper>
</Box>
```

### 4.3 Space-Optimized Table Pattern
All data tables must feature compact `#fafafa` headers, uppercase tracked labels, and clean borders:
```tsx
<TableContainer
  component={Paper}
  sx={{
    borderRadius: '10px',
    border: '1px solid #e4e4e7',
    boxShadow: 'none',
    overflow: 'hidden',
  }}
>
  <Table size="small">
    <TableHead sx={{ bgcolor: '#fafafa' }}>
      <TableRow>
        <TableCell sx={{ fontWeight: 700, color: '#71717a', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', py: 1.5 }}>
          Item Name
        </TableCell>
        <TableCell sx={{ fontWeight: 700, color: '#71717a', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Category
        </TableCell>
        <TableCell align="right" sx={{ fontWeight: 700, color: '#71717a', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Actions
        </TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {items.map((row) => (
        <TableRow key={row.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
          <TableCell sx={{ fontWeight: 600, color: '#09090b', fontSize: '0.825rem' }}>{row.name}</TableCell>
          <TableCell sx={{ color: '#52525b', fontSize: '0.825rem' }}>{row.category}</TableCell>
          <TableCell align="right">
            <IconButton size="small" sx={{ color: '#71717a', '&:hover': { color: '#09090b' } }}>
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>
```

### 4.4 Space-Optimized Modal / Dialog Pattern
Modals must NEVER use unstyled sprawling `80vw` containers. Use structured cards with header, pill step tracker, and footer:
```tsx
<Dialog
  open={open}
  onClose={handleClose}
  maxWidth="md"
  fullWidth
  slotProps={{
    paper: {
      sx: {
        borderRadius: '16px',
        border: '1px solid #e4e4e7',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.2)',
        bgcolor: '#ffffff',
        overflow: 'hidden',
        maxHeight: '92vh',
      }
    }
  }}
>
  {/* Header */}
  <Box sx={{ px: 3.5, pt: 3, pb: 2.25, borderBottom: '1px solid #f4f4f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 800, color: '#09090b', fontSize: '1.15rem' }}>
        Dialog Title
      </Typography>
      <Typography variant="caption" sx={{ color: '#71717a', display: 'block', mt: 0.25 }}>
        Short helpful description of the action.
      </Typography>
    </Box>
    <IconButton onClick={handleClose} size="small" sx={{ color: '#71717a', borderRadius: '8px', border: '1px solid #e4e4e7' }}>
      <CloseIcon sx={{ fontSize: '1.1rem' }} />
    </IconButton>
  </Box>

  {/* Content */}
  <DialogContent sx={{ p: 3.5 }}>
    <Grid container spacing={2.5}>
      <Grid size={6}>
        <TextField fullWidth size="small" label="Field One *" required />
      </Grid>
      <Grid size={6}>
        <TextField fullWidth size="small" label="Field Two" />
      </Grid>
    </Grid>
  </DialogContent>

  {/* Footer */}
  <DialogActions sx={{ p: 2.5, px: 3.5, borderTop: '1px solid #f4f4f5' }}>
    <Button onClick={handleClose} sx={{ borderRadius: '8px', textTransform: 'none', color: '#71717a' }}>
      Cancel
    </Button>
    <Button variant="contained" sx={{ borderRadius: '8px', textTransform: 'none', bgcolor: '#09090b', color: '#ffffff' }}>
      Save Changes
    </Button>
  </DialogActions>
</Dialog>
```

### 4.5 Risk & Priority Badge Pattern
Maintain standard high-visibility color conventions:
```tsx
// Action Priority Badges
<Chip
  label="High AP"
  size="small"
  sx={{ bgcolor: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', fontWeight: 700, fontSize: '0.7rem', height: 22 }}
/>
<Chip
  label="Medium AP"
  size="small"
  sx={{ bgcolor: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', fontWeight: 700, fontSize: '0.7rem', height: 22 }}
/>
<Chip
  label="Low AP"
  size="small"
  sx={{ bgcolor: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontWeight: 700, fontSize: '0.7rem', height: 22 }}
/>
```

---

## 5. Migration Checklist for Existing & New Pages
When creating or modernizing a page, verify:
- [ ] Header uses `variant="h4"` with `fontWeight: 800`, `letterSpacing: '-0.03em'`, and color `#09090b`.
- [ ] Tab bars use segmented pill container with `#f4f4f5` background and white active card.
- [ ] No `margin="normal"` on any form fields. All fields use `size="small"` and `borderRadius: '8px'`.
- [ ] Tables use `#fafafa` headers, uppercase tracked headers, and `#e4e4e7` container border.
- [ ] Dialogs use `slotProps={{ paper: { sx: { borderRadius: '16px', border: '1px solid #e4e4e7' } } }}`.
- [ ] Primary buttons use `#09090b` with white text and `borderRadius: '8px'`.
- [ ] Zero duplicate icon characters in button text (`+ +` bug eliminated).
