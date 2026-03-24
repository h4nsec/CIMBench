import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useSearchStore } from '@/stores/searchStore'
import { useProfileSearch } from '@/hooks/useProfileSearch'

export function ProfileSearchBar() {
  // Mounts the debounced search effect
  useProfileSearch()

  const { query, setQuery } = useSearchStore()

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Search size={15} />
        Search Profiles
      </div>
      <div className="relative">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="e.g. Endpoint, Patient…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="pl-7 text-xs h-8"
        />
      </div>
    </div>
  )
}
