#!/usr/bin/env bash
set -euo pipefail

CONFIG=${TRAFFIC_CONFIG:-/etc/default/free-ai-directory}
if [[ -r "$CONFIG" ]]; then
  # shellcheck disable=SC1090
  source "$CONFIG"
fi

LOG=${EVENT_LOG:-/var/log/nginx/events.log}
DAY=${1:-$(LC_ALL=C date '+%d/%b/%Y')}
EXCLUDE_IPS=${EXCLUDE_IPS:-}

LOG_FILES=()
for candidate in "$LOG" "$LOG"-* "$LOG".*; do
  [[ -f "$candidate" ]] && LOG_FILES+=("$candidate")
done

if [[ ${#LOG_FILES[@]} -eq 0 ]]; then
  echo "event logs not found: $LOG" >&2
  exit 1
fi

read_logs() {
  for file in "${LOG_FILES[@]}"; do
    if [[ "$file" == *.gz ]]; then gzip -cd -- "$file"; else cat -- "$file"; fi
  done
}

read_logs | awk -v day="[$DAY:" -v excluded="$EXCLUDE_IPS" '
  BEGIN {
    count=split(excluded,excluded_ips,",");
    for(i=1;i<=count;i++)if(excluded_ips[i] != "")ignore[excluded_ips[i]]=1;
    funnel_names["site-search"]=1; funnel_names["directory-filter"]=1;
    funnel_names["finder-entry"]=1; funnel_names["finder-start"]=1; funnel_names["finder-result"]=1; funnel_names["finder-open"]=1;
    funnel_names["archive-current"]=1;
    funnel_names["save-item"]=1; funnel_names["saved-open"]=1; funnel_names["model-compare-add"]=1; funnel_names["model-compare-open"]=1;
    funnel_names["money-news"]=1; funnel_names["money-discussion"]=1; funnel_names["skill"]=1; funnel_names["skill-source"]=1;
    funnel_names["rss-money"]=1; funnel_names["rss-skills"]=1; funnel_names["archive-money-current"]=1; funnel_names["archive-skills-current"]=1;
    funnel_names["nav-money"]=1; funnel_names["nav-skills"]=1;
    funnel_names["nav-stocks"]=1; funnel_names["home-stocks"]=1; funnel_names["home-stocks-project"]=1; funnel_names["home-stocks-news"]=1; funnel_names["stock-project"]=1; funnel_names["stock-source"]=1;
    funnel_names["stock-news"]=1; funnel_names["stock-news-source"]=1; funnel_names["stock-risk"]=1; funnel_names["rss-stocks"]=1; funnel_names["archive-stocks-current"]=1;
    funnel_names["search-result"]=1; funnel_names["model"]=1; funnel_names["model-source"]=1; funnel_names["relay"]=1;
    funnel_names["rss"]=1; funnel_names["rss-models"]=1; funnel_names["rss-relays"]=1; funnel_names["share"]=1;
  }
  index($4,day)==1 && $7 ~ /^\/event\?/ && !($1 in ignore) {
    split($0,q,"\""); ua=q[6]; request=q[2];
    ua_lower=tolower(ua);
    if(ua_lower ~ /(bot|spider|crawler|headless|curl|wget|python|go-http|httpclient|preview|lighthouse)/) next;
    type=""; path=""; ref=""; reason="";
    n=split(request,r," "); split(r[2],url,"?"); split(url[2],pairs,"&");
    for(i in pairs){split(pairs[i],kv,"="); if(kv[1]=="type")type=kv[2]; if(kv[1]=="path")path=kv[2]; if(kv[1]=="ref")ref=kv[2]; if(kv[1]=="reason")reason=kv[2]}
    events++;
    identity=$1 "|" ua;
    if(type in funnel_names){funnel_events[type]++; funnel_people[type SUBSEP identity]=1;}
    if(type=="pageview"){
      pageviews++; visitors[identity]=1; paths[path]++; sources[ref]++;
    } else if(type=="engaged") {
      engaged_events++;
      if(reason=="dwell-15s") dwell_visitors[identity]=1;
      else engaged_visitors[identity]=1;
    } else if(type=="share") shares++;
    else if(type!="deploy-check") outbound[type]++;
  }
  END {
    for(v in visitors) {
      users++;
      has_interaction=(v in engaged_visitors);
      has_dwell=(v in dwell_visitors);
      if(has_interaction) interactive_users++;
      if(has_dwell && !has_interaction) dwell_only_users++;
      if(has_interaction) verified_users++;
    }
    for(key in funnel_people){split(key,parts,SUBSEP); funnel_visitors[parts[1]]++;}
    print "date",substr(day,2,length(day)-2);
    print "verified_visitors",verified_users+0;
    print "engaged_visitors",interactive_users+0;
    print "dwell_only_signals",dwell_only_users+0;
    print "javascript_visitors",users+0;
    print "pageviews",pageviews+0;
    print "engaged_events",engaged_events+0;
    print "shares",shares+0;
    print "tracked_events",events+0;
    print "funnel_events";
    for(f in funnel_events) print funnel_events[f],f | "sort -nr";
    close("sort -nr");
    print "funnel_visitors";
    for(f in funnel_visitors) print funnel_visitors[f],f | "sort -nr";
    close("sort -nr");
    print "top_paths";
    for(p in paths) print paths[p],p | "sort -nr | head -10";
    close("sort -nr | head -10");
    print "sources";
    for(s in sources) print sources[s],s | "sort -nr | head -10";
    close("sort -nr | head -10");
    print "outbound_clicks";
    for(o in outbound) print outbound[o],o | "sort -nr | head -10";
    close("sort -nr | head -10");
  }
'
