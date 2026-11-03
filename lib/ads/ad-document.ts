import { motifSvg } from "@/lib/ads/motifs";
import type { Ad, GameStep } from "@/lib/domain/types";

/**
 * Builds the self-contained HTML document an ad is rendered from.
 *
 * It is loaded through `<iframe srcdoc sandbox="allow-scripts">` (no allow-same-origin), so it
 * runs in an opaque origin: no cookies, no storage, no access to the parent. The CSP meta tag
 * additionally blocks every network request, and the only way out is `postMessage`, which the
 * viewer validates against an allow-list of message shapes.
 */

export const AD_MESSAGE_SOURCE = "ad-garage";

export type AdMessage = {
  source: typeof AD_MESSAGE_SOURCE;
  type: "interaction" | "navigate";
  key: string;
};

export function isAdMessage(value: unknown): value is AdMessage {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    v.source === AD_MESSAGE_SOURCE &&
    (v.type === "interaction" || v.type === "navigate") &&
    typeof v.key === "string" &&
    v.key.length < 40
  );
}

const CSP =
  "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:";

export function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function shell(title: string, css: string, body: string, script = ""): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>
${css}
</style>
</head>
<body>
${body}
${script ? `<script>\n${script}\n</script>` : ""}
</body>
</html>
`;
}

const BASE_CSS = `*{box-sizing:border-box;margin:0;padding:0}
html,body{width:100%;height:100%}
body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;overflow:hidden;-webkit-font-smoothing:antialiased}
button{font:inherit;cursor:pointer;border:0}
button:focus-visible,.ad:focus-visible{outline:2px solid currentColor;outline-offset:3px}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}`;

const COMMON_SCRIPT = `function send(type,key){parent.postMessage({source:"${AD_MESSAGE_SOURCE}",type:type,key:key},"*")}
document.querySelectorAll("[data-cta]").forEach(function(b){b.addEventListener("click",function(e){e.stopPropagation();send("interaction","click-cta");send("navigate","destination")})});
var root=document.querySelector(".ad");
if(root&&root.getAttribute("data-clickable")==="true"){root.addEventListener("click",function(){send("interaction","click-cta");send("navigate","destination")})}`;

export type Metrics = {
  layout: "wide" | "tall" | "std";
  hs: number;
  pad: number;
  art: number;
};

export function metricsFor(ad: Ad): Metrics {
  const { width: w, height: h } = ad.size;
  const layout = w / h > 3 ? "wide" : h / w > 2 ? "tall" : "std";
  const hs =
    layout === "wide" ? h * 0.27 : layout === "tall" ? w * 0.13 : Math.min(w, h * 1.25) / 12.5;
  const pad = Math.round(hs * 0.7);
  const art = Math.round(
    layout === "wide" ? h * 0.8 : layout === "tall" ? w * 0.6 : Math.min(w, h * 1.2) * 0.38,
  );
  return { layout, hs: Math.round(hs * 10) / 10, pad, art };
}

function cardCss(ad: Ad, m: Metrics): string {
  const p = ad.palette;
  return `.ad{position:relative;width:100%;height:100%;display:flex;color:${p.ink};background:linear-gradient(145deg,${p.from},${p.to});padding:${m.pad}px;overflow:hidden;--hs:${m.hs}px;--art:${m.art}px;--pad:${m.pad}px}
.ad::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 11px,${p.accent}14 11px 12px);pointer-events:none}
.tag{position:absolute;top:6px;left:8px;font:600 9px/1 ui-monospace,Menlo,Consolas,monospace;letter-spacing:.14em;text-transform:uppercase;color:${p.accent};opacity:.85;z-index:2}
.art{position:absolute;width:var(--art);height:var(--art);z-index:1}
.art svg{width:100%;height:100%;display:block}
.copy{position:relative;z-index:2}
h1{font-size:var(--hs);line-height:1.05;font-weight:800;letter-spacing:-.01em;text-wrap:balance}
.copy p{margin-top:calc(var(--hs)*.4);font-size:calc(var(--hs)*.55);line-height:1.35;opacity:.85}
.cta{position:relative;z-index:2;align-self:flex-start;background:${p.accent};color:${p.from};font-weight:800;font-size:calc(var(--hs)*.55);padding:calc(var(--hs)*.4) calc(var(--hs)*.8);border-radius:3px;letter-spacing:.02em;transition:transform .15s ease,box-shadow .15s ease;white-space:nowrap}
.ad[data-clickable="true"]{cursor:pointer}
.ad[data-clickable="true"]:hover .cta,.cta:hover{transform:translateY(-2px);box-shadow:0 6px 14px #0006}
.ad[data-clickable="true"]:hover .art{transform:scale(1.04)}
.art{transition:transform .25s ease}
.ad.std{flex-direction:column;justify-content:space-between}
.ad.std .art{right:var(--pad);top:var(--pad)}
.ad.std .copy{max-width:62%;margin-top:calc(var(--pad)*.6)}
.ad.wide{flex-direction:row;align-items:center;gap:var(--pad);padding-right:calc(var(--art) + var(--pad)*2)}
.ad.wide .copy{flex:1}
.ad.wide .copy p{margin-top:2px}
.ad.wide .art{right:var(--pad);top:50%;margin-top:calc(var(--art)/-2)}
.ad.tall{flex-direction:column;align-items:center;text-align:center;justify-content:space-between}
.ad.tall .art{position:relative;margin-top:calc(var(--pad)*.8)}
.ad.tall .cta{align-self:center}`;
}

function imageLikeBody(ad: Ad, m: Metrics, clickable: boolean): string {
  const art = motifSvg(ad.motif, ad.palette.accent, ad.palette.ink);
  const copy = `<div class="copy"><h1>${esc(ad.headline)}</h1><p>${esc(ad.body)}</p></div>`;
  const cta = `<button class="cta" type="button" data-cta>${esc(ad.cta)}</button>`;
  return `<main class="ad ${m.layout}" data-format="${ad.format}" data-clickable="${clickable}" aria-label="Advertisement from ${esc(ad.advertiser)}">
<span class="tag">Demo ad</span>
<div class="art">${art}</div>${copy}${cta}
</main>`;
}

/* ───────────── video ───────────── */

function videoDoc(ad: Ad, scrub: boolean): string {
  const p = ad.palette;
  const total = ad.engagement?.videoSec ?? 15;
  const css = `${BASE_CSS}
.ad{position:relative;width:100%;height:100%;overflow:hidden;color:${p.ink};background:radial-gradient(circle at 70% 40%,${p.from},${p.to});font-size:15px}
.scene{position:absolute;inset:0 0 40px 0;display:grid;place-items:center}
.scene .m{width:38%;max-width:150px;aspect-ratio:1}
.scene svg{width:100%;height:100%}
.playing .scene .m{animation:float 2.4s ease-in-out infinite}
@keyframes float{50%{transform:translateY(-8px) rotate(4deg)}}
.cap{position:absolute;left:18px;right:18px;bottom:54px;display:none}
.cap h1{font-size:22px;line-height:1.1;font-weight:800;text-wrap:balance}
.cap p{margin-top:6px;opacity:.85}
.ad[data-scene="0"] .s0,.ad[data-scene="1"] .s1,.ad[data-scene="2"] .s2{display:block}
.s2{text-align:center;left:0;right:0}
.cta{margin-top:10px;background:${p.accent};color:${p.from};font-weight:800;padding:9px 16px;border-radius:3px}
.bar{position:absolute;left:0;right:0;bottom:0;height:40px;display:flex;align-items:center;gap:10px;padding:0 12px;background:#0009}
.pp{background:transparent;color:${p.ink};width:26px;height:26px;font-size:14px}
.track{flex:1;height:6px;background:#fff3;border-radius:3px;overflow:hidden;${scrub ? "cursor:pointer" : ""}}
.track i{display:block;height:100%;width:0;background:${p.accent}}
.time{font:600 11px ui-monospace,Menlo,monospace;min-width:34px;text-align:right}
.big{position:absolute;inset:0 0 40px 0;margin:auto;width:64px;height:64px;border-radius:50%;background:${p.accent};color:${p.from};font-size:26px;display:grid;place-items:center;z-index:3}
.started .big:not(.again){display:none}
.playing .big{display:none}
.tag{position:absolute;top:8px;left:10px;font:600 9px/1 ui-monospace,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase;color:${p.accent};z-index:4}
.len{position:absolute;top:8px;right:10px;font:600 10px ui-monospace,Menlo,monospace;opacity:.75}`;
  const body = `<main class="ad" data-scene="0" aria-label="Video advertisement from ${esc(ad.advertiser)}">
<span class="tag">Demo video</span><span class="len">${total}s</span>
<div class="scene"><div class="m">${motifSvg(ad.motif, p.accent, p.ink)}</div></div>
<div class="cap s0"><h1>${esc(ad.headline)}</h1></div>
<div class="cap s1"><h1>${esc(ad.body)}</h1></div>
<div class="cap s2"><h1>${esc(ad.advertiser)}</h1><button class="cta" type="button" data-cta>${esc(ad.cta)}</button></div>
<button class="big" type="button" id="big" aria-label="Play video">▶</button>
<div class="bar"><button class="pp" type="button" id="pp" aria-label="Play">▶</button><div class="track" id="track"><i id="fill"></i></div><span class="time" id="time">0:${String(total).padStart(2, "0")}</span></div>
</main>`;
  const script = `${COMMON_SCRIPT}
var TOTAL=${total},SCRUB=${scrub},t=0,playing=false,started=false,ended=false,timer=null;
var big=document.getElementById("big"),pp=document.getElementById("pp"),fill=document.getElementById("fill"),time=document.getElementById("time"),track=document.getElementById("track");
function fmt(x){var s=Math.max(0,Math.ceil(TOTAL-x));return "0:"+(s<10?"0":"")+s}
function render(){
 fill.style.width=(t/TOTAL*100)+"%";time.textContent=fmt(t);
 root.className="ad"+(playing?" playing":"")+(started?" started":"")+(ended?" ended":"");
 root.setAttribute("data-scene",ended||t>=TOTAL*.85?"2":t>=TOTAL*.45?"1":"0");
 pp.textContent=playing?"❚❚":"▶";pp.setAttribute("aria-label",playing?"Pause":"Play");
 big.className=ended?"big again":"big";big.textContent=ended?"↻":"▶";
}
function tick(){t=Math.min(TOTAL,t+.1);if(t>=TOTAL){ended=true;playing=false;clearInterval(timer);send("interaction","complete")}render()}
function play(){if(ended){t=0;ended=false}playing=true;if(!started){started=true;send("interaction","play")}clearInterval(timer);timer=setInterval(tick,100);render()}
function pause(){playing=false;clearInterval(timer);render()}
big.addEventListener("click",play);
pp.addEventListener("click",function(){playing?pause():play()});
if(SCRUB){track.addEventListener("click",function(e){var r=track.getBoundingClientRect();t=Math.min(TOTAL-.1,Math.max(0,(e.clientX-r.left)/r.width*TOTAL));if(!started){started=true;send("interaction","play")}render()})}
render();`;
  return shell(ad.title, css, body, script);
}

/* ───────────── gamified ───────────── */

function wheelSvg(prizes: string[], accent: string, ink: string): string {
  const n = prizes.length;
  const paths = prizes
    .map((_, i) => {
      const a0 = ((i / n) * 360 - 90) * (Math.PI / 180);
      const a1 = (((i + 1) / n) * 360 - 90) * (Math.PI / 180);
      const x0 = 50 + 46 * Math.cos(a0);
      const y0 = 50 + 46 * Math.sin(a0);
      const x1 = 50 + 46 * Math.cos(a1);
      const y1 = 50 + 46 * Math.sin(a1);
      const fill = i % 2 === 0 ? accent : ink;
      const opacity = i % 2 === 0 ? 0.95 : 0.22;
      return `<path d="M50 50L${x0.toFixed(2)} ${y0.toFixed(2)}A46 46 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}Z" fill="${fill}" fill-opacity="${opacity}"/>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-hidden="true">${paths}<circle cx="50" cy="50" r="46" fill="none" stroke="${accent}" stroke-width="2"/><circle cx="50" cy="50" r="6" fill="${ink}"/></svg>`;
}

function stepHtml(step: GameStep, i: number, ad: Ad): string {
  const p = ad.palette;
  const hidden = i === 0 ? "" : " hidden";
  const attr = `class="step" data-i="${i}" data-kind="${step.kind}"${hidden}`;
  switch (step.kind) {
    case "choice":
      return `<section ${attr}><p class="prompt">${esc(step.prompt)}</p><div class="opts">${step.options
        .map((o) => `<button type="button" class="opt">${esc(o)}</button>`)
        .join("")}</div></section>`;
    case "tap":
      return `<section ${attr} data-taps="${step.taps}"><p class="prompt">${esc(step.prompt)}</p><button type="button" class="tapper" aria-label="Tighten bolt"><span>${motifSvg(ad.motif, p.accent, p.ink)}</span></button><div class="meter"><i></i></div><p class="count">0 / ${step.taps}</p></section>`;
    case "spin":
      return `<section ${attr} data-prizes="${esc(JSON.stringify(step.prizes))}"><p class="prompt">${esc(step.prompt)}</p><div class="wheelbox"><div class="pointer"></div><button type="button" class="wheel" aria-label="Spin the wheel">${wheelSvg(step.prizes, p.accent, p.ink)}</button></div><p class="result" aria-live="polite">&nbsp;</p></section>`;
    case "reveal":
      return `<section ${attr}><p class="prompt">${esc(step.prompt)}</p><button type="button" class="revealbtn">Reveal</button><div class="reward" hidden><p class="rw">${esc(step.reward)}</p><button class="cta" type="button" data-cta>${esc(ad.cta)}</button></div></section>`;
  }
}

function gameDoc(ad: Ad): string {
  const p = ad.palette;
  const steps = ad.game ?? [];
  const css = `${BASE_CSS}
.ad{position:relative;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;color:${p.ink};background:linear-gradient(160deg,${p.from},${p.to});padding:26px 18px 18px;text-align:center}
.tag{position:absolute;top:8px;left:10px;font:600 9px/1 ui-monospace,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase;color:${p.accent}}
h1{font-size:24px;line-height:1.05;font-weight:800;text-wrap:balance}
.sub{margin-top:6px;font-size:13px;opacity:.8}
.dots{display:flex;gap:6px;margin:12px 0 4px}
.dots i{width:22px;height:5px;border-radius:3px;background:#fff3}
.dots i.on{background:${p.accent}}
.stepn{font:600 10px ui-monospace,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase;opacity:.7}
.stage{flex:1;width:100%;display:grid;place-items:center}
.step{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%}
.step[hidden]{display:none}
.prompt{font-weight:700;font-size:15px}
.opts{display:grid;gap:8px;width:100%}
.opt,.revealbtn,.cta{background:${p.accent};color:${p.from};font-weight:800;padding:11px 16px;border-radius:4px;transition:transform .15s}
.opt:hover,.revealbtn:hover,.cta:hover{transform:translateY(-2px)}
.opt.sel{outline:3px solid ${p.ink}}
.opt[disabled]{opacity:.55;cursor:default}
.tapper{background:transparent;width:110px;height:110px;transition:transform .12s}
.tapper:active{transform:scale(.9) rotate(12deg)}
.tapper span{display:block;width:100%;height:100%}
.tapper svg{width:100%;height:100%}
.meter{width:70%;height:8px;border-radius:4px;background:#fff3;overflow:hidden}
.meter i{display:block;height:100%;width:0;background:${p.accent};transition:width .2s}
.count{font:600 12px ui-monospace,Menlo,monospace}
.wheelbox{position:relative;width:150px;height:150px}
.wheel{display:block;width:100%;height:100%;background:transparent;border-radius:50%;transition:transform 1.6s cubic-bezier(.12,.7,.15,1)}
.wheel svg{width:100%;height:100%}
.pointer{position:absolute;top:-8px;left:50%;margin-left:-8px;border:8px solid transparent;border-top:14px solid ${p.ink};z-index:2}
.result{font-weight:800;font-size:15px;min-height:20px;color:${p.accent}}
.reward{display:flex;flex-direction:column;align-items:center;gap:12px}
.reward[hidden]{display:none}
.rw{font-size:20px;font-weight:800;color:${p.accent}}`;
  const body = `<main class="ad" data-format="gamified" aria-label="Interactive advertisement from ${esc(ad.advertiser)}">
<span class="tag">Demo game</span>
<h1>${esc(ad.headline)}</h1><p class="sub">${esc(ad.body)}</p>
<div class="dots">${steps.map((_, i) => `<i class="${i === 0 ? "on" : ""}"></i>`).join("")}</div>
<p class="stepn" id="stepn">Step 1 of ${steps.length}</p>
<div class="stage">${steps.map((s, i) => stepHtml(s, i, ad)).join("")}</div>
</main>`;
  const script = `${COMMON_SCRIPT}
var secs=[].slice.call(document.querySelectorAll(".step")),dots=[].slice.call(document.querySelectorAll(".dots i")),stepn=document.getElementById("stepn");
function show(i){secs.forEach(function(s,k){s.hidden=k!==i});dots.forEach(function(d,k){d.className=k<=i?"on":""});stepn.textContent="Step "+(i+1)+" of "+secs.length}
function done(i){send("interaction","step-"+i);if(i<secs.length-1){setTimeout(function(){show(i+1)},550)}}
secs.forEach(function(sec,i){
 var kind=sec.getAttribute("data-kind");
 if(kind==="choice"){var opts=[].slice.call(sec.querySelectorAll(".opt"));opts.forEach(function(o){o.addEventListener("click",function(){opts.forEach(function(x){x.disabled=true});o.className="opt sel";done(i)})})}
 if(kind==="tap"){var need=+sec.getAttribute("data-taps"),n=0,b=sec.querySelector(".tapper"),m=sec.querySelector(".meter i"),c=sec.querySelector(".count");b.addEventListener("click",function(){if(n>=need)return;n++;m.style.width=(n/need*100)+"%";c.textContent=n+" / "+need;if(n>=need){b.disabled=true;done(i)}})}
 if(kind==="spin"){var prizes=JSON.parse(sec.getAttribute("data-prizes")),w=sec.querySelector(".wheel"),r=sec.querySelector(".result"),spun=false;w.addEventListener("click",function(){if(spun)return;spun=true;var idx=Math.floor(Math.random()*prizes.length),seg=360/prizes.length;w.style.transform="rotate("+(360*4+(360-(idx+.5)*seg))+"deg)";setTimeout(function(){r.textContent=prizes[idx];done(i)},1700)})}
 if(kind==="reveal"){var rb=sec.querySelector(".revealbtn"),rw=sec.querySelector(".reward");rb.addEventListener("click",function(){rb.hidden=true;rw.hidden=false;done(i)})}
});`;
  return shell(ad.title, css, body, script);
}

/* ───────────── carousel ───────────── */

function carouselDoc(ad: Ad): string {
  const p = ad.palette;
  const slides = ad.slides ?? [];
  const css = `${BASE_CSS}
.ad{position:relative;width:100%;height:100%;display:flex;flex-direction:column;color:${p.ink};background:linear-gradient(160deg,${p.from},${p.to})}
.tag{position:absolute;top:8px;left:10px;font:600 9px/1 ui-monospace,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase;color:${p.accent};z-index:2}
.stage{flex:1;display:grid;place-items:center;padding:30px 44px 8px;min-height:0}
.slide{display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;width:100%}
.slide[hidden]{display:none}
.slide .m{width:96px;height:96px}
.slide svg{width:100%;height:100%;display:block}
.slide h1{font-size:22px;line-height:1.1;font-weight:800;text-wrap:balance}
.slide p{font-size:13px;line-height:1.35;opacity:.85}
.arrow{position:absolute;top:50%;margin-top:-26px;width:32px;height:32px;border-radius:50%;background:${p.accent};color:${p.from};font-size:16px;font-weight:800;display:grid;place-items:center;z-index:2;transition:transform .15s}
.arrow:hover:not([disabled]){transform:scale(1.1)}
.arrow[disabled]{opacity:.3;cursor:default}
#prev{left:8px}#next{right:8px}
.foot{display:flex;flex-direction:column;align-items:center;gap:10px;padding:4px 16px 16px}
.dots{display:flex;gap:6px}
.dots i{width:18px;height:5px;border-radius:3px;background:#fff3}
.dots i.on{background:${p.accent}}
.cta{background:${p.accent};color:${p.from};font-weight:800;font-size:14px;padding:10px 20px;border-radius:3px;transition:transform .15s}
.cta:hover{transform:translateY(-2px)}`;
  const body = `<main class="ad" data-format="carousel" data-clickable="false" aria-label="Carousel advertisement from ${esc(ad.advertiser)}">
<span class="tag">Demo carousel</span>
<button class="arrow" type="button" id="prev" aria-label="Previous card">‹</button>
<button class="arrow" type="button" id="next" aria-label="Next card">›</button>
<div class="stage" aria-live="polite">${slides
    .map(
      (s, i) =>
        `<section class="slide" data-i="${i}"${i === 0 ? "" : " hidden"}><div class="m">${motifSvg(s.motif, p.accent, p.ink)}</div><h1>${esc(s.headline)}</h1><p>${esc(s.body)}</p></section>`,
    )
    .join("")}</div>
<div class="foot"><div class="dots">${slides.map((_, i) => `<i class="${i === 0 ? "on" : ""}"></i>`).join("")}</div><button class="cta" type="button" data-cta>${esc(ad.cta)}</button></div>
</main>`;
  const script = `${COMMON_SCRIPT}
var slides=[].slice.call(document.querySelectorAll(".slide")),dots=[].slice.call(document.querySelectorAll(".dots i")),prev=document.getElementById("prev"),next=document.getElementById("next"),seen={0:1},at=0;
function show(n){at=Math.max(0,Math.min(slides.length-1,n));slides.forEach(function(s,k){s.hidden=k!==at});dots.forEach(function(d,k){d.className=k===at?"on":""});prev.disabled=at===0;next.disabled=at===slides.length-1;if(!seen[at]){seen[at]=1;send("interaction","slide-"+(at+1))}}
prev.addEventListener("click",function(){show(at-1)});
next.addEventListener("click",function(){show(at+1)});
document.addEventListener("keydown",function(e){if(e.key==="ArrowRight")show(at+1);else if(e.key==="ArrowLeft")show(at-1)});
prev.disabled=true;next.disabled=slides.length<2;`;
  return shell(ad.title, css, body, script);
}

/* ───────────── native ───────────── */

function nativeDoc(ad: Ad): string {
  const p = ad.palette;
  const { width: w, height: h } = ad.size;
  const row = w / h > 2;
  const css = `${BASE_CSS}
body{background:#f5f3ee;color:#1c1e22}
.ad{width:100%;height:100%;display:flex;${row ? "flex-direction:row;align-items:center;gap:14px;padding:14px" : "flex-direction:column;gap:12px;padding:16px"};background:#fffdf8;border:1px solid #1c1e2218;cursor:pointer}
.ad:hover h1{text-decoration:underline}
.thumb{${row ? "width:96px;height:96px;flex:none" : "width:100%;height:42%;min-height:90px"};background:linear-gradient(145deg,${p.from},${p.to});display:grid;place-items:center;border-radius:3px}
.thumb svg{width:${row ? "64px" : "74px"};height:${row ? "64px" : "74px"}}
.lab{font:600 10px ui-monospace,Menlo,monospace;letter-spacing:.12em;text-transform:uppercase;color:#6b6a63}
h1{font:700 ${row ? "17px" : "21px"}/1.15 Georgia,"Times New Roman",serif;margin-top:4px}
p.b{margin-top:4px;font-size:13px;color:#4a4943;line-height:1.4}
.link{margin-top:8px;background:none;color:#1c1e22;font-weight:700;font-size:13px;text-decoration:underline;text-underline-offset:3px;padding:0}`;
  const body = `<main class="ad" data-format="native" data-clickable="true" aria-label="Sponsored content from ${esc(ad.advertiser)}">
<div class="thumb">${motifSvg(ad.motif, p.accent, p.ink)}</div>
<div><span class="lab">Sponsored · ${esc(ad.advertiser)}</span><h1>${esc(ad.headline)}</h1><p class="b">${esc(ad.body)}</p><button class="link" type="button" data-cta>${esc(ad.cta)} →</button></div>
</main>`;
  return shell(ad.title, css, body, COMMON_SCRIPT);
}

/* ───────────── public builders ───────────── */

export function buildAdDocument(ad: Ad): string {
  const scrub = !(ad.engagement?.requirements ?? []).some((r) => r.key === "complete");
  switch (ad.format) {
    case "video":
      return videoDoc(ad, scrub);
    case "gamified":
      return gameDoc(ad);
    case "native":
      return nativeDoc(ad);
    case "carousel":
      return carouselDoc(ad);
    case "clickable":
    case "banner":
    case "image": {
      const m = metricsFor(ad);
      const clickable = ad.format === "clickable";
      return shell(
        ad.title,
        `${BASE_CSS}\n${cardCss(ad, m)}`,
        imageLikeBody(ad, m, clickable),
        COMMON_SCRIPT,
      );
    }
  }
}

/** The mock destination shown after a click on a `landing` destination. */
export function buildLandingDocument(ad: Ad): string {
  const dest = ad.destination;
  if (dest.kind !== "landing") return "";
  const p = ad.palette;
  const css = `${BASE_CSS}
body{overflow:auto;background:#f7f5f0;color:#1c1e22}
header{display:flex;align-items:center;justify-content:space-between;padding:14px 28px;background:${p.from};color:${p.ink}}
header b{font-size:16px;letter-spacing:.04em}
nav{display:flex;gap:16px;font-size:13px;opacity:.8}
.banner{padding:8px 28px;background:#f2b705;color:#1c1e22;font:600 12px ui-monospace,Menlo,monospace}
.hero{display:grid;grid-template-columns:1fr 180px;gap:24px;align-items:center;padding:44px 28px;max-width:860px;margin:0 auto}
.hero h1{font-size:36px;line-height:1.05;text-wrap:balance}
.hero p{margin-top:12px;font-size:16px;line-height:1.5;color:#3a3933;max-width:48ch}
.hero button{margin-top:18px;background:${p.from};color:${p.ink};padding:12px 20px;border-radius:3px;font-weight:700}
.hero .art{background:linear-gradient(145deg,${p.from},${p.to});border-radius:6px;padding:26px;aspect-ratio:1}
.hero svg{width:100%;height:100%}
.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;padding:0 28px 40px;max-width:860px;margin:0 auto}
.cards div{height:90px;border-radius:4px;background:#e9e6de}
@media (max-width:560px){.hero{grid-template-columns:1fr}.hero .art{display:none}.cards{grid-template-columns:1fr 1fr}}`;
  const body = `<header><b>${esc(ad.advertiser)}</b><nav><span>Shop</span><span>About</span><span>Contact</span></nav></header>
<div class="banner">Demo destination · part of the Ads Garage sandbox. Nothing here is a real store.</div>
<section class="hero"><div><h1>${esc(dest.title)}</h1><p>${esc(dest.blurb)}</p><button type="button">Continue</button></div><div class="art">${motifSvg(ad.motif, p.accent, p.ink)}</div></section>
<section class="cards"><div></div><div></div><div></div></section>`;
  return shell(`${dest.title} · ${ad.advertiser}`, css, body);
}

/** Public URL string shown in the viewer's address bar for a landing destination. */
export function destinationUrl(ad: Ad): string {
  const dest = ad.destination;
  return dest.kind === "landing" ? `https://${dest.host}${dest.path}` : dest.url;
}
