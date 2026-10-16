# Todo-chan: Minimalistic, Personalized, Multi-User Day Planner & PWA

**Todo-chan** is a personalized day planner, calendar, Eisenhower Matrix task manager, and collaborative workspace with real-time Firebase synchronization, customizable neon aesthetics, and an original cute anime companion named **Toco-chan**.

---

## Key Features & Two-Level Password Access Architecture

### 1. Two-Level Password Access System
Every shared to-do list has an authoritative unique list ID and two independent passwords:
- **Level 1 — View Password (Read-Only Access)**:
  - Grants read-only access to the list, tasks, calendar, Eisenhower Matrix, and progress.
  - Editing controls are disabled with a prominent **View Only** mode badge.
  - Viewers cannot create, edit, or delete tasks, modify priorities, or send chat messages (unless granted by the owner).
- **Level 2 — Edit Password (Full Editor Access)**:
  - Grants full editing permissions: create/edit/delete tasks, complete/reopen, update Eisenhower quadrant classifications, add comments, and participate in live chat.
  - Changes made by editors synchronize instantly with the owner and all authorized workspace members via Firebase Firestore real-time listeners.
- **Connection Screen**:
  - Requires **Unique To-Do List ID** and either the **View Password** or **Edit Password**.
- **Upgrade Connection**:
  - Viewers can upgrade their current connection to Editor access at any time by entering the Edit Password.
- **Owner Controls & Revocation**:
  - View/copy unique list ID.
  - Update View Password and Edit Password with secure random generator.
  - Option to invalidate previously issued access grants, requiring reconnects.
  - Manage connected members, view access levels, and revoke access.
  - Configure viewer permissions for notes, comments, and chat independently.

### 2. Username-and-Password-Only Authentication
- No email address required.
- Secure server-side credential verification with PBKDF2 hashing (64-byte key, 10,000 iterations + cryptographically random salt).
- Atomic username reservation in Firestore (`usernames/{normalizedUsername}`).
- Rate limiting and brute-force protection on authentication and connection endpoints.

### 3. Productivity & Planning Tools
- **Multiple To-Do Lists**: Create and manage distinct workspaces (Personal, College, Projects, Work) with custom colors.
- **Comprehensive Task Dimensions**: Title, description, assigner, assignees, start/due dates, scheduled start/due times, duration in minutes, importance slider (1–10), urgency score (1–10), Eisenhower classification (auto + override), task colors, and private vs. shared notes.
- **Eisenhower Matrix**: Four interactive quadrants (Do First, Schedule, Delegate, Eliminate) with drag-and-drop and quick-switch controls.
- **Calendar System**: Month, Week, Day, and Agenda views with date navigation, filters, and quick-add affordances.
- **Live Chat**: Real-time Firestore chat for shared workspaces with auto-scroll and permission checks.

### 4. Aesthetics & Personalization
- **Full Color Wheel**: Interactive HSV/RGB color wheel with brightness slider, hex inputs, and instant preview.
- **Light & Dark Themes**: Full contrast adaptation across all accent colors.
- **Independent Neon Mode**: Soft neon glow effects on borders and controls with ambient room glow.
- **Toco-chan Anime Mascot**: Two-ponytail anime companion with rotating advice dialogues ("HEYYYY! TODO-CHAN SAYS COMPLETE YOUR WORKS!", "Todo-chan is watching you", "Todo-chan feels lonely... complete ur works").
- **Completion Celebration**: Displays celebratory Toco-chan modal ("YAYY!!! TODO-CHAN GIVES U A CHOCOLATE!!!") on local task completion.

### 5. Progressive Web App (PWA)
- Full Web App Manifest (`id`, `name`, `short_name`, `theme_color`, `display: standalone`).
- Service worker asset caching with `vite-plugin-pwa`.
- In-app install button (`PWAInstallButton`) with guided instructions for iOS Safari.
- Offline connectivity banner (`OfflineIndicator`).

---

## Deployment & Vercel Configuration

1. **Build & Start**:
   ```bash
   npm run build
   npm start
   ```
2. **Vercel Deployment**:
   - `vercel.json` provides client-side SPA rewrites to ensure direct route refreshing works seamlessly.
   - Configure public Firebase variables in project settings as needed.
