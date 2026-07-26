# FMEA Tree View – UI Redesign Specification
## For Antigravity Implementation

**Objective:** Convert the current FMEA tree view (heavy, mixed-color, icon-cluttered) into a flat, low-saturation, single-accent-color hierarchy that uses shape and indentation—not bold color—to convey node type and level, matching the target reference design.

---

## 1. Design Objective

Replace the current heavy, mixed-color, icon-cluttered tree with a flat, low-saturation, single-accent-color hierarchy that uses shape and indentation—not bold color—to convey node type and level.

---

## 2. Color Palette

Current version uses saturated blues, greens, and red-orange badges, which creates visual noise. The target uses one neutral text color with color reserved only for functional icons.

| Element | Current | Target |
|---|---|---|
| Node text (all levels) | Blue/Green/Red per type | Dark gray/near-black, #2D2D2D |
| Connector lines | Black dashed | Light gray, #D0D0D0, solid |
| Icon backgrounds | Solid blue/green/orange squares | Soft pastel circles (e.g., #E8F0FE, #EAF7EE, #FDEDEA) |
| Failure/risk tags | Red block "F" | Muted red outline badge, no fill |
| Selected/hover state | None specified | Light gray row highlight, #F5F6F8 |

---

## 3. Typography

- **Font family:** Switch to a single modern sans-serif (Inter, Roboto, or Segoe UI) across all nodes — one consistent font weight/family throughout, unlike current mixed bold-color styling.
- **Font size hierarchy:**
  - Root/System node (e.g., "Wheel Flange", "E vacuum pump"): 14px, Medium weight
  - Process step / Operation (PS, OP): 13px, Medium weight
  - Function / sub-function: 13px, Regular weight
  - Failure mode / attribute node: 12px, Regular weight
- Remove bold coloring as a means of distinguishing type; use icon shape/color instead.
- **Line height:** increase row height to 28–32px (from current ~22px) for breathing room.

---

## 4. Icons and Shapes

- Replace solid square icon badges with **circular icon containers** with soft pastel fill and a thin 1px border.
- Standardize icon size to 16x16px inside a 24x24px circular container.
- **Icon-to-type mapping** (retain semantic meaning, change visual treatment only):
  - Structure/System node: blue outline icon, circle background #E8F0FE
  - Function node: green outline icon, circle background #EAF7EE
  - Failure/Risk node: red/orange outline icon (not filled block), circle background #FDEDEA
  - Process/Operation node: purple or orange outline icon depending on hierarchy level, circle background #F3ECFB or #FEF2E8
- Remove the filled red "F" square badge; replace with a small circular warning icon (e.g., outlined triangle or "!" in a light red circle) to reduce visual alarm.

---

## 5. Tree Structure and Lines

- **Connector lines:** change from black dashed lines to thin (1px) solid light-gray lines (#D0D0D0).
- **Expand/collapse controls:** replace "+/-" box icons with minimal chevron arrows (›/⌄).
- **Indentation:** increase per-level indentation to 20–24px to clearly separate hierarchy depth without relying on color alone.

---

## 6. Interaction States

- **Hover:** light gray background (#F5F6F8) on row, no color change to text.
- **Selected node:** subtle left-border accent (2px, brand color) plus light background tint, avoiding heavy blue fill blocks.
- **Active/expanded branch:** keep icon color, only change chevron orientation — no additional color coding needed.

---

## 7. Spacing and Layout

- Increase vertical padding per row to 6–8px top/bottom.
- Add consistent left padding of 12px before icon, 8px between icon and text.
- Limit color usage to icons only; all text should read in one neutral tone for scan-ability, mirroring the restrained palette of the target reference.

---

## 8. Summary Style Rules for Antigravity Implementation

1. One universal font (Inter/Roboto/Segoe UI), weight-based hierarchy instead of color-based hierarchy.
2. Neutral dark-gray text (#2D2D2D) for all nodes regardless of type.
3. Pastel circular icon badges instead of solid colored squares.
4. Light gray solid connector lines instead of black dashed lines.
5. Chevron-style expand/collapse instead of boxed +/-.
6. Increased row height, indentation, and padding for a more breathable, professional layout.
7. Risk/failure indicators shown as outlined badges, not solid alarming color blocks.

---

*This produces a tree that keeps all current functional information (structure, function, failure, process step icons) but presents it with the calm, consistent, professional visual language of the target reference.*
