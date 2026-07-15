"use client";

import { useCallback, useReducer, type SetStateAction } from "react";
import type { WebsiteJSON } from "@/types/website";

export type HistoryActionSource = "manual" | "ai" | "system";
export type HistoryEntry = { value: WebsiteJSON; label: string; source: HistoryActionSource; createdAt: number };
export type WebsiteHistoryState = { past: HistoryEntry[]; present: HistoryEntry; future: HistoryEntry[]; group: string | null; groupedAt: number };
export type WebsiteHistoryOptions = { maxHistory?: number; groupWindowMs?: number };
export type SetWebsiteOptions = { label?: string; source?: HistoryActionSource; group?: string };
export type WebsiteHistoryAction =
  | { type: "commit"; value: SetStateAction<WebsiteJSON>; options: SetWebsiteOptions; now: number; maxHistory: number; groupWindowMs: number }
  | { type: "reset"; value: WebsiteJSON; label: string; source: HistoryActionSource; now: number }
  | { type: "clear" }
  | { type: "undo" }
  | { type: "redo"; maxHistory: number };

const DEFAULT_MAX_HISTORY = 100;
const DEFAULT_GROUP_WINDOW_MS = 1200;

function structurallyEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (typeof left !== typeof right || left === null || right === null) return false;
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
    return left.every((value, index) => structurallyEqual(value, right[index]));
  }
  if (typeof left !== "object" || typeof right !== "object") return false;
  const leftRecord = left as Record<string, unknown>;
  const rightRecord = right as Record<string, unknown>;
  const leftKeys = Object.keys(leftRecord);
  const rightKeys = Object.keys(rightRecord);
  return leftKeys.length === rightKeys.length && leftKeys.every((key) => Object.prototype.hasOwnProperty.call(rightRecord, key) && structurallyEqual(leftRecord[key], rightRecord[key]));
}

export function createHistoryEntry(value: WebsiteJSON, label = "Initial state", source: HistoryActionSource = "system", createdAt = Date.now()): HistoryEntry {
  return { value, label, source, createdAt };
}

export function websiteHistoryReducer(state: WebsiteHistoryState, action: WebsiteHistoryAction): WebsiteHistoryState {
  if (action.type === "reset") return { past: [], present: createHistoryEntry(action.value, action.label, action.source, action.now), future: [], group: null, groupedAt: 0 };
  if (action.type === "clear") return { ...state, past: [], future: [], group: null, groupedAt: 0 };
  if (action.type === "undo") {
    const previous = state.past.at(-1);
    return previous ? { past: state.past.slice(0, -1), present: previous, future: [state.present, ...state.future], group: null, groupedAt: 0 } : state;
  }
  if (action.type === "redo") {
    const next = state.future[0];
    return next ? { past: [...state.past, state.present].slice(-action.maxHistory), present: next, future: state.future.slice(1), group: null, groupedAt: 0 } : state;
  }

  const nextValue = typeof action.value === "function" ? action.value(state.present.value) : action.value;
  if (structurallyEqual(nextValue, state.present.value)) return state;
  const label = action.options.label?.trim() || "Edit website";
  const source = action.options.source ?? "manual";
  const continuesGroup = Boolean(action.options.group && action.options.group === state.group && source === state.present.source && action.now - state.groupedAt < action.groupWindowMs);
  return {
    past: continuesGroup ? state.past : [...state.past, state.present].slice(-action.maxHistory),
    present: createHistoryEntry(nextValue, label, source, action.now),
    future: [],
    group: action.options.group ?? null,
    groupedAt: action.options.group ? action.now : 0,
  };
}

export function useWebsiteHistory(initial: WebsiteJSON, options: WebsiteHistoryOptions = {}) {
  const maxHistory = Math.max(1, Math.floor(options.maxHistory ?? DEFAULT_MAX_HISTORY));
  const groupWindowMs = Math.max(0, options.groupWindowMs ?? DEFAULT_GROUP_WINDOW_MS);
  const [state, dispatch] = useReducer(websiteHistoryReducer, initial, (value) => ({ past: [], present: createHistoryEntry(value), future: [], group: null, groupedAt: 0 }));
  const setWebsite = useCallback((value: SetStateAction<WebsiteJSON>, setOptions: SetWebsiteOptions = {}) => dispatch({ type: "commit", value, options: setOptions, now: Date.now(), maxHistory, groupWindowMs }), [groupWindowMs, maxHistory]);
  const resetHistory = useCallback((value: WebsiteJSON, label = "Reset website", source: HistoryActionSource = "system") => dispatch({ type: "reset", value, label, source, now: Date.now() }), []);
  const clearHistory = useCallback(() => dispatch({ type: "clear" }), []);
  const undo = useCallback(() => dispatch({ type: "undo" }), []);
  const redo = useCallback(() => dispatch({ type: "redo", maxHistory }), [maxHistory]);
  return { website: state.present.value, setWebsite, replaceWebsite: resetHistory, resetHistory, clearHistory, undo, redo, canUndo: state.past.length > 0, canRedo: state.future.length > 0, undoLabel: state.past.length > 0 ? state.present.label : undefined, redoLabel: state.future[0]?.label };
}
