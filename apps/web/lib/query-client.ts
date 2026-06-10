'use client'

import { makeQueryClient } from '@edunest/cache'
import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export { makeQueryClient }

/** React hook — creates a stable QueryClient per component tree. */
export function useQueryClientInstance(): QueryClient {
  const [client] = useState(() => makeQueryClient())
  return client
}
