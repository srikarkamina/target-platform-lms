"use client";

import { useState, useEffect } from "react";

let sidebarOpen = false;
const listeners = new Set<(open: boolean) => void>();

export function toggleSidebar() {
  sidebarOpen = !sidebarOpen;
  listeners.forEach((l) => l(sidebarOpen));
}

export function setSidebar(open: boolean) {
  sidebarOpen = open;
  listeners.forEach((l) => l(sidebarOpen));
}

export function useSidebarState() {
  const [open, setOpen] = useState(sidebarOpen);

  useEffect(() => {
    const listener = (newOpen: boolean) => setOpen(newOpen);
    listeners.add(listener);
    
    // Sync initial state
    setOpen(sidebarOpen);

    return () => {
      listeners.delete(listener);
    };
  }, []);

  return open;
}
