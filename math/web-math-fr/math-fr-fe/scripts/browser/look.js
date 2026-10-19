// returns the first six hundred characters of the page's main text, for pages without a run.
(async () => { await new Promise(r => setTimeout(r, 2500)); return document.querySelector("main")?.textContent.slice(0, 600); })()
