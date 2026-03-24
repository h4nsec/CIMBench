import { create } from 'zustand'
import type { LoadedIG, LoadProgress } from '@/types/ig'

interface IGState {
  igs: Record<string, LoadedIG>                    // key = "packageId#version"
  loadingProgress: Record<string, LoadProgress>

  addIG: (ig: LoadedIG) => void
  updateIGStatus: (key: string, partial: Partial<LoadedIG>) => void
  setProgress: (key: string, progress: LoadProgress) => void
  removeIG: (key: string) => void
  getIG: (key: string) => LoadedIG | undefined
  getAllIGs: () => LoadedIG[]
  getReadyIGs: () => LoadedIG[]
}

export const useIGStore = create<IGState>((set, get) => ({
  igs: {},
  loadingProgress: {},

  addIG: (ig) =>
    set(state => ({
      igs: { ...state.igs, [ig.displayName]: ig },
    })),

  updateIGStatus: (key, partial) =>
    set(state => ({
      igs: state.igs[key]
        ? { ...state.igs, [key]: { ...state.igs[key], ...partial } }
        : state.igs,
    })),

  setProgress: (key, progress) =>
    set(state => ({
      loadingProgress: { ...state.loadingProgress, [key]: progress },
    })),

  removeIG: (key) =>
    set(state => {
      const { [key]: _, ...rest } = state.igs
      const { [key]: __, ...restProgress } = state.loadingProgress
      return { igs: rest, loadingProgress: restProgress }
    }),

  getIG: (key) => get().igs[key],

  getAllIGs: () => Object.values(get().igs),

  getReadyIGs: () => Object.values(get().igs).filter(ig => ig.status === 'ready'),
}))
