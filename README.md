# Appetizer

A browser-based homepage dashboard builder. Arrange app shortcuts, group them into menus, structure the canvas with layouts, and choose a live animated background — all configured visually or through YAML. App widgets can optionally embed a live feed that polls an HTTP endpoint and displays results inline. Requires authentication by default; supports multiple users with role-based access.

---

## Quick Start

Always run a tagged release, not the `main` branch directly. Pick a release from the [Releases page](../../releases), then:

```bash
git clone --branch v1.0.0 https://github.com/amsilva97/appetizer.git
cd appetizer
npm install
```

Create a `.env.local` file with a session secret (generate one with `openssl rand -hex 32`):

```
SESSION_SECRET=your_64_char_hex_string_here
```

Then start the server:

```bash
npm run dev
```

Open `http://localhost:3000`. On the first visit you will be redirected to `/setup` to create the root admin account. After that, the homepage is protected by login unless you disable **Force Login** in the user management settings.

---

## First-Run Setup

The `/setup` page appears automatically when no admin account exists. Enter a username and password (8+ characters) to create the **root admin** account. This account cannot be deleted, though it can be disabled by another admin.

Setup is a one-time flow. Once an admin exists, `/setup` redirects to the homepage.

---

## Authentication

Sessions are managed with encrypted cookies (`iron-session`). The session secret is set via the `SESSION_SECRET` environment variable (see [Environment Variables](#environment-variables)).

- **Login** — `/login`. Sign in with a username and password.
- **Logout** — click the sign-out icon in the toolbar.
- **Session persistence** — sessions survive page reloads until the cookie expires or the user signs out.
- **Disabled users** — if an admin disables your account, you are kicked out on the next request without waiting for session expiry.

### Force Login

When **Force Login** is enabled (the default), unauthenticated visitors are redirected to `/login` and cannot access the homepage. When it is disabled, unauthenticated visitors can browse the homepage as guests but must log in manually to get admin capabilities.

The Force Login setting is managed from `/admin/users` by any admin.

---

## Roles

| Role | Capabilities |
|---|---|
| **Root Admin** | All admin capabilities. Cannot be deleted; can only be disabled by another admin. Created on first run. |
| **Admin** | Edit the homepage, manage users, manage secret keys. |
| **User** | View-only access. Cannot enter edit mode or access admin pages. |
| **Guest** | View-only, unauthenticated. Only possible when Force Login is off. |

The toolbar adapts to the current session. Admin controls (edit, users, keys) are only shown to admins.

---

## User Management

Admins access `/admin/users` from the Users icon in the toolbar. From this page admins can:

- **Add users** — set a username, password, and role (admin or user).
- **Change roles** — promote a user to admin or demote an admin to user. The last active admin cannot be demoted.
- **Disable / enable users** — disabled users are locked out immediately. An admin cannot disable their own account.
- **Delete users** — permanently remove a user. The root admin cannot be deleted, and an admin cannot delete their own account.
- **Toggle Force Login** — switch between requiring login and allowing guest access.

---

## Secret Keys

Admins access `/admin/keys` from the Keys icon in the toolbar. Keys are named secrets stored encrypted on disk. They are never exposed to the browser — only their names are returned by the API.

Keys are referenced in app widget feed headers using the `{KEY_NAME}` placeholder syntax (see [Feed tab](#feed-tab)).

---

## Interface

### Toolbar

The toolbar sits at the top of the screen. Its contents depend on your role:

- **Appetizer mark** (top-left) — always visible.
- **Users icon** *(admin only)* — navigate to `/admin/users`.
- **Keys icon** *(admin only)* — navigate to `/admin/keys`.
- **Edit toggle** *(admin only)* — switches between view mode and edit mode. Active state fills white.
- **Sign out** *(when logged in)* — ends the session and redirects to `/login`.
- **Sign in** *(when not logged in)* — navigates to `/login`.

### View Mode

The dashboard as your end users see it. Layouts are invisible. Menus and apps are fully visible and interactive. Clicking an app with a URL opens that URL in a new tab.

### Edit Mode

Reveals the structure of the canvas. Layouts show their cells with a subtle background and border. Hovering a cell highlights it. Right-clicking anywhere opens the **context menu**. Only admins can enter edit mode.

---

## Context Menu

Right-click anywhere on the canvas while in edit mode. The menu is built dynamically based on what is under your cursor.

**Edit section** — one entry per element in the stack at the cursor position:
- Edit Background
- Edit [Layout name] — for each layout the cursor is inside
- Edit [Menu name] — if a menu occupies the cell under the cursor
- Edit [App title] — for floating apps under the cursor, and apps inside any menu under the cursor

**Add section** — one entry per possible insertion point:
- Add Layout to [parent layout name] — adds a sub-layout into the cell under the cursor
- Add Menu to [parent layout name] — adds a menu into the cell under the cursor
- Add App to [menu name] — adds an app widget inside a menu that is under the cursor
- Add Layout to Background — adds a new root layout that fills the whole canvas

Clicking an edit entry opens the **editor panel** for that element. Clicking an add entry creates the widget immediately and opens its editor.

---

## Editor Panel

A floating panel that appears in the bottom-left corner when you select something to edit. It can be dragged by its grip handle and resized by dragging the right edge. It closes with the X button, or by switching edit mode off.

Changes are **not applied until you click Save**. The **Revert** button discards unsaved changes. The **Delete** button permanently removes the widget and all its children.

---

## Widget Types

### Background

The canvas background. Accessed via right-click → Edit Background.

The editor has three tabs:

**Style tab** — contains a **Preset** dropdown, a **Type** selector, and the type-specific fields.

Presets are one-click starting points:
- Solid: Midnight, Snow
- Gradient: Ocean Dusk, Sunrise, Cotton Candy
- Wavy: Deep Sea, Lava
- Aurora: Nebula, Northern Lights
- Particles: Web, Cosmos
- Mesh: Aurora Mesh, Sherbet
- Conic: Prism, Molten
- Plasma: Acid, Deep Space
- Bokeh: City Lights, Candlelight
- Geometric: Topography, Autumn

Types: Solid, Gradient, Wavy, Aurora, Particles, Mesh, Conic, Plasma, Bokeh, Geometric.

**Overlays tab** — applied on top of any background type:
- **Grain** — film grain texture, 0–50 intensity
- **Vignette** — darkened edge fade, 0–100 intensity

**YAML tab** — directly edit the background config as YAML. Applied live; errors are shown inline.

---

### Layout

An invisible structural grid that fills the canvas (or a cell of a parent layout). Layouts define how the page is divided into zones. They are only visible in edit mode.

A layout can contain other layouts, menus, or feed widgets — one per cell.

**Display tab:**
- **Label** — internal name shown in context menu entries and the editor panel title. Not visible to end users.
- **Layout type** — always Grid (the only current type).
- **Columns** — number of grid columns, 1–12.
- **Rows** — number of grid rows, 1–12.

**Visuals tab** (edit mode only — these styles are invisible in view mode):
- **Corner radius** — rounds the outer corners of the layout container, in pixels.
- **Padding** — space between the outer edge and the grid cells, in pixels.
- **Gap** — space between grid cells, in pixels.
- **Margin** — shrinks the layout inward from its container edges, in pixels.
- **Background color** — hex color for the cell fill.
- **Background opacity** — 0–100%.
- **Border color** — hex color for the cell borders.
- **Border opacity** — 0–100%.

**YAML tab** — directly edit the config as YAML. Applied live; errors are shown inline.

**Delete Layout** — removes the layout and all its children (sub-layouts, menus, apps, and feeds inside them).

---

### Menu

A visible styled container that lives inside a layout cell. Menus hold app widgets and render them in a flex list. The label is displayed at the top of the menu.

**Display tab:**
- **Label** — displayed as a small heading at the top of the menu.
- **Type** — always List (the only current type).
- **Direction** — Vertical (apps stacked top-to-bottom) or Horizontal (apps side by side).
- **Padding** — inner spacing between the menu border and its apps, in pixels.
- **Gap** — spacing between app cards, in pixels.

**Visuals tab:**
- **Margin** — shrinks the menu inward from its cell edges, in pixels.
- **Corner radius** — rounds the menu's corners, in pixels.
- **Background color** — hex color for the menu background.
- **Background opacity** — 0–100%.
- **Border color** — hex color for the menu border.
- **Border opacity** — 0–100%.

**YAML tab** — directly edit the config as YAML.

**Delete Menu** — removes the menu and all apps inside it.

---

### App

An app shortcut card. Apps can be floating (draggable, positioned freely on the canvas) or live inside a menu. When inside a menu, apps fill the available axis — horizontally if the menu is vertical, vertically if the menu is horizontal.

**Display tab:**
- **Title** — main text shown on the card. Also used as the fallback icon initial(s) if no logo URL is set.
- **Subtitle** — smaller secondary text below the title.
- **Tooltip** — text shown on hover, as a native browser tooltip.
- **Logo view** — how the icon is displayed:
  - `icon` — a square icon sits to the left of the title/subtitle.
  - `none` — no icon, just the text.
  - `full` — the logo fills the entire card as a background image, with the title overlaid at the top.
- **Logo URL** — URL of the image to use as the icon or cover. If the image fails to load or no URL is set, a colored block showing the first two letters of the title is used instead.
- **Icon zoom** *(full cover only)* — scales the cover image, 100–300%.
- **Offset X** *(full cover only)* — shifts the cover image horizontally, -100 to +100%.
- **Offset Y** *(full cover only)* — shifts the cover image vertically, -100 to +100%.

**Visuals tab:**
- **Width** — card width in pixels, 160–480.
- **Height** — card height in pixels, 48–300.
- **Padding** — horizontal inner spacing, in pixels.
- **Margin** — space between the card edge and its container, in pixels.
- **Corner radius** — rounds the card corners, in pixels.

**Connection tab:**
- **URL** — the URL the app points to.
- **Click to open URL** — toggle. When on, clicking the card opens the URL in a new tab.
- **Show online status** — toggle. When on, a small dot appears next to the title: grey/pulsing while checking, green when reachable, red when offline.
- **Ping URL** — the URL to ping for the status check. Defaults to the main URL if left blank.
- **Check every** — how often to re-check, in seconds, 10–300.

**Feed tab:**

Embeds a live scrollable data list directly below the app card header. The feed is part of the app widget — no separate widget type is needed.

The feed runs as a server-side proxy: the browser posts the config to `/api/feed/run`, the server fetches the upstream URL, applies the transform, and returns the data. Secrets in headers are substituted server-side and never sent to the browser.

- **Method** — `None` (no feed) or `GET` (fetch and display data below the header row).
- **URL** — the endpoint to fetch. Must be `http://` or `https://`.
- **Headers** — key/value pairs sent with every request. Use `{KEY_NAME}` in a value to inject a secret from the [Keys page](#secret-keys). The substitution happens server-side; the actual value is never exposed in the browser.
- **Transform** — a JavaScript expression evaluated in a sandboxed `vm` context (2-second timeout, 10MB response cap). The variable `body` holds the parsed JSON response. The expression must return **either an array** (renders as a plain list) **or an HTML string** (renders as a sanitized rich panel).

  ```js
  // Array — rendered as a list of rows
  body.records.map(r => ({ title: r.title, subtitle: r.status }))

  // HTML string — rendered as a rich panel (links and scripts stripped)
  `<h2>Queue</h2><table>${body.records.map(r =>
    `<tr><td>${r.title}</td><td>${r.status}</td></tr>`
  ).join("")}</table>`
  ```

  When returning HTML, all `<a>` tags, `href` and `src` attributes, and event handlers are stripped by DOMPurify. The feed displays data only — it cannot navigate or execute code. `style` attributes are allowed so you can apply inline CSS.

  The feed container is `overflow: hidden` — it clips its content rather than scrolling itself. If you want the content to scroll, add an `overflow-y: auto` wrapper in your HTML. Because the container has an explicit pixel height, `height: 100%` and `width: 100%` resolve correctly inside it:

  ```js
  `<div style="width:100%;height:100%;overflow-y:auto;padding:12px">
    <table style="width:100%;border-collapse:collapse">
      ${body.records.map(r =>
        `<tr><td style="padding:4px 8px">${r.title}</td>
             <td style="padding:4px 8px;color:#a1a1aa">${r.status}</td></tr>`
      ).join("")}
    </table>
  </div>`
  ```

- **Poll every** — how often to re-fetch, in seconds, 10–300. Polling pauses automatically when the tab is hidden.
- **Feed height** — height of the feed panel in pixels, 80–600. The panel clips content at this height; scrolling is opt-in via your HTML.

**YAML tab** — directly edit the config as YAML.

**Delete App** — removes the app widget.

---

## Import / Export

The editor panel for the background exposes two buttons:

- **Export YAML** — downloads the entire scene as a `.yaml` file, including the background config and all widgets.
- **Import YAML** — loads a `.yaml` file. Can be a full scene file (background + widgets) or a background-only file.

State is also automatically saved to the server on each change (debounced by 1 second) and restored on page load.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SESSION_SECRET` | Yes | 32+ character string used to encrypt session cookies. Generate with `openssl rand -hex 32`. |

Create a `.env.local` file in the project root:

```
SESSION_SECRET=your_64_char_hex_string_here
```

The server will reject session operations without this variable.

---

## Data Files

Appetizer stores its persistent state in the `data/` directory (created automatically, excluded from git):

| File | Description |
|---|---|
| `data/state.yaml` | The homepage scene (background + widgets). |
| `data/users.yaml` | User accounts (usernames, bcrypt hashes, roles). |
| `data/settings.yaml` | App settings (e.g. `forceLogin`). |
| `data/.key` | Encryption key for the secrets store. Auto-generated on first use. |
| `data/keys.enc` | Encrypted secret keys store. |

Do not commit the `data/` directory. It contains credentials and secrets.

---

## YAML Schema Reference

The full scene file has two top-level keys:

```yaml
background: <BackgroundConfig>
widgets:
  - <WidgetInstance>
  - <WidgetInstance>
```

---

### WidgetInstance

Every widget in the scene is a flat entry in the `widgets` array. Hierarchy is expressed through `parentId` and `cellIndex` references, not nesting.

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | Unique identifier for this widget. Any short alphanumeric string. |
| `type` | `app` \| `layout` \| `menu` | yes | Widget type. |
| `config` | object | yes | Type-specific configuration (see below). |
| `x` | number | yes | Horizontal position in pixels. Only meaningful for floating app widgets. Set to `0` for all other widget types. |
| `y` | number | yes | Vertical position in pixels. Only meaningful for floating app widgets. Set to `0` for all other widget types. |
| `parentId` | string | no | ID of the parent widget. Required for sub-layouts and menus (parent must be a layout). Required for apps inside menus (parent must be a menu). Omit for root layouts and floating apps. |
| `cellIndex` | number | no | Zero-based cell index within the parent layout. `cellIndex = row * columns + column`. Required when a layout or menu has a `parentId`. Not used for apps inside menus. |

---

### Layout Config

Used when `type: layout`.

```yaml
type: layout
config:
  label: "Main Grid"
  layout:
    type: grid
    columns: 3
    rows: 2
  padding: 0
  gap: 8
  margin: 0
  borderRadius: 0
  bgColor: "#ffffff"
  bgOpacity: 3
  borderColor: "#ffffff"
  borderOpacity: 6
```

| Field | Type | Default | Range | Description |
|---|---|---|---|---|
| `label` | string | `"Layout"` | — | Display name shown in context menus and the editor. |
| `layout.type` | `grid` | `grid` | — | Always `grid`. |
| `layout.columns` | number | `3` | 1–12 | Number of columns. |
| `layout.rows` | number | `2` | 1–12 | Number of rows. |
| `padding` | number | `0` | 0–64 | Inner padding around the grid. |
| `gap` | number | `0` | 0–64 | Gap between grid cells. |
| `margin` | number | `0` | 0–128 | Inset from container edges. |
| `borderRadius` | number | `0` | 0–200 | Corner radius of the outer container. |
| `bgColor` | hex string | `"#ffffff"` | — | Cell background color (edit mode only). |
| `bgOpacity` | number | `3` | 0–100 | Cell background opacity as a percentage. |
| `borderColor` | hex string | `"#ffffff"` | — | Cell border color (edit mode only). |
| `borderOpacity` | number | `6` | 0–100 | Cell border opacity as a percentage. |

---

### Menu Config

Used when `type: menu`.

```yaml
type: menu
config:
  label: "Bookmarks"
  type: list
  direction: vertical
  padding: 12
  gap: 8
  margin: 0
  borderRadius: 8
  bgColor: "#ffffff"
  bgOpacity: 5
  borderColor: "#ffffff"
  borderOpacity: 10
```

| Field | Type | Default | Range | Description |
|---|---|---|---|---|
| `label` | string | `"Menu"` | — | Heading displayed at the top of the menu. |
| `type` | `list` | `list` | — | Always `list`. |
| `direction` | `vertical` \| `horizontal` | `vertical` | — | Stack direction of child apps. |
| `padding` | number | `12` | 0–64 | Inner padding around the app list. |
| `gap` | number | `8` | 0–64 | Gap between app cards. |
| `margin` | number | `0` | 0–128 | Inset from cell edges. |
| `borderRadius` | number | `8` | 0–48 | Corner radius. |
| `bgColor` | hex string | `"#ffffff"` | — | Background color. |
| `bgOpacity` | number | `5` | 0–100 | Background opacity as a percentage. |
| `borderColor` | hex string | `"#ffffff"` | — | Border color. |
| `borderOpacity` | number | `10` | 0–100 | Border opacity as a percentage. |

---

### App Config

Used when `type: app`.

```yaml
type: app
config:
  title: "Sonarr"
  subtitle: "TV shows"
  tooltip: ""
  logoUrl: "https://example.com/sonarr.png"
  logoView: icon
  url: "https://sonarr.example.com"
  openUrl: true
  ping: true
  pingUrl: ""
  pingInterval: 30
  width: 240
  height: 72
  padding: 16
  margin: 0
  borderRadius: 16
  iconZoom: 1
  iconOffsetX: 0
  iconOffsetY: 0
  feed:
    method: GET
    url: "https://sonarr.example.com/api/v3/queue"
    headers:
      - key: X-Api-Key
        value: "{SONARR_KEY}"
    transform: "body.records.map(r => ({ title: r.title, subtitle: r.status }))"
    pollInterval: 30
    height: 200
```

| Field | Type | Default | Range | Description |
|---|---|---|---|---|
| `title` | string | `"My App"` | — | Primary label on the card. |
| `subtitle` | string | `""` | — | Secondary label below the title. |
| `tooltip` | string | `""` | — | Native hover tooltip text. |
| `logoUrl` | string | `""` | — | Image URL for the icon or cover. Falls back to initials if empty or on load error. |
| `logoView` | `icon` \| `none` \| `full` | `icon` | — | Icon display mode. `icon` shows a square icon beside the text. `none` hides the icon. `full` fills the card with the image. |
| `iconZoom` | number | `1` | 1–3 | Scale multiplier for the cover image. Only applies when `logoView: full`. |
| `iconOffsetX` | number | `0` | -100–100 | Horizontal offset of the cover image as a percentage of card width. Only applies when `logoView: full`. |
| `iconOffsetY` | number | `0` | -100–100 | Vertical offset of the cover image as a percentage of card height. Only applies when `logoView: full`. |
| `url` | string | `""` | — | Destination URL. |
| `openUrl` | boolean | `true` | — | Whether clicking the card opens `url` in a new tab. |
| `ping` | boolean | `false` | — | Whether to show an online status indicator. |
| `pingUrl` | string | `""` | — | URL to check for the status indicator. Defaults to `url` if empty. |
| `pingInterval` | number | `30` | 10–300 | Seconds between status checks. |
| `width` | number | `240` | 160–480 | Card width in pixels. Ignored when the app fills a menu axis. |
| `height` | number | `72` | 48–300 | Header row height in pixels. Ignored when the app fills a menu axis. |
| `padding` | number | `16` | 0–48 | Horizontal inner padding. |
| `margin` | number | `0` | 0–64 | Space between the card and its container. |
| `borderRadius` | number | `16` | 0–48 | Corner radius in pixels. |
| `feed.method` | `none` \| `GET` | `none` | — | `none` shows no feed; `GET` fetches and displays data below the header row. |
| `feed.url` | string | `""` | — | Endpoint URL. Must be `http://` or `https://`. |
| `feed.headers` | array | `[]` | — | List of `{ key, value }` pairs. Use `{KEY_NAME}` in values to inject secrets server-side. |
| `feed.transform` | string | `""` | — | JS expression receiving `body` (parsed JSON). Must return an array or an HTML string. 2-second execution timeout. |
| `feed.pollInterval` | number | `30` | 10–300 | Seconds between polls. Pauses when the tab is hidden. |
| `feed.height` | number | `200` | 80–600 | Height of the feed panel in pixels. Content is clipped; add `overflow-y:auto` in your HTML to scroll. |

---

### Background Config

The `background` key takes one of ten typed configs. All types support optional overlay fields:

| Field | Type | Range | Description |
|---|---|---|---|
| `grain` | number | 0–0.5 | Film grain intensity. `0` disables it. |
| `vignette` | number | 0–1 | Edge vignette intensity. `0` disables it. |

#### solid

```yaml
background:
  type: solid
  color: "#0a0a0a"
```

| Field | Type | Description |
|---|---|---|
| `color` | hex string | Fill color. |

#### gradient

```yaml
background:
  type: gradient
  colors:
    - "#1a1a2e"
    - "#16213e"
    - "#0f3460"
  direction: 160
  animated: false
  speed: 5
```

| Field | Type | Range | Description |
|---|---|---|---|
| `colors` | hex string[] | 2–6 stops | Gradient color stops. |
| `direction` | number | 0–360 | Gradient angle in degrees. |
| `animated` | boolean | — | Whether the gradient animates. |
| `speed` | number | 1–10 | Animation speed. Only used when `animated: true`. |

#### wavy

```yaml
background:
  type: wavy
  baseColor: "#0a192f"
  waveColor: "#172a45"
  speed: 4
  amplitude: 40
  layers: 3
```

| Field | Type | Range | Description |
|---|---|---|---|
| `baseColor` | hex string | — | Background fill color. |
| `waveColor` | hex string | — | Wave color. |
| `speed` | number | 1–10 | Wave animation speed. |
| `amplitude` | number | 10–100 | Wave height in pixels. |
| `layers` | number | 2–5 | Number of wave layers. |

#### aurora

```yaml
background:
  type: aurora
  baseColor: "#000814"
  colors:
    - "#48cae4"
    - "#023e8a"
    - "#7209b7"
  speed: 3
  blur: 90
```

| Field | Type | Range | Description |
|---|---|---|---|
| `baseColor` | hex string | — | Background fill color. |
| `colors` | hex string[] | 2–5 blobs | Blob colors drifting across the background. |
| `speed` | number | 1–10 | Animation speed. |
| `blur` | number | 40–120 | Blur radius of the blobs in pixels. Higher values are softer. |

#### particles

```yaml
background:
  type: particles
  baseColor: "#0a0a0a"
  particleColor: "#4facfe"
  count: 60
  speed: 3
  size: 2
  connected: true
```

| Field | Type | Range | Description |
|---|---|---|---|
| `baseColor` | hex string | — | Background fill color. |
| `particleColor` | hex string | — | Particle dot color. Also used for connection lines. |
| `count` | number | 10–200 | Number of particles. |
| `speed` | number | 1–10 | Particle movement speed. |
| `size` | number | 1–5 | Particle radius in pixels. |
| `connected` | boolean | — | Whether nearby particles are connected by lines. |

#### mesh

```yaml
background:
  type: mesh
  baseColor: "#050510"
  colors:
    - "#7209b7"
    - "#4361ee"
    - "#4cc9f0"
    - "#f72585"
  speed: 3
```

| Field | Type | Range | Description |
|---|---|---|---|
| `baseColor` | hex string | — | Background fill color. |
| `colors` | hex string[] | 3–6 nodes | Node colors used to generate the gradient mesh. |
| `speed` | number | 1–10 | Animation speed of the mesh nodes. |

#### conic

```yaml
background:
  type: conic
  colors:
    - "#ff0000"
    - "#00ff00"
    - "#0000ff"
  speed: 2
  reverse: false
```

| Field | Type | Range | Description |
|---|---|---|---|
| `colors` | hex string[] | 2–8 stops | Conic gradient color stops, distributed evenly. |
| `speed` | number | 1–10 | Rotation speed. |
| `reverse` | boolean | — | Reverse the rotation direction. |

#### plasma

```yaml
background:
  type: plasma
  hueStart: 200
  hueRange: 100
  saturation: 0.85
  speed: 4
  scale: 25
```

| Field | Type | Range | Description |
|---|---|---|---|
| `hueStart` | number | 0–360 | Base hue angle in degrees. |
| `hueRange` | number | 30–360 | How many degrees of the hue wheel the animation spans. |
| `saturation` | number | 0.3–1 | Color saturation. |
| `speed` | number | 1–10 | Animation speed. |
| `scale` | number | 5–40 | Noise scale — lower values produce larger blobs. |

#### bokeh

```yaml
background:
  type: bokeh
  baseColor: "#0a0a0a"
  colors:
    - "#ff6b6b"
    - "#feca57"
    - "#48dbfb"
  count: 15
  speed: 2
  size: 150
```

| Field | Type | Range | Description |
|---|---|---|---|
| `baseColor` | hex string | — | Background fill color. |
| `colors` | hex string[] | 2–6 | Out-of-focus circle colors. |
| `count` | number | 5–25 | Number of bokeh circles. |
| `speed` | number | 1–10 | Drift speed. |
| `size` | number | 50–300 | Maximum circle radius in pixels. |

#### geometric

```yaml
background:
  type: geometric
  baseColor: "#050d14"
  colors:
    - "#0d1b2a"
    - "#1f4068"
    - "#1b6ca8"
    - "#163a5f"
  speed: 3
  cellSize: 100
```

| Field | Type | Range | Description |
|---|---|---|---|
| `baseColor` | hex string | — | Background fill color. |
| `colors` | hex string[] | 2–5 | Triangle palette colors. |
| `speed` | number | 1–10 | Animation speed. |
| `cellSize` | number | 40–200 | Size of the triangulation cells in pixels. Smaller values produce finer detail. |

---

## Full Scene Example

```yaml
background:
  type: aurora
  baseColor: "#000814"
  colors:
    - "#48cae4"
    - "#023e8a"
    - "#7209b7"
  speed: 3
  blur: 90
  grain: 0.15
  vignette: 0.4

widgets:
  # Root layout — fills the canvas
  - id: "lay1"
    type: layout
    x: 0
    y: 0
    config:
      label: "Main"
      layout:
        type: grid
        columns: 2
        rows: 1
      padding: 24
      gap: 16
      margin: 0
      borderRadius: 0
      bgColor: "#ffffff"
      bgOpacity: 3
      borderColor: "#ffffff"
      borderOpacity: 6

  # Menu in cell 0 (left column)
  - id: "menu1"
    type: menu
    parentId: "lay1"
    cellIndex: 0
    x: 0
    y: 0
    config:
      label: "Media"
      type: list
      direction: vertical
      padding: 12
      gap: 8
      margin: 8
      borderRadius: 12
      bgColor: "#ffffff"
      bgOpacity: 5
      borderColor: "#ffffff"
      borderOpacity: 10

  # App inside the menu — with an embedded live feed
  - id: "app1"
    type: app
    parentId: "menu1"
    x: 0
    y: 0
    config:
      title: "Sonarr"
      subtitle: "TV shows"
      tooltip: ""
      logoUrl: "https://example.com/sonarr.png"
      logoView: icon
      url: "https://sonarr.example.com"
      openUrl: true
      ping: true
      pingUrl: ""
      pingInterval: 30
      width: 240
      height: 72
      padding: 16
      margin: 0
      borderRadius: 12
      iconZoom: 1
      iconOffsetX: 0
      iconOffsetY: 0
      feed:
        method: GET
        url: "https://sonarr.example.com/api/v3/queue"
        headers:
          - key: X-Api-Key
            value: "{SONARR_KEY}"
        transform: "body.records.map(r => ({ title: r.title, subtitle: r.status }))"
        pollInterval: 30
        height: 200

  # Floating app — not inside any layout or menu
  - id: "app2"
    type: app
    x: 120
    y: 200
    config:
      title: "GitHub"
      subtitle: ""
      tooltip: ""
      logoView: full
      logoUrl: "https://example.com/github.png"
      iconZoom: 1.2
      iconOffsetX: 0
      iconOffsetY: 0
      url: "https://github.com"
      openUrl: true
      ping: false
      pingUrl: ""
      pingInterval: 30
      width: 200
      height: 120
      padding: 16
      margin: 0
      borderRadius: 16
```

---

## Widget Hierarchy Rules

- A **root layout** has no `parentId`. There can be multiple root layouts; they all fill the full canvas.
- A **sub-layout** has `parentId` pointing to another layout and a `cellIndex` indicating which cell it occupies.
- A **menu** has `parentId` pointing to a layout and a `cellIndex`. Each cell can hold at most one direct child (a sub-layout or a menu).
- An **app inside a menu** has `parentId` pointing to a menu. It does not use `cellIndex`. It may include an optional `feed` config to display live data inline below its header.
- A **floating app** has no `parentId`. Its `x` and `y` position it on the canvas. It may also include a `feed` config.
- `cellIndex` is calculated as `row * columns + column`, zero-based, reading left-to-right, top-to-bottom.
