import type { BindingStrength } from '@/types/fhir'

const STRENGTH_RANK: Record<BindingStrength, number> = {
  example: 0,
  preferred: 1,
  extensible: 2,
  required: 3,
}

export function strengthRank(s: BindingStrength): number {
  return STRENGTH_RANK[s] ?? 0
}

export function strongerStrength(a: BindingStrength, b: BindingStrength): BindingStrength {
  return strengthRank(a) >= strengthRank(b) ? a : b
}

export function strongestStrength(values: BindingStrength[]): BindingStrength {
  return values.reduce(strongerStrength, 'example')
}

export function strengthLabel(s: BindingStrength): string {
  const labels: Record<BindingStrength, string> = {
    required: 'Required',
    extensible: 'Extensible',
    preferred: 'Preferred',
    example: 'Example',
  }
  return labels[s] ?? s
}

export function strengthColor(s: BindingStrength): string {
  const colors: Record<BindingStrength, string> = {
    required: 'bg-red-100 text-red-800',
    extensible: 'bg-orange-100 text-orange-800',
    preferred: 'bg-yellow-100 text-yellow-800',
    example: 'bg-gray-100 text-gray-600',
  }
  return colors[s] ?? 'bg-gray-100 text-gray-600'
}
