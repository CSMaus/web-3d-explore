/**
 * how a token is shown: its colour, and the marks that make a space or a line break visible.
 */
/** the page is in light mode, read from the html element; dark when there is no page */
function lightPage() {
  return typeof document !== "undefined" && document.documentElement.dataset.mode === "light";
}

/** a chip colour from a hue in degrees: dark on the dark page, pale on the light page, both under the page's text colour. */
export function tint(degrees: number, light = lightPage()) {
  return `hsl(${degrees % 360} 45% ${light ? 88 : 24}%)`;
}

/** a token id painted as a stable colour, so the same token looks the same everywhere. */
export function hue(id: number, light = lightPage()) {
  return tint((id * 47) % 360, light);
}

/** a leading space shown as a mark, so it is seen to be inside the token. */
export function visible(text: string) {
  return text.replace(/ /g, "␣").replace(/\n/g, "⏎");
}
