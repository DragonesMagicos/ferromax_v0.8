# Ferromax ERP — Product Context

## What is this?

Ferromax is an Argentine hardware store (ferretería) management system with two surfaces:

1. **Internal ERP** — used by admins and employees to manage stock, process sales (POS), view dashboard KPIs, and handle online orders.
2. **Public Tienda (storefront)** — a consumer-facing e-commerce site where customers browse and order tools and hardware products.

## Users

### Admin (José Rodríguez)
- Owns the business. Uses the dashboard daily to check sales, stock alerts, and cash flow.
- Needs fast access to KPIs — doesn't want to dig for information.
- Uses the POS terminal to ring up in-store sales quickly (barcode scanner workflow).

### Empleado (Manuel Casas)
- Processes in-store sales via POS. Speed is everything — any friction slows the queue.
- Checks stock levels and pending online orders.

### Cliente (public)
- Arrives from search or word-of-mouth. Browses tools by category.
- Mobile-first. Often comparing prices. Wants to see stock availability and price clearly.
- Can create an account to place online orders.

## Brand

- **Name**: FERROMAX
- **Tagline**: "Herramientas profesionales para quienes construyen el futuro"
- **Tone**: Direct, confident, professional. Not flashy — serious craftspeople trust this brand.
- **Country**: Argentina (prices in ARS, locale es-AR)

### Colors
- Primary orange: `#FF6B35`
- Dark navy: `#1A1A2E`
- Light background: `#F8F9FA`
- White: `#FFFFFF`

### Typography
- Body: Inter (system fallback: system-ui, sans-serif)
- Display/headings: Rajdhani (bold, uppercase for hero titles)

### Visual language
- Rounded corners (rounded-xl, rounded-2xl, rounded-full)
- Soft shadows (shadow-sm, shadow-md)
- Orange accents on interactive elements
- Clean white cards on gray backgrounds
- No gradients except subtle overlays on hero images

## Anti-references
- No dark/terminal aesthetic on the public storefront (that belongs only to the internal ERP login)
- No overly playful or cartoon-like UI — this is a professional hardware store
- No cluttered layouts — prioritize clarity and speed of scanning
- No animations that slow down frequent actions (POS keyboard shortcuts must feel instant)

## Strategic principles
1. **Speed over delight in internal tools** — POS and dashboard must be fast. Animations are secondary.
2. **Delight in the storefront** — the public Tienda competes visually; polish and motion matter here.
3. **Mobile-first for the Tienda** — most customers browse on phones.
4. **Consistency** — same color tokens, same border radii, same button styles across all surfaces.
