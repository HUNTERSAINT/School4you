#!/bin/sh
# Builds the app and always prints the full compiler output, so a failed deploy shows its real error
# (Railway's build log can swallow the tail of `next build` output on failure).
npx prisma generate || exit 1
npx next build > /tmp/next-build.log 2>&1
code=$?
echo "=== next build exit code: $code ==="
tail -n 200 /tmp/next-build.log
if [ "$code" -ne 0 ]; then
  echo "=== tsc --noEmit (diagnostic) ==="
  npx tsc --noEmit 2>&1 | head -n 100
fi
exit $code
