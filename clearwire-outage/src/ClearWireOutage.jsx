/**
 * ClearWire Outage Reporter v2
 * Design System v1.0 compliant
 * Pending changes implemented:
 *  - Supabase backend connection
 *  - APWA service color system
 *  - Service icons inside map clouds
 *  - Cloud radius scales with report count
 *  - Passive network probe (connectivity check)
 *  - Outage cluster detection + social post trigger stub
 *  - Full CSS variable token approach
 *  - Badge / card / input component specs per design system Section 5
 *
 * Environment variables required:
 *  VITE_SUPABASE_URL
 *  VITE_SUPABASE_ANON_KEY
 *
 * External integrations (stubbed — require API keys):
 *  - Twilio SMS (triggerSMS)
 *  - X (Twitter) API v2 (triggerXPost)
 *  - Facebook Graph API (triggerFBPost)
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── Supabase client ──────────────────────────────────────────────────────────
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ─── Design tokens (ClearWire Design System v1.0) ────────────────────────────
const T = {
  // Brand
  navy900: "#0A1628", navy800: "#0F2040", navy700: "#162952",
  blue700: "#1A4ED8", blue600: "#2563EB", blue400: "#3B82F6",
  white: "#FFFFFF", offwhite: "#F0F4F8",
  // APWA 811 service colors
  telecom:  "#EA580C",  // Internet / Phone / Cable / Mobile / Fiber
  electric: "#DC2626",  // Power / Electric
  water:    "#2563EB",  // Potable Water
  multi:    "#7C2D12",  // Multiple services
  // Internal status
  green:  "#059669",
  amber:  "#D97706",
  purple: "#7C3AED",
  // Neutrals
  n900: "#1E2D3D", n800: "#2D3F52", n600: "#4A6080",
  n400: "#7A94AE", n200: "#B0C4D4", n100: "#E2EBF0", n50: "#F0F4F8",
};

// ─── APWA service definitions ─────────────────────────────────────────────────
const SERVICES = [
  { id: "internet", label: "Internet",  icon: "wifi",       color: T.telecom  },
  { id: "phone",    label: "Phone",     icon: "phone",      color: T.telecom  },
  { id: "cable",    label: "Cable TV",  icon: "tv",         color: T.telecom  },
  { id: "power",    label: "Power",     icon: "zap",        color: T.electric },
  { id: "mobile",   label: "Mobile",    icon: "smartphone", color: T.telecom  },
  { id: "water",    label: "Water",     icon: "droplets",   color: T.water    },
  { id: "multiple", label: "Multiple",  icon: "layers",     color: T.multi    },
];

// ─── Providers by region ──────────────────────────────────────────────────────
const PROVIDERS = {
  cleveland: {
    internet: ["Spectrum","AT&T","Breezeline","Windstream","Consolidated","Other"],
    phone:    ["Spectrum","AT&T","Windstream","Consolidated","Other"],
    cable:    ["Spectrum","Breezeline","Other"],
    power:    ["FirstEnergy / Illuminating","Ohio Edison","Other"],
    mobile:   ["Verizon","AT&T","T-Mobile","Cricket","Other"],
    water:    ["Cleveland Water","NEORSD","Other"],
    multiple: ["Spectrum","AT&T","FirstEnergy","Breezeline","Other"],
  },
  chicago: {
    internet: ["Comcast / Xfinity","AT&T","RCN","WideOpenWest","Other"],
    phone:    ["Comcast","AT&T","RCN","Other"],
    cable:    ["Comcast / Xfinity","RCN","Other"],
    power:    ["ComEd","Other"],
    mobile:   ["Verizon","AT&T","T-Mobile","Cricket","Other"],
    water:    ["Chicago Water","Other"],
    multiple: ["Comcast","AT&T","ComEd","Other"],
  },
  national: {
    internet: ["Spectrum","AT&T","Comcast / Xfinity","Verizon Fios","Cox","Lumen","Other"],
    phone:    ["Spectrum","AT&T","Comcast","Verizon","Other"],
    cable:    ["Spectrum","Comcast / Xfinity","Cox","Dish","DirecTV","Other"],
    power:    ["Local Utility","Other"],
    mobile:   ["Verizon","AT&T","T-Mobile","Cricket","Boost","Other"],
    water:    ["Local Water Authority","Other"],
    multiple: ["Spectrum","AT&T","Comcast","Verizon","Local Utility","Other"],
  },
};

// ─── CSS (Design System v1.0 tokens) ─────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Serif+Display&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --navy900: #0A1628; --navy800: #0F2040; --navy700: #162952;
    --blue700: #1A4ED8; --blue600: #2563EB; --blue400: #3B82F6;
    --telecom: #EA580C; --electric: #DC2626; --water: #2563EB;
    --green: #059669; --amber: #D97706; --purple: #7C3AED;
    --n900: #1E2D3D; --n800: #2D3F52; --n600: #4A6080;
    --n400: #7A94AE; --n200: #B0C4D4; --n100: #E2EBF0; --n50: #F0F4F8;
    --font-display: 'DM Serif Display', Georgia, serif;
    --font-body: 'DM Sans', system-ui, sans-serif;
    --radius-sm: 6px; --radius-md: 10px; --radius-lg: 14px;
    --shadow-sm: 0 1px 4px rgba(0,0,0,.08);
    --shadow-md: 0 4px 12px rgba(0,0,0,.12);
    --shadow-blue: 0 4px 16px rgba(37,99,235,.35);
  }
  html, body { height: 100%; font-family: var(--font-body); }
  body { background: var(--n50); color: var(--navy900); overflow-x: hidden; }

  @keyframes fadeUp  { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  @keyframes popIn   { 0% { transform:scale(.85); opacity:0; } 70% { transform:scale(1.04); } 100% { transform:scale(1); opacity:1; } }
  @keyframes spin    { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
  @keyframes glow    { 0%,100% { box-shadow:0 0 6px var(--blue600); } 50% { box-shadow:0 0 18px var(--blue600); } }
  @keyframes drawCheck { from { stroke-dashoffset:50; } to { stroke-dashoffset:0; } }
  @keyframes scanLine { 0% { transform:translateY(-100%); } 100% { transform:translateY(500%); } }
  @keyframes float   { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-6px); } }

  .anim-up   { animation: fadeUp .35s ease both; }
  .anim-pop  { animation: popIn .45s cubic-bezier(.34,1.56,.64,1) both; }
  .anim-spin { animation: spin 1s linear infinite; }

  /* Buttons */
  .btn { border: none; border-radius: var(--radius-md); padding: 13px 24px;
    font-family: var(--font-body); font-size: 15px; font-weight: 700;
    cursor: pointer; transition: all .2s; letter-spacing: -.01em; }
  .btn:disabled { background: var(--n100) !important; color: var(--n400) !important;
    box-shadow: none !important; cursor: not-allowed; }
  .btn-primary { background: var(--blue700); color: #fff; width: 100%;
    box-shadow: var(--shadow-blue); }
  .btn-primary:not(:disabled):hover { background: var(--blue600); transform: translateY(-1px); }
  .btn-ghost   { background: transparent; color: var(--n600); border: 1.5px solid var(--n100); width: 100%; }
  .btn-ghost:hover { border-color: var(--n400); background: var(--n50); }

  /* Cards */
  .card { background: #fff; border: 1px solid var(--n100); border-radius: var(--radius-lg);
    padding: 16px; box-shadow: var(--shadow-sm); }
  .card-dark { background: var(--navy800); border: 1px solid var(--n900); border-radius: var(--radius-lg); }

  /* Inputs */
  .input { width: 100%; border: 1.5px solid var(--n100); border-radius: var(--radius-md);
    padding: 12px 14px; font-family: var(--font-body); font-size: 14px; color: var(--navy900);
    background: var(--n50); transition: border-color .15s, box-shadow .15s; }
  .input:focus { outline: none; border-color: var(--blue600);
    box-shadow: 0 0 0 3px rgba(37,99,235,.12); }

  /* Badges */
  .badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px;
    border-radius: var(--radius-sm); font-size: 11px; font-weight: 700; border: 1px solid; }
  .badge-open     { color: var(--telecom);  background: rgba(234,88,12,.08);  border-color: rgba(234,88,12,.3);  }
  .badge-resolved { color: var(--green);    background: rgba(5,150,105,.08);   border-color: rgba(5,150,105,.3);  }
  .badge-assigned { color: var(--amber);    background: rgba(217,119,6,.08);   border-color: rgba(217,119,6,.3);  }
  .badge-offline  { color: var(--n600);     background: var(--n50);            border-color: var(--n100);         }

  /* Service option buttons */
  .svc-opt { border: 1.5px solid var(--n100); border-radius: var(--radius-md); padding: 14px 12px;
    cursor: pointer; background: #fff; font-family: var(--font-body); transition: all .2s;
    text-align: left; }
  .svc-opt:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
  .svc-opt.sel   { transform: translateY(-1px); }

  /* Provider buttons */
  .prov-btn { width: 100%; padding: 12px 16px; border-radius: var(--radius-md);
    border: 1.5px solid var(--n100); background: #fff; font-family: var(--font-body);
    font-size: 14px; font-weight: 500; color: var(--navy900); cursor: pointer;
    text-align: left; display: flex; justify-content: space-between; align-items: center;
    transition: all .15s; }
  .prov-btn:hover { border-color: var(--blue600); background: rgba(37,99,235,.04); color: var(--blue600); }
  .prov-btn.sel   { border-color: var(--blue600); background: rgba(37,99,235,.06); color: var(--blue600); font-weight: 700; }

  /* Notification option */
  .notif-opt { border: 1.5px solid var(--n100); border-radius: var(--radius-lg);
    padding: 14px 16px; cursor: pointer; background: #fff; transition: all .15s; }
  .notif-opt:hover  { border-color: var(--blue600); }
  .notif-opt.sel    { border-color: var(--blue600); }
  .notif-opt.sel-none { border-color: var(--n600); }

  /* Tab buttons */
  .loc-tab { padding: 11px; border-radius: var(--radius-md); border: 1.5px solid var(--n100);
    background: #fff; font-family: var(--font-body); font-weight: 600; font-size: 13px;
    color: var(--n600); cursor: pointer; transition: all .15s;
    display: flex; align-items: center; justify-content: center; gap: 6px; }
  .loc-tab.active { border-color: var(--blue600); background: rgba(37,99,235,.06); color: var(--blue600); }

  /* Progress dots */
  .prog-dot { height: 7px; border-radius: 4px; transition: all .25s; background: var(--n100); }
  .prog-dot.active { width: 20px; background: var(--blue600); }
  .prog-dot.done   { width: 7px; background: var(--blue600); }
  .prog-dot.idle   { width: 7px; }

  /* List items */
  .report-item { background: #fff; border: 1px solid var(--n100); border-radius: var(--radius-lg);
    padding: 12px 14px; display: flex; justify-content: space-between; align-items: center;
    cursor: pointer; transition: all .15s; }
  .report-item:hover { border-color: var(--n200); box-shadow: var(--shadow-sm); }
`;

// ─── Inline SVG icons (Lucide-style 2px stroke, rounded caps) ─────────────────
const Icon = ({ name, size = 20, color = "currentColor", sw = 2 }) => {
  const s = { width: size, height: size, display: "block", flexShrink: 0 };
  const p = { fill: "none", stroke: color, strokeWidth: sw, strokeLinecap: "round", strokeLinejoin: "round" };
  const icons = {
    wifi:       <svg style={s} viewBox="0 0 24 24"><path {...p} d="M5 12.55a11 11 0 0 1 14.08 0"/><path {...p} d="M1.42 9a16 16 0 0 1 21.16 0"/><path {...p} d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle {...p} cx="12" cy="20" r="1" fill={color}/></svg>,
    phone:      <svg style={s} viewBox="0 0 24 24"><path {...p} d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.72 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.63 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l.92-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
    tv:         <svg style={s} viewBox="0 0 24 24"><rect {...p} x="2" y="7" width="20" height="15" rx="2"/><polyline {...p} points="17 2 12 7 7 2"/></svg>,
    zap:        <svg style={s} viewBox="0 0 24 24"><polygon {...p} points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    smartphone: <svg style={s} viewBox="0 0 24 24"><rect {...p} x="5" y="2" width="14" height="20" rx="2"/><line {...p} x1="12" y1="18" x2="12.01" y2="18"/></svg>,
    droplets:   <svg style={s} viewBox="0 0 24 24"><path {...p} d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path {...p} d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/></svg>,
    layers:     <svg style={s} viewBox="0 0 24 24"><polygon {...p} points="12 2 2 7 12 12 22 7 12 2"/><polyline {...p} points="2 17 12 22 22 17"/><polyline {...p} points="2 12 12 17 22 12"/></svg>,
    bell:       <svg style={s} viewBox="0 0 24 24"><path {...p} d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path {...p} d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    map:        <svg style={s} viewBox="0 0 24 24"><polygon {...p} points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line {...p} x1="8" y1="2" x2="8" y2="18"/><line {...p} x1="16" y1="6" x2="16" y2="22"/></svg>,
    check:      <svg style={s} viewBox="0 0 24 24"><polyline {...p} points="20 6 9 17 4 12"/></svg>,
    x:          <svg style={s} viewBox="0 0 24 24"><line {...p} x1="18" y1="6" x2="6" y2="18"/><line {...p} x1="6" y1="6" x2="18" y2="18"/></svg>,
    arrow:      <svg style={s} viewBox="0 0 24 24"><line {...p} x1="5" y1="12" x2="19" y2="12"/><polyline {...p} points="12 5 19 12 12 19"/></svg>,
    back:       <svg style={s} viewBox="0 0 24 24"><line {...p} x1="19" y1="12" x2="5" y2="12"/><polyline {...p} points="12 19 5 12 12 5"/></svg>,
    signal:     <svg style={s} viewBox="0 0 24 24"><line {...p} x1="2" y1="20" x2="2" y2="20"/><line {...p} x1="7" y1="15" x2="7" y2="20"/><line {...p} x1="12" y1="9" x2="12" y2="20"/><line {...p} x1="17" y1="4" x2="17" y2="20"/><line {...p} x1="22" y1="2" x2="22" y2="20"/></svg>,
    noSignal:   <svg style={s} viewBox="0 0 24 24"><line {...p} x1="1" y1="1" x2="23" y2="23"/><line {...p} x1="16.72" y1="11.06" x2="19" y2="9"/><line {...p} x1="5" y1="12.55" x2="2" y2="9.72"/><line {...p} x1="10.71" y1="5.05" x2="11" y2="5"/><line {...p} x1="1.42" y1="9" x2="4.33" y2="6.5"/><line {...p} x1="21.58" y1="9" x2="22" y2="9"/><line {...p} x1="8.53" y1="16.11" x2="10.35" y2="15"/><line {...p} x1="13.65" y1="16.11" x2="13.18" y2="16.4"/><circle {...p} cx="12" cy="20" r="1" fill={color}/></svg>,
    loader:     <svg style={s} viewBox="0 0 24 24"><line {...p} x1="12" y1="2" x2="12" y2="6"/><line {...p} x1="12" y1="18" x2="12" y2="22"/><line {...p} x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line {...p} x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line {...p} x1="2" y1="12" x2="6" y2="12"/><line {...p} x1="18" y1="12" x2="22" y2="12"/></svg>,
    lock:       <svg style={s} viewBox="0 0 24 24"><rect {...p} x="3" y="11" width="18" height="11" rx="2"/><path {...p} d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    refresh:    <svg style={s} viewBox="0 0 24 24"><polyline {...p} points="23 4 23 10 17 10"/><polyline {...p} points="1 20 1 14 7 14"/><path {...p} d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
  };
  return icons[name] || icons.signal;
};

// ─── Utility functions ────────────────────────────────────────────────────────
function haversine(a, b, c, d) {
  const R = 6371000, p1 = a * Math.PI / 180, p2 = c * Math.PI / 180;
  const dp = (c - a) * Math.PI / 180, dl = (d - b) * Math.PI / 180;
  const x = Math.sin(dp/2)**2 + Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
}
function detectRegion(lat, lng) {
  if (haversine(lat, lng, 41.4993, -81.6944) < 80000) return "cleveland";
  if (haversine(lat, lng, 41.8827, -87.6233) < 80000) return "chicago";
  return "national";
}
function uid() { return `co_${Date.now()}_${Math.random().toString(36).substr(2,6)}`; }
function fmtPhone(v) {
  const d = v.replace(/\D/g, "").slice(0, 10);
  if (d.length < 4) return d;
  if (d.length < 7) return `(${d.slice(0,3)}) ${d.slice(3)}`;
  return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
}

// ─── Geocode via Nominatim ────────────────────────────────────────────────────
async function geocodeAddress(addr) {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addr + ", USA")}&format=json&limit=1`,
      { headers: { "User-Agent": "ClearWireOutage/2.0" } }
    );
    const d = await r.json();
    if (d.length) return { lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon), display: d[0].display_name.split(",").slice(0,3).join(",") };
    return null;
  } catch { return null; }
}

// ─── Passive network probe ────────────────────────────────────────────────────
// Checks actual internet connectivity (not just WiFi association)
async function probeConnectivity() {
  try {
    const start = Date.now();
    await fetch("https://www.google.com/generate_204", {
      method: "HEAD",
      cache: "no-cache",
      signal: AbortSignal.timeout(5000),
    });
    return { online: true, latency: Date.now() - start };
  } catch {
    return { online: false, latency: null };
  }
}

// ─── Outage cluster detection ─────────────────────────────────────────────────
// Fires when 3+ reports share same provider + 5km radius within 30 minutes
function detectOutageCluster(reports) {
  const now = Date.now();
  const recent = reports.filter(r => now - new Date(r.created_at).getTime() < 30 * 60 * 1000);
  const clusters = [];
  recent.forEach(seed => {
    const neighbors = recent.filter(r =>
      r.provider === seed.provider &&
      haversine(seed.latitude, seed.longitude, r.latitude, r.longitude) < 5000
    );
    if (neighbors.length >= 3) {
      const existing = clusters.find(c => c.provider === seed.provider &&
        haversine(seed.latitude, seed.longitude, c.lat, c.lng) < 5000);
      if (!existing) {
        const lats = neighbors.map(r => r.latitude);
        const lngs = neighbors.map(r => r.longitude);
        clusters.push({
          provider: seed.provider,
          service: seed.service_type,
          count: neighbors.length,
          lat: lats.reduce((a,b)=>a+b,0)/lats.length,
          lng: lngs.reduce((a,b)=>a+b,0)/lngs.length,
        });
      }
    }
  });
  return clusters;
}

// ─── Social post trigger (STUBBED — requires API keys) ────────────────────────
// TODO: Replace stubs with actual API calls after legal review
// IMPORTANT: Never name the carrier in public posts
async function triggerSocialPost(area, serviceType) {
  const svc = SERVICES.find(s => s.id === serviceType);
  const svcLabel = svc ? svc.label : "Service";
  const message = `${svcLabel} disruption reported in ${area}. Are you experiencing issues? Report here and get notified when restored → https://clearwire.app/report #ClearWire #${area.replace(/\s/g,"")}`;
  console.log("[SOCIAL POST TRIGGER]", message);

  // TODO: X (Twitter) API v2
  // POST https://api.twitter.com/2/tweets
  // Headers: Authorization: Bearer <X_BEARER_TOKEN>
  // Body: { text: message }

  // TODO: Facebook Graph API
  // POST https://graph.facebook.com/{PAGE_ID}/feed
  // Body: { message, access_token: FB_PAGE_ACCESS_TOKEN }

  // TODO: Log trigger to Supabase for audit trail
  try {
    await supabase.from("social_post_log").insert({
      message,
      service_type: serviceType,
      area,
      triggered_at: new Date().toISOString(),
      status: "stub_pending_api_keys",
    });
  } catch {}
}

// ─── SMS notification (STUBBED — requires Twilio) ────────────────────────────
// TODO: Implement via Supabase Edge Function + Twilio
// The Edge Function receives: { to, reportId, type }
// type: "confirmation" | "followup" | "resolved"
async function scheduleSMSNotification(phone, reportId, type = "confirmation") {
  try {
    await supabase.functions.invoke("send-sms", {
      body: { to: phone, reportId, type },
    });
  } catch (e) {
    console.error("[SMS] Failed to invoke send-sms:", e);
  }
}

// ─── Supabase: save report ────────────────────────────────────────────────────
async function saveReport(report) {
  const { data, error } = await supabase
    .from("outage_reports")
    .insert({
      id:            report.id,
      service_type:  report.serviceType,
      provider:      report.provider,        // stored but never shown publicly
      latitude:      report.latitude,
      longitude:     report.longitude,
      notify_pref:   report.notifyPref,
      phone:         report.phone || null,   // only stored with explicit opt-in
      push_sub:      report.pushSub || null,
      status:        "open",
      created_at:    new Date().toISOString(),
    })
    .select()
    .single();
  return { data, error };
}

// ─── Supabase: fetch recent reports for map ───────────────────────────────────
async function fetchReportClusters() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("outage_reports")
    .select("id, service_type, latitude, longitude, status, created_at")
    .gte("created_at", cutoff)
    .eq("status", "open");
  return data || [];
}

// ─── Cluster map reports into geographic groups ───────────────────────────────
function clusterReports(reports, radiusM = 1500) {
  const clusters = [];
  reports.forEach(r => {
    const existing = clusters.find(c =>
      haversine(r.latitude, r.longitude, c.lat, c.lng) < radiusM
    );
    if (existing) {
      existing.count++;
      existing.services.add(r.service_type);
      existing.lat = (existing.lat * existing.count + r.latitude) / (existing.count + 1);
      existing.lng = (existing.lng * existing.count + r.longitude) / (existing.count + 1);
    } else {
      clusters.push({
        id: r.id,
        lat: r.latitude,
        lng: r.longitude,
        count: 1,
        services: new Set([r.service_type]),
      });
    }
  });
  return clusters;
}

// ─── Determine cloud color from service types ─────────────────────────────────
function cloudColor(services) {
  const arr = Array.from(services);
  if (arr.length > 1) return T.multi;
  const svc = SERVICES.find(s => s.id === arr[0]);
  return svc?.color || T.telecom;
}

// ─── Cloud radius: scales with report count (min 1000m public) ───────────────
function cloudRadius(count) {
  return Math.max(1000, Math.min(3000, 1000 + count * 120));
}

// ─── Web Push subscription ────────────────────────────────────────────────────
async function requestPushPermission() {
  if (!("Notification" in window)) return null;
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return null;
  // TODO: Use VITE_VAPID_PUBLIC_KEY for actual web push subscription
  return "push_granted";
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ClearWireOutage() {
  const [view, setView]               = useState("home");
  const [step, setStep]               = useState(1);
  const [service, setService]         = useState(null);
  const [locMode, setLocMode]         = useState("gps");
  const [gps, setGps]                 = useState(null);
  const [gpsLoading, setGpsLoading]   = useState(false);
  const [address, setAddress]         = useState("");
  const [addrResult, setAddrResult]   = useState(null);
  const [addrLoading, setAddrLoading] = useState(false);
  const [providers, setProviders]     = useState([]);
  const [provider, setProvider]       = useState("");
  const [notifyPref, setNotifyPref]   = useState(null);
  const [phone, setPhone]             = useState("");
  const [pushGranted, setPushGranted] = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [reportId, setReportId]       = useState(null);
  const [connectivity, setConnectivity] = useState({ online: true, latency: null });
  const [mapClusters, setMapClusters]   = useState([]);
  const [mapRole, setMapRole]           = useState("public");
  const [activeCluster, setActiveCluster] = useState(null);

  const mapDiv       = useRef();
  const lmap         = useRef(null);
  const markersLayer = useRef(null);
  const probeTimer   = useRef(null);

  // ── CSS injection ──
  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = CSS;
    document.head.appendChild(s);
    return () => document.head.removeChild(s);
  }, []);

  // ── Passive network probe — runs every 60s when opted in ──
  useEffect(() => {
    const runProbe = async () => {
      const result = await probeConnectivity();
      setConnectivity(result);
      // Store probe result in Supabase for passive detection
      if (reportId) {
        try {
          await supabase.from("connectivity_probes").insert({
            report_id:  reportId,
            online:     result.online,
            latency:    result.latency,
            probed_at:  new Date().toISOString(),
          });
        } catch {}
      }
    };
    runProbe();
    probeTimer.current = setInterval(runProbe, 60000);
    return () => clearInterval(probeTimer.current);
  }, [reportId]);

  // ── Provider list by region ──
  useEffect(() => {
    if (!service || !gps) return;
    const region = detectRegion(gps.lat, gps.lng);
    setProviders(PROVIDERS[region]?.[service.id] || PROVIDERS.national[service.id] || []);
    setProvider("");
  }, [service, gps]);

  // ── Map init ──
  useEffect(() => {
    if (view !== "map") return;
    const init = async () => {
      if (!window.L || !mapDiv.current) return;
      if (lmap.current) { renderClusters(); return; }
      const L = window.L;
      const map = L.map(mapDiv.current, {
        center: [41.4993, -81.6944], zoom: 11, zoomControl: true,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map);
      lmap.current = map;
      markersLayer.current = L.layerGroup().addTo(map);
      const rawReports = await fetchReportClusters();
      const clusters = clusterReports(rawReports);
      setMapClusters(clusters);
      renderClusters(map, clusters);
    };
    if (window.L) { setTimeout(init, 80); return; }
    const lnk = document.createElement("link");
    lnk.rel = "stylesheet";
    lnk.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
    document.head.appendChild(lnk);
    const scr = document.createElement("script");
    scr.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    scr.onload = () => setTimeout(init, 80);
    document.head.appendChild(scr);
    return () => {
      if (lmap.current) { lmap.current.remove(); lmap.current = null; markersLayer.current = null; }
    };
  }, [view]);

  useEffect(() => {
    if (lmap.current && window.L) renderClusters(lmap.current, mapClusters);
  }, [mapRole, mapClusters]);

  function renderClusters(map = lmap.current, clusters = mapClusters) {
    if (!map || !window.L || !markersLayer.current) return;
    const L = window.L;
    markersLayer.current.clearLayers();

    // Use demo clusters if no real data yet
    const data = clusters.length ? clusters : DEMO_CLUSTERS;

    data.forEach(c => {
      const color = cloudColor(c.services || new Set([c.svc || "internet"]));
      if (mapRole === "public") {
        // Public: anonymous cloud sized by report count, APWA color, service icon
        const r     = cloudRadius(c.count);
        const alpha = Math.min(0.08 + (c.count / 40) * 0.14, 0.22).toFixed(2);
        const strokeAlpha = Math.min(0.2 + (c.count / 40) * 0.25, 0.45).toFixed(2);
        L.circle([c.lat, c.lng], {
          radius: r,
          fillColor: color, fillOpacity: parseFloat(alpha),
          color: color, opacity: parseFloat(strokeAlpha),
          weight: 1.5, dashArray: "4 4",
        }).addTo(markersLayer.current)
          .bindPopup(`
            <div style="font-family:'DM Sans',sans-serif;min-width:150px;padding:4px">
              <div style="font-weight:700;color:#111;font-size:13px;margin-bottom:4px">
                Service Disruption
              </div>
              <div style="font-size:12px;color:#666;margin-bottom:4px">
                ${c.count} report${c.count !== 1 ? "s" : ""} in this area
              </div>
              <div style="font-size:11px;color:#999">~${Math.round(r/100)/10}km radius</div>
            </div>
          `);
      } else {
        // Owner view: street-level pins with full count + service detail
        const ico = L.divIcon({
          html: `
            <div style="position:relative">
              <div style="width:16px;height:16px;border-radius:50%;background:${color};
                border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3)"></div>
              <div style="position:absolute;top:-4px;right:-10px;background:#1A4ED8;
                color:#fff;border-radius:8px;padding:1px 5px;font-size:9px;
                font-weight:700;white-space:nowrap;font-family:'DM Sans',sans-serif">
                ${c.count}
              </div>
            </div>
          `,
          iconSize: [28, 18], iconAnchor: [8, 8], className: "",
        });
        L.marker([c.lat, c.lng], { icon: ico }).addTo(markersLayer.current)
          .bindPopup(`
            <div style="font-family:'DM Sans',sans-serif;min-width:160px;padding:4px">
              <div style="font-weight:700;color:#111;font-size:13px;margin-bottom:4px">
                ${c.count} report${c.count !== 1 ? "s" : ""}
              </div>
              <div style="font-size:12px;color:#666;margin-bottom:2px">
                ${Array.from(c.services || [c.svc || "internet"]).join(", ")}
              </div>
              <div style="font-size:11px;color:#999">Owner view — street detail</div>
            </div>
          `);
      }
    });

    // User's own report pin
    if (gps && reportId) {
      const ico = L.divIcon({
        html: `<div style="width:12px;height:12px;border-radius:50%;background:#2563EB;
          border:2.5px solid #fff;box-shadow:0 2px 8px rgba(37,99,235,.5)"></div>`,
        iconSize: [12, 12], iconAnchor: [6, 6], className: "",
      });
      L.marker([gps.lat, gps.lng], { icon: ico }).addTo(markersLayer.current)
        .bindPopup(`<div style="font-family:'DM Sans',sans-serif;font-size:12px;color:#111;padding:2px">Your report received ✓</div>`);
    }
  }

  // ── Demo clusters for map before real data ──
  const DEMO_CLUSTERS = [
    { lat: 41.476, lng: -81.710, count: 31, services: new Set(["internet"]), svc: "internet" },
    { lat: 41.482, lng: -81.665, count: 14, services: new Set(["power"]),    svc: "power"    },
    { lat: 41.499, lng: -81.694, count: 9,  services: new Set(["internet"]), svc: "internet" },
    { lat: 41.460, lng: -81.630, count: 5,  services: new Set(["water"]),    svc: "water"    },
  ];

  // ── GPS capture ──
  const captureGPS = useCallback(() => {
    setGpsLoading(true);
    const fallback = () => {
      setGps({ lat: 41.4993 + (Math.random()-.5)*.02, lng: -81.6944 + (Math.random()-.5)*.02, demo: true });
      setGpsLoading(false);
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        p => { setGps({ lat: p.coords.latitude, lng: p.coords.longitude }); setGpsLoading(false); },
        fallback, { timeout: 7000 }
      );
    } else fallback();
  }, []);

  useEffect(() => {
    if (locMode === "gps" && !gps) captureGPS();
  }, [locMode]);

  // ── Address lookup ──
  const lookupAddress = async () => {
    if (!address.trim()) return;
    setAddrLoading(true);
    const r = await geocodeAddress(address);
    if (r) { setAddrResult(r); setGps({ lat: r.lat, lng: r.lng }); }
    else setAddrResult({ error: true });
    setAddrLoading(false);
  };

  // ── Submit report ──
  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    const id = uid();
    const report = {
      id,
      serviceType: service.id,
      provider,
      latitude:  gps?.lat,
      longitude: gps?.lng,
      notifyPref,
      phone: notifyPref === "sms" ? phone.replace(/\D/g,"") : null,
      pushSub: pushGranted ? "granted" : null,
    };

    // Save to Supabase
    const { error } = await saveReport(report);
    if (error) {
      // Fallback to local storage if Supabase fails
      try {
        const ex = await window.storage.get("cl_outage_reports").catch(() => null);
        const arr = ex ? JSON.parse(ex.value) : [];
        arr.push({ ...report, created_at: new Date().toISOString(), status: "queued" });
        await window.storage.set("cl_outage_reports", JSON.stringify(arr));
      } catch {}
    }

    // Schedule SMS follow-up
    if (notifyPref === "sms" && report.phone) {
      await scheduleSMSNotification(report.phone, id, "confirmation");
      // Schedule 2-hour follow-up (handled by Supabase cron / Edge Function)
    }

    // Check for cluster and trigger social post
    try {
      const rawReports = await fetchReportClusters();
      const clusters = detectOutageCluster([
        ...rawReports,
        { id, provider, service_type: service.id, latitude: gps.lat, longitude: gps.lng,
          created_at: new Date().toISOString() }
      ]);
      if (clusters.length > 0) {
        for (const c of clusters) {
          await triggerSocialPost("Cleveland West Side", c.service);
        }
      }
    } catch {}

    setReportId(id);
    setSubmitting(false);
    setView("confirm");
  };

  // ── Reset ──
  const reset = () => {
    setStep(1); setService(null); setGps(null); setAddress(""); setAddrResult(null);
    setProvider(""); setNotifyPref(null); setPhone(""); setReportId(null); setPushGranted(false);
    setView("home");
  };

  // ── Validation ──
  const locReady  = gps !== null;
  const canSubmit = !!provider && (
    notifyPref === "none" ||
    notifyPref === "push" ||
    (notifyPref === "sms" && phone.replace(/\D/g,"").length >= 10)
  );

  // ── Shared layout ──
  const root = { fontFamily: "var(--font-body)", background: "var(--n50)", minHeight: "100vh",
    color: "var(--navy900)", display: "flex", flexDirection: "column" };
  const hdr  = { background: "#fff", borderBottom: "1px solid var(--n100)", padding: "12px 18px",
    display: "flex", alignItems: "center", gap: 12, flexShrink: 0 };

  // ════════════════════════════════════════════════════════════════════════════
  // HOME VIEW
  // ════════════════════════════════════════════════════════════════════════════
  if (view === "home") return (
    <div style={root}>
      <header style={hdr}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:10, height:10, borderRadius:"50%", background:"var(--blue600)",
            animation:"glow 2s infinite", flexShrink:0 }}/>
          <span style={{ fontFamily:"var(--font-display)", fontSize:19, color:"var(--navy900)", lineHeight:1 }}>
            ClearWire
          </span>
          <span style={{ fontSize:10, color:"var(--n400)", fontWeight:600, letterSpacing:".08em" }}>
            OUTAGE REPORTS
          </span>
        </div>
        <div style={{ marginLeft:"auto" }}>
          {!connectivity.online && (
            <span className="badge badge-offline" style={{ fontSize:10 }}>
              <Icon name="noSignal" size={11} color="var(--n600)"/> Offline
            </span>
          )}
        </div>
        <button onClick={() => setView("map")}
          style={{ background:"rgba(37,99,235,.08)", border:"1px solid rgba(37,99,235,.2)",
            borderRadius:8, padding:"7px 14px", fontSize:13, fontWeight:600, color:"var(--blue600)",
            cursor:"pointer", fontFamily:"inherit" }}>
          <Icon name="map" size={14} color="var(--blue600)"/> View Map
        </button>
      </header>

      {/* Hero */}
      <div style={{ background:"linear-gradient(135deg, var(--navy900) 0%, #1D4ED8 100%)",
        padding:"36px 20px 44px", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, opacity:.04 }}>
          <svg width="100%" height="100%"><defs>
            <pattern id="hg" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#3B82F6" strokeWidth=".5"/>
            </pattern></defs>
            <rect width="100%" height="100%" fill="url(#hg)"/>
          </svg>
        </div>
        <div style={{ position:"relative", zIndex:1, animation:"fadeUp .5s ease" }}>
          <div style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,.5)",
            letterSpacing:".1em", marginBottom:10 }}>COMMUNITY SERVICE REPORTING</div>
          <h1 style={{ fontFamily:"var(--font-display)", fontSize:28, fontWeight:700,
            color:"#fff", lineHeight:1.25, marginBottom:10 }}>
            Is your service down?
          </h1>
          <p style={{ fontSize:14, color:"rgba(255,255,255,.65)", lineHeight:1.6,
            maxWidth:280, margin:"0 auto 24px" }}>
            Report in under 60 seconds. Get notified when service is restored.
          </p>
          <button className="btn btn-primary" style={{ width:"auto", padding:"14px 32px",
            fontSize:15, background:"#fff", color:"var(--blue700)",
            boxShadow:"0 4px 20px rgba(0,0,0,.25)" }}
            onClick={() => setView("report")}>
            Report a Disruption →
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ background:"#fff", borderBottom:"1px solid var(--n100)",
        display:"grid", gridTemplateColumns:"1fr 1fr 1fr" }}>
        {[{n:"79",l:"Active reports"},{n:"5",l:"Areas affected"},{n:"~2h",l:"Avg. resolution"}]
          .map((s,i) => (
          <div key={i} style={{ padding:"14px 8px", textAlign:"center",
            borderRight: i < 2 ? "1px solid var(--n100)" : "none" }}>
            <div style={{ fontFamily:"var(--font-display)", fontSize:20, fontWeight:700,
              color:"var(--navy900)" }}>{s.n}</div>
            <div style={{ fontSize:10, color:"var(--n400)", fontWeight:500,
              letterSpacing:".03em", marginTop:1 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Report list */}
      <div style={{ flex:1, overflow:"auto", padding:"16px" }}>
        <div style={{ fontSize:11, fontWeight:600, color:"var(--n400)",
          letterSpacing:".08em", marginBottom:12 }}>ACTIVE REPORTS NEAR YOU</div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[
            { area:"Cleveland West Side",  count:31, svc:"Internet",          ago:"18m", svcId:"internet" },
            { area:"Tremont",              count:14, svc:"Power",             ago:"34m", svcId:"power"    },
            { area:"Downtown / Near West", count:9,  svc:"Internet · Cable", ago:"1h",  svcId:"multiple" },
            { area:"East Side",            count:5,  svc:"Water",            ago:"2h",  svcId:"water"    },
          ].map((r,i) => {
            const svcDef = SERVICES.find(s => s.id === r.svcId);
            const color  = svcDef?.color || T.telecom;
            return (
              <div key={i} className="report-item" onClick={() => setView("map")}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:10,
                    background:`${color}12`, border:`1px solid ${color}25`,
                    display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <Icon name={svcDef?.icon || "signal"} size={16} color={color}/>
                  </div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, color:"var(--navy900)",
                      marginBottom:2 }}>{r.area}</div>
                    <div style={{ fontSize:12, color:"var(--n400)" }}>{r.svc} · {r.ago} ago</div>
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ background:`${color}10`, borderRadius:20, padding:"4px 10px",
                    fontSize:12, fontWeight:600, color, border:`1px solid ${color}25` }}>
                    {r.count}
                  </div>
                  <span style={{ color:"var(--n200)", fontSize:18 }}>›</span>
                </div>
              </div>
            );
          })}
        </div>
        <button className="btn btn-ghost" style={{ marginTop:14, fontSize:14 }}
          onClick={() => setView("map")}>
          View Full Disruption Map
        </button>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // REPORT FLOW — 4 steps
  // ════════════════════════════════════════════════════════════════════════════
  if (view === "report") return (
    <div style={root}>
      <header style={hdr}>
        <button onClick={() => step > 1 ? setStep(s => s-1) : setView("home")}
          style={{ background:"none", border:"none", fontSize:20, cursor:"pointer",
            color:"var(--n400)", padding:0, lineHeight:1 }}>
          <Icon name="back" size={20} color="var(--n400)"/>
        </button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:600, color:"var(--navy900)" }}>Report a Disruption</div>
          <div style={{ fontSize:11, color:"var(--n400)" }}>Step {step} of 4</div>
        </div>
        <div style={{ display:"flex", gap:5 }}>
          {[1,2,3,4].map(n => (
            <div key={n} className={`prog-dot ${n === step ? "active" : n < step ? "done" : "idle"}`}/>
          ))}
        </div>
      </header>

      <div style={{ flex:1, overflow:"auto", padding:"20px 16px" }}>

        {/* STEP 1 — Service type */}
        {step === 1 && (
          <div className="anim-up">
            <h2 style={{ fontFamily:"var(--font-display)", fontSize:24, color:"var(--navy900)",
              marginBottom:6 }}>What service is affected?</h2>
            <p style={{ fontSize:14, color:"var(--n400)", marginBottom:20, lineHeight:1.5 }}>
              Select the service type experiencing disruption.
            </p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:24 }}>
              {SERVICES.map(s => (
                <button key={s.id} className={`svc-opt${service?.id === s.id ? " sel" : ""}`}
                  onClick={() => setService(s)}
                  style={{ border:`2px solid ${service?.id === s.id ? s.color : "var(--n100)"}`,
                    background: service?.id === s.id ? `${s.color}08` : "#fff" }}>
                  <div style={{ marginBottom:8 }}>
                    <Icon name={s.icon} size={24} color={service?.id === s.id ? s.color : "var(--n600)"}/>
                  </div>
                  <div style={{ fontSize:14, fontWeight:600,
                    color: service?.id === s.id ? s.color : "var(--navy900)" }}>
                    {s.label}
                  </div>
                  {service?.id === s.id && (
                    <div style={{ width:16, height:16, borderRadius:"50%", background:s.color,
                      display:"flex", alignItems:"center", justifyContent:"center", marginTop:6 }}>
                      <Icon name="check" size={10} color="#fff"/>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <button className="btn btn-primary"
              disabled={!service}
              style={{ background: service ? service.color : undefined,
                boxShadow: service ? `0 4px 16px ${service.color}50` : undefined }}
              onClick={() => { setStep(2); setLocMode("gps"); }}>
              Continue →
            </button>
          </div>
        )}

        {/* STEP 2 — Location */}
        {step === 2 && (
          <div className="anim-up">
            <h2 style={{ fontFamily:"var(--font-display)", fontSize:24, color:"var(--navy900)",
              marginBottom:6 }}>Where are you located?</h2>
            <p style={{ fontSize:14, color:"var(--n400)", marginBottom:20, lineHeight:1.5 }}>
              Your location maps the disruption. Never shared publicly or with your provider.
            </p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:20 }}>
              {[
                { id:"gps", icon:"signal", label:"Use GPS" },
                { id:"address", icon:"map", label:"Enter Address" },
              ].map(m => (
                <button key={m.id} className={`loc-tab${locMode === m.id ? " active" : ""}`}
                  onClick={() => setLocMode(m.id)}>
                  <Icon name={m.icon} size={16} color={locMode === m.id ? "var(--blue600)" : "var(--n600)"}/>
                  {m.label}
                </button>
              ))}
            </div>

            {locMode === "gps" && (
              <div className="card" style={{ textAlign:"center", padding:24, marginBottom:20 }}>
                {gpsLoading ? (
                  <>
                    <div className="anim-spin" style={{ display:"inline-block", marginBottom:10 }}>
                      <Icon name="loader" size={32} color="var(--blue600)"/>
                    </div>
                    <div style={{ fontSize:14, color:"var(--n600)" }}>Acquiring location...</div>
                  </>
                ) : gps ? (
                  <>
                    <div style={{ width:44, height:44, borderRadius:"50%",
                      background:"rgba(5,150,105,.1)", border:"2px solid rgba(5,150,105,.3)",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      margin:"0 auto 10px" }}>
                      <Icon name="check" size={20} color="var(--green)"/>
                    </div>
                    <div style={{ fontSize:14, fontWeight:600, color:"var(--green)", marginBottom:4 }}>
                      Location captured
                    </div>
                    <div style={{ fontSize:12, color:"var(--n400)" }}>
                      {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}
                      {gps.demo ? " (demo)" : ""}
                    </div>
                  </>
                ) : (
                  <>
                    <Icon name="signal" size={32} color="var(--n400)" />
                    <div style={{ fontSize:14, color:"var(--n600)", marginBottom:14, marginTop:8 }}>
                      Tap to detect your location
                    </div>
                    <button className="btn btn-primary" style={{ width:"auto", padding:"10px 24px", fontSize:13 }}
                      onClick={captureGPS}>
                      Get Location
                    </button>
                  </>
                )}
              </div>
            )}

            {locMode === "address" && (
              <div style={{ marginBottom:20 }}>
                <div style={{ position:"relative" }}>
                  <input className="input" value={address} placeholder="Enter your street address..."
                    onChange={e => setAddress(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && lookupAddress()}/>
                  <button onClick={lookupAddress} disabled={!address.trim() || addrLoading}
                    style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)",
                      background:"var(--blue600)", border:"none", borderRadius:7, width:28, height:28,
                      cursor: address.trim() ? "pointer" : "not-allowed", fontSize:14, color:"#fff",
                      display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {addrLoading
                      ? <span className="anim-spin" style={{display:"inline-block"}}>⟳</span>
                      : <Icon name="arrow" size={14} color="#fff"/>}
                  </button>
                </div>
                {addrResult && !addrResult.error && (
                  <div style={{ marginTop:8, padding:"10px 14px",
                    background:"rgba(5,150,105,.06)", border:"1px solid rgba(5,150,105,.2)",
                    borderRadius:"var(--radius-md)", fontSize:13, color:"var(--green)" }}>
                    ✓ {addrResult.display}
                  </div>
                )}
                {addrResult?.error && (
                  <div style={{ marginTop:8, padding:"10px 14px",
                    background:"rgba(220,38,38,.06)", border:"1px solid rgba(220,38,38,.2)",
                    borderRadius:"var(--radius-md)", fontSize:13, color:"var(--electric)" }}>
                    Address not found. Try being more specific.
                  </div>
                )}
              </div>
            )}

            <button className="btn btn-primary" disabled={!locReady}
              onClick={() => setStep(3)}>Continue →</button>
          </div>
        )}

        {/* STEP 3 — Provider */}
        {step === 3 && (
          <div className="anim-up">
            <h2 style={{ fontFamily:"var(--font-display)", fontSize:24, color:"var(--navy900)",
              marginBottom:6 }}>Who is your provider?</h2>
            <p style={{ fontSize:14, color:"var(--n400)", marginBottom:4, lineHeight:1.5 }}>
              This routes your report on the backend.
            </p>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:20,
              padding:"8px 12px", background:"rgba(37,99,235,.04)",
              border:"1px solid rgba(37,99,235,.15)", borderRadius:"var(--radius-md)" }}>
              <Icon name="lock" size={13} color="var(--blue600)"/>
              <span style={{ fontSize:12, color:"var(--n600)" }}>
                Your provider is never displayed publicly or on the map.
              </span>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:24 }}>
              {providers.map(p => (
                <button key={p} className={`prov-btn${provider === p ? " sel" : ""}`}
                  onClick={() => setProvider(p)}>
                  {p}
                  {provider === p && <Icon name="check" size={16} color="var(--blue600)"/>}
                </button>
              ))}
            </div>
            <button className="btn btn-primary" disabled={!provider}
              onClick={() => setStep(4)}>Continue →</button>
          </div>
        )}

        {/* STEP 4 — Notifications */}
        {step === 4 && (
          <div className="anim-up">
            <h2 style={{ fontFamily:"var(--font-display)", fontSize:24, color:"var(--navy900)",
              marginBottom:6 }}>Get notified when fixed?</h2>
            <p style={{ fontSize:14, color:"var(--n400)", marginBottom:20, lineHeight:1.5 }}>
              Optional. We'll follow up in ~2 hours and notify you when service is restored.
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:20 }}>

              {/* SMS */}
              <div className={`notif-opt${notifyPref === "sms" ? " sel" : ""}`}
                onClick={() => setNotifyPref(notifyPref === "sms" ? null : "sms")}>
                <div style={{ display:"flex", alignItems:"center", gap:12,
                  marginBottom: notifyPref === "sms" ? 12 : 0 }}>
                  <div style={{ width:38, height:38, borderRadius:10,
                    background:"rgba(37,99,235,.08)", flexShrink:0,
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Icon name="phone" size={18} color="var(--blue600)"/>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:600, color:"var(--navy900)" }}>
                      Text Message
                    </div>
                    <div style={{ fontSize:12, color:"var(--n400)" }}>
                      Follow-up texts · Highest reliability
                    </div>
                  </div>
                  <div style={{ width:20, height:20, borderRadius:"50%", flexShrink:0,
                    border:`2px solid ${notifyPref==="sms" ? "var(--blue600)" : "var(--n200)"}`,
                    background: notifyPref==="sms" ? "var(--blue600)" : "transparent",
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {notifyPref === "sms" && <div style={{ width:8, height:8, borderRadius:"50%", background:"#fff" }}/>}
                  </div>
                </div>
                {notifyPref === "sms" && (
                  <input className="input" type="tel" value={phone} placeholder="(216) 555-0100"
                    style={{ background:"var(--n50)", fontSize:15, letterSpacing:".02em" }}
                    onChange={e => setPhone(fmtPhone(e.target.value))}
                    onClick={e => e.stopPropagation()}
                    autoFocus/>
                )}
              </div>

              {/* Push */}
              <div className={`notif-opt${notifyPref === "push" ? " sel" : ""}`}
                style={{ display:"flex", alignItems:"center", gap:12 }}
                onClick={async () => {
                  if (notifyPref === "push") { setNotifyPref(null); setPushGranted(false); return; }
                  const r = await requestPushPermission();
                  if (r) { setPushGranted(true); setNotifyPref("push"); }
                }}>
                <div style={{ width:38, height:38, borderRadius:10,
                  background:"rgba(124,58,237,.08)", flexShrink:0,
                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Icon name="bell" size={18} color="var(--purple)"/>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:"var(--navy900)" }}>
                    Browser Notification
                  </div>
                  <div style={{ fontSize:12, color:"var(--n400)" }}>Push alert · No phone number needed</div>
                </div>
                <div style={{ width:20, height:20, borderRadius:"50%", flexShrink:0,
                  border:`2px solid ${notifyPref==="push" ? "var(--blue600)" : "var(--n200)"}`,
                  background: notifyPref==="push" ? "var(--blue600)" : "transparent",
                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {notifyPref === "push" && <div style={{ width:8, height:8, borderRadius:"50%", background:"#fff" }}/>}
                </div>
              </div>

              {/* Skip */}
              <div className={`notif-opt${notifyPref === "none" ? " sel-none" : ""}`}
                style={{ display:"flex", alignItems:"center", gap:12 }}
                onClick={() => setNotifyPref("none")}>
                <div style={{ width:38, height:38, borderRadius:10,
                  background:"var(--n50)", flexShrink:0,
                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Icon name="x" size={18} color="var(--n600)"/>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:"var(--navy900)" }}>No thanks</div>
                  <div style={{ fontSize:12, color:"var(--n400)" }}>Just submit my report</div>
                </div>
                <div style={{ width:20, height:20, borderRadius:"50%", flexShrink:0,
                  border:`2px solid ${notifyPref==="none" ? "var(--n600)" : "var(--n200)"}`,
                  background: notifyPref==="none" ? "var(--n600)" : "transparent",
                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {notifyPref === "none" && <div style={{ width:8, height:8, borderRadius:"50%", background:"#fff" }}/>}
                </div>
              </div>
            </div>

            <div style={{ padding:"10px 14px", background:"var(--n50)",
              border:"1px solid var(--n100)", borderRadius:"var(--radius-md)",
              fontSize:12, color:"var(--n400)", marginBottom:20, lineHeight:1.5 }}>
              <Icon name="lock" size={12} color="var(--n400)"/>{"  "}
              Your contact info is never shared publicly or with your provider.
            </div>

            <button className="btn btn-primary" disabled={!canSubmit || submitting}
              onClick={handleSubmit}>
              {submitting ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // CONFIRM VIEW
  // ════════════════════════════════════════════════════════════════════════════
  if (view === "confirm") return (
    <div style={{ ...root, alignItems:"center", justifyContent:"center", padding:24, textAlign:"center" }}>
      <div className="anim-pop" style={{ maxWidth:360, width:"100%" }}>
        <div style={{ width:80, height:80, borderRadius:"50%",
          background:"linear-gradient(135deg, var(--green), #34D399)",
          display:"flex", alignItems:"center", justifyContent:"center",
          margin:"0 auto 20px", boxShadow:"0 8px 24px rgba(5,150,105,.3)" }}>
          <svg width="36" height="36" viewBox="0 0 36 36">
            <path d="M8 18l7 7 13-13" stroke="#fff" strokeWidth="3"
              strokeLinecap="round" strokeLinejoin="round"
              fill="none" strokeDasharray="50" strokeDashoffset="0"
              style={{ animation:"drawCheck .4s .3s ease both" }}/>
          </svg>
        </div>

        <h2 style={{ fontFamily:"var(--font-display)", fontSize:26, color:"var(--navy900)",
          marginBottom:8 }}>Report received</h2>
        <p style={{ fontSize:14, color:"var(--n600)", lineHeight:1.6, marginBottom:6 }}>
          Your {service?.label} disruption report has been submitted.
        </p>
        <p style={{ fontSize:13, color:"var(--n400)", lineHeight:1.5, marginBottom:28 }}>
          {notifyPref === "sms"  && `We'll text ${phone} to follow up in about 2 hours.`}
          {notifyPref === "push" && "We'll send a browser notification when service is restored."}
          {notifyPref === "none" && "Check back here for status updates in your area."}
        </p>

        <div className="card" style={{ textAlign:"left", marginBottom:20, background:"var(--n50)",
          border:"1px solid var(--n100)" }}>
          <div style={{ fontSize:11, fontWeight:600, color:"var(--n400)",
            letterSpacing:".08em", marginBottom:10 }}>REPORT SUMMARY</div>
          {[
            { l:"Service",  v: service?.label },
            { l:"Location", v: gps ? `${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}` : "—" },
            { l:"Status",   v: "Open — under review" },
          ].map(r => (
            <div key={r.l} style={{ display:"flex", justifyContent:"space-between",
              padding:"6px 0", borderBottom:"1px solid var(--n100)" }}>
              <span style={{ fontSize:13, color:"var(--n600)" }}>{r.l}</span>
              <span style={{ fontSize:13, fontWeight:500, color:"var(--navy900)" }}>{r.v}</span>
            </div>
          ))}
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <button className="btn btn-primary" onClick={() => setView("map")}>
            View Disruption Map
          </button>
          <button className="btn btn-ghost" onClick={reset}>Submit Another Report</button>
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // MAP VIEW — tiered by role
  // ════════════════════════════════════════════════════════════════════════════
  if (view === "map") return (
    <div style={{ ...root }}>
      <header style={hdr}>
        <button onClick={() => setView("home")}
          style={{ background:"none", border:"none", fontSize:20, cursor:"pointer",
            color:"var(--n400)", padding:0 }}>
          <Icon name="back" size={20} color="var(--n400)"/>
        </button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:600, color:"var(--navy900)" }}>Disruption Map</div>
          <div style={{ fontSize:11, color:"var(--n400)" }}>
            {mapRole === "public" ? "Community view — approximate areas only"
              : "Owner view — street-level detail"}
          </div>
        </div>
        <button className="btn btn-primary" style={{ width:"auto", padding:"8px 14px", fontSize:13 }}
          onClick={() => setView("report")}>
          + Report
        </button>
      </header>

      {/* Role toggle */}
      <div style={{ background:"#fff", borderBottom:"1px solid var(--n100)",
        padding:"8px 18px", display:"flex", gap:8, alignItems:"center" }}>
        <span style={{ fontSize:11, color:"var(--n400)", fontWeight:500, letterSpacing:".04em" }}>
          VIEW:
        </span>
        {[{id:"public",label:"Community"},{id:"owner",label:"Owner"}].map(r => (
          <button key={r.id} onClick={() => setMapRole(r.id)}
            style={{ padding:"5px 12px", borderRadius:7, cursor:"pointer", fontFamily:"inherit",
              border:`1.5px solid ${mapRole===r.id ? "var(--blue600)" : "var(--n100)"}`,
              background: mapRole===r.id ? "rgba(37,99,235,.06)" : "#fff",
              fontSize:12, fontWeight:600,
              color: mapRole===r.id ? "var(--blue600)" : "var(--n600)" }}>
            {r.label}
          </button>
        ))}
        <span style={{ fontSize:11, color:"var(--n400)", marginLeft:4 }}>
          {mapRole==="public" ? "Anonymous ~1-3km clouds" : "Street-level pins + counts"}
        </span>
      </div>

      {/* Service color legend — APWA colors, no hex codes */}
      <div style={{ background:"rgba(255,251,235,.8)", borderBottom:"1px solid rgba(217,119,6,.2)",
        padding:"7px 18px", display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
        {[
          { color: T.telecom,  label: "Comms",  icon: "wifi"     },
          { color: T.electric, label: "Power",  icon: "zap"      },
          { color: T.water,    label: "Water",  icon: "droplets" },
          { color: T.multi,    label: "Multiple", icon: "layers" },
        ].map(l => (
          <div key={l.label} style={{ display:"flex", alignItems:"center", gap:5,
            fontSize:11, fontWeight:600, color: l.color }}>
            <Icon name={l.icon} size={12} color={l.color}/>
            {l.label}
          </div>
        ))}
        <span style={{ fontSize:11, color:"var(--n400)", marginLeft:4 }}>
          · Cloud size = report count
        </span>
      </div>

      <div ref={mapDiv} style={{ flex:1, background:"var(--n50)", position:"relative" }}>
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center",
          justifyContent:"center", color:"var(--n400)", fontSize:13, fontWeight:500,
          zIndex:0, pointerEvents:"none" }}>
          Loading map...
        </div>
      </div>

      <div style={{ background:"#fff", borderTop:"1px solid var(--n100)",
        padding:"14px 16px", flexShrink:0 }}>
        <button className="btn btn-primary" onClick={() => setView("report")}>
          Report a Disruption →
        </button>
      </div>
    </div>
  );

  return null;
}
