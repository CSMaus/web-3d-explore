/**
 * the theme in use: the case named in case.ts, taken from cases.ts, unless the
 * environment names another one (VITE_KIT_CASE=base, before the theme command or
 * the package build), the same way VITE_KIT_PALETTE picks a palette. with the
 * site's dev server running the sheet is regenerated on save of any file in
 * this folder; otherwise `npm run theme` regenerates src/theme.css.
 */
import { CASE as NAMED } from "./case.ts";
import { cases, type CaseName } from "./cases.ts";

const fromNode = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.VITE_KIT_CASE;
const fromVite = (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_KIT_CASE;
const forced = fromNode || fromVite;

export const CASE: CaseName = forced && forced in cases ? (forced as CaseName) : NAMED;
export const theme = cases[CASE];
export const CASE_NAMES = Object.keys(cases) as CaseName[];
