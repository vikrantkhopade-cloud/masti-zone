import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Runs an async function and tracks { data, loading, error }.
 * Re-runs when `deps` change; ignores stale responses.
 */
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const callId = useRef(0);

  const run = useCallback(() => {
    const id = ++callId.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.resolve()
      .then(fn)
      .then((data) => { if (id === callId.current) setState({ data, loading: false, error: null }); })
      .catch((error) => { if (id === callId.current) setState({ data: null, loading: false, error }); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { run(); }, [run]);

  return { ...state, reload: run, setData: (data) => setState((s) => ({ ...s, data })) };
}
