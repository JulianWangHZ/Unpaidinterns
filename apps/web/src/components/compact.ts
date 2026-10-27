import { createContext, useContext } from 'react';

/** True inside the picture-in-picture window (or the ?pip=1 preview): views drop their own chrome. */
export const CompactContext = createContext(false);
export const useCompact = (): boolean => useContext(CompactContext);
