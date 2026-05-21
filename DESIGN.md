# Ferromax — Design System

## Color tokens

```css
--color-primary:    #FF6B35;   /* orange — CTAs, accents, active states */
--color-primary-hover: #e55a2b;
--color-primary-bg: rgba(255, 107, 53, 0.10); /* tinted backgrounds */
--color-dark:       #1A1A2E;   /* primary text, dark surfaces */
--color-bg:         #F8F9FA;   /* page background */
--color-white:      #FFFFFF;   /* card surfaces */
--color-border:     #E5E7EB;   /* gray-200 */
--color-text-muted: #6B7280;   /* gray-500 */
--color-text-faint: #9CA3AF;   /* gray-400 */

/* Semantic */
--color-success:  #10B981;   /* emerald-500 */
--color-danger:   #EF4444;   /* red-500 */
--color-warning:  #F59E0B;   /* amber-500 */
--color-info:     #3B82F6;   /* blue-500 */
```

## Easing curves

```css
--ease-out:    cubic-bezier(0.23, 1, 0.32, 1);   /* enters, standard UI */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);  /* on-screen movement */
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);   /* drawers, sheets */
```

## Animation durations

| Element                  | Duration      |
|--------------------------|---------------|
| Button press feedback    | 100ms         |
| Tooltips, small popovers | 150ms         |
| Dropdowns                | 200ms         |
| Drawers, modals          | 350-400ms     |
| Page entrance stagger    | 250ms + delay |

## Typography

| Role        | Font      | Weight | Size          | Case      |
|-------------|-----------|--------|---------------|-----------|
| Hero title  | Rajdhani  | 900    | 5xl–8xl       | UPPERCASE |
| Section h2  | Inter     | 700    | 3xl–4xl       | Title     |
| Card title  | Inter     | 600    | sm–base       | Sentence  |
| Body        | Inter     | 400    | sm (14px)     | Sentence  |
| Label       | Inter     | 600    | xs (12px)     | Sentence  |
| Mono/badge  | Inter     | 700    | 10px          | UPPERCASE |

## Spacing scale
Follows Tailwind defaults. Key values: 4px base unit. Cards use p-4 or p-5. Sections use py-20.

## Border radius

| Element          | Radius    |
|------------------|-----------|
| Buttons (pill)   | rounded-full |
| Buttons (solid)  | rounded-xl   |
| Cards            | rounded-2xl  |
| Inputs           | rounded-xl   |
| Badges           | rounded-full |
| Icons containers | rounded-xl   |

## Elevation / shadows

| Level | Class       | Usage                      |
|-------|-------------|----------------------------|
| 0     | none        | Flat items inside cards     |
| 1     | shadow-sm   | Cards, sidebars             |
| 2     | shadow-md   | Hover state on cards        |
| 3     | shadow-lg   | Modals, drawers             |

## Components

### Button — primary
```jsx
<button className="bg-[#FF6B35] hover:bg-[#e55a2b] active:scale-[0.97] text-white font-semibold rounded-full px-6 py-3 transition-colors text-sm">
```

### Button — secondary
```jsx
<button className="border border-gray-200 bg-white hover:bg-gray-50 active:scale-[0.97] text-gray-700 font-semibold rounded-xl px-4 py-2.5 transition-colors text-sm">
```

### Input
```jsx
<input className="w-full bg-white border border-gray-200 focus:border-[#FF6B35] rounded-xl px-4 py-3 text-sm outline-none transition-colors" />
/* Add ring-2 ring-[#FF6B35]/30 on the wrapper when focused */
```

### Card
```jsx
<div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
```

### Badge / chip
```jsx
<span className="bg-[#FF6B35]/10 text-[#FF6B35] text-xs font-bold px-3 py-1 rounded-full">
```

## Motion principles

1. **Active states on every pressable element** — `active:scale-[0.97]` minimum
2. **Never `transition-all`** — always specify properties: `transition-colors`, `transition-transform`
3. **Entrance animations use `whileInView`** on the Tienda (once: true) — never on internal tools
4. **Spring drawer** — `type: 'spring', duration: 0.4, bounce: 0.1`
5. **Counter bumps** — `AnimatePresence mode="popLayout"` with spring bounce: 0.5
6. **Stagger** — 50ms between sibling items; 30–80ms range acceptable

## Surface-specific rules

### Tienda (public storefront)
- Full motion budget: parallax hero, scroll animations, button micro-interactions
- Drawer uses spring with opacity fade
- Product cards have 3D tilt on hover (desktop only, `@media (hover: hover)`)
- Cart counter badge uses spring bounce on change

### ERP Dashboard / POS
- Minimal animation — KPI cards stagger on load, that's it
- No `whileInView`, no parallax
- POS: zero animation on keyboard-triggered actions

### Login pages
- Split layout: dark brand panel left, light form panel right
- Entrance: single `opacity + y` motion on the form container
- Tab indicator: `layoutId` spring slide
- Error message: scale + opacity spring from above
