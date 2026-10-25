# Unpaidinterns Design Spec

- Date: 2026-10-25
- Status: Design approved, implementation plan pending

## 1. Product

A locally run 3D dashboard that shows live status of Claude Code, Codex and Gemini CLI sessions, plus a Kanban task board and a chat panel for resuming sessions.

- **v1**: observe session status, Kanban board, send messages to finished/idle sessions
- **v2+**: dispatch new sessions from the board, Cloudflare deployment, more scenes, Grok and Claude duet

## 2. Supported agents (v1)

| Agent | Data source | Resume command |
|---|---|---|
| Claude Code | `~/.claude/projects` | `claude --resume <id> -p <msg>` |
| Codex | `~/.codex/sessions` | `codex exec resume <id> <msg>` |
| Gemini CLI | `~/.gemini/tmp` | Until verified, the Gemini chat input is disabled and labeled "Not supported yet" |

Each agent has its own adapter behind a shared interface. Adding an agent means adding one adapter file.

## 3. Architecture

pnpm workspaces monorepo:

```
packages/core       Types and zod schemas (AgentEvent, Session, Task)
packages/collector  Watches session files with chokidar; per-agent adapters emit AgentEvent
packages/server     Hono: SessionStore, Transport, TaskRepository, Runner, Auth
apps/web            React + Vite + React Three Fiber + dnd-kit + i18next + zustand
```

### 3.1 Data flow

1. The collector watches session files; each adapter converts them to `AgentEvent { agent, sessionId, project, state, tool, ts }`
2. `SessionStore` (a reducer) derives the latest state per session
3. `Transport` pushes state to the browser over WebSocket; after reconnecting, the client refetches a full snapshot
4. `/island` and `/board` share one zustand store and one `ChatPanel`
5. When a message is sent, `Runner` executes the resume command. The CLI writes results back to the session file and the collector picks them up, so no separate stream parser is needed

### 3.2 Swappable interfaces (for later Cloudflare deployment)

| Interface | v1 | Later |
|---|---|---|
| Transport | Local WebSocket | Worker + Durable Object (collector connects outbound; commands use the same reverse channel) |
| TaskRepository | `~/.unpaidinterns/tasks.json` | D1 |
| Auth | One-time URL token exchanged for a cookie | Cloudflare Access |

Only status, tool name and project name go to the cloud. Raw session content never leaves the machine.

### 3.3 Security

- Server binds to `127.0.0.1` only
- A one-time token is generated at startup, passed in the URL, then exchanged for a cookie
- Runner spawns with an argument array, never through a shell
- Three permission levels: read-only, can edit (default), full. Only "full" enables `Bash`, and selecting it requires an extra confirmation
- At most one Runner per session at a time

## 4. 3D island (`/island`)

### 4.1 Layout

- The island is built from hex tiles in a pastel diorama style
- **Outer ring: work areas.** One district per project (grouped by session cwd); each tile holds one desk and one session. District positions persist; new projects grow into empty outer tiles
- **Center: amenities**, 8 tiles: coffee bar, kitchen, KTV, gym, massage room, ball pit, ping-pong, nap pods
- Clicking a district flies the camera in; "Overview" returns to the top view. Clicking an agent opens ChatPanel; hovering shows what it is doing
- A side list mirrors the 3D view and serves as the keyboard and accessibility entry point

### 4.2 States and characters (office scene)

States are grouped into 4 groups. Characters only change costume when the group changes, to avoid flicker:

| Group | States | Character and behavior |
|---|---|---|
| Working | thinking, running tool, writing reply | Engineer at desk. Thinking: chin on hand. Running tool: typing, code scrolling on screen. Writing: slow typing |
| Needs you | waiting for user | Stands up at the desk and waves; the tile shows an apricot pulse ring. Never leaves the desk |
| Resting | done, idle | Goes to the coffee bar for ~1 minute first, then other amenities. Two or more sing KTV or play ping-pong together |
| Trouble | error | Spills coffee, holds head |

- Idle over 30 minutes: goes to a nap pod, then fades out; the tile is reclaimed and the district shrinks
- Subagents are "unpaid interns": smaller, semi-transparent, following their parent
- A barista NPC always stands behind the coffee bar and does not represent any agent
- Each character carries the official logo badge of its agent

### 4.3 Scene packs and character packs

- A scene pack contains tile skins, props and a role table (state group to character). v1 ships only the office
- Character spec: `.glb`, under 5k triangles, textures up to 1024px. Fixed animation names: `idle`, `think`, `type`, `wave`, `stretch`, `slump`, `walk`. Missing animations fall back to `idle`
- `manifest.json` maps the character to an agent and sets scale and bubble height
- v1 default characters are procedural but follow the same spec, so original characters dropped into `characters/` replace them without code changes
- Future scene candidates: amusement park, Taiwanese night market, restaurant kitchen, water park, farm

### 4.4 Performance

- Hex tiles use `InstancedMesh`; cap of ~60 agents
- `frameloop="demand"` renders only when needed; rendering pauses when the tab is hidden

## 5. Kanban (`/board`)

- Three columns: To do, In progress, Done. Built with dnd-kit; supports cross-column moves, in-column reordering and keyboard control
- Card fields: title, note, project, bound sessions (zero or more)
- Cards never move on their own. When a session finishes, the card shows a "Move to Done?" button and the user decides
- No color stripe on cards. State is shown by elevation: Done is flat, normal cards float slightly, "needs you" cards float highest with an apricot shadow
- A "needs you" card shows the same waving character from the 3D island peeking over its top edge
- Header: island/board switch, project and agent filters, search, language switch

## 6. ChatPanel

- Slides in from the right; shared by island and board
- Shows recent conversation; tool calls are collapsed by default
- Messages can only be sent when the session is done or idle
- If a CLI process is detected running for the same project, a warning suggests "Fork" (`--fork-session`)
- Two selectors under the input: permission (read-only / can edit / full) and mode (resume / fork)
- Button labels name the action, e.g. "Send to Claude", "Reply to Claude"

## 7. Visual spec

| Item | Spec |
|---|---|
| Color | Background `#EEF0FB`, text `#2E3150`, secondary text `#6B6F96`, cards `#FFFFFF`, needs-you `#FF9F1C` (used for this state only), done `#4CC38A`. Agent brand colors appear only on avatars |
| Type | Display: Bricolage Grotesque. Body: Noto Sans TC. Commands and numbers: IBM Plex Mono. Evaluate jf-openhuninn for Chinese headings later |
| Grid | 20px outer gutter, 8px spacing grid, 32px control height, 12px card gap, 20px column gap, 14px radius |
| Icons | Clay-style SVG: 24px grid, light from top-left, two-step gradient per hue, white glyph. Below 20px use a flat single-color variant. No emoji |
| Agent badges | Official logos, unmodified, with attribution in `assets/agents/README.md` |
| Motion | Drag lift `scale(1.02) rotate(-1.5deg)`, drop with spring (bounce 0.15). Card lift 200ms `cubic-bezier(.23,1,.32,1)`, panel slide 300ms, button press `scale(.97)`. No animation for keyboard actions; respect `prefers-reduced-motion` |
| Logo | Clay style, matching the icon set |

## 8. Settings (v1)

1. Language: Traditional Chinese, English, follow system
2. Scene and quality: scene, high/low quality, reduce motion
3. Agent sources: per-agent toggle, session path, idle fade-out time (default 30 minutes)
4. Notifications: browser notification and sound when an agent needs you or finishes
5. Chat defaults: permission level, resume or fork

## 9. Error handling

| Case | Handling |
|---|---|
| A session file line fails to parse, or the format changes | Skip and count; settings show per-adapter health |
| CLI data directory not found | Show "Not installed", not an error |
| WebSocket disconnects | Auto-reconnect with backoff, refetch a full snapshot, show "Reconnecting" |
| Runner fails (CLI missing, non-zero exit, over 10 minutes, Runner already active) | ChatPanel states the cause and the fix; stderr is redacted first |
| `tasks.json` corrupted | Writes go to a temp file then rename. If corruption is detected on load, rename to `.bak`, start fresh and show a notice |
| WebGL unavailable | Switch to the board and show a notice |

## 10. Testing

- Coverage target: 80%
- **Unit**: each adapter against redacted real session fixtures; SessionStore transitions; Runner argument building; TaskRepository
- **Integration**: Hono endpoints and WebSocket; Runner against a fake CLI script
- **E2E**: Playwright with system Chrome (`channel: "chrome"`): card drag, language switch, chat flow, district fly-in
- **`--demo` mode**: fake data for tests and screenshots

## 11. v1 milestones (~3 weeks)

1. core, collector, Claude adapter, server, plus a simple list view: 3 days
2. Codex and Gemini adapters: 2 days
3. Kanban, tasks, i18n: 3 days
4. 3D office island and characters: 5–6 days
5. ChatPanel and Runner: 4–5 days
6. Settings, notifications, clay icons: 2–3 days

## 12. Out of scope for v1

Cloudflare deployment, other scenes, loading custom character packs (the spec is defined first), Grok and Claude duet, dispatching new sessions from the board.

## 13. Open questions

- Whether Gemini CLI supports non-interactive resume (verify during milestone 2)
- Which tools "Grok" and "Claude duet" mean, and whether they keep local session records
