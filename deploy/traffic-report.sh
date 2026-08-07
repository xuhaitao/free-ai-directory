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
    funnel_names["nav-weekly"]=1; funnel_names["home-weekly"]=1; funnel_names["weekly-item"]=1; funnel_names["weekly-change"]=1; funnel_names["rss-weekly"]=1; funnel_names["archive-weekly-current"]=1;
    funnel_names["nav-topics"]=1; funnel_names["home-topics"]=1; funnel_names["weekly-topics"]=1; funnel_names["weekly-topic"]=1; funnel_names["topic-item"]=1; funnel_names["rss-topics"]=1;
    funnel_names["topic-follow"]=1; funnel_names["topic-unfollow"]=1; funnel_names["rss-topic"]=1; funnel_names["following-open"]=1; funnel_names["following-browse"]=1; funnel_names["following-topic-open"]=1;
    funnel_names["brief-copy"]=1;
    funnel_names["top3-copy-models"]=1; funnel_names["top3-copy-money"]=1; funnel_names["top3-copy-stocks"]=1; funnel_names["top3-copy-skills"]=1;
    funnel_names["top3-share-models"]=1; funnel_names["top3-share-money"]=1; funnel_names["top3-share-stocks"]=1; funnel_names["top3-share-skills"]=1;
    funnel_names["top3-open-models"]=1; funnel_names["top3-open-money"]=1; funnel_names["top3-open-stocks"]=1; funnel_names["top3-open-skills"]=1; funnel_names["home-brief-news"]=1; funnel_names["home-brief-project"]=1; funnel_names["home-brief-model"]=1; funnel_names["home-brief-money"]=1; funnel_names["home-brief-skill"]=1; funnel_names["home-brief-stocks"]=1;
    funnel_names["home-retention-daily"]=1; funnel_names["home-retention-weekly"]=1; funnel_names["home-retention-following"]=1;
    funnel_names["home-focus-money"]=1; funnel_names["home-focus-stocks"]=1;
    funnel_names["topic-view-models"]=1; funnel_names["topic-view-money"]=1; funnel_names["topic-view-stocks"]=1; funnel_names["topic-view-skills"]=1;
    funnel_names["topic-open-models"]=1; funnel_names["topic-open-money"]=1; funnel_names["topic-open-stocks"]=1; funnel_names["topic-open-skills"]=1;
    funnel_names["search-result"]=1; funnel_names["model"]=1; funnel_names["model-source"]=1; funnel_names["relay"]=1;
    funnel_names["rss"]=1; funnel_names["rss-models"]=1; funnel_names["rss-relays"]=1; funnel_names["share"]=1;
  }
  index($4,day)==1 && $7 ~ /^\/event\?/ && !($1 in ignore) {
    split($0,q,"\""); ua=q[6]; request=q[2];
    ua_lower=tolower(ua);
    if(ua_lower ~ /(bot|spider|crawler|headless|curl|wget|python|go-http|httpclient|preview|lighthouse)/) next;
    type=""; path=""; ref=""; reason=""; campaign=""; content="";
    n=split(request,r," "); split(r[2],url,"?"); split(url[2],pairs,"&");
    for(i in pairs){split(pairs[i],kv,"="); if(kv[1]=="type")type=kv[2]; if(kv[1]=="path")path=kv[2]; if(kv[1]=="ref")ref=kv[2]; if(kv[1]=="reason")reason=kv[2]; if(kv[1]=="campaign")campaign=kv[2]; if(kv[1]=="content")content=kv[2]}
    events++;
    identity=$1 "|" ua;
    if(type in funnel_names){funnel_events[type]++; funnel_people[type SUBSEP identity]=1;}
    if(type ~ /^topic-(view|open)-(models|money|stocks|skills)$/)topic_people[type SUBSEP identity]=1;
    if(type=="pageview"){
      pageviews++; visitors[identity]=1; paths[path]++; sources[ref]++;
      if(campaign!="")campaign_pageviews[campaign "|" (content==""?"unspecified":content)]++;
    } else if(type=="engaged") {
      engaged_events++;
      if(reason=="dwell-15s") dwell_visitors[identity]=1;
      else {
        engaged_visitors[identity]=1;
        if(campaign!="")campaign_people[campaign "|" (content==""?"unspecified":content) SUBSEP identity]=1;
      }
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
    for(key in topic_people){split(key,parts,SUBSEP); if(parts[2] in engaged_visitors)topic_engaged_visitors[parts[1]]++;}
    for(key in campaign_people){split(key,parts,SUBSEP); campaign_visitors[parts[1]]++;}
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
    print "topic_engaged_visitors";
    for(t in topic_engaged_visitors) print topic_engaged_visitors[t],t | "sort -nr";
    close("sort -nr");
    print "top_paths";
    for(p in paths) print paths[p],p | "sort -nr | head -10";
    close("sort -nr | head -10");
    print "sources";
    for(s in sources) print sources[s],s | "sort -nr | head -10";
    close("sort -nr | head -10");
    print "campaign_pageviews";
    for(c in campaign_pageviews) print campaign_pageviews[c],c | "sort -nr | head -20";
    close("sort -nr | head -20");
    print "campaign_engaged_visitors";
    for(c in campaign_visitors) print campaign_visitors[c],c | "sort -nr | head -20";
    close("sort -nr | head -20");
    print "outbound_clicks";
    for(o in outbound) print outbound[o],o | "sort -nr | head -10";
    close("sort -nr | head -10");
  }
'
