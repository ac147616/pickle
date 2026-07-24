import { MeResponse } from '@pickle/types';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/contexts/auth-context';
import { apiFetch } from '@/lib/api';

interface MeContextValue {
  me: MeResponse | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

const MeContext = createContext<MeContextValue | undefined>(undefined);

// Separate from AuthProvider (Firebase identity) - this is our own API's
// view of the account, including needsOnboarding, which apps/mobile/src/app
// /_layout.tsx uses to route between (onboarding) and (tabs). Must be
// nested inside AuthProvider.
export function MeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Nothing to fetch, and nothing to reset either - RootNavigator's
    // (tabs)/(onboarding) guards both require a user anyway, so stale `me`
    // data can never leak into a route reachable while signed out.
    if (!user) {
      return;
    }
    // Guards against a stale in-flight request clobbering a newer one if
    // `user` changes again (sign out, then sign in as someone else) before
    // the first fetch resolves. No synchronous setLoading(true) here -
    // `loading` starts true and this only needs to flip it false once the
    // fetch settles (the lint rule below flags any synchronous setState
    // inside an effect body, callback-wrapped calls are fine).
    let cancelled = false;
    apiFetch<MeResponse>('/me')
      .then((result) => {
        if (!cancelled) setMe(result);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Only ever called from onboarding screens' event handlers after a
  // successful org creation / document upload - never from an effect, so
  // this direct setState is fine.
  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      setMe(await apiFetch<MeResponse>('/me'));
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo<MeContextValue>(() => ({ me, loading, refetch }), [me, loading, refetch]);

  return <MeContext.Provider value={value}>{children}</MeContext.Provider>;
}

export function useMe(): MeContextValue {
  const context = useContext(MeContext);
  if (!context) {
    throw new Error('useMe must be used within a MeProvider');
  }
  return context;
}
