# Design System: High-End Editorial Education

## 1. Overview & Creative North Star: "The Digital Mentor"
This design system moves away from the gamified, "toy-like" aesthetic common in language apps. Instead, it adopts the persona of **The Digital Mentor**: a sophisticated, calm, and authoritative editorial experience.

The system rejects the "flat grid" of standard apps. We achieve a premium feel through **Intentional Asymmetry** (using staggered layouts for course cards), **Tonal Depth** (layering shades instead of using borders), and **Extreme Typography Scales** (pairing massive display headers with tight, functional labels). The goal is an interface that feels like a high-end digital broadsheet—intelligent, spacious, and motivating.

---

## 2. Color & Atmospheric Surface Strategy
We utilize a deep "Midnight Teal" palette (`primary`) balanced against warm "Amber Sunset" accents (`tertiary`).

### The "No-Line" Rule
**Standard 1px solid borders are strictly prohibited for sectioning.**
To define boundaries, use background color shifts. A lesson module (set in `surface-container-low`) should sit directly on the global `surface` without a stroke. This creates a seamless, modern flow that feels architectural rather than "boxed in."

### Surface Hierarchy & Nesting
Depth is achieved through a "Stacked Paper" metaphor. Each level of importance moves one step up the surface tier:
- **Global Canvas:** `surface` (#f8f9fa)
- **Secondary Content Areas:** `surface-container-low` (#f3f4f5)
- **Interactive Cards/Elements:** `surface-container-lowest` (#ffffff)
- **High-Focus Overlays:** `surface-bright` (#f8f9fa)

### The "Glass & Gradient" Rule
For floating elements (like a "Daily Streak" tracker), use **Glassmorphism**. Apply `surface-container-lowest` at 70% opacity with a `20px` backdrop-blur.
For main Call-to-Actions (CTAs), do not use flat fills. Use a subtle linear gradient transitioning from `primary` (#003441) to `primary_container` (#0f4c5c) at a 135° angle to provide "soul" and a tactile, premium sheen.

---

### 3. Typography: Editorial Authority
We pair **Manrope** (Display/Headlines) for character and **Inter** (Body/Labels) for precision.

- **Display-LG (Manrope, 3.5rem):** Use for "Moment of Achievement" screens (e.g., "Lesson Complete").
- **Headline-SM (Manrope, 1.5rem):** The standard for lesson titles. It should feel authoritative.
- **Body-MD (Inter, 0.875rem):** Used for instructional text. High line-height (1.6) is mandatory to ensure readability and "breathing room."
- **Label-SM (Inter, 0.6875rem):** Used for meta-data (e.g., "5 mins remaining"). Always use `0.05rem` letter-spacing for a sophisticated, "utility" look.

The hierarchy communicates the brand: **Large headlines** provide the encouragement; **tight, clean body text** provides the intelligence.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are a sign of "generic" UI. We use light to define space.

- **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` background. The slight delta in hex value creates enough contrast for the eye without visual clutter.
- **Ambient Shadows:** For high-elevation elements (modals), use a shadow color derived from `on-surface` at 5% opacity, with a `blur: 40px` and `y: 20px`. It must look like a soft glow, not a dark smudge.
- **The "Ghost Border" Fallback:** If accessibility requires a border, use the `outline_variant` (#c0c8cb) at **15% opacity**. It should be felt, not seen.
- **Glassmorphism:** Use for persistent navigation bars. This allows the sophisticated teal gradients of the lesson content to bleed through, maintaining a sense of place.

---

## 5. Components: The Premium Kit

### Buttons (The "Pill" Signature)
*All buttons use `rounded-full` (9999px) for a modern, fluid feel.*
- **Primary:** Gradient (`primary` to `primary_container`). White text. No border.
- **Secondary:** `surface-container-high` background with `primary` text.
- **Tertiary:** Transparent background, `primary` text, with the "Ghost Border" (15% opacity `outline_variant`).

### Input Fields (Focus & Clarity)
- **Resting:** `surface-container-lowest` fill, no border, `rounded-xl`.
- **Focus:** Subtle `0.5px` border using `surface_tint` and a soft ambient shadow.
- **Error:** Background shifts to `error_container`, text remains `on_error_container`.

### Learning Cards & Lists
**Forbid the use of divider lines.**
- Separate list items using `spacing-3` (1rem) of vertical white space.
- Use a slight background shift (`surface-container-low`) on hover/press states instead of an outline.
- **Signature Component - "Progress Halo":** For lesson progress, use a large, thin circular stroke in `secondary_fixed` with the active portion in `tertiary`.

### Tooltips & Feedback
- **Success State:** Use `secondary_container` with `on_secondary_container` text. It is softer and more "premium" than a harsh bright green.
- **Hint State:** Use `tertiary_fixed` with `on_tertiary_fixed`. The warm amber acts as a "gentle nudge."

---

## 6. Do’s and Don’ts

### Do:
- **Do** use asymmetrical spacing (e.g., `spacing-8` top padding and `spacing-4` bottom padding) to create an editorial, "curated" look.
- **Do** use "white space as a separator." If you feel the need to add a line, add `spacing-4` of empty space instead.
- **Do** use `manrope` for any text that is meant to be "inspiring" and `inter` for anything "functional."

### Don't:
- **Don’t** use pure black (#000000) for text. Always use `on_surface` (#191c1d) to maintain tonal softness.
- **Don’t** use `rounded-sm`. High-end tools should feel approachable; use `rounded-xl` (0.75rem) or `rounded-full`.
- **Don’t** use "bouncy" animations. Transitions should be linear-out-slow-in (300ms) to feel professional and calm.
- **Don't** use 100% opacity borders. It breaks the "Digital Mentor" illusion of sophisticated layering.
