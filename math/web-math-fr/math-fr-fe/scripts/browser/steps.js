// optionally clicks one option button, then clicks "Ten steps" a number of times and returns
// the run bar and the verdict. the url carries the arguments: ?steps=40&pick=Fixed%20pacemaker
(async () => {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(2500);
  const body = () => document.body.textContent;
  const grab = (l, n = 90) => { const b = body(); const i = b.indexOf(l); return i < 0 ? "MISSING" : b.slice(i + l.length, i + l.length + n).trim(); };
  const out = [];
  const pick = (label) => { const b = [...document.querySelectorAll("button")].find(b => b.textContent.trim() === label); if (b) b.click(); return !!b; };
  const times = Number(new URL(location.href).searchParams.get("steps") || 30);
  const choice = new URL(location.href).searchParams.get("pick");
  if (choice) out.push(`picked ${choice}: ${pick(choice)}`);
  await wait(300);
  for (let i = 0; i < times; i++) { pick("Ten steps"); await wait(30); }
  await wait(600);
  out.push(`run: ${grab("RUN", 80).replace(/\s+/g, " ")}`);
  out.push(`verdict: ${grab("WHAT CAME OUT", 700)}`);
  return out.join("\n");
})()
