import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export interface ChildLite {
  id: string
  full_name: string
  grade: number
}

interface ChildrenState {
  children: ChildLite[]
  activeId: string | null
  loaded: boolean
  load: (parentId: string) => Promise<void>
  setActive: (id: string) => void
}

export const useChildrenStore = create<ChildrenState>((set, get) => ({
  children: [],
  activeId: null,
  loaded: false,

  async load(parentId) {
    const { data } = await supabase
      .from('children')
      .select('id, full_name, grade')
      .eq('parent_id', parentId)
      .order('created_at', { ascending: true })
    const list = (data ?? []) as ChildLite[]
    set({
      children: list,
      loaded: true,
      activeId: get().activeId && list.some((c) => c.id === get().activeId)
        ? get().activeId
        : list[0]?.id ?? null,
    })
  },

  setActive(id) { set({ activeId: id }) },
}))
