// src/stores/store.ts
import { createStore } from "zustand/vanilla";

export type Priority = "Low" | "Medium" | "High";

export type GlobalState = {
  solPrice: number;
  priorityFee: number;
  priorityLevel: Priority;
};

export type GlobalActions = {
  updateSolPrice: (price: number) => void;
  updatePriorityFee: (fee: number) => void;
  updatePriorityLevel: (level: Priority) => void;
};

export type GlobalStore = GlobalState & GlobalActions;

export const initGlobalStore = (): GlobalState => {
  return { solPrice: 0, priorityFee: 0, priorityLevel: "Medium" };
};

export const defaultInitState: GlobalState = {
  solPrice: 0,
  priorityFee: 0,
  priorityLevel: "Medium",
};

export const createGlobalStore = (
  initState: GlobalState = defaultInitState
) => {
  return createStore<GlobalStore>()((set) => ({
    ...initState,
    updateSolPrice: (newPrice) => set({ solPrice: newPrice }),
    updatePriorityFee: (newFee) => set({ priorityFee: newFee }),
    updatePriorityLevel: (newLevel: Priority) =>
      set({ priorityLevel: newLevel }),
  }));
};
