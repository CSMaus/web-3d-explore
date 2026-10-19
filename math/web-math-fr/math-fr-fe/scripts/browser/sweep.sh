#!/bin/zsh
# runs the accessibility scan on every route of the site in one mode and writes the log named
# usage: zsh scripts/browser/sweep.sh light <log file>; the dev server address is the third argument, 1263 by default
MODE=${1:-light}
OUT=${2:?log file}
: > "$OUT"
BASE=${3:-http://localhost:1263}
for r in / /about /account /contact /kit /learn /play /projects /search /topics \
  /topics/chaos /topics/chaos/parts /topics/chaos/play /topics/chaos/play/bifurcation /topics/chaos/play/control /topics/chaos/play/field /topics/chaos/play/logistic /topics/chaos/play/lorenz /topics/chaos/play/phase /topics/chaos/play/rossler /topics/chaos/play/solvers /topics/chaos/theory /topics/chaos/uses /topics/chaos/uses/control \
  /topics/complex /topics/complex/parts /topics/complex/play /topics/complex/play/add /topics/complex/play/line /topics/complex/play/multiply /topics/complex/play/quaternions /topics/complex/play/round /topics/complex/play/square /topics/complex/play/turn /topics/complex/theory /topics/complex/uses /topics/complex/uses/quaternions \
  /topics/fractals /topics/fractals/parts /topics/fractals/play /topics/fractals/play/credibility /topics/fractals/play/dla /topics/fractals/play/hurst /topics/fractals/play/ifs /topics/fractals/play/julia /topics/fractals/play/lichtenberg /topics/fractals/play/lsystem /topics/fractals/play/mandelbrot /topics/fractals/play/mandelbulb /topics/fractals/play/tails /topics/fractals/theory /topics/fractals/uses /topics/fractals/uses/credibility /topics/fractals/uses/hurst /topics/fractals/uses/tails \
  /topics/networks /topics/networks/parts /topics/networks/play /topics/networks/play/accumulate /topics/networks/play/any /topics/networks/play/blame /topics/networks/play/fade /topics/networks/play/growth /topics/networks/play/layers /topics/networks/play/learn /topics/networks/play/line /topics/networks/play/nudge /topics/networks/play/pictures /topics/networks/play/rate /topics/networks/play/rate2 /topics/networks/play/sequence /topics/networks/play/slope /topics/networks/play/slow /topics/networks/play/unit /topics/networks/play/words /topics/networks/theory /topics/networks/uses \
  /topics/primes /topics/primes/parts /topics/primes/play /topics/primes/play/gaps /topics/primes/theory \
  /topics/tokens /topics/tokens/parts /topics/tokens/play /topics/tokens/play/artefacts /topics/tokens/play/attend /topics/tokens/play/bytes /topics/tokens/play/cost /topics/tokens/play/generate /topics/tokens/play/meaning /topics/tokens/play/merge /topics/tokens/play/order /topics/tokens/play/pool /topics/tokens/play/predict /topics/tokens/play/sample /topics/tokens/play/segment /topics/tokens/play/space /topics/tokens/play/table /topics/tokens/theory /topics/tokens/uses; do
  MODE=$MODE node scripts/browser/a11y.mjs "$BASE$r" >> "$OUT" 2>&1
done
echo "SWEEP DONE" >> "$OUT"
