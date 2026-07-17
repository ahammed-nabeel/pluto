"use client";

import { useState, useCallback } from "react";

type ToastVariant = "default" | "success" | "destructive" | "warning";

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

let toastListeners: ((toasts: Toast[]) => void)[] = [];
let toastList: Toast[] = [];

function notifyListeners() {
  toastListeners.forEach((fn) => fn([...toastList]));
}

export function toast(opts: Omit<Toast, "id">) {
  const id = Math.random().toString(36).slice(2);
  const duration = opts.duration ?? 4000;
  toastList = [{ ...opts, id }, ...toastList].slice(0, 5);
  notifyListeners();
  setTimeout(() => {
    toastList = toastList.filter((t) => t.id !== id);
    notifyListeners();
  }, duration);
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const subscribe = useCallback((fn: (toasts: Toast[]) => void) => {
    toastListeners.push(fn);
    return () => { toastListeners = toastListeners.filter((l) => l !== fn); };
  }, []);

  // Subscribe on mount
  useState(() => {
    const unsub = subscribe(setToasts);
    return unsub;
  });

  const dismiss = useCallback((id: string) => {
    toastList = toastList.filter((t) => t.id !== id);
    notifyListeners();
  }, []);

  return { toasts, dismiss };
}
