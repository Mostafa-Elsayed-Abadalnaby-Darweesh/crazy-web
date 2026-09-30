# Virtual Lab

**Virtual Lab** is an interactive web application for running virtual **chemistry** and **physics** experiments. Students, teachers and researchers drag laboratory equipment, chemicals and physics components onto a workbench, run simulations, record measurements, analyse data and generate professional PDF reports.

> ⚠️ Virtual Lab is an **educational simulation**. Reactions, hazards and safety advice are modelled for learning only. Never attempt hazardous experiments outside a properly supervised laboratory.

## Features

| Area | What you get |
| --- | --- |
| **Workspace** | Konva canvas with drag-and-drop (dnd-kit ghost preview + highlighted drop targets), zoom, pan (Space + drag), grid, snap-to-grid, rulers, smart alignment guides, multi-select (Shift / marquee), undo/redo, copy/paste/duplicate, rotate/resize handles, group, lock, context menus and keyboard shortcuts. Chemistry (bench) and Physics lab modes. |
| **Library** | ~75 components: glassware, transfer tools, heating & mixing, instruments, electrochemistry, electricity, mechanics, optics and thermodynamics. 60+ chemicals filterable by class (acids, bases, salts, metals, indicators, solvents, gases…) and the full 118-element periodic table with electron configurations and common reactions. |
| **Chemistry engine** | Mixtures tracked in moles. Declarative reaction rules (neutralisation, precipitation, displacement, gas evolution, catalysis, redox) with stoichiometry, kinetics (concentration & temperature dependent), enthalpy → temperature change, pH (strong/weak acids & bases, buffers), indicator colours, precipitates, bubbles, heating, boiling, evaporation, pouring and titration via burette. |
| **Physics engine** | Nodal-analysis circuit solver (batteries, supplies incl. AC, resistors, rheostats, capacitors, inductors, diodes/LEDs, switches, bulbs, motors, meters, oscilloscope). Mechanics: blocks with friction, inclined planes, Atwood pulley, springs (Hooke's law), pendulums, free fall. Ray-traced optics: lasers, light sources, thin lenses, mirrors, prisms with dispersion, glass blocks, screens, with focal/image/object distance and incidence/refraction angle readings. Thermodynamics: heaters, calorimeter, ideal-gas chamber, sensors. |
| **Measurement & data** | Live instrument readings, manual capture, automatic data logging, editable/sortable/filterable data table, CSV export. |
| **Charts** | Line, bar, scatter and area charts (Recharts) with selectable X/Y axes and multiple datasets, updating live; linear-regression fits. |
| **Timeline & recording** | Every action, reaction, observation, measurement and safety warning is timestamped. Record a session and replay it step by step. |
| **Notebook & reports** | 15-section lab notebook (auto-fill from the experiment). Academic report with snapshot, tables, charts, calculations; customise institution, logo, student, course and instructor; print or download PDF (React-PDF, embedded DejaVu fonts for chemical formulae). |
| **Safety** | Safe / Caution / Danger levels, hazardous-combination warnings (e.g. bleach + acid → toxic chlorine), PPE recommendations. |
| **Templates** | 17 ready-made experiments: titration, reaction rate, pH, electrolysis, salt preparation, precipitation, gas preparation, calorimetry, Ohm's law, Hooke's law, pendulum, Newton's 2nd law, series/parallel circuits, lens, refraction, free fall. |

## Pages

`/` landing · `/dashboard` · `/lab` (workspace, `?template=<id>` / `?mode=physics`) · `/lab/[id]` · `/templates` · `/experiments` (history) · `/saved` · `/reports` · `/reports/[id]` · `/data` (data & charts) · `/settings` · `/help`

## Tech stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Zustand · dnd-kit · Konva / react-konva · Recharts · @react-pdf/renderer · Prisma + PostgreSQL (optional)

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

Experiments are stored in the browser (localStorage) by default. To enable server persistence, copy `.env.example` to `.env`, set `DATABASE_URL` to a PostgreSQL database, run `npm run db:push`, and turn on **Cloud sync** in Settings. The REST API lives at `/api/experiments` and `/api/experiments/[id]` (`GET`, `POST`, `PUT`, `DELETE`); `/api/health` reports database status.

## Architecture

Nothing about individual experiments is hard-coded — the engine is data-driven:

```
src/lib/engine/        core types, component registry, factory, simulation stepper, safety rules, geometry
src/lib/catalog/       component definitions (chemistry, electricity, mechanics, optics, thermo)
src/lib/chemistry/     chemicals database, reaction rules, mixture engine (pH, colour, kinetics), indicators, periodic table
src/lib/physics/       circuit solver (nodal analysis), optics ray tracer
src/lib/templates/     experiment templates (pure data)
src/lib/report/        notebook auto-fill, report model, statistics, chart rasterisation
src/store/             Zustand stores (lab workspace, settings)
src/components/lab/    workspace UI: library, canvas + renderers, properties, bottom panels
prisma/schema.prisma   Experiment stored as structured JSON
```

Every object on the bench is a JSON `LabComponent`:

```json
{ "id": "beaker-x1y2z3", "type": "beaker", "category": "chemistry", "name": "Beaker 01",
  "position": { "x": 400, "y": 250 }, "rotation": 0, "dimensions": { "width": 90, "height": 110 },
  "properties": { "capacity": 250 }, "connections": [], "state": { "mixture": { "volumeMl": 50, "temperature": 25, "species": { "hcl": 0.05 } } } }
```

Behaviour lives in a `ComponentDefinition` registered once (`registerComponent`): property schema (drives the properties panel), terminals + circuit model (drives the solver), `readings` (drives measurements/data logging), `simulate` (per-tick behaviour), `actions`, and a renderer archetype. Adding a new instrument, reaction (`REACTIONS`), chemical (`CHEMICALS`) or template (`TEMPLATES`) requires no changes to the core engine, canvas or persistence.

---

Made by **Mostafa Elsayed**
