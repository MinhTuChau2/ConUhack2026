import { atom, createStore } from "jotai";


export const environmentAtom = atom(1);
export const mentalAtom = atom(0.5);
export const moneyAtom = atom(0);
export const dayAtom = atom(1);
export const earthAtom = atom(1);

export const outfitAtom = atom("none");

export const carDecayAtom = atom(1); // default = no extra decay

export const cameraZoomValueAtom = atom(1);

export const store = createStore();