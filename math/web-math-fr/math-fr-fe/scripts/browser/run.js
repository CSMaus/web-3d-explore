// clicks "Run", watches the run bar for three seconds and returns the heading, the number of
// canvases, the verdict before and after, and whether the page reported a load error.
(async () => {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(3000);
  const out = [];
  const body = () => document.body.textContent;
  const grab = (l, n = 90) => { const b = body(); const i = b.indexOf(l); return i < 0 ? "MISSING" : b.slice(i + l.length, i + l.length + n).trim(); };
  out.push(`h1: ${document.querySelector("main h1")?.textContent}`);
  out.push(`canvases: ${document.querySelectorAll("main canvas").length}`);
  out.push(`verdict before: ${grab("WHAT CAME OUT", 200)}`);
  const run = [...document.querySelectorAll("button")].find(b => b.textContent.trim() === "Run");
  if (!run) return out.concat("NO RUN BUTTON").join("\n");
  run.click();
  const seen = [];
  for (let i = 0; i < 6; i++) { await wait(500); seen.push(grab("RUN", 60).replace(/\s+/g, " ").slice(0, 50)); }
  out.push(`while running: ${seen.join(" -> ")}`);
  out.push(`verdict after: ${grab("WHAT CAME OUT", 320)}`);
  out.push(`page error: ${document.body.textContent.includes("did not load")}`);
  return out.join("\n");
})()
