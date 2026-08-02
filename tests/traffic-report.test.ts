import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync=promisify(execFile);

test("流量报告输出去重后的互动漏斗",async()=>{
  const dir=await mkdtemp(join(tmpdir(),"free-ai-traffic-"));
  const log=join(dir,"events.log");
  const rotated=`${log}-20260729`;
  const line=(type:string,path="%2Ffind-model%2F",tags="")=>`1.2.3.4 - - [28/Jul/2026:12:00:00 +0800] "POST /event?type=${type}&path=${path}${tags} HTTP/1.1" 204 0 "-" "Mozilla/5.0 Test"\n`;
  const campaign="&campaign=topic_test_2026q3&content=free_models";
  await writeFile(log,line("pageview","%2Fmodels%2F",`&ref=utm%3Agithub${campaign}`));
  await writeFile(rotated,line("engaged","%2Fmodels%2F",campaign)+line("topic-view-models","%2F")+line("topic-open-models","%2F")+line("finder-start")+line("finder-result")+line("finder-result")+line("finder-open")+line("archive-current","%2Fdaily%2F")+line("save-item","%2Fsaved%2F")+line("model-compare-add","%2Fmodels%2F")+line("nav-stocks","%2Fai-stocks%2F")+line("stock-project","%2Fai-stocks%2F")+line("rss-stocks","%2Fai-stocks%2F")+line("nav-weekly","%2Fweekly%2F")+line("weekly-item","%2Fweekly%2F")+line("weekly-change","%2Fweekly%2F")+line("rss-weekly","%2Fweekly%2F")+line("nav-topics","%2Ftopics%2F")+line("topic-item","%2Ftopics%2F")+line("rss-topics","%2Ftopics%2F")+line("topic-follow","%2Ftopics%2F")+line("rss-topic","%2Ftopics%2F")+line("following-open","%2Ftopics%2F")+line("brief-copy","%2F")+line("home-brief-money","%2F")+line("home-retention-weekly","%2F"));
  try{
    const {stdout}=await execFileAsync("bash",["deploy/traffic-report.sh","28/Jul/2026"],{env:{...process.env,EVENT_LOG:log,EXCLUDE_IPS:""}});
    assert.match(stdout,/engaged_visitors 1/);
    assert.match(stdout,/funnel_events[\s\S]*2 finder-result/);
    assert.match(stdout,/funnel_visitors[\s\S]*1 finder-result/);
    assert.match(stdout,/1 finder-open/);
    assert.match(stdout,/1 archive-current/);
    assert.match(stdout,/1 save-item/);
    assert.match(stdout,/1 model-compare-add/);
    assert.match(stdout,/1 nav-stocks/);
    assert.match(stdout,/1 stock-project/);
    assert.match(stdout,/1 rss-stocks/);
    assert.match(stdout,/1 nav-weekly/);
    assert.match(stdout,/1 weekly-item/);
    assert.match(stdout,/1 weekly-change/);
    assert.match(stdout,/1 rss-weekly/);
    assert.match(stdout,/1 nav-topics/);
    assert.match(stdout,/1 topic-item/);
    assert.match(stdout,/1 rss-topics/);
    assert.match(stdout,/1 topic-follow/);
    assert.match(stdout,/1 rss-topic/);
    assert.match(stdout,/1 following-open/);
    assert.match(stdout,/1 brief-copy/);
    assert.match(stdout,/1 home-brief-money/);
    assert.match(stdout,/1 home-retention-weekly/);
    assert.match(stdout,/1 topic-view-models/);
    assert.match(stdout,/1 topic-open-models/);
    assert.match(stdout,/topic_engaged_visitors[\s\S]*1 topic-view-models/);
    assert.match(stdout,/topic_engaged_visitors[\s\S]*1 topic-open-models/);
    assert.match(stdout,/campaign_pageviews[\s\S]*1 topic_test_2026q3\|free_models/);
    assert.match(stdout,/campaign_engaged_visitors[\s\S]*1 topic_test_2026q3\|free_models/);
  }finally{await rm(dir,{recursive:true,force:true})}
});
