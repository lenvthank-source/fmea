# Rule: UI Theme & Design System Specification

## 1. Core Design Philosophy
FMEApex uses a connected quality engineering identity across the homepage, sign-in, and application dashboard.
- Ivory canvas (`#faf9f6`), white surfaces, graphite ink (`#242621`), orange brand accents (`#ff682c`), and contextual green (`#45664c`, soft `#eff2e8`). Risk colors retain their semantic meaning.
- Plus Jakarta Sans headings and Inter body text. Public pages use storytelling scale; workspace screens use compact, readable controls.
- `frontend/src/theme/theme.ts:4` exports the canonical MUI color tokens and theme. `ColorModeContext.tsx` consumes that theme instead of creating a competing copy.
- `frontend/src/theme/quality-theme.css:1` scopes native auth, app chrome, dashboard, and guide styling. Public storytelling styles remain scoped in `landing-story.css`.
- Prefer restrained borders and motion that responds to user actions. Honor reduced motion and visible keyboard focus.

---

## 2. Global Color Tokens & CSS Variables

| Token Role | Hex Code | Usage Context |
|---|---|---|
| **Public Canvas** | `#FAF9F6` | Main background for landing, product, pricing, learn pages. |
| **Workspace Canvas** | `#FAF9F6` / `#FFFFFF` | Internal dashboard canvas and cards. |
| **Heading / Primary Text** | `#242621` (Public) / `#242621` (App) | Titles, h1-h4 headings, table headers. |
| **Body Text** | `#52525B` (Public) / `#27272a` (App) | Paragraphs, descriptions, table body text. |
| **Muted Text / Hints** | `#65685f` / `#A1A1AA` | Subtitles, labels, keyboard shortcut badges. |
| **Subtle Borders** | `#E5E0D8` (Public) / `#e3e4db` (App) | Card borders, table dividers, input borders. |
| **Segmented Tab Pill** | `#eff2e8` | Background container for segmented tab bars. |
| **Primary Accent (Orange)** | `#FF682C` | Brand details, selection accents, simulator toggles; semantic red remains for High AP. |
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
- **Input Styling**: All inputs must feature `borderRadius: '8px'`, border `#e3e4db`, hover `#d4d4d8`, and focused `#242621`.

---

## 4. Standard Component Patterns & Code Examples

### 4.1 Page Header Pattern
Every workspace page must start with a clean 2-column header layout:
```tsx
<Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
  <Box>
    <Typography variant="h4" component="h1" sx={{ fontWeight: 800, letterSpacing: '-0.03em', color: '#242621', fontSize: { xs: '1.5rem', sm: '1.875rem' } }}>
      [Page Title]
    </Typography>
    <Typography variant="body2" sx={{ color: '#65685f', fontWeight: 500, mt: 0.5 }}>
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
        bgcolor: '#242621',
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
      bgcolor: '#eff2e8',
      border: '1px solid #e3e4db',
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
          color: '#65685f',
          transition: 'all 0.15s',
          '&.Mui-selected': {
            bgcolor: '#ffffff',
            color: '#242621',
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
    border: '1px solid #e3e4db',
    boxShadow: 'none',
    overflow: 'hidden',
  }}
>
  <Table size="small">
    <TableHead sx={{ bgcolor: '#fafafa' }}>
      <TableRow>
        <TableCell sx={{ fontWeight: 700, color: '#65685f', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', py: 1.5 }}>
          Item Name
        </TableCell>
        <TableCell sx={{ fontWeight: 700, color: '#65685f', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Category
        </TableCell>
        <TableCell align="right" sx={{ fontWeight: 700, color: '#65685f', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Actions
        </TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {items.map((row) => (
        <TableRow key={row.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
          <TableCell sx={{ fontWeight: 600, color: '#242621', fontSize: '0.825rem' }}>{row.name}</TableCell>
          <TableCell sx={{ color: '#52525b', fontSize: '0.825rem' }}>{row.category}</TableCell>
          <TableCell align="right">
            <IconButton size="small" sx={{ color: '#65685f', '&:hover': { color: '#242621' } }}>
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
        border: '1px solid #e3e4db',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.2)',
        bgcolor: '#ffffff',
        overflow: 'hidden',
        maxHeight: '92vh',
      }
    }
  }}
>
  {/* Header */}
  <Box sx={{ px: 3.5, pt: 3, pb: 2.25, borderBottom: '1px solid #eff2e8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 800, color: '#242621', fontSize: '1.15rem' }}>
        Dialog Title
      </Typography>
      <Typography variant="caption" sx={{ color: '#65685f', display: 'block', mt: 0.25 }}>
        Short helpful description of the action.
      </Typography>
    </Box>
    <IconButton onClick={handleClose} size="small" sx={{ color: '#65685f', borderRadius: '8px', border: '1px solid #e3e4db' }}>
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
  <DialogActions sx={{ p: 2.5, px: 3.5, borderTop: '1px solid #eff2e8' }}>
    <Button onClick={handleClose} sx={{ borderRadius: '8px', textTransform: 'none', color: '#65685f' }}>
      Cancel
    </Button>
    <Button variant="contained" sx={{ borderRadius: '8px', textTransform: 'none', bgcolor: '#242621', color: '#ffffff' }}>
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
- [ ] Header uses `variant="h4"` with `fontWeight: 800`, `letterSpacing: '-0.03em'`, and color `#242621`.
- [ ] Tab bars use segmented pill container with `#eff2e8` background and white active card.
- [ ] No `margin="normal"` on any form fields. All fields use `size="small"` and `borderRadius: '8px'`.
- [ ] Tables use `#fafafa` headers, uppercase tracked headers, and `#e3e4db` container border.
- [ ] Dialogs use `slotProps={{ paper: { sx: { borderRadius: '16px', border: '1px solid #e3e4db' } } }}`.
- [ ] Primary buttons use `#242621` with white text and `borderRadius: '8px'`.
- [ ] Zero duplicate icon characters in button text (`+ +` bug eliminated).


## 6. Contextual FMEA Walkthrough and Dashboard Density

- `frontend/src/features/projects/components/FmeaTutorialGuide.tsx:1` renders a bounded, anchored coachmark with Popper collision handling and visible target outlines. It does not reserve a side rail or duplicate the entry point.
- Dashboard: one 7-Step Guide button. Project workflow screens: one sidebar entry; global workflow screens may use the header. Creating a new project offers contextual help unless dismissed.
- Prompts follow real wizard fields, validation, Next Step, and successful Create Program. Field tips cannot continue through empty required values. Cancelling does not save data; closing/finishing ends only the tour.
- Continue into PFD structure, PFMEA functions/failures/risk, actions/evidence, and control-plan documentation. Guide progression does not satisfy any FMEA entry/exit gate.
- Use a compact summary strip, smaller headers and card padding, and a wider program column. On phones show the total and put phase filters on a horizontal scroller; prevent app-header overflow.
- Trial UI says Trial workspace (Trial on narrow screens), hides archive navigation/actions, and suppresses redundant current-page account-menu navigation.
- Activity must come from viewer-scoped recorded audits. Refresh periodically, on focus, after mutations, and manually. Display loading, empty, error, and updated-at states honestly; never label polling as streaming.


## Approved account/card/repository refinements (2026-10-19)
Display the server-assigned publicHandle in the minimal avatar/name/chevron account control; keep trial state and theme controls in its menu. Do not reintroduce a separate trial badge or inactive bell. Preserve all project fields/actions with wrapping and natural card height; no title line clamps hiding data. Repository overview must expose actual package/function/cause/control relationships with counts and missing-data states; structural completeness differs from approval. Full text remains available in the inspector. See engineering-rule-register for domain meaning and ACTIVE_STATE for integration status.
