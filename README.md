# CIMBench

**Clinical Information Model Benchmark** — a browser-based tool for comparing FHIR Implementation Guides, finding the common ground between them, and generating a foundational profile from the consensus.

---

## What it does

When multiple countries or organisations publish FHIR Implementation Guides covering the same clinical concepts (e.g. `Endpoint`, `Patient`, `Practitioner`), their profiles inevitably differ in cardinality, bindings, and Must Support flags. CIMBench automates the comparison:

1. **Load** any number of FHIR packages from `packages.fhir.org`, `packages2.fhir.org`, or any `build.fhir.org` CI build URL
2. **Search** for a profile type across all loaded IGs simultaneously
3. **Diff** — a side-by-side table showing every element, how each IG defines it, and where they agree or diverge
4. **Intersect** — finds the consensus cardinality, types, bindings, and Must Support flags at a configurable coverage threshold
5. **Generate** — exports the intersection as a valid FHIR profile in FSH (FHIR Shorthand) or raw JSON `StructureDefinition`

---

## Use case example

> I want to know what elements are common to the `Endpoint` profile across US Core, AU Core, AU Base, IPS, and NL Core so I can define a minimal interoperable baseline.

- Load `hl7.fhir.us.core`, `hl7.fhir.au.core`, `hl7.fhir.au.base`, `hl7.fhir.uv.ips`, `nictiz.fhir.nl.r4.nl-core`
- Search **Endpoint**, select all matches, click **Compare**
- Review the diff table — green rows are already in the intersection
- Adjust the threshold slider (e.g. 75% = element must appear in at least 3 of 4 IGs)
- Click **Run Intersection** → review conflicts → **Generate Profile**
- Export `EndpointBase.fsh` ready to drop into a SUSHI project

---

## Features

| Feature | Detail |
|---|---|
| **IG Browser** | Browse curated popular IGs by realm (🌍 🇺🇸 🇦🇺 🇳🇱 🇨🇦 🇩🇪), search `packages.fhir.org`, or browse `build.fhir.org` CI builds |
| **Direct URL loading** | Paste any `build.fhir.org/ig/…` URL — the app fetches `package.tgz` automatically |
| **In-browser extraction** | No server required — `.tgz` packages are decompressed and parsed entirely in the browser using `fflate` |
| **Snapshot synthesis** | Packages without snapshots have their differentials resolved against their parent chain automatically |
| **Virtualised diff table** | Handles hundreds of elements without layout issues |
| **Threshold control** | Tune coverage from 50% (broad consensus) to 100% (strict — every IG must include it) |
| **Conflict detection** | Cardinality, type, and ValueSet conflicts are flagged with explanations |
| **FSH output** | Generated profiles include aliases, cardinality rules, type constraints, bindings, MS flags, and conflict annotations |
| **JSON output** | Valid FHIR `StructureDefinition` with differential elements, ready for tooling |
| **Built-in help** | `?` button in the diff toolbar opens a plain-language guide explaining every concept |

---

## Getting started

### Prerequisites

- Node.js 18+
- npm 9+

### Install and run

```bash
git clone https://github.com/your-org/cimbench.git
cd cimbench
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Build for production

```bash
npm run build
# Output is in /dist — deploy as a static site
```

---

## Loading packages

### From the registry (packages.fhir.org)

Enter the package ID and version in the sidebar, or click **Browse** to search the registry:

```
Package ID:  hl7.fhir.us.core
Version:     7.0.0
```

### From a CI build (build.fhir.org)

Paste a build page URL into the **Load from URL** field — the app appends `/package.tgz` automatically:

```
https://build.fhir.org/ig/HL7/fhir-us-ndh/
https://build.fhir.org/ig/HL7/US-Core/
```

### Quick-load presets

| Label | Package ID | Version |
|---|---|---|
| US Core 7.0.0 | `hl7.fhir.us.core` | `7.0.0` |
| US Core 6.1.0 | `hl7.fhir.us.core` | `6.1.0` |
| AU Base 6.0.0 | `hl7.fhir.au.base` | `6.0.0` |
| AU Core 1.0.0 | `hl7.fhir.au.core` | `1.0.0` |
| IPS 1.1.0 | `hl7.fhir.uv.ips` | `1.1.0` |
| CA Baseline 1.2.0 | `hl7.fhir.ca.baseline` | `1.2.0` |
| NL Core 0.10.0 | `nictiz.fhir.nl.r4.nl-core` | `0.10.0` |

---

## Understanding the diff table

Click the **`?`** button at the top-right of the diff toolbar for an in-app guide. Quick reference:

| Element | Meaning |
|---|---|
| `0..1` | Optional, at most once |
| `1..1` | Required, exactly once |
| `0..*` | Optional, unbounded |
| **MS** badge | Must Support — implementers must handle this element |
| **MOD** badge | Is Modifier — changes resource meaning |
| `required` binding | Must use this value set, no exceptions |
| `extensible` binding | Use this set; add codes only if needed |
| Green row | Element is in the intersection result |
| ⚠️ orange triangle | Conflict — needs manual resolution |
| Coverage bar `3/5` | Present in 3 of 5 loaded IGs |

---

## Architecture

```
src/
├── components/
│   ├── diff/           # Diff table, toolbar, help panel, cell renderer
│   ├── generator/      # FSH / JSON profile output
│   ├── igLoader/       # Package loader panel, IG browser modal
│   ├── intersection/   # Consensus elements table
│   ├── layout/         # Sidebar + main pane shell
│   ├── search/         # Profile search bar + results list
│   └── ui/             # Radix UI + Tailwind primitives
├── hooks/
│   ├── useIntersection.ts      # Run diff, intersection, generate
│   ├── usePackageLoader.ts     # Fetch + parse packages (incl. URL-based)
│   └── useProfileSearch.ts     # Debounced profile search
├── services/
│   ├── packageRegistry.ts      # packages.fhir.org API + URL fetch
│   ├── igParser.ts             # TAR extraction → StructureDefinition parse
│   ├── tarExtractor.ts         # fflate gzip + TAR header parser
│   ├── snapshotSynthesizer.ts  # Differential → snapshot resolution
│   ├── intersectionEngine.ts   # Consensus algorithm
│   ├── fshGenerator.ts         # FSH + JSON StructureDefinition output
│   └── profileAnalyzer.ts      # Search scoring + diff table builder
├── stores/                     # Zustand state (IGs, diff, intersection, search)
└── types/                      # FHIR, IG, diff, intersection, generator types
```

### Key technical decisions

- **No backend** — all package fetching, TAR extraction, and FHIR parsing runs in the browser. The Vite dev server provides a CORS proxy for local development.
- **fflate** for in-browser gzip decompression (much smaller than zlib alternatives)
- **TanStack Virtual** for virtualised table rendering — handles large profiles without DOM bloat
- **Zustand** for state — simple, no boilerplate, works well with async package loading
- **Snapshot synthesis** — many packages ship differential-only profiles; the app walks the parent chain (`baseDefinition`) to reconstruct a full element list for accurate comparison

---

## Tech stack

| Tool | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | 5.8 | Type safety |
| Vite | 6 | Build tool + dev server |
| Tailwind CSS | 3 | Styling |
| Radix UI | latest | Accessible UI primitives |
| Zustand | 5 | State management |
| TanStack Virtual | 3 | Virtualised list / table |
| fflate | 0.8 | In-browser gzip decompression |
| Lucide React | latest | Icons |
| react-hot-toast | 2 | Notifications |

---

## FHIR concepts glossary

| Term | Meaning |
|---|---|
| **IG** | Implementation Guide — a set of rules and profiles built on top of base FHIR |
| **Profile** | A `StructureDefinition` that constrains a base FHIR resource for a specific use case |
| **Differential** | Only the changes from the parent resource/profile |
| **Snapshot** | The complete element list including inherited elements |
| **FSH** | FHIR Shorthand — a human-readable language for authoring FHIR profiles, compiled by SUSHI |
| **SUSHI** | The FSH compiler that turns `.fsh` files into FHIR JSON |
| **Must Support** | A conformance flag indicating implementers must be able to store and return this element |
| **Cardinality** | Min..Max occurrences of an element (`0..1`, `1..*`, etc.) |
| **Binding** | A link between an element and a value set, with a strength (required / extensible / preferred / example) |
| **CIM** | Clinical Information Model — an abstract model of clinical data, which FHIR profiles can realise |

---

## Roadmap

- [ ] Persist loaded IGs to `IndexedDB` (survive page refresh)
- [ ] Multi-version comparison (same IG, different versions)
- [ ] Export intersection as a complete SUSHI project (with `sushi-config.yaml`)
- [ ] Side-by-side element detail view (click a cell to see full `ElementDefinition`)
- [ ] Support R5 profiles
- [ ] Shareable URL state (encode loaded IGs + search query in URL hash)

---

## Contributing

Pull requests welcome. Please open an issue first for any significant changes.

---

## Licence

MIT
