# GameGrid Design System

GameGrid is a premium sports companion for following the World Cup: matches, results, standings, highlights, and upcoming games. The visual identity should feel fast, organized, confident, and emotionally connected to football without becoming loud or novelty-driven.

The default experience is dark mode. Light mode must be fully supported, but the brand should be strongest in the dark theme.

## 1. Brand Direction

### Personality

- Modern sports technology.
- Real-time match control center.
- Premium, reliable, and easy to scan.
- Energetic during live moments, calm during browsing.
- World Cup inspired, but not overloaded with flags, confetti, or decorative noise.

### Visual Principles

- Use dark surfaces, sharp contrast, and restrained glow for a broadcast/control-room feeling.
- Use green as the primary GameGrid brand color.
- Use yellow as the World Cup energy accent for moments of attention, victory, status, and celebration.
- Use blue as a supporting information color for links, data, live tracking, maps, and secondary indicators.
- Prefer clean geometry, structured grids, compact data blocks, and clear hierarchy.
- Avoid large areas with multiple saturated colors at the same time.
- Avoid excessive gradients, heavy shadows, decorative blobs, and over-animated effects.

### Visual Assets

The project can use the image assets available in `src/images` as part of the product identity:

- `Logo.jpeg`: preferred brand/logo source when a richer raster logo is needed.
- `GameGrid.jpeg`: brand or hero artwork for GameGrid-focused moments.
- `Design System.jpeg`: visual reference for design-system, presentation, or documentation surfaces.
- `bola.gif`: football motion asset for intro, loading, or playful match moments.

Asset usage rules:

- Use real project imagery before generic stock-like visuals.
- Keep images crisp, purposeful, and connected to the current screen.
- Do not place important text on busy image areas without a dark overlay.
- Avoid using animated assets in dense data areas; reserve them for intro, loading, empty states, or celebratory feedback.
- Always provide descriptive `alt` text for meaningful images. Decorative images should use empty `alt`.

## 2. Color System

### Dark Mode Palette

Dark mode is the main GameGrid theme.

| Token | Value | Role |
| --- | --- | --- |
| `color.bg` | `#0B1220` | Main app background |
| `color.surface` | `#111827` | Cards, panels, topbar, tables |
| `color.surfaceSecondary` | `#172033` | Nested panels, filters, table headers |
| `color.surfaceRaised` | `#1E293B` | Elevated cards, popovers, selected rows |
| `color.text` | `#F8FAFC` | Primary text |
| `color.textMuted` | `#CBD5E1` | Secondary text |
| `color.textSubtle` | `#94A3B8` | Metadata, timestamps, helper text |
| `color.border` | `#263244` | Default borders and separators |
| `color.primary` | `#22C55E` | Main brand action |
| `color.primaryHover` | `#16A34A` | Primary hover/pressed |
| `color.primarySoft` | `rgba(34, 197, 94, 0.14)` | Soft green surfaces |
| `color.accent` | `#FBBF24` | Energy, trophy, featured details |
| `color.accentHover` | `#F59E0B` | Accent hover/active |
| `color.highlight` | `#38BDF8` | Links, data emphasis, maps, live tracking |
| `color.success` | `#22C55E` | Positive status |
| `color.warning` | `#F59E0B` | Warning, soon, attention |
| `color.error` | `#F87171` | Error, unavailable, danger |
| `color.live` | `#EF4444` | Live match status |

### Light Mode Palette

Light mode should feel bright, clean, and editorial while preserving the same brand structure.

| Token | Value | Role |
| --- | --- | --- |
| `color.bg` | `#F8FAFC` | Main app background |
| `color.surface` | `#FFFFFF` | Cards, panels, topbar, tables |
| `color.surfaceSecondary` | `#EEF2F7` | Nested panels, filters, table headers |
| `color.surfaceRaised` | `#E2E8F0` | Elevated/selected surfaces |
| `color.text` | `#0F172A` | Primary text |
| `color.textMuted` | `#475569` | Secondary text |
| `color.textSubtle` | `#64748B` | Metadata, timestamps, helper text |
| `color.border` | `#D9E2EC` | Default borders and separators |
| `color.primary` | `#16A34A` | Main brand action |
| `color.primaryHover` | `#15803D` | Primary hover/pressed |
| `color.primarySoft` | `rgba(22, 163, 74, 0.12)` | Soft green surfaces |
| `color.accent` | `#FACC15` | Energy, trophy, featured details |
| `color.accentHover` | `#EAB308` | Accent hover/active |
| `color.highlight` | `#2563EB` | Links, data emphasis, maps, live tracking |
| `color.success` | `#22C55E` | Positive status |
| `color.warning` | `#F59E0B` | Warning, soon, attention |
| `color.error` | `#EF4444` | Error, unavailable, danger |
| `color.live` | `#DC2626` | Live match status |

### Color Usage Rules

- Green is reserved for brand, primary CTAs, selected navigation, active filters, and positive progression.
- Yellow is reserved for energy: featured content, trophy moments, important highlights, and subtle decorative details.
- Blue is secondary and informational: links, maps, charts, data sync, tooltips, and neutral status.
- Red is only for live state, danger, error, or urgent status.
- Keep large surfaces neutral. Use saturated color in badges, icons, borders, small fills, and focused CTAs.
- Do not place yellow text on white or pale yellow surfaces without a dark supporting color.
- Never rely on color alone. Pair status colors with text labels or icons.

## 3. Typography

### Font Families

- Heading and brand: `Poppins`
- Body and interface: `Inter`
- Fallback: `system-ui`, `-apple-system`, `BlinkMacSystemFont`, `"Segoe UI"`, `sans-serif`

Fonts can be loaded from Google Fonts. Recommended import:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@500;600;700;800&display=swap"
  rel="stylesheet"
/>
```

### Type Scale

| Role | Desktop | Mobile | Weight | Usage |
| --- | --- | --- | --- | --- |
| Display / Hero | 48-64px | 34-42px | 700-800 | Main GameGrid moments and hero titles |
| H1 | 36-48px | 30-36px | 700 | Page titles |
| H2 | 28-34px | 24-28px | 700 | Section titles |
| H3 | 20-24px | 18-22px | 600-700 | Card groups and panels |
| Body | 16px | 15-16px | 400-500 | General reading and UI copy |
| Small | 13-14px | 13px | 500 | Metadata, timestamps, table labels |
| Badge | 11-12px | 11-12px | 700 | Status badges |
| Score | 36-56px | 30-42px | 800 | Match score numbers |

### Typography Rules

- Headings should feel strong and athletic, but not condensed or overly decorative.
- Body copy must remain neutral and readable.
- Scores and statistics should use high weight and tabular numeric alignment when possible.
- Use uppercase only for short labels, badges, and navigation metadata.
- Avoid negative letter spacing. Use `letter-spacing: 0` for normal text and up to `0.08em` only for compact uppercase labels.

## 4. Iconography

Use Font Awesome as the preferred icon library for GameGrid if the project should feel more expressive, sporty, and familiar. Use `lucide-react` as the lighter alternative when a more minimal, line-icon interface is desired.

Recommended Font Awesome package for React:

```bash
npm install @fortawesome/react-fontawesome @fortawesome/free-solid-svg-icons
```

Recommended icons:

- `faHouse`
- `faCalendarDays`
- `faTrophy`
- `faFutbol`
- `faClock`
- `faBell`
- `faMagnifyingGlass`
- `faStar`
- `faChartSimple`
- `faUsers`
- `faGear`
- `faPlay`
- `faVideo`
- `faMapLocationDot`
- `faGlobe`
- `faShieldHalved`
- `faBookmark`

Icon rules:

- Prefer solid Font Awesome icons for navigation, match actions, and status labels.
- Use icons at 14-16px in dense UI, 18-20px in buttons, and 24px in empty states.
- Icons should support labels, not replace important text unless the control has a tooltip or accessible label.
- Keep all icons from one visual family on a single screen.
- Avoid mixing Font Awesome and lucide icons in the same navigation or card cluster.

## 5. Base Tokens

### Token Values

```js
export const gameGridTokens = {
  radius: {
    sm: "6px",
    md: "10px",
    lg: "14px",
    xl: "20px",
  },
  shadow: {
    sm: "0 6px 16px rgba(2, 6, 23, 0.16)",
    md: "0 14px 32px rgba(2, 6, 23, 0.24)",
    lg: "0 24px 60px rgba(2, 6, 23, 0.34)",
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    "2xl": "48px",
  },
  font: {
    heading: '"Poppins", system-ui, sans-serif',
    body: '"Inter", system-ui, sans-serif',
  },
};
```

### CSS Variables

```css
:root {
  color-scheme: light;

  --gg-color-bg: #F8FAFC;
  --gg-color-surface: #FFFFFF;
  --gg-color-surface-secondary: #EEF2F7;
  --gg-color-surface-raised: #E2E8F0;
  --gg-color-text: #0F172A;
  --gg-color-text-muted: #475569;
  --gg-color-text-subtle: #64748B;
  --gg-color-border: #D9E2EC;
  --gg-color-primary: #16A34A;
  --gg-color-primary-hover: #15803D;
  --gg-color-primary-soft: rgba(22, 163, 74, 0.12);
  --gg-color-accent: #FACC15;
  --gg-color-accent-hover: #EAB308;
  --gg-color-highlight: #2563EB;
  --gg-color-success: #22C55E;
  --gg-color-warning: #F59E0B;
  --gg-color-error: #EF4444;
  --gg-color-live: #DC2626;

  --gg-radius-sm: 6px;
  --gg-radius-md: 10px;
  --gg-radius-lg: 14px;
  --gg-radius-xl: 20px;

  --gg-shadow-sm: 0 6px 16px rgba(2, 6, 23, 0.12);
  --gg-shadow-md: 0 14px 32px rgba(2, 6, 23, 0.16);
  --gg-shadow-lg: 0 24px 60px rgba(2, 6, 23, 0.22);

  --gg-space-xs: 4px;
  --gg-space-sm: 8px;
  --gg-space-md: 16px;
  --gg-space-lg: 24px;
  --gg-space-xl: 32px;
  --gg-space-2xl: 48px;

  --gg-font-heading: "Poppins", system-ui, sans-serif;
  --gg-font-body: "Inter", system-ui, sans-serif;
}

.dark {
  color-scheme: dark;

  --gg-color-bg: #0B1220;
  --gg-color-surface: #111827;
  --gg-color-surface-secondary: #172033;
  --gg-color-surface-raised: #1E293B;
  --gg-color-text: #F8FAFC;
  --gg-color-text-muted: #CBD5E1;
  --gg-color-text-subtle: #94A3B8;
  --gg-color-border: #263244;
  --gg-color-primary: #22C55E;
  --gg-color-primary-hover: #16A34A;
  --gg-color-primary-soft: rgba(34, 197, 94, 0.14);
  --gg-color-accent: #FBBF24;
  --gg-color-accent-hover: #F59E0B;
  --gg-color-highlight: #38BDF8;
  --gg-color-success: #22C55E;
  --gg-color-warning: #F59E0B;
  --gg-color-error: #F87171;
  --gg-color-live: #EF4444;

  --gg-shadow-sm: 0 6px 16px rgba(2, 6, 23, 0.24);
  --gg-shadow-md: 0 14px 32px rgba(2, 6, 23, 0.32);
  --gg-shadow-lg: 0 24px 60px rgba(2, 6, 23, 0.42);
}
```

### Tailwind Theme Guidance

```js
// tailwind.config.js excerpt
theme: {
  extend: {
    fontFamily: {
      heading: ["Poppins", "system-ui", "sans-serif"],
      body: ["Inter", "system-ui", "sans-serif"],
    },
    colors: {
      gg: {
        bg: "var(--gg-color-bg)",
        surface: "var(--gg-color-surface)",
        "surface-secondary": "var(--gg-color-surface-secondary)",
        text: "var(--gg-color-text)",
        muted: "var(--gg-color-text-muted)",
        border: "var(--gg-color-border)",
        primary: "var(--gg-color-primary)",
        accent: "var(--gg-color-accent)",
        highlight: "var(--gg-color-highlight)",
        success: "var(--gg-color-success)",
        warning: "var(--gg-color-warning)",
        error: "var(--gg-color-error)",
        live: "var(--gg-color-live)",
      },
    },
    borderRadius: {
      ggSm: "var(--gg-radius-sm)",
      ggMd: "var(--gg-radius-md)",
      ggLg: "var(--gg-radius-lg)",
      ggXl: "var(--gg-radius-xl)",
    },
    boxShadow: {
      ggSm: "var(--gg-shadow-sm)",
      ggMd: "var(--gg-shadow-md)",
      ggLg: "var(--gg-shadow-lg)",
    },
  },
}
```

## 6. Component Guidelines

### Buttons

Primary buttons:

- Background: `color.primary`
- Text: white
- Border: transparent or a slightly brighter green border in dark mode.
- Hover: `color.primaryHover`, subtle elevation, and a restrained glow.
- Use for main actions like viewing match details, following a game, confirming filters, or saving preferences.

Secondary buttons:

- Transparent or `color.surfaceSecondary` background.
- Border: `color.border`
- Text: `color.text`
- Hover: raised surface and green border tint.
- Use for filters, navigation actions, map links, and lower-priority controls.

Ghost buttons:

- Transparent background.
- Text: `color.textMuted`
- Hover: `color.primarySoft`.
- Use for compact toolbar actions and icon buttons.

Danger buttons:

- Use `color.error` sparingly.
- Pair with a clear label and confirmation when destructive.

Disabled buttons:

- Reduce opacity to 45-55%.
- Remove hover elevation.
- Keep text readable enough to identify the disabled action.

### Cards

Default card:

- Background: `color.surface`
- Border: `1px solid color.border`
- Radius: `radius.lg`
- Shadow: `shadow.sm` in light mode, `shadow.md` for key dark-mode panels.
- Padding: `spacing.md` on mobile, `spacing.lg` on desktop.

Match card:

- Use a clear top metadata row: stage, date, time, venue, status.
- Put teams and score in the center with the strongest hierarchy.
- Keep team names readable and avoid truncating important names too aggressively.
- Use the status badge near the match metadata, not buried in actions.

Live match card:

- Slightly stronger border using `color.live` or `color.primary`.
- Use a compact red `AO VIVO` badge.
- Add a small pulse or glow only if motion preferences allow it.
- Keep the score as the dominant element.

Featured card:

- Use `color.accent` as a thin top border, badge, or small highlight.
- Avoid full yellow backgrounds.
- Feature one primary CTA at most.

### Badges

Badges should be small, high-contrast, and semantic.

| Label | Color Direction | Usage |
| --- | --- | --- |
| `AO VIVO` | Red fill or red soft surface | Active match |
| `PROXIMO` | Blue or green soft surface | Upcoming match |
| `ENCERRADO` | Neutral surface | Finished match |
| `DESTAQUE` | Yellow soft surface with dark text | Featured editorial/content |
| `VITORIA` | Green soft surface | Positive match/team result |
| `ALERTA` | Amber soft surface | Schedule change, attention |

Badge rules:

- Use 11-12px uppercase text.
- Use `font-weight: 700`.
- Keep badge radius pill-shaped.
- Include text labels even when icons are present.

### Inputs, Search, and Filters

- Inputs should be minimal, with subtle borders and clear focus rings.
- Search inputs should include `faMagnifyingGlass` from Font Awesome.
- Focus state: green outline or border with a soft green shadow.
- Placeholder text should use `color.textSubtle`.
- Filter groups should sit in `color.surfaceSecondary` panels with compact spacing.
- Selects and segmented controls should have clear active states using green.

### Tables and Standings

- Use clean rows with either subtle zebra striping or border separators.
- Header background: `color.surfaceSecondary`.
- Highlight rank, team, points, goal difference, and form.
- Position numbers should be compact but visually stable.
- Use green for qualification/positive status, amber for caution, red only for elimination or negative status.
- Tables must remain horizontally readable on mobile; prefer sticky first column or card-like row summaries if needed.

### Navigation

Desktop:

- Use a premium topbar or sidebar.
- Topbar should have a dark glass/surface feel, clear brand area, and compact navigation items.
- Active route uses green text, green border, or green underline.
- Avoid oversized marketing-style nav.

Mobile:

- Bottom navigation is allowed for primary routes.
- Keep 4-5 primary items maximum.
- Use icon plus short label.
- Minimum touch target: 44px.

### Highlights and Live Elements

- Live cards should feel urgent but controlled.
- Score numbers should be large, bold, and centered.
- Use mini indicators for live progress, possession, form, or vote results only when they help scanning.
- Use restrained motion: short transitions, no constant large animation.
- Respect `prefers-reduced-motion`.

### Skeletons and Empty States

- Skeletons use neutral surfaces with soft shimmer.
- Empty states should be calm, actionable, and never visually louder than real content.
- Use one icon and one clear action when useful.

## 7. Layout and Responsiveness

### Layout Grid

- Main content max width: 1200-1320px for standard desktop.
- Wide displays can expand to 1480px only for dense match grids.
- Page padding:
  - Mobile: 12-16px
  - Tablet: 20-24px
  - Desktop: 24-32px
- Card gaps:
  - Mobile: 10-12px
  - Desktop: 14-20px

### Desktop Behavior

- Prioritize scan density.
- Use match grids, standings tables, and dashboards with clear sections.
- Keep filters visible and easy to refine.
- Avoid oversized hero sections that push match data too far below the fold.

### Mobile Behavior

- First screen should quickly show brand, next/live match, and primary navigation.
- Cards should stack cleanly.
- Match actions should become full-width when needed.
- Filters can collapse behind a clear control.
- Bottom navigation can replace wide top navigation.

## 8. Accessibility

- Maintain strong text/background contrast in both themes.
- Use visible focus states on all interactive controls.
- Do not encode match status by color alone.
- Keep touch targets at least 44px.
- Avoid tiny text below 11px.
- Ensure score, time, and team names are screen-reader friendly.
- Support reduced motion by disabling pulsing, intro motion, and large animated transitions.

## 9. Motion and Effects

- Motion should support sports energy, not distract from data.
- Recommended durations:
  - Fast UI hover: 120-180ms
  - Card entrance: 180-260ms
  - Route transition: 220-320ms
- Recommended easing:
  - Standard: `cubic-bezier(0.2, 0.8, 0.2, 1)`
  - Exit: `cubic-bezier(0.4, 0, 1, 1)`
- Use glow only on live status, selected filters, and primary CTAs.
- Avoid large decorative background animations behind dense data.

## 10. Implementation Notes for This Project

The current project uses React, Vite, Tailwind CSS, and a global stylesheet at `src/styles/app.css`. This design system is intended to guide a future visual migration.

Recommended future implementation sequence:

1. Add `Poppins` and `Inter` font loading from Google Fonts in `index.html`.
2. Add the CSS variables above in the global stylesheet.
3. Map Tailwind tokens to the CSS variables.
4. Gradually replace hard-coded color values in components and CSS with semantic `gg` tokens.
5. Add Font Awesome packages when component icon updates begin.
6. Use the images in `src/images` as first-choice brand assets before adding new decorative imagery.

No business logic should change when applying this visual system.
