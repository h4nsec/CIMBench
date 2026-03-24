import { X, AlertTriangle, CheckCircle, Circle } from 'lucide-react'
import { cn } from '@/lib/cn'

interface Props {
  onClose: () => void
}

export function DiffHelpPanel({ onClose }: Props) {
  return (
    <div className="absolute inset-y-0 right-0 z-30 w-80 bg-background border-l shadow-xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
        <span className="font-semibold text-sm">How this works</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X size={15} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">

        {/* Overview */}
        <section className="space-y-1.5">
          <h3 className="font-semibold text-sm text-foreground">What am I looking at?</h3>
          <p className="text-muted-foreground leading-relaxed">
            Each <strong className="text-foreground">row</strong> is a data element from the
            FHIR profile you searched for (e.g. <code className="bg-muted px-1 rounded">Endpoint.identifier</code>).
            Each <strong className="text-foreground">column</strong> is one IG you loaded.
            The cell shows how that IG defines the element.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            The goal is to spot which elements every IG agrees on — those become the
            foundation of a new shared profile.
          </p>
        </section>

        {/* Reading a cell */}
        <section className="space-y-2">
          <h3 className="font-semibold text-sm text-foreground">Reading a cell</h3>
          <div className="rounded border bg-muted/30 p-2 space-y-2">

            <div className="flex items-start gap-2">
              <code className="bg-background border rounded px-1.5 py-0.5 font-mono text-[11px] shrink-0">0..1</code>
              <span className="text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Cardinality</strong> — how many times the element may appear.
                <code className="bg-muted px-1 rounded ml-1">0..1</code> means optional, once.
                <code className="bg-muted px-1 rounded ml-1">1..1</code> means required, exactly once.
                <code className="bg-muted px-1 rounded ml-1">0..*</code> means optional, many.
              </span>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded shrink-0">MS</span>
              <span className="text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Must Support</strong> — this IG requires
                implementers to meaningfully handle this element. It's a conformance obligation,
                not just a recommendation.
              </span>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-[9px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded shrink-0">MOD</span>
              <span className="text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Is Modifier</strong> — the element changes
                the meaning of the resource (e.g. <code className="bg-muted px-1 rounded">status=inactive</code>).
                Consuming systems must check modifier elements.
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-muted-foreground">
                <strong className="text-foreground">Binding strength</strong> — how tightly the element is bound to a value set:
              </span>
              <div className="grid grid-cols-2 gap-1 mt-1">
                {[
                  ['required', 'bg-red-100 text-red-700 border-red-200', 'Must use this value set, no exceptions'],
                  ['extensible', 'bg-orange-100 text-orange-700 border-orange-200', 'Use this set; add codes if needed'],
                  ['preferred', 'bg-yellow-100 text-yellow-700 border-yellow-200', 'Recommended but not required'],
                  ['example', 'bg-gray-100 text-gray-600 border-gray-200', 'Just an illustration, any codes OK'],
                ].map(([strength, cls, desc]) => (
                  <div key={strength} className="flex items-start gap-1.5">
                    <span className={cn('text-[9px] px-1 rounded border shrink-0 mt-0.5', cls)}>{strength}</span>
                    <span className="text-muted-foreground text-[10px] leading-tight">{desc}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* Row indicators */}
        <section className="space-y-2">
          <h3 className="font-semibold text-sm text-foreground">Row highlights</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-100 border border-green-300 shrink-0" />
              <span className="text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Green row</strong> — this element is in the
                intersection (common across enough IGs to meet the threshold).
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Circle size={13} className="text-green-600 shrink-0" fill="currentColor" />
              <span className="text-muted-foreground">
                <strong className="text-foreground">Green dot</strong> next to a path name — same as above.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground/40 text-[10px] font-mono shrink-0">—</span>
              <span className="text-muted-foreground">
                <strong className="text-foreground">Dash</strong> — this IG doesn't define this element at all.
              </span>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="space-y-2">
          <h3 className="font-semibold text-sm text-foreground">Toolbar controls</h3>
          <div className="space-y-2.5">

            <div>
              <span className="font-medium text-foreground">MS Only</span>
              <p className="text-muted-foreground mt-0.5 leading-relaxed">
                Hides elements that no IG marks as Must Support. Useful for focusing on
                the elements that implementers are actually required to handle.
              </p>
            </div>

            <div>
              <span className="font-medium text-foreground">Hide / Show Ext.</span>
              <p className="text-muted-foreground mt-0.5 leading-relaxed">
                Toggles extension elements (paths containing <code className="bg-muted px-1 rounded">extension</code>).
                Extensions are IG-specific additions to FHIR and are often too unique to
                include in a shared profile.
              </p>
            </div>

            <div>
              <span className="font-medium text-foreground">Column toggles</span>
              <p className="text-muted-foreground mt-0.5 leading-relaxed">
                Click an IG name to show or hide its column. Struck-through = hidden.
                Useful for comparing a subset of IGs.
              </p>
            </div>

          </div>
        </section>

        {/* Threshold */}
        <section className="space-y-2 rounded-md border bg-muted/30 p-3">
          <h3 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
            <span className="text-primary">⟵</span> Threshold slider
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            Controls the <strong className="text-foreground">minimum coverage</strong> an element
            needs to be included in the intersection result.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            At <strong className="text-foreground">100%</strong> only elements present in
            <em> every single</em> loaded IG are included — the strictest common ground.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            At <strong className="text-foreground">50%</strong> an element only needs to
            appear in half the IGs — gives a broader, more inclusive result.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            A good starting point is <strong className="text-foreground">75–80%</strong>.
            Lower it if you're getting very few results; raise it for stricter consensus.
          </p>
        </section>

        {/* Run Intersection */}
        <section className="space-y-2">
          <h3 className="font-semibold text-sm text-foreground">Run Intersection</h3>
          <p className="text-muted-foreground leading-relaxed">
            Analyses every element across all selected profiles and finds the
            <strong className="text-foreground"> common ground</strong>:
          </p>
          <ul className="text-muted-foreground space-y-1 list-none">
            <li className="flex items-start gap-1.5">
              <span className="text-primary shrink-0">·</span>
              <span><strong className="text-foreground">Cardinality</strong> is merged to the most restrictive overlap
                (highest minimum, lowest maximum).</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-primary shrink-0">·</span>
              <span><strong className="text-foreground">Types</strong> are intersected — only types every IG agrees on are kept.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-primary shrink-0">·</span>
              <span><strong className="text-foreground">Binding</strong> takes the strongest strength found across all IGs.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-primary shrink-0">·</span>
              <span><strong className="text-foreground">Must Support</strong> is set if at least 50% of IGs mark it as MS.</span>
            </li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-1">
            The result populates the <strong className="text-foreground">Intersection tab</strong>
            and can then be exported as FSH or JSON from the <strong className="text-foreground">Generator tab</strong>.
          </p>
        </section>

        {/* Conflicts */}
        <section className="space-y-2 rounded-md border border-orange-200 bg-orange-50/50 p-3">
          <h3 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
            <AlertTriangle size={13} className="text-orange-500" />
            Conflicts
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            A conflict means IGs <strong className="text-foreground">disagree in a way that
            can't be automatically resolved</strong>:
          </p>
          <ul className="text-muted-foreground space-y-1 list-none">
            <li className="flex items-start gap-1.5">
              <AlertTriangle size={11} className="text-orange-500 shrink-0 mt-0.5" />
              <span><strong className="text-foreground">Cardinality conflict</strong> — the merged
                cardinality is impossible. E.g. one IG says <code className="bg-muted px-1 rounded">1..1</code> (required)
                and another says <code className="bg-muted px-1 rounded">0..0</code> (prohibited).</span>
            </li>
            <li className="flex items-start gap-1.5">
              <AlertTriangle size={11} className="text-orange-500 shrink-0 mt-0.5" />
              <span><strong className="text-foreground">Type conflict</strong> — no types are shared
                across all IGs. The element is kept in the result but flagged for manual review.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <AlertTriangle size={11} className="text-orange-500 shrink-0 mt-0.5" />
              <span><strong className="text-foreground">ValueSet conflict</strong> — IGs agree on
                binding strength but point to different value sets. Manual alignment needed.</span>
            </li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-1">
            Conflicting elements are highlighted in red in the Intersection tab and
            annotated with comments in the generated FSH output so you know exactly
            what needs a human decision.
          </p>
        </section>

        {/* Coverage */}
        <section className="space-y-2">
          <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              <div className="w-12 bg-muted rounded-full h-2">
                <div className="h-2 rounded-full bg-green-500 w-full" />
              </div>
            </div>
            Coverage bar
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            Shows how many of your loaded IGs define this element.
            <code className="bg-muted px-1 rounded ml-1">3/5</code> means 3 of 5 IGs include it.
            A full green bar = present in all. Blue = present in most but not all.
          </p>
        </section>

        {/* Workflow */}
        <section className="space-y-2">
          <h3 className="font-semibold text-sm text-foreground">Suggested workflow</h3>
          <ol className="text-muted-foreground space-y-1.5 list-none">
            {[
              ['1', 'Load IGs from the sidebar. Load at least 2 for a useful comparison.'],
              ['2', 'Search for a profile type (e.g. Endpoint, Patient, Practitioner).'],
              ['3', 'Select the profiles you want to compare and click Compare.'],
              ['4', 'Review the Diff Table. Use MS Only to focus on required elements.'],
              ['5', 'Adjust the threshold slider. Start at 75% and tune from there.'],
              ['6', 'Click Run Intersection. Switch to the Intersection tab.'],
              ['7', 'Review conflicts — these need manual decisions before generating.'],
              ['8', 'Switch to the Generator tab, name your profile, and export FSH or JSON.'],
            ].map(([n, text]) => (
              <li key={n} className="flex items-start gap-2">
                <span className="shrink-0 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center font-bold">{n}</span>
                <span>{text}</span>
              </li>
            ))}
          </ol>
        </section>

      </div>
    </div>
  )
}
