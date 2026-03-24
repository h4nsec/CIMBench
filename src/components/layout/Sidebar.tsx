import { Separator } from '@/components/ui/separator'
import { IGLoaderPanel } from '@/components/igLoader/IGLoaderPanel'
import { LoadedIGList } from '@/components/igLoader/LoadedIGList'
import { ProfileSearchBar } from '@/components/search/ProfileSearchBar'
import { ProfileSearchResults } from '@/components/search/ProfileSearchResults'

export function Sidebar() {
  return (
    <aside className="w-64 min-w-64 h-full flex flex-col border-r bg-muted/10 overflow-y-auto">
      {/* Logo */}
      <div className="px-4 py-3 border-b">
        <div className="font-bold text-base tracking-tight">CIMBench</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">
          FHIR IG Intersection Tool
        </div>
      </div>

      <div className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        <IGLoaderPanel />
        <Separator />
        <LoadedIGList />
        <Separator />
        <ProfileSearchBar />
        <ProfileSearchResults />
      </div>
    </aside>
  )
}
