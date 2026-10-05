#!/bin/sh
# usage: scripts/lh.sh <url> <out.json>   (Lighthouse mobile, local Chrome)
export CHROME_PATH="${CHROME_PATH:-/c/Program Files/Google/Chrome/Application/chrome.exe}"
npx -y lighthouse@12 "$1" --quiet --chrome-flags="--headless=new" --only-categories=performance,accessibility,best-practices,seo --output=json --output-path="$2" >/dev/null 2>&1
node -e "const r=require(process.argv[1]);const c=r.categories;console.log(process.argv[2],Object.entries(c).map(([k,v])=>k+'='+Math.round(v.score*100)).join(' '));for(const a of Object.values(r.audits))if(a.score!==null&&a.score<0.9&&!['informative','notApplicable','manual'].includes(a.scoreDisplayMode))console.log('   -',a.id,a.displayValue||'')" "$(cygpath -w "$2" 2>/dev/null || echo "$2")" "$1"
