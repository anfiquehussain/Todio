# Project Rules & Best Practices

This document outlines the coding standards and architectural principles for the **Todio** project.

## 1. Core Architecture (Strict 3-Layer UI)

All UI code MUST belong to exactly one of the following layers:

- **ui**: Primitives (dumb, reusable, lowest-level).
- **patterns**: Reusable UI patterns (compositions of primitives, domain-agnostic).
- **features**: Business-specific components (own application behavior, business logic).

### 1.1 Strict Import Direction

Imports **MUST** flow in one direction only:
`ui` → `patterns` → `features` → `pages`

**Forbidden Reverse Imports:**

- `ui` components MUST NOT import from `patterns`, `features`, or `pages`.
- `patterns` components MUST NOT import from `features` or `pages`.
- `features` components MUST NOT import from `pages`.

---

## 2. Layer Definitions

### 2.1 `components/ui/` — Primitives

- **Purpose**: Lowest-level building blocks.
- **Characteristics**: Dumb components, no business logic, no side effects, no API calls.
- **Allowed**: Styling, Layout, Accessibility, Visual state (hover, focus, disabled).
- **❌ Strictly Forbidden Imports**: `api/`, `features/`, `pages/`, Domain models (Collection, Task, Subtask, User, etc.), Application-specific constants.
- **Naming**: Generic and responsibility-based (e.g., `Button`, `IconButton`, `Input`, `Rating`, `Skeleton`).

### 2.2 `components/patterns/` — Reusable UI Patterns

- **Purpose**: Reusable compositions of primitives, still domain-agnostic.
- **Characteristics**: Compose primitives, no business rules, no entity-specific naming, no API awareness.
- **Examples**: `Modal`, `ConfirmationModal`, `PageHeader`, `MediaScroll`, `MediaCard` (TaskCard), `StatusBadge`, `SearchBar`, `ProtectedRoute`, `BackToTopButton`.
- **Confirmation Pattern**: Use `ConfirmationModal` for destructive actions (e.g., delete task). NEVER use raw `window.confirm`.
- **Modal Pattern**: Use `Modal` for complex interactions (Auth forms, task editors) with Framer Motion animations.
- **ProtectedRoute Pattern**: Use `ProtectedRoute` to wrap routes requiring authentication.
- **PageHeader Pattern**: Every page MUST use `PageHeader` for consistent titling, subtitles, and actions.
- **Dashboard Pattern**: For primary overview panels (e.g., Home page dashboard), use full-width statistics and decorative glassmorphism backdrops with glowing gradients.

### 2.3 `components/features/` — Feature Components

- **Purpose**: Business-domain components, own real application behavior.
- **Characteristics**: May contain business logic, may call APIs, may reference domain entities (streaks, tasks, lists).
- **Organization**: Grouped by feature/domain (e.g., `features/media/` for tasks, `features/profile/` for gamified metrics, `features/collections/` for categories).
- **Responsibility**: Configure patterns (actions, list filter triggers, item deletions), do NOT re-implement UI mechanics.

## 3. Feature Internal Organization & Promotion Rule (Strict)

Every feature domain (e.g., `media/`, `profile/`, `collections/`) contains isolated components, logic, and configurations. We enforce a strict **Strictly Private vs. Global Promotion** rule for all code assets (components, hooks, utilities, and types):

1.  **Private Feature Assets**: If an asset (component, hook, utility, or type) is used **only** within that specific feature, it MUST reside inside that feature's subfolder (e.g., `src/components/features/media/components/`, `media/hooks/`, `media/utils/`, or `media/types.ts`).
2.  **Component/Logic Encapsulation**: If an extracted sub-component, hook, or utility is only a "building block" for one specific parent component, it MUST reside in a folder-per-component subfolder (e.g., `src/components/features/media/TaskDetailPane/SubtaskChecklist.tsx`) and MUST NOT be imported anywhere else.
3.  **Global Promotion (Common Assets)**: As soon as a component, business logic (hook/utility), or type is needed by **another feature, common page, or external layout**, it MUST be immediately promoted to the global common directories:
    *   **UI Components** → Promote to `src/components/patterns/` (or `src/components/ui/` if it's a stateless atomic primitive).
    *   **Business / State Logics (Hooks)** → Promote to `src/hooks/`.
    *   **Utilities & Transformers** → Promote to `src/utils/`.
    *   **TypeScript Types** → Promote to `src/types/[domain].types.ts` and export from the `src/types/index.ts` barrel.

**Strict Import Violations**:
*   ❌ Do NOT import private feature-specific assets across features.
*   ❌ Do NOT let pages contain heavy business logic; promote page logic to feature components or global hooks.
*   ❌ Do NOT mix common reusable components with isolated feature directories.

---

## 4. Hooks (`src/hooks/`)

- **Purpose**: Reusable logic, state management, side effects.
- **Redux Hook Rule**: Always use typed `useAppDispatch` and `useAppSelector` from `hooks/useRedux.ts`.

---

## 5. Pages (`src/pages/`)

- **Purpose**: Route entry points only.
- **Characteristics**: Thin wrappers composing feature components, handle routing params, no reusable UI logic.
- **❌ Styling**: Pages should NOT add their own padding wrappers. The `Layout` component provides consistent padding.

---

## 6. Feedback & Interaction

### 6.1 Toast Notifications

- **Rule**: Always use the toast system with custom styled toast notifications from Sonner.
- Use for: Success (task completed, category established), Error (API/sync failures), Info (general data updates, sound toggles).

### 6.2 Confirmation Flow

Destructive actions (Delete task, reset database) MUST:

1.  Trigger `ConfirmationModal` (`variant="danger"`).
2.  Execute Redux slice action or API call.
3.  Show Toast notification result.
4.  Close modal and refresh UI.

---

## 7. Styling & Icons (Strict)

### 7.1 Theme Colors Only

- **Rule**: NEVER use hardcoded hex codes, RGB, or standard Tailwind colors (e.g., `bg-blue-500`) outside of `index.css`.
- **Brand Colors**: `brand-primary` (#6366f1), `brand-secondary` (#06b6d4), `brand-accent` (#8b5cf6), `brand-light` (#e0e7ff).
- **Text Colors**: `text-primary` (#f5f5f5), `text-secondary` (#a3a3a3).
- **Semantic Colors**: `success` (#10b981), `warning` (#f59e0b), `error` (#ef4444), `info` (#3b82f6).
- **Implementation**: Use Tailwind classes mapping to these variables (e.g., `text-brand-primary`, `bg-card`, `border-gray-border`).

### 7.2 Icons

- **Rule**: ALL icons MUST use the `lucide-react` package. No exceptions.
- **Consistency**: Stick to `lucide-react` for visual harmony.

### 7.3 Form Design

- **Outside Labels**: Always place labels outside and above the input field.
- **Help Text**: Place clearly below the label or as separate caption text.
- **Consistency**: Use `space-y-1.5` for grouping labels with inputs.

### 7.4 Tailwind v4 Standards

- **Refactoring Requirement**: When modifying components, proactively refactor legacy utility classes to their Tailwind v4 equivalents.
- **Shrink/Grow**: Use `shrink-0` instead of `flex-shrink-0`, `grow` instead of `flex-grow`, etc.
- **Gradients**: Use `bg-linear-to-*` instead of `bg-gradient-to-*`.
- **Aspect Ratios**: Use standard fraction notation `aspect-2/3` instead of bracket notation `aspect-[2/3]`.
- **Rounded Corners**: Use standard presets (e.g., `rounded-3xl`) instead of pixel/rem values in brackets.
- **Text Wrapping**: Use `wrap-break-word` instead of `break-words`.

---

## 8. Naming Conventions

- **Components**: `PascalCase`, responsibility-based (UI) or business-meaning (Features).
- **Variables / Functions**: `camelCase`.
- **Constants**: `UPPER_CASE`.
- **Type Files**: `[domain].types.ts` (e.g., `auth.types.ts`, `collections.types.ts`).
- **Interfaces/Types**: `PascalCase`, prefixed with domain context (e.g., `Task`, `ButtonProps`).

---

## 9. Golden Rule

> **Design-system components are named by UI responsibility.**
> **Feature components are named by business meaning.**

---

## 10. Web Interface Guidelines (Vercel Compliance)

To ensure a premium, accessible, and performant user experience, follow these guidelines:

### 10.1 Accessibility

- **Icon-only buttons**: MUST have `aria-label`.
- **Forms**: MUST have `<label>` or `aria-label`.
- **Interactive elements**: MUST have keyboard handlers (`onKeyDown`/`onKeyUp`).
- **Semantic HTML**: Use `<button>` for actions, `<a>`/`<Link>` for navigation. NEVER use `<div onClick>`.
- **Icons**: Decorative icons MUST have `aria-hidden="true"`.
- **Async Updates**: Toasts and validation messages MUST have `aria-live="polite"`.

### 10.2 Focus & Interaction

- **Focus States**: MUST have visible focus (e.g., `focus-visible:ring-2`). NEVER use `outline-none` without a replacement.
- **Hover States**: Buttons/links MUST have distinct `hover:` styles for visual feedback.
- **Touch**: Use `touch-action: manipulation` to prevent double-tap zoom delay.

### 10.3 Forms & Validation

- **Inputs**: MUST have `autocomplete` and meaningful `name`.
- **Spellcheck**: Disable on emails, codes, and usernames (`spellCheck={false}`).
- **Placeholders**: End with `…` (e.g., `Search tasks…`).
- **Submit State**: Stay enabled until request starts; show spinner during request.

### 10.4 Typography & Content

- **Punctuation**: Use `…` (ellipsis character) instead of `...`. Use curly quotes `"` `"`.
- **Loading**: Loading states MUST end with `…` (e.g., `Loading…`).
- **Truncation**: Use `truncate` or `line-clamp-*` for long text; flex children need `min-w-0`.
- **Numbers**: Use `font-variant-numeric: tabular-nums` for columns/comparisons.

### 10.5 Animation & Performance

- **Properties**: Animate ONLY `transform` and `opacity`. NEVER use `transition: all`.
- **Reduced Motion**: Honor `prefers-reduced-motion`.
- **Images**: MUST have explicit `width` and `height` to prevent Layout Shift (CLS).

---

## 11. Responsive Design (Enforced)

The application MUST be fully responsive and look premium on all devices (mobile, tablet, desktop).

- **Mobile-First Approach**: Design and build for mobile first, then scale up using Tailwind breakpoints (`sm:`, `md:`, `lg:`, `xl:`).
- **Flexible Layouts**: Use Flexbox and Grid for all layouts. NEVER use fixed widths (e.g., `w-[500px]`) that can break on smaller screens. Use percentages, `fr` units, or max-widths.
- **Touch Targets**: Interactive elements (buttons, links) MUST have a minimum hit area of `44x44px` on mobile.
- **No Horizontal Scrolling**: The main page content MUST NOT trigger horizontal scrollbars.
- **Safe Areas**: Use `env(safe-area-inset-*)` for devices with notches (handled by the global Layout padding).
- **Stacking**: Content should stack vertically on small screens and expand to multi-column layouts on larger screens.

---

## 12. TypeScript Standards (Strict)

### 12.1 General Rules

- **Strict Mode**: `tsconfig.app.json` enforces `strict: true`. Never disable it.
- **No `any`**: The `any` type is strictly forbidden unless absolutely unavoidable. Document the reason with a `// eslint-disable-next-line` comment.
- **Prefer `unknown`**: Use `unknown` over `any` for truly unknown types, then narrow with type guards.
- **Explicit Return Types**: Functions with non-trivial logic SHOULD have explicit return types. Simple arrow functions can rely on inference.
- **`as` Assertions**: Minimize use of `as`. Prefer type narrowing (type guards, `instanceof`, `in`).

### 12.2 Component Typing

- **Props Interfaces**: Define a `[ComponentName]Props` interface for every component.
- **Extend HTML Attributes**: Use `React.ButtonHTMLAttributes<HTMLButtonElement>`, `React.InputHTMLAttributes<HTMLInputElement>`, etc. to extend native element props.
- **`children`**: Type as `React.ReactNode`.
- **No `React.FC`**: Use regular function declarations or typed arrow functions.

### 12.3 Redux Toolkit Typing

- **Store Types**: Export `RootState` and `AppDispatch` from `store/index.ts`.
- **Typed Hooks**: Always use `useAppDispatch` and `useAppSelector` from `hooks/useRedux.ts`. NEVER use untyped `useDispatch`/`useSelector`.
- **Slice Typing**: Define `interface [Slice]State` for each slice's state shape. Use `PayloadAction<T>` for reducers.

### 12.4 API & Data Typing

- **Response Types**: Define in `src/types/[domain].types.ts` (e.g., `todo.types.ts`).
- **Null vs Undefined**: API fields that can be absent should be `T | null` (matching API reality), not `T | undefined`.
- **Barrel Exports**: Re-export all types from `src/types/index.ts` for clean imports.

### 12.5 Firebase Typing

- **Config**: Type Firebase config objects as `FirebaseOptions`.
- **Services**: Explicitly type exports (`Auth`, `Firestore`).
- **Firestore Data**: Define interfaces for document shapes.

### 12.6 Environment Variables

- **Typed via `env.d.ts`**: All `VITE_*` env vars MUST be declared in `src/types/env.d.ts` with `ImportMetaEnv`.
- **Access**: Always access via `import.meta.env.VITE_*`. Never use `process.env`.

### 12.7 Async & Error Handling

- **Typed Promises**: Async functions MUST have typed return values.
- **Error Narrowing**: In `catch` blocks, narrow errors with `instanceof Error` before accessing `.message`.

### 12.8 Import Ordering

All imports MUST follow this order, separated by blank lines:

1.  **React / Framework** — `react`, `react-dom`, `react-router-dom`
2.  **Third-Party Libraries** — `@reduxjs/toolkit`, `firebase`, `lucide-react`, `framer-motion`
3.  **Internal Modules** — `@/store`, `@/hooks`, `@/api`
4.  **Type-Only Imports** — `import type { ... }` (grouped with their origin)
5.  **Relative Imports** — `./components`, `../utils`
6.  **Styles** — `./styles/index.css`

### 12.9 File Naming Standards

- **Components**: `PascalCase.tsx` (e.g., `Button.tsx`, `MainLayout.tsx`).
- **Hooks**: `camelCase.ts` (e.g., `useToast.ts`, `useRedux.ts`).
- **Types**: `[domain].types.ts` (e.g., `auth.types.ts`, `collections.types.ts`).
- **Utilities / Sounds**: `camelCase.ts` (e.g., `sound.ts`).
- **Store Slices**: `camelCase.ts` (e.g., `todoSlice.ts`).
- **API Services**: `.ts` | camelCase (e.g., `mediaApi.ts`).
- **Config**: `camelCase.ts` (e.g., `firebase.ts`).

### 12.10 Reusable Type Organization

- **Global Types** (`src/types/`): Types shared across 2+ features.
- **Feature Types** (`features/[domain]/types.ts`): Types used only within a single feature.
- **Component Types**: Props interfaces live in the same file as the component.
- **Barrel File** (`src/types/index.ts`): Re-exports all global types.

### 12.11 TSX Component Structure

Every `.tsx` file SHOULD follow this internal structure:

```tsx
// 1. Imports (ordered per §12.8)
import { useState } from 'react';
import type { ReactNode } from 'react';

// 2. Types & Interfaces
interface ComponentProps { ... }

// 3. Constants (variant maps, static data)
const variants: Record<Variant, string> = { ... };

// 4. Component
const Component = ({ prop }: ComponentProps) => { ... };

// 5. Export
export default Component;
```

### 12.12 Task Domain Model

- **Task Model**: Always use the standard `Task` interface to represent productivity tasks:
  - `id`: Unique identifier of the task (`string`).
  - `title`: Title of the task card.
  - `overview`: Details and notes of the task.
  - `completed`: Completion status flag (`boolean`).
  - `priority`: Priority weight (`'low' | 'medium' | 'high'`).
  - `collectionId`: Workspace category ID or null.
  - `subcollectionId`: Workspace subcollection ID or null.
  - `dueDate`: Target due date (`string`).
  - `createdAt`: Date of creation.

---

## 13. Subtask Checklist & Logging System

- **Real-time**: Use database snapshots or local state listeners to provide subtask logs with high responsiveness.
- **Subtask Model**: Always use the standard `Subtask` interface to represent checklist items:
  - `id`: Unique identifier of the subtask.
  - `taskId`: Parent task ID association.
  - `title`: Description of the subtask.
  - `completed`: Checklist completion status (`boolean`).
  - `priority`: Checklist priority level (`'low' | 'medium' | 'high'`).
  - `createdAt`: Date of creation.
- **XP Rewards**: Completing subtasks yields `35 XP` points dynamically.

---

## 14. Documentation Integrity

- **Source of Truth**: `rules.md` and `files.md` are the single source of truth for the project.
- **Mandatory Updates**: Whenever a new file is created, a folder structure is changed, or a new architectural pattern is introduced, the corresponding documentation (`files.md` and/or `rules.md`) **MUST** be updated in the same task.
- **Consistency**: Never allow the codebase and these documentation files to become inconsistent.

---

## 15. Performance & Data Fetching Patterns

### 15.1 Infinite Scrolling

- **Client-Side (Local Data)**:
  - Use a `visibleCount` state variable to control the number of rendered items.
  - Implement an `IntersectionObserver` via callback refs at the bottom of the list to increment `visibleCount`.
- **Internal Scrollboxes**: For secondary content (e.g., Subtask checklists), wrap the list in a `max-height` container with `overflow-y-auto` to preserve screen space.

### 15.2 Lazy-Loading

- Use an `IntersectionObserver` and callback refs for lazy rendering and performance boundaries.

---

## 16. Sound Synthesizer Audio Bells

- **Productivity Synthesizer**: The application features a Web Audio API powered physical synthesizer that produces high-end bell resonances upon completing primary tasks or subtasks.
- **Preferences**: Sound playback state is synced via Redux (`soundEnabled`) and saved to `localStorage` to respect user configurations.
- **Toggles**: A segmented header option allows immediate muting/unmuting of synthesizer bells.

---

## 17. UI State & Navigation Persistence

To ensure a seamless user experience, key workspace view state is persisted in `localStorage` so refreshing the browser maintains the user's active context instead of resetting the views:

1.  **Landing View**:
    *   On a fresh open (new browser session/clean slate), the application defaults to the **Today** smart view (`filter: 'active'`) for maximum starting productivity.
2.  **State Preservation**:
    *   `activeCollectionId`, `activeSubcollectionId`, `activeTaskId`, and `filter` are stored in `localStorage` in real-time. Page refreshes reload the exact collection, sublist, and active task the user was last working on.
3.  **Sidebar Expansion Memory**:
    *   The expand/collapse states of custom lists in the sidebar (`expandedCollections`) are synchronized with `localStorage`.
    *   If a user navigates to a sublist or task context (such as via the "Go" shortcut), the parent list automatically expands to reveal the item.
4.  **Cleanup**:
    *   Wiping data or deleting active folders cleanly scrubs their stored keys to prevent stale or broken workspace references.

---

## 18. Routine Domain Model

Routines are recurring habits or rituals scheduled at daily, weekly, monthly, or custom day intervals. They never complete permanently; instead, completions are tracked using check-in logs.

### 18.1 Routine Schema
- `id`: Unique identifier (`string`).
- `userId`: Parent user ID association (`string`).
- `title`: Short title of the habit card (`string`).
- `description`: Notes or context of the habit (`string`).
- `icon`: Lucide icon name for visual identity (`string`).
- `color`: Custom theme color for badge highlight (`string`).
- `recurrenceType`: Frequency pattern (`'daily' | 'weekly' | 'monthly' | 'custom'`).
- `recurrenceDays`: Scheduled days of week `[0-6]` (Sun-Sat) or days of month `[1-31]` (`number[]`).
- `customIntervalDays`: Interval value N for custom frequency (`number | null`).
- `startDate`: Start schedule date (`string`, YYYY-MM-DD).
- `endDate`: End schedule date or null (`string | null`, YYYY-MM-DD).
- `currentStreak`: Consecutive due days completed up to today (`number`).
- `bestStreak`: All-time record streak (`number`).
- `archived`: Archiving toggle flag (`boolean`).
- `deleted`: Soft-delete trash bin flag (`boolean`).
- `deletedAt`: ISO timestamp when deleted (`string | null`).

### 18.2 RoutineLog Schema
Each completed occurrence generates a log entry:
- `id`: Log item identifier (`string`).
- `routineId`: Parent routine definition ID (`string`).
- `userId`: Owner user ID (`string`).
- `completedAt`: ISO datetime of check-in (`string`).
- `scheduledDate`: Target date (YYYY-MM-DD) for which check-in is logged (`string`).
- `note`: Optional text note added at check-in (`string`).

### 18.3 Gamification & XP Rewards
- Completing a routine check-in awards `25 XP` and increments the profile streak.
- Unchecking / deleting a completion log decrements `25 XP` and resets the streak.

