# Project Structure & Scalability

This document explains the organization of the codebase and the rationale behind the directory structure, following the strict 3-layer UI architecture with full TypeScript.

## Directory Overview

```text
src/
├── api/                # API service layer (typed constants, mock & live API services)
│   ├── base.ts         # Local/Mock API base URL & key constants
│   ├── auth/           # Auth service layer
│   │   └── authService.ts # Firebase and mock auth implementation
│   ├── profile/        # Profile service layer
│   │   └── profileService.ts # Firebase firestore/local sync for streaks & metrics
│   ├── collections/    # Workspace collections service layer
│   │   ├── collectionsService.ts # Firebase firestore for lists & categories
│   │   └── collectionsApi.ts     # API client for workspace categories
│   ├── todo/           # Core task (todo) service layer
│   │   └── firestoreService.ts # CRUD tasks and details sync service
│   └── routines/       # Routine management service layer
│       └── routineService.ts # CRUD routines and logs sync service
├── assets/             # Static assets (images, logos)
├── components/         # UI Components (3-Layer Architecture)
│   ├── ui/             # [Layer 1] Primitives (Button.tsx, IconButton.tsx, Input.tsx, Rating.tsx, Skeleton.tsx)
│   ├── patterns/       # [Layer 2] Reusable Patterns (Modal, ConfirmationModal, PageHeader, MediaScroll, MediaCard, StatusBadge, SearchBar, ProtectedRoute, BackToTopButton, ExpandableText)
│   └── features/       # [Layer 3] Feature Components (Grouped by domain)
│       ├── auth/       # Authentication (AuthModal.tsx)
│       ├── layout/     # Global structure features
│       │   ├── MainLayout.tsx # Layout coordinator wrapper
│       │   └── MainLayout/ # Encapsulated layout elements
│       │       ├── SidebarRail.tsx # Narrow vertical navigation rail
│       │       ├── ProfileDrawer.tsx # Streak and XP drawer popup
│       │       └── OrganizerSidebar.tsx # Smart views and completed sidebar
│       ├── media/      # Task-specific feature components
│       │   ├── TaskList.tsx # Tasks list manager, inline quick-adds, & filters
│       │   ├── TaskList/   # Encapsulated task list building blocks
│       │   │   ├── SubtaskProgress.tsx # Circular subtask completion gauge
│       │   │   ├── ActiveTaskItem.tsx # Individual task row component
│       │   │   ├── TrashQueueView.tsx # Soft-deleted items workspace queue
│       │   │   └── BulkImportModal.tsx # Hierarchical bulk task importer modal
│       │   ├── TaskDetailPane.tsx # Task details coordinator wrapper
│       │   ├── ChecklistActivity.tsx # Standard task details checklist timeline
│       │   ├── TaskFormModal.tsx # Task add/edit configuration modal
│       │   └── TaskDetailPane/ # Encapsulated details inspector building blocks
│       │       ├── TaskDetailHeader.tsx # Header details toolbar
│       │       ├── TaskDescription.tsx # Description textarea
│       │       ├── SubtaskChecklist.tsx # Subtask checklists
│       │       ├── SubtaskChecklist/ # Encapsulated subtask checklist elements
│       │       │   └── ActiveSubtaskItem.tsx # Individual subtask row component
│       │       └── ExportModal.tsx # Interactive task & subtask configurations exporter
│       ├── profile/    # Profile & analytics components
│       │   ├── StreakFlame.tsx # Gold/silver streak SVG gauge meters
│       │   └── XPProgress.tsx # Circular level XP progress loader
│       ├── collections/# Category collections components
│       │   └── CategoryManager.tsx # Workspace list tag manager
│       ├── routines/   # Routine management feature components
│       │   ├── RoutineList.tsx # Routines list and filter tab triggers
│       │   ├── RoutineList/
│       │   │   ├── RoutineCard.tsx # Individual habit card row
│       │   │   └── CheckInNoteModal.tsx # Routine milestone comments prompt dialog modal
│       │   ├── RoutineFormModal.tsx # Routine creator & editor modal
│       │   ├── RoutineDetailPane.tsx # Detail stats and history inspector
│       │   └── RoutineDetailPane/
│       │       ├── CalendarHeatmap.tsx # CSS grid activity matrix heatmap
│       │       └── StreakStats.tsx # Streak counts & counter items
│       └── settings/   # Customization features
│           ├── FontCustomizer.tsx # Typography and size multipliers
│           ├── SandboxPreview.tsx # UI sandbox mockup preview
│           ├── BackupManager.tsx # JSON import/export database manager
│           └── SoundManager.tsx # Audio synthesizer bell settings toggle
├── hooks/              # Reusable global hooks
│   ├── useAuth.ts      # Auth logic and state sync with Redux
│   ├── useAuthGuard.ts # Action security cloud lock validation
│   ├── useRedux.ts     # Pre-typed useAppDispatch & useAppSelector
│   ├── useToast.ts     # Typed toast notification hook (Sonner wrapper)
│   ├── usePWA.ts       # PWA installer prompt and state manager hook
│   ├── useIntersectionObserver.ts # Observer hook for infinite scroll loading
│   ├── useRoutineSchedule.ts # Habit scheduling & streak calculators
│   └── useTaskDetailsPage.ts # State/action coordinator for MediaDetailsPage.tsx
├── lib/                # Third-party library configs
│   ├── firebase.ts     # Firebase config credentials initialization
│   └── sound.ts        # Web Audio API Synthesizer bell sounds
├── pages/              # Routed page components
│   ├── HomePage.tsx      # Landing dashboard, streaks, and priority lists
│   ├── BrowsePage.tsx    # Exploration, backup exporter/importer, and sound switches
│   ├── RoutinesPage.tsx  # Habit tracking dashboard layout wrapper
│   ├── ProfilePage.tsx   # Detailed progress metrics and database wipe resets
│   ├── MediaDetailsPage.tsx   # Detailed subtask checklist lists and star priorities
│   ├── CollectionsPage.tsx # Categories list dashboard
│   ├── CollectionDetailsPage.tsx # Individual category list pipelines
│   ├── PersonPage.tsx      # Lead engineering contributors & app specifications
│   └── SettingsPage.tsx    # Workspace dynamic font and font-size customization settings
│── routes/             # Route definitions
│   └── index.tsx       # Nested createBrowserRouter maps
├── store/              # Redux store configuration
│   ├── index.ts        # Store setup, exports RootState & AppDispatch
│   └── slices/         # Redux Toolkit slices
│       ├── authSlice.ts
│       ├── profileSlice.ts
│       ├── todoSlice.ts
│       ├── routineSlice.ts # Routine management slice
│       └── settingsSlice.ts # Settings customization state with LocalStorage persistence
├── types/              # Global TypeScript type definitions
│   ├── env.d.ts        # Vite environment variable types
│   ├── todo.types.ts   # Core Task & Subtask typings
│   ├── collections.types.ts # Category lists types
│   ├── settings.types.ts # Font family and font-size configuration typings
│   ├── auth.types.ts   # Firebase auth types
│   ├── routine.types.ts # Habit definitions & log models
│   └── index.ts        # Barrel export for all global types
├── App.tsx             # App entry with RouterProvider
├── main.tsx            # React DOM mounting point with Redux Provider
└── index.css           # Tailwind v4 standard with custom theme variables
```

---

## 1. UI Layering (Strict)

### `components/ui/`
- Atomic, dumb components.
- No business logic.
- Reusable across any project.
- Props typed via `[Component]Props` interfaces extending HTML attributes.

### `components/patterns/`
- Compositions of `ui` primitives.
- Domain-agnostic (no specific "Todo" or "User" terminology).
- Solves UI problems like "Entity Scroll" or "Page Headings".

### `components/features/`
- Business-logic heavy.
- Grouped by domain (e.g., `features/media/` for task cards, `features/profile/` for gamified UI).
- Contains its own sub-components and private layout elements.

---

## 2. Global Folders

### `hooks/`
- Logic shared across multiple features.
- Handles stateful logic that doesn't belong to a specific UI component.
- **`useRedux.ts`**: Pre-typed `useAppDispatch` & `useAppSelector`. Always use these over raw `useDispatch`/`useSelector`.
- **`useToast.ts`**: Typed wrapper around Sonner for consistent toast notifications.

### `lib/`
- Configured services like Web Audio synth sound handlers (`sound.ts`) and Firebase configurations (`firebase.ts`).

### `types/`
- **Global shared types** used across 2+ features or modules.
- **`env.d.ts`**: Declares `ImportMetaEnv` for type-safe `import.meta.env` access.
- **`[domain].types.ts`**: Domain-specific type files (e.g., `todo.types.ts`, `auth.types.ts`).
- **`index.ts`**: Barrel export re-exporting all global types.

### `store/`
- **`index.ts`**: `configureStore` setup, exports `RootState` and `AppDispatch` types.
- **`slices/`**: Redux Toolkit slices. Each slice has a typed `[Slice]State` interface.

### `pages/`
- Thin wrappers that compose feature components.
- Handle routing logic and URL parameters.

---

## 3. File Naming Conventions

| File Type | Extension | Casing | Example |
|---|---|---|---|
| React Components | `.tsx` | PascalCase | `Button.tsx`, `Navbar.tsx` |
| Hooks | `.ts` | camelCase | `useToast.ts`, `useRedux.ts` |
| Type Definitions | `.types.ts` | camelCase | `todo.types.ts`, `auth.types.ts` |
| Environment Types | `.d.ts` | camelCase | `env.d.ts` |
| Store/Slices | `.ts` | camelCase | `index.ts`, `todoSlice.ts` |
| API Services | `.ts` | camelCase | `base.ts`, `mediaApi.ts` |
| Utilities / Sound | `.ts` | camelCase | `sound.ts` |
| Styles | `.css` | camelCase | `index.css` |

---

## ❌ Structure "Don't"s

- **❌ Reverse Imports**: Never import from `features` into `ui` or `patterns`.
- **❌ Flat Features**: Don't dump all feature components in one folder. Group by domain.
- **❌ Page Logic**: Don't put business logic or data fetching in `pages/`. Move it to `features/` or `hooks/`.
- **❌ Duplicate Primitives**: Don't create custom buttons if a generic `Button` exists in `ui/`.
- **❌ Untyped Redux**: Never use raw `useDispatch` or `useSelector`. Use `useAppDispatch` / `useAppSelector` from `@/hooks/useRedux`.
- **❌ `any` Types**: Never use `any`. Use `unknown` and narrow with type guards.
- **❌ `.js`/`.jsx` Files**: All source files MUST use `.ts`/`.tsx` extensions. No JavaScript files in `src/`.

## 4. Scalability & Promotion Strategy

1.  **Strict Private vs. Common Assets**: Assets (components, hooks, utils, types) used by only **one feature or parent component** must stay encapsulated within that feature's subfolder (e.g. `src/components/features/media/components/` or `TaskDetailPane/` subfolder).
2.  **Asset Promotion**: As soon as a component, hook, utility, or type is required by **2+ features or pages**, it MUST be promoted to global common spaces:
    *   **Components** → Promote to global `patterns/` or `ui/`.
    *   **Logic (Hooks/Utils)** → Promote to global `src/hooks/` or `src/utils/`.
    *   **Types** → Move to `src/types/` and re-export from `src/types/index.ts`.
3.  **Strict Padding**: The `Layout` component in `features/layout/` handles all page padding. Pages must be clean wrappers.
4.  **Documentation Sync**: Any change to the file structure, new API services, or new features MUST be reflected in the "Directory Overview" of this file immediately.
