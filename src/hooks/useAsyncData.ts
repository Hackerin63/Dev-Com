import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { friendlyError } from '@/utils/errors';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  reload: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Loads data every time the screen gains focus (so admin changes show up) and exposes pull-to-refresh.
 * `loader` should be wrapped in useCallback by the caller.
 */
export function useAsyncData<T>(loader: () => Promise<T>): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasData = useRef(false);

  const run = useCallback(async () => {
    try {
      const result = await loader();
      setData(result);
      hasData.current = true;
      setError(null);
    } catch (e) {
      setError(friendlyError(e));
    }
  }, [loader]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!hasData.current) setLoading(true);
      run().finally(() => {
        if (active) setLoading(false);
      });
      return () => {
        active = false;
      };
    }, [run]),
  );

  const reload = useCallback(async () => {
    setLoading(true);
    await run();
    setLoading(false);
  }, [run]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await run();
    setRefreshing(false);
  }, [run]);

  return { data, loading, refreshing, error, reload, refresh };
}
