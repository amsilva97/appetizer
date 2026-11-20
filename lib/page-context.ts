"use client";

import { createContext, useContext } from "react";

/** Name of the dashboard page being shown, so widgets can reference saved config. */
export const PageContext = createContext<string>("");

export function useCurrentPage(): string {
  return useContext(PageContext);
}
