import { QueryClient } from '@tanstack/react-query'

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime:           1000 * 60 * 2, // 2 min
        gcTime:              1000 * 60 * 5, // 5 min
        retry:               1,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: 0 },
    },
  })
}
