import { useCallback, useMemo, useSyncExternalStore } from "react";

export enum MediaQuery {
  // Match desktop or print, default behavior
  DEFAULT = "screen and (width >= 1024px), print",
  MOBILE = "screen and (width < 1024px)",
}

/**
 * @param query - The media query to use. Defaults to `MediaQuery.DEFAULT`.
 * @param defaultMatches - The default matches returned on the server.
 */
export const useMediaQuery = (query = MediaQuery.DEFAULT, defaultMatches = true) => {
  const getDefaultSnapshot = useCallback(() => defaultMatches, [defaultMatches]);

  const { subscribe, getSnapshot } = useMemo(() => {
    if (typeof window === "undefined") {
      return { subscribe: () => () => {}, getSnapshot: getDefaultSnapshot };
    }

    const mediaQueryList = window.matchMedia(query);

    const _subscribe = (onStoreChange: () => void) => {
      mediaQueryList.addEventListener("change", onStoreChange);
      return () => {
        mediaQueryList.removeEventListener("change", onStoreChange);
      };
    };

    const _getSnapshot = () => mediaQueryList.matches;

    return { subscribe: _subscribe, getSnapshot: _getSnapshot };
  }, [getDefaultSnapshot, query]);

  return useSyncExternalStore(subscribe, getSnapshot, getDefaultSnapshot);
};
