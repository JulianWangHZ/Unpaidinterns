import { createContext, useContext } from 'react';

export interface PipControls {
  available: boolean;
  open: boolean;
  toggle(): void;
}

export const PipContext = createContext<PipControls>({ available: false, open: false, toggle: () => undefined });

export const usePipControls = (): PipControls => useContext(PipContext);
