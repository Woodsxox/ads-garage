"use client";

import { useCallback, useReducer } from "react";
import type { AdDesign } from "@/lib/studio/model";

const LIMIT = 80;

type State = {
  present: AdDesign;
  past: AdDesign[];
  future: AdDesign[];
  /** Increments on every change; compared with `savedVersion` to know if there is unsaved work. */
  version: number;
  savedVersion: number;
};

type Action =
  | { type: "commit" } // remember the current design so the next update can be undone
  | { type: "update"; design: AdDesign }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "saved" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "commit":
      return { ...state, past: [...state.past, state.present].slice(-LIMIT), future: [] };
    case "update":
      return { ...state, present: action.design, version: state.version + 1 };
    case "undo": {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      return {
        ...state,
        present: previous,
        past: state.past.slice(0, -1),
        future: [state.present, ...state.future],
        version: state.version + 1,
      };
    }
    case "redo": {
      if (state.future.length === 0) return state;
      const [next, ...rest] = state.future;
      return {
        ...state,
        present: next,
        past: [...state.past, state.present],
        future: rest,
        version: state.version + 1,
      };
    }
    case "saved":
      return { ...state, savedVersion: state.version };
  }
}

export function useDesignHistory(initial: AdDesign) {
  const [state, dispatch] = useReducer(reducer, {
    present: initial,
    past: [],
    future: [],
    version: 0,
    savedVersion: 0,
  });

  /** Apply a change. Pass `record: false` for the continuation of a drag already committed. */
  const change = useCallback(
    (design: AdDesign, record = true) => {
      if (record) dispatch({ type: "commit" });
      dispatch({ type: "update", design });
    },
    [],
  );

  return {
    design: state.present,
    change,
    commit: () => dispatch({ type: "commit" }),
    undo: () => dispatch({ type: "undo" }),
    redo: () => dispatch({ type: "redo" }),
    markSaved: () => dispatch({ type: "saved" }),
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    dirty: state.version !== state.savedVersion,
  };
}
