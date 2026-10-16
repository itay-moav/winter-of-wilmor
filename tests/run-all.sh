#!/bin/bash
# Runs the whole suite. Pass --quick to skip the slow bot playthrough and the balance sim.
cd "$(dirname "$0")/.." || exit 1
fail=0
run() { echo "== $*"; "$@" || { echo "!! FAILED: $*"; fail=1; }; }
run node tests/test-maps.js
run node tests/test-hex.js
run node tests/test-combat.js
run node tests/test-dressing.js
run node tests/test-art.js
run node tests/test-audio.js
for t in smoke battle places services side-quest gameover-ending; do run node "tests/browser/$t.js"; done
if [ "$1" != "--quick" ]; then
  run node tests/sim.js 20
  echo "== node tests/playthrough.js 2"
  out=$(node tests/playthrough.js 2 2>&1); echo "$out" | grep -E "ending reached|FAILED" | cut -c1-160
  [ "$(echo "$out" | grep -c 'ending reached: true')" -ge 1 ] || { echo "!! FAILED: playthrough never reached the ending"; fail=1; }
fi
[ $fail = 0 ] && echo "ALL PASSED" || echo "SOME TESTS FAILED"
exit $fail
