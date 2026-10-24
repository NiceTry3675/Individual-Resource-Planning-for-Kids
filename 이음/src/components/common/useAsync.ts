import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { getStoreVersion, subscribeStore } from '../../api/ieum';

export type AsyncState<T> = { status: 'loading' } | { status: 'error' } | { status: 'ok'; data: T };

export function useAsync<T>(load: () => Promise<T>, deps: unknown[] = []) {
  const version = useSyncExternalStore(subscribeStore, getStoreVersion);
  const [tick, setTick] = useState(0);
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' });
  const depKey = JSON.stringify(deps);
  const lastKey = useRef(depKey);

  useEffect(() => {
    let live = true;
    if (lastKey.current !== depKey) {
      lastKey.current = depKey;
      setState({ status: 'loading' });
    }
    load()
      .then((data) => {
        if (live) setState({ status: 'ok', data });
      })
      .catch(() => {
        if (live) setState({ status: 'error' });
      });
    return () => {
      live = false;
    };
  }, [version, tick, depKey]);

  const retry = () => {
    setState({ status: 'loading' });
    setTick((t) => t + 1);
  };

  return { state, retry };
}
