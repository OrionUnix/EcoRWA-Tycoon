# 🗺️ EcoRWA Tycoon - Local Architecture Map

> **Note**: This file serves as a GPS for developers and AI agents to navigate the frontend architecture of the project. It outlines the logical structure of the UI components and the rules for state management.

## 📁 Repository Structure (`frontend/app/[locale]/(user)/user-terminal/`)

```txt
components/
├── ui/                     # The new, cleaned-up UI architecture
│   ├── hud/                # (Heads-Up Display) Persistent on-screen elements
│   │   ├── TopBar.tsx
│   │   ├── MainToolbar.tsx
│   │   └── ActiveToolHUD.tsx
│   │
│   ├── npcs/               # Character dialogues & interactions
│   │   ├── AdvisorWidget.tsx
│   │   ├── BobWarningModal.tsx
│   │   ├── JordanPitchModal.tsx
│   │   └── AnimatedAvatar.tsx
│   │
│   ├── panels/             # Game management & data displays
│   │   ├── BudgetPanel.tsx
│   │   ├── DataLayersPanel.tsx
│   │   ├── BuildingInspector.tsx
│   │   └── CityInfoBar.tsx
│   │
│   ├── web3/               # RWA & Blockchain specific components
│   │   ├── RwaInvestModal.tsx
│   │   ├── WalletConnectPrompt.tsx
│   │   └── TokenBalanceDisplay.tsx
│   │
│   └── overlays/           # Full-screen or blocking screens
│       ├── GameOnboarding.tsx
│       ├── SimCityLoader.tsx
│       ├── SoftWelcomeModal.tsx
│       └── ChunkExpandOverlay.tsx
│
├── engine/                 # Core Game Logic (PixiJS, Systems, Simulation)
│   ├── systems/            # Logic systems (Economy, Building, Save)
│   └── ...                 # Renderers, Managers, Utilities
│
└── hooks/                  # extracted logic from bulky components
    ├── ui/                 # View-model logic for UI components
    │   ├── useBobDialogue.ts
    │   └── useBuildingInspector.ts
    │
    └── web3/               # Blockchain logic
        └── useFirebaseWeb3Auth.ts
```

## 🧩 Architecture Rules & Guidelines

### 1. View-Logic Separation (The "Dumb UI" Rule)
UI Components (`.tsx` files in `components/ui/`) should be as "dumb" as possible. Their primary responsibility is to define the JSX layout, styling (Tailwind CSS), and Framer Motion animations.
- **DO NOT** put complex `useEffect` chains, raw fetch calls, or Wagmi transaction logic directly inside the component.
- **DO** extract these operations into a custom hook inside the `hooks/` directory, and import the variables/callbacks into the component.

### 2. Splitting Bulky Components (>300 lines)
If a file exceeds ~200-300 lines, it is doing too much. Apply this workflow:
1. **Extract Sub-Components**: Break down complex renders into smaller helper components (e.g., `InspectorRow`, `ServiceBadge`) either in the same file or in a `/components/ui/shared/` folder.
2. **Extract Logic**: Move the state management, event listeners, and data formatting into a matching custom hook.
   - *Example*: `BuildingInspector.tsx` logic moves to `hooks/ui/useBuildingInspector.ts`. The UI file only receives `const { canUpgrade, handleUpgrade, ...} = useBuildingInspector(building);`

### 3. Global State vs. Local State
- **Context API / Zustand**: Use global state managers for data that affects multiple disjoint areas of the game (e.g., wallet connection status, total city budget, current cursor mode).
- **Local State (`useState`)**: Keep state local if it only affects a single component (e.g., modal open/close status, current tab in a panel, loading animation frame).
- **Engine State**: Game entity data (buildings, roads, resources) belongs to the `MapEngine` / `BuildingManager`. UI components should only *read* from the engine or dispatch actions to it, never store direct copies of the game state unless absolutely necessary for React reactivity.

### 4. Event-Driven Communication
To avoid tight coupling between the PixiJS Game Engine and the React UI, use CustomEvents dispatched on the `window` object. 
- *Syntax*: `window.dispatchEvent(new CustomEvent('my_event', { detail: data }))`
- React components listen to these events (via hooks) to update their visible state (e.g., showing Bob's warning when a building placement fails in the engine).
