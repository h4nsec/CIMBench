# FHIR Implementation Guide (IG) Knowledge Base

## What Is a FHIR IG?

A FHIR Implementation Guide (IG) is a set of rules specifying how FHIR resources should be used to solve a particular interoperability problem. Think of FHIR as a general language and an IG as a domain-specific style guide — same language, specific rules for a context.

Without IGs, "FHIR-compliant" systems can share data structurally but fail semantically. An IG provides a computable, validated contract covering:
- **Validation**: Servers reject data that doesn't conform to profiles
- **Semantic interoperability**: Enforces valid codes, prevents ambiguity
- **Computability**: Machine-processable ImplementationGuide resource for tooling

IGs are published as both human-readable websites and machine-processable NPM packages (`.tgz`).

---

## IG Anatomy — Directory Structure

```
MyIG/
├── .gitignore
├── _genonce.bat / _genonce.sh        # Run IG Publisher once
├── _updatePublisher.bat / .sh        # Download latest publisher.jar
├── ig.ini                            # IG Publisher entry point
├── sushi-config.yaml                 # SUSHI + IG metadata
├── package-list.json                 # Version history
└── input/
    ├── fsh/                          # FSH source files (.fsh)
    ├── pagecontent/                  # Narrative markdown pages
    │   └── index.md                  # Home page
    ├── images/                       # Images, PDFs, etc.
    ├── includes/                     # menu.xml navigation
    ├── ignoreWarnings.txt            # Suppress IG Publisher warnings
    └── profiles/ extensions/         # Optional: hand-authored JSON/XML
        examples/ vocabulary/
```

After SUSHI runs, it produces:
```
fsh-generated/resources/
├── ImplementationGuide-{id}.json
├── StructureDefinition-{id}.json
├── ValueSet-{id}.json
└── ...
```

### Key Configuration Files

**`ig.ini`** — Entry point for IG Publisher:
```ini
[IG]
ig = fsh-generated/resources/ImplementationGuide-fhir.example.json
template = fhir.base.template#current
```

**`sushi-config.yaml`** — Full example:
```yaml
id: hl7.fhir.us.example
canonical: http://hl7.org/fhir/us/example
name: ExampleIG
title: "Example FHIR Implementation Guide"
status: draft
version: 0.1.0
fhirVersion: 4.0.1
copyrightYear: 2024+
releaseLabel: ci-build
license: CC0-1.0
publisher:
  name: Example Organization
  url: https://example.org
  email: fhir@example.org
description: "An example FHIR IG."
dependencies:
  hl7.fhir.us.core: 6.1.0
  hl7.terminology.r4: 5.3.0
pages:
  index.md:
    title: Home
  profiles.md:
    title: Profiles
parameters:
  excludettl: true
  validation: [allow-any-extensions]
menu:
  Home: index.html
  Profiles: profiles.html
  Artifacts: artifacts.html
```

Advanced `sushi-config.yaml` fields:
- `FSHOnly: true` — produce only FHIR JSON, skip full IG generation
- `resources` — customize how specific resources appear (omit, add descriptions)
- `groups` — organize resources into named sections
- `global` — apply profiles globally by resource type
- `instanceOptions` — control ID/profile handling in instances

---

## The Build Toolchain

```
.fsh files + sushi-config.yaml
        ↓ SUSHI
fsh-generated/ (JSON StructureDefinitions, ValueSets, etc.)
        ↓ IG Publisher (+ ig.ini + input/)
output/ (HTML website + package.tgz + validator.pack + full-ig.zip)
```

### Prerequisites

| Tool | Purpose | Install |
|------|---------|---------|
| Java 11+ JDK | IG Publisher runtime | Set `JAVA_HOME` |
| Node.js 18/20/22 | SUSHI runtime | nodejs.org |
| Ruby + Jekyll | Markdown → HTML | Per OS instructions |
| SUSHI | FSH compiler | `npm install -g fsh-sushi` |
| publisher.jar | IG Publisher | Via `_updatePublisher.sh` |

### Build Steps

1. Author FSH in `input/fsh/*.fsh`
2. `sushi build .` — compiles FSH to `fsh-generated/resources/`
3. `java -jar publisher.jar -ig ig.ini` (or run `_genonce.sh`):
   - Loads dependencies from `packages.fhir.org`
   - Calls SUSHI internally (skip with `-no-sushi`)
   - Validates all resources against spec + declared dependencies
   - Calls `tx.fhir.org` for terminology validation
   - Processes markdown pages via Jekyll
   - Generates diff/snapshot views, cross-reference tables, QA report
4. Output lands in `output/`

### IG Publisher CLI Flags

| Flag | Purpose |
|------|---------|
| `-ig [path]` | Path to ig.ini |
| `-tx [url]` | Alternative terminology server |
| `-no-network` | Offline build |
| `-no-sushi` | Skip SUSHI execution |
| `-generation-off` | Skip narrative generation (faster) |
| `-validation-off` | Skip validation (faster) |
| `-watch` | Continuous rebuild on file changes |
| `-go-publish` | Formal publication mode |

### Continuous Integration

The [auto-ig-builder](https://github.com/FHIR/auto-ig-builder) GitHub App triggers automated builds at `https://build.fhir.org/ig/{org}/{repo}` on every commit.

---

## FSH (FHIR Shorthand)

FSH is a domain-specific language for defining FHIR artifacts. Files use `.fsh` extension, ASCII or UTF-8 encoding.

### Core Syntax Rules

- Every rule starts with `*` followed by a space
- Comments: `//` (line), `/* */` (block)
- Whitespace is not significant except inside strings and for indentation (hierarchy in CodeSystems)
- Reserved declaration keywords: `Profile:` `Extension:` `Instance:` `ValueSet:` `CodeSystem:` `RuleSet:` `Invariant:` `Mapping:` `Logical:` `Resource:` `Alias:`
- Metadata keywords: `Parent:` `Id:` `Title:` `Description:` `InstanceOf:` `Usage:` `Source:` `Target:` `Severity:` `Expression:` `XPath:`

### Rule Types

| Rule Type | Syntax | Example |
|-----------|--------|---------|
| Cardinality | `* path min..max` | `* name 1..*` |
| Flag | `* path FLAG` | `* name MS` |
| Binding | `* path from VS (strength)` | `* code from MyVS (required)` |
| Assignment | `* path = value` | `* status = #active` |
| Type constraint | `* path only Type` | `* value[x] only string` |
| Contains (slicing) | `* path contains name min..max` | `* extension contains MyExt 0..1` |
| Obeys (invariant) | `* obeys invariant-id` | `* obeys my-inv` |
| Caret (metadata) | `* ^metadataPath = value` | `* ^status = #draft` |
| Insert (RuleSet) | `* insert RuleSetName` | `* insert CommonMeta` |
| Mapping | `* path -> "target"` | `* name -> "PID-5"` |

### Key Syntax Patterns

| Pattern | Meaning | Example |
|---------|---------|---------|
| `#` | Code literal | `#active` |
| `$` | Alias reference | `$SCT#73211009` |
| `[x]` | Polymorphic element | `value[x]` |
| `[sliceName]` | Slice reference | `component[systolic]` |
| `..` | Cardinality range | `0..1` |
| `^` | Caret (metadata) path | `^status` |
| `MS` | Must Support flag | `* name MS` |
| `SU` | Summary flag | `* id SU` |
| `?!` | Modifier flag | `* status ?!` |

### Flags Reference

| Flag | Meaning |
|------|---------|
| `MS` | Must Support |
| `SU` | Include in Summary (`isSummary`) |
| `TU` | Trial Use |
| `N` | Normative |
| `D` | Draft |
| `?!` | Modifier element |

### Binding Strengths

`required` > `extensible` > `preferred` > `example`

---

## FSH Item Types — Syntax Reference

### Profile

```fsh
Profile: MyPatient
Parent: Patient
Id: my-patient
Title: "My Patient Profile"
Description: "A customized patient profile"

* name 1..* MS
* birthDate 0..1 MS
* gender 1..1
* contact.relationship from ContactRelationshipTypes (required)
* address only Address
* obeys my-patient-invariant
```

### Extension

Simple extension:
```fsh
Extension: PatientReligion
Id: patient-religion
Title: "Patient Religion"
Description: "Religious affiliation"
Context: Patient

* value[x] only CodeableConcept
* value[x] from ReligionValueSet (extensible)
```

Complex (multi-element) extension:
```fsh
Extension: USCoreRaceExtension
Context: Patient
* extension contains
    ombCategory 0..5 MS and
    detailed 0..* and
    text 1..1 MS
* extension[ombCategory].value[x] only Coding
* extension[ombCategory].valueCoding from OmbRaceVS (required)
* extension[text].value[x] only string
```

Reference an extension in a profile:
```fsh
* extension[PatientReligion] 0..1 MS
```

### ValueSet

```fsh
ValueSet: AdministrativeGenderVS
Id: administrative-gender-vs
Title: "Administrative Gender Value Set"
Description: "Codes for administrative gender"

* include codes from system http://hl7.org/fhir/administrative-gender
* exclude http://hl7.org/fhir/administrative-gender#unknown
* include http://snomed.info/sct#33791000087105 "Intersex"
```

Include/exclude rules support: specific codes, entire systems, systems with filters (`where property operator value`), and other value sets (`codes from valueset`).

### CodeSystem

```fsh
CodeSystem: VehicleTypeCS
Id: vehicle-type-cs
Title: "Vehicle Types"

* #car "Automobile" "A four-wheel motorized vehicle"
* #truck "Truck" "A large commercial vehicle"
  * #pickup "Pickup Truck" "Light-duty truck"
  * #semitruck "Semi Truck" "Heavy-duty commercial truck"
```

Indentation creates child/hierarchical concepts.

### Instance

```fsh
Instance: JaneDoePatient
InstanceOf: MyPatient
Title: "Jane Doe Example"
Usage: #example

* id = "jane-doe"
* name.given = "Jane"
* name.family = "Doe"
* birthDate = 1990-05-15
* gender = #female
```

`Usage` values:
- `#example` — included in IG as example resource
- `#definition` — conformance resource (e.g., CapabilityStatement)
- `#inline` — used inside another instance

### Invariant

```fsh
Invariant: valid-name-required
Description: "Either given or family name must be present"
Severity: #error
Expression: "family.exists() or given.exists()"
XPath: "f:given or f:family"
```

Applied via: `* obeys valid-name-required` or `* name obeys valid-name-required`

`Severity`: `#error` or `#warning`. `XPath` is R4 only; R5 uses only `Expression`.

### Mapping

```fsh
Mapping: PatientToHL7v2
Id: hl7v2-mapping
Source: MyPatient
Target: "http://hl7.org/v2"
Title: "HL7 v2 Mapping"

* -> "PID segment"
* name -> "PID-5" "Patient name"
* birthDate -> "PID-7" "Date of birth"
```

### RuleSet

Simple:
```fsh
RuleSet: CommonMetadata
* ^status = #draft
* ^experimental = true
* ^publisher = "Example Organization"
```

Parameterized:
```fsh
RuleSet: SetBindingRule(element, valueSet, strength)
* {element} from {valueSet} ({strength})

// Usage:
* insert SetBindingRule(code, MyCodeVS, required)
```

Insert: `* insert CommonMetadata`

### Aliases

```fsh
Alias: $SCT = http://snomed.info/sct
Alias: $LOINC = http://loinc.org
Alias: $v2-0203 = http://terminology.hl7.org/CodeSystem/v2-0203

// Usage in rules:
* code = $SCT#73211009 "Diabetes mellitus"
```

### Slicing

```fsh
Profile: BloodPressureObservation
Parent: Observation

* component ^slicing.discriminator.type = #pattern
* component ^slicing.discriminator.path = "code"
* component ^slicing.rules = #open
* component contains
    SystolicBP 1..1 MS and
    DiastolicBP 1..1 MS
* component[SystolicBP].code = $LOINC#8480-6
* component[SystolicBP].value[x] only Quantity
* component[DiastolicBP].code = $LOINC#8462-4
* component[DiastolicBP].value[x] only Quantity
```

SUSHI also supports "Ginzu" automatic slicing where discriminators are inferred from slice definitions.

---

## SUSHI — The FSH Compiler

SUSHI (SUSHI Unshortens SHorthand Inputs) is the reference FSH compiler, written in TypeScript.

### Installation & CLI

```bash
npm install -g fsh-sushi

sushi build [dir]              # Compile FSH (default)
sushi init                     # Scaffold new IG project
sushi update-dependencies      # Update dependencies to latest
sushi --version
```

### Build Flags

| Flag | Purpose |
|------|---------|
| `-l, --log-level` | error / warn / info (default) / debug |
| `-o, --out` | Output folder (default: `fsh-generated`) |
| `-s, --snapshot` | Generate StructureDefinition snapshot |
| `-p, --preprocessed` | Output `_preprocessed/` folder |
| `-r, --require-latest` | Fail if not on latest SUSHI |
| `-c, --config` | Override config values, e.g., `status:active` |

Example: `sushi build . --config status:active --snapshot`

### Output

SUSHI writes `{ResourceType}-{resourceId}.json` to `fsh-generated/resources/`. Generates differential only by default (use `-s` for snapshot, or let IG Publisher handle it).

---

## GoFSH — The FSH Decompiler

GoFSH converts existing FHIR JSON/XML artifacts back into FSH. Useful for:
- Migrating existing JSON-based IGs to FSH
- Understanding existing profiles

```bash
npm install -g gofsh
gofsh input/ -o output/
```

Supports R4, R4B, R5, R6. Enables lossless round-tripping: JSON → FSH (GoFSH) → JSON (SUSHI).

---

## FHIR Package Ecosystem

### Package Structure

A FHIR package is a `.tgz` tarball:
```
package/
├── package.json          # NPM-compatible manifest
├── .index.json           # Resource index for quick lookup
├── ImplementationGuide-{id}.json
├── StructureDefinition-{id}.json
└── ...
examples/
├── .index.json
└── Patient-example.json
```

### `package.json` Key Fields

```json
{
  "name": "hl7.fhir.us.core",
  "version": "6.1.0",
  "canonical": "http://hl7.org/fhir/us/core",
  "fhirVersions": ["4.0.1"],
  "type": "IG",
  "license": "CC0-1.0",
  "dependencies": {
    "hl7.fhir.r4.core": "4.0.1",
    "hl7.terminology.r4": "5.3.0"
  }
}
```

### Version Constraints

- Only `x` is supported as a wildcard (e.g., `4.0.x` = highest `4.0.*`)
- Full npm semver ranges are NOT supported
- Packages can only depend on same FHIR version packages

### Registries

| Registry | URL |
|---------|-----|
| Primary | https://packages.fhir.org |
| Backup | https://packages2.fhir.org |
| Simplifier | https://packages.simplifier.net |
| CI Builds | https://build.fhir.org/ig/{org}/{repo}/package.tgz |

### Core Package Families

| Package | Contents |
|---------|----------|
| `hl7.fhir.r4.core` | Base R4 resources |
| `hl7.fhir.r4.examples` | All R4 spec examples |
| `hl7.fhir.r4.expansions` | Pre-expanded value sets |
| `hl7.terminology.r4` | Shared terminology (LOINC, SNOMED bindings) |
| `hl7.fhir.uv.extensions` | Standard FHIR extensions |

### Local Package Cache

Tools share: `~/.fhir/packages/` (Unix) or `%USERPROFILE%\.fhir\packages\` (Windows).

---

## Key Conformance Resources

### StructureDefinition (Profiles & Extensions)

The backbone of any IG. Constrains or extends a FHIR resource/datatype.

Key limits:
- Cannot loosen cardinality beyond the base spec
- Cannot add new element names to base resources
- Cannot set default values for base spec elements

Contains:
- `differential` — only the changes from parent (what SUSHI generates)
- `snapshot` — complete flattened element list (generated by IG Publisher or SUSHI `-s`)

### CapabilityStatement

Declares server/client capabilities. References:
- `rest.resource.profile` — profiles resources must conform to
- `rest.resource.supportedProfile` — additional profiles
- `rest.resource.searchParam.definition` — SearchParameters
- `rest.resource.operation.definition` — OperationDefinitions

### OperationDefinition

Custom operations invoked with `$operationName`. Defines: code, scope (system/type/instance), in/out parameters, idempotency.

### SearchParameter

Custom search capabilities beyond base FHIR. Defines: code, base resource(s), type (number/date/string/token/reference/composite/quantity/uri/special), FHIRPath expression, comparators, modifiers.

### Terminology Resources

| Resource | Purpose |
|---------|---------|
| ValueSet | Curated set of coded values (intensional or extensional) |
| CodeSystem | Defines codes and meanings |
| ConceptMap | Maps concepts between code systems |
| NamingSystem | Documents identity of a code/identifier system |

### Other Resources

| Resource | Purpose |
|---------|---------|
| MessageDefinition | Messaging interactions |
| GraphDefinition | Resource graph traversal |
| StructureMap | Transforms between structures (FHIR Mapping Language) |
| ExampleScenario | Example interaction scenarios |

---

## FHIR Versions

| Feature | R4 (4.0.1) | R4B (4.3.0) | R5 (5.0.0) |
|---------|-----------|------------|-----------|
| Release year | 2019 | 2022 | 2023 |
| Type | Normative | STU | STU |
| Subscription model | Search-based | SubscriptionTopic | SubscriptionTopic (mature) |
| US regulatory | Required (Cures Act) | Not compliant | Not compliant |
| Breaking changes from R4 | Baseline | Minimal | Significant (4000+) |

### Which Version to Target?

- **US Market**: Must use R4 (4.0.1) — mandated by 21st Century Cures Act / ONC
- **Regulatory/Pharma**: R4B for medication definition resources
- **Subscriptions in R4**: Use the R5 Subscription Backport IG as dependency
- **International greenfield**: R4 for ecosystem support, R5 for future-proofing

Note: R4B IGs cannot depend on R4 IGs and vice versa.

### Multi-version in SUSHI

```yaml
fhirVersion:
  - 4.0.1
  - 4.3.0
```

---

## Validation

### Validation Methods

**1. HL7 FHIR Validator CLI (official)**
```bash
java -jar validator_cli.jar resource.json \
  -version 4.0.1 \
  -ig hl7.fhir.us.core#6.1.0
```
Web UI: https://validator.fhir.org/

**2. FHIR `$validate` Operation**
```
POST [base]/Patient/$validate?profile=http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient
```
Returns `OperationOutcome` with issues by severity.

**3. HAPI FHIR Instance Validator** — Java SDK for server-side pipelines

**4. Firely Terminal CLI**
```bash
fhir validate resource.json --scope hl7.fhir.us.core@6.1.0
```

**5. Simplifier.net Playground** — Online paste-and-check

### Validation Checks

- Structure (all content described by spec)
- Cardinality (correct min/max)
- Value domains (correct types)
- Terminology bindings (valid codes)
- Invariants (FHIRPath constraints)
- Profile rules (all constraints)

### Performance Note

Full validation with terminology is expensive. IG Publisher caches terminology lookups in `input-cache/txcache/`. Consider selective validation in high-throughput production.

---

## Other Authoring Tools

### Forge (Firely)

Windows desktop GUI for visual profile authoring. Supports StructureDefinition, OperationDefinition, SearchParameter. Syncs with Simplifier.net. Best for clinical modelers preferring visual tools. Does not cover ValueSet, CodeSystem, CapabilityStatement, or IG orchestration.

### Simplifier.net

Web platform: online editor (XML/JSON/FSH), project management, package publishing, validation playground, IG rendering/hosting, CI/CD integration.

### Trifolia-on-FHIR (Lantana)

Browser-based IG authoring, no installation required. Form-based guided interface. Exports IG Publisher-compatible conformance resources.

---

## IG Registries & Publication

### HL7 FHIR IG Registry

- URL: http://fhir.org/guides/registry/
- Source: https://github.com/FHIR/ig-registry (`fhir-ig-list.json`)
- Register via pull request — open to all, not HL7-exclusive

### Registration Steps

1. Fork https://github.com/FHIR/ig-registry
2. Edit `fhir-ig-list.json` — add entry with `url`, `package`, `fhir-version`, `ig-version`, `history`, `ci-build`
3. Submit pull request

### URL Conventions

| Context | Pattern |
|---------|---------|
| HL7 IGs | `http://hl7.org/fhir/{realm}/{code}/` |
| CI builds | `https://build.fhir.org/ig/{org}/{repo}/` |
| IHE profiles | `https://profiles.ihe.net/...` |

### Formal Publication (IG Publisher)

```bash
java -jar publisher.jar -go-publish \
  -source /path/to/my-ig \
  -web /path/to/webroot \
  -history /path/to/ig-history \
  -registry /path/to/ig-registry/fhir-ig-list.json
```

Produces versioned publication at `{webroot}/{org}/{code}/{version}/`.

### Notable Public IGs

| IG | Package | Notes |
|----|---------|-------|
| US Core | `hl7.fhir.us.core` | US national base IG (ONC required) |
| International Patient Summary | `hl7.fhir.uv.ips` | International standard |
| SMART App Launch | `hl7.fhir.uv.smart-app-launch` | OAuth2/SMART authorization |
| Bulk Data Access | `hl7.fhir.uv.bulkdata` | FHIR bulk export |
| Structured Data Capture | `hl7.fhir.uv.sdc` | Questionnaire/forms |
| mCODE | `hl7.fhir.us.mcode` | Minimal cancer data |
| Da Vinci PDex | `hl7.fhir.us.davinci-pdex` | Payer data exchange |

---

## Quick Reference — Important URLs

| Resource | URL |
|---------|-----|
| FSH Language Reference | https://build.fhir.org/ig/HL7/fhir-shorthand/reference.html |
| FSH Quick Reference PDF | http://hl7.org/fhir/uv/shorthand/FSHQuickReference.pdf |
| FSH School (tutorials) | https://fshschool.org |
| SUSHI GitHub | https://github.com/FHIR/sushi |
| GoFSH GitHub | https://github.com/FHIR/GoFSH |
| IG Publisher GitHub | https://github.com/HL7/fhir-ig-publisher |
| IG Publisher Docs | https://confluence.hl7.org/display/FHIR/IG+Publisher+Documentation |
| Package Registry | https://packages.fhir.org |
| IG Registry | https://fhir.org/guides/registry/ |
| FHIR Validator | https://validator.fhir.org/ |
| CI Auto-Builder | https://github.com/FHIR/auto-ig-builder |
| CI Build Output | https://build.fhir.org/ig/ |
| Simplifier.net | https://simplifier.net |
| NPM Package Spec | https://confluence.hl7.org/display/FHIR/NPM+Package+Specification |
