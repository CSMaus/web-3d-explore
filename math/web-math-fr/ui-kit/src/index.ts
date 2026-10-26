/**
 * the kit. a project imports what it needs from here, points tailwind at this
 * folder with one @source line, and imports src/index.css once.
 */
export { Button, buttonVariants } from "./components/ui/button";
export { Input } from "./components/ui/input";
export { Textarea } from "./components/ui/textarea";
export { Badge } from "./components/ui/badge";
export { Separator } from "./components/ui/separator";
export { Switch } from "./components/ui/switch";
export { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./components/ui/tooltip";
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./components/ui/card";
export { Label as FormLabel } from "./components/ui/label";
export { Chips, Choices, Field, Slider, Swatch } from "./components/controls";
export { Band, Banner, Brand, BrandInner, Caption, CaseSwitch, Counter, Display, Figure, Furniture, Heading, Hero, HeroPanel, IconCard, Label, LanguageSwitch, Lede, ModeSwitch, Page, PaletteSwitch, Panel, PanelHead, Plot, Readout, Screen, Screens, ScrollHint, SearchButton, Share, SideNav, SideNavLink, SkipLink, Strip, Tag, Text, TextLink, TopBar, TopBarDivider, TopBarLink, Verdict } from "./components/pieces";
export { EdgeFigure, LineFigure, SolidFigure } from "./components/figures";
export { arc, arrow, axes, box, circle, fit, loop, plot, poly, seg, type Pt } from "./lib/motifs";
export { SOLID_KINDS, SOLID_NAMES, type SolidKind } from "./lib/solids";
export { FractalBackground, OBSTACLE } from "./components/fractal";
export { FIGURE_KINDS, FIGURE_NAMES, type FigureKind } from "./lib/figures";
export { applyMode, currentMode, readMode, saveMode, useMode, useModeChoice, watchMode, MODE_KEY, type Mode } from "./lib/mode";
export { applyPalette, currentPalette, readPalette, savePalette, usePalette, usePaletteChoice, watchPalette, PALETTE_KEY } from "./lib/palette";
export { theme as kitTheme, CASE as KIT_CASE, CASE_NAMES as KIT_CASES } from "../config/index.ts";
export { caseLabel, caseLabels, pickCase, CASE_ROUTE, CASE_SELECT_SHOWN } from "./lib/case";
export { Gallery } from "./preview/Gallery";
export { cn } from "./lib/utils";
