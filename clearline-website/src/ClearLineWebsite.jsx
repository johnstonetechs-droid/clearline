import { useState, useEffect, useRef } from "react";

const T = {
  navy900:"#0A1628",navy800:"#0F2040",navy700:"#162952",
  blue700:"#1A4ED8",blue600:"#2563EB",blue400:"#3B82F6",
  white:"#FFFFFF",offwhite:"#F0F4F8",
  telecom:"#EA580C",electric:"#DC2626",water:"#2563EB",
  green:"#059669",amber:"#D97706",
  neutral900:"#1E2D3D",neutral800:"#2D3F52",neutral600:"#4A6080",
  neutral400:"#7A94AE",neutral200:"#B0C4D4",neutral100:"#E2EBF0",neutral50:"#F0F4F8",
};

const BlueprintGrid = ({opacity=0.04,color="#2563EB"})=>(
  <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="gsm" width="24" height="24" patternUnits="userSpaceOnUse">
        <path d="M 24 0 L 0 0 0 24" fill="none" stroke={color} strokeWidth="0.5" opacity={opacity}/>
      </pattern>
      <pattern id="glg" width="120" height="120" patternUnits="userSpaceOnUse">
        <path d="M 120 0 L 0 0 0 120" fill="none" stroke={color} strokeWidth="1" opacity={opacity*1.5}/>
        <rect width="120" height="120" fill="url(#gsm)"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#glg)"/>
  </svg>
);

const Icon=({name,size=24,color="currentColor",strokeWidth=2})=>{
  const s={width:size,height:size,display:"block",flexShrink:0};
  const p={fill:"none",stroke:color,strokeWidth,strokeLinecap:"round",strokeLinejoin:"round"};
  const icons={
    wifi:<svg style={s} viewBox="0 0 24 24"><path {...p} d="M5 12.55a11 11 0 0 1 14.08 0"/><path {...p} d="M1.42 9a16 16 0 0 1 21.16 0"/><path {...p} d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle {...p} cx="12" cy="20" r="1" fill={color}/></svg>,
    zap:<svg style={s} viewBox="0 0 24 24"><polygon {...p} points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    phone:<svg style={s} viewBox="0 0 24 24"><path {...p} d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.72 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.63 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
    tv:<svg style={s} viewBox="0 0 24 24"><rect {...p} x="2" y="7" width="20" height="15" rx="2"/><polyline {...p} points="17 2 12 7 7 2"/></svg>,
    smartphone:<svg style={s} viewBox="0 0 24 24"><rect {...p} x="5" y="2" width="14" height="20" rx="2"/><line {...p} x1="12" y1="18" x2="12.01" y2="18"/></svg>,
    droplets:<svg style={s} viewBox="0 0 24 24"><path {...p} d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path {...p} d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/></svg>,
    layers:<svg style={s} viewBox="0 0 24 24"><polygon {...p} points="12 2 2 7 12 12 22 7 12 2"/><polyline {...p} points="2 17 12 22 22 17"/><polyline {...p} points="2 12 12 17 22 12"/></svg>,
    map:<svg style={s} viewBox="0 0 24 24"><polygon {...p} points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line {...p} x1="8" y1="2" x2="8" y2="18"/><line {...p} x1="16" y1="6" x2="16" y2="22"/></svg>,
    shield:<svg style={s} viewBox="0 0 24 24"><path {...p} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    bell:<svg style={s} viewBox="0 0 24 24"><path {...p} d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path {...p} d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    activity:<svg style={s} viewBox="0 0 24 24"><polyline {...p} points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    users:<svg style={s} viewBox="0 0 24 24"><path {...p} d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle {...p} cx="9" cy="7" r="4"/><path {...p} d="M23 21v-2a4 4 0 0 0-3-3.87"/><path {...p} d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    tool:<svg style={s} viewBox="0 0 24 24"><path {...p} d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
    trending:<svg style={s} viewBox="0 0 24 24"><polyline {...p} points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline {...p} points="17 6 23 6 23 12"/></svg>,
    check:<svg style={s} viewBox="0 0 24 24"><polyline {...p} points="20 6 9 17 4 12"/></svg>,
    arrow:<svg style={s} viewBox="0 0 24 24"><line {...p} x1="5" y1="12" x2="19" y2="12"/><polyline {...p} points="12 5 19 12 12 19"/></svg>,
    menu:<svg style={s} viewBox="0 0 24 24"><line {...p} x1="3" y1="12" x2="21" y2="12"/><line {...p} x1="3" y1="6" x2="21" y2="6"/><line {...p} x1="3" y1="18" x2="21" y2="18"/></svg>,
    close:<svg style={s} viewBox="0 0 24 24"><line {...p} x1="18" y1="6" x2="6" y2="18"/><line {...p} x1="6" y1="6" x2="18" y2="18"/></svg>,
    signal:<svg style={s} viewBox="0 0 24 24"><line {...p} x1="2" y1="20" x2="2" y2="20"/><line {...p} x1="7" y1="15" x2="7" y2="20"/><line {...p} x1="12" y1="9" x2="12" y2="20"/><line {...p} x1="17" y1="4" x2="17" y2="20"/><line {...p} x1="22" y1="2" x2="22" y2="20"/></svg>,
    camera:<svg style={s} viewBox="0 0 24 24"><path {...p} d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle {...p} cx="12" cy="13" r="4"/></svg>,
    building:<svg style={s} viewBox="0 0 24 24"><rect {...p} x="4" y="2" width="16" height="20" rx="2"/><path {...p} d="M9 22v-4h6v4"/><path {...p} d="M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/></svg>,
    city:<svg style={s} viewBox="0 0 24 24"><line {...p} x1="3" y1="22" x2="21" y2="22"/><rect {...p} x="2" y="9" width="8" height="13"/><rect {...p} x="14" y="4" width="8" height="18"/><path {...p} d="M6 9V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v4"/><line {...p} x1="18" y1="9" x2="18" y2="9.01"/><line {...p} x1="18" y1="13" x2="18" y2="13.01"/></svg>,
    link:<svg style={s} viewBox="0 0 24 24"><path {...p} d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path {...p} d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
    heart:<svg style={s} viewBox="0 0 24 24"><path {...p} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  };
  return icons[name]||icons.signal;
};

const CSS=`
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Serif+Display&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  :root{
    --navy900:#0A1628;--navy800:#0F2040;--navy700:#162952;
    --blue700:#1A4ED8;--blue600:#2563EB;--blue400:#3B82F6;
    --telecom:#EA580C;--electric:#DC2626;--water:#2563EB;
    --green:#059669;--amber:#D97706;
    --n900:#1E2D3D;--n800:#2D3F52;--n600:#4A6080;
    --n400:#7A94AE;--n200:#B0C4D4;--n100:#E2EBF0;--n50:#F0F4F8;
    --font-display:'DM Serif Display',Georgia,serif;
    --font-body:'DM Sans',system-ui,sans-serif;
  }
  html{scroll-behavior:smooth;}
  body{font-family:var(--font-body);background:var(--navy900);color:#fff;line-height:1.6;overflow-x:hidden;}
  ::-webkit-scrollbar{width:4px;}
  ::-webkit-scrollbar-track{background:var(--navy900);}
  ::-webkit-scrollbar-thumb{background:var(--n800);border-radius:4px;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
  @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
  @keyframes glow{0%,100%{box-shadow:0 0 6px var(--blue600);}50%{box-shadow:0 0 20px var(--blue600),0 0 40px rgba(37,99,235,.3);}}
  @keyframes pulse{0%,100%{opacity:1;}50%{opacity:.3;}}
  @keyframes scanLine{0%{transform:translateY(-100%);}100%{transform:translateY(400%);}}
  @keyframes float{0%,100%{transform:translateY(0);}50%{transform:translateY(-8px);}}
  .reveal{opacity:0;transform:translateY(24px);transition:opacity .6s ease,transform .6s ease;}
  .reveal.visible{opacity:1;transform:translateY(0);}
  .nav-link{color:var(--n400);text-decoration:none;font-size:14px;font-weight:500;letter-spacing:.02em;transition:color .15s;}
  .nav-link:hover{color:#fff;}
  .btn-primary{background:var(--blue700);color:#fff;border:none;border-radius:10px;padding:13px 28px;font-family:var(--font-body);font-size:15px;font-weight:700;cursor:pointer;letter-spacing:-.01em;transition:all .2s;box-shadow:0 4px 16px rgba(26,78,216,.4);}
  .btn-primary:hover{background:var(--blue600);transform:translateY(-1px);box-shadow:0 6px 24px rgba(37,99,235,.5);}
  .btn-outline{background:transparent;color:#fff;border:1.5px solid rgba(255,255,255,.2);border-radius:10px;padding:12px 24px;font-family:var(--font-body);font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;}
  .btn-outline:hover{border-color:rgba(255,255,255,.6);background:rgba(255,255,255,.05);}
  .btn-ghost{background:none;border:none;color:var(--n400);font-family:var(--font-body);font-size:14px;font-weight:500;cursor:pointer;padding:8px 0;transition:color .15s;}
  .btn-ghost:hover{color:#fff;}
  .feature-card{background:var(--navy800);border:1px solid var(--n900);border-radius:14px;padding:28px;transition:all .25s;position:relative;overflow:hidden;}
  .feature-card::before{content:'';position:absolute;inset:0;border-radius:14px;background:linear-gradient(135deg,rgba(37,99,235,.06) 0%,transparent 60%);opacity:0;transition:opacity .25s;}
  .feature-card:hover{border-color:rgba(37,99,235,.3);transform:translateY(-3px);box-shadow:0 12px 32px rgba(0,0,0,.3);}
  .feature-card:hover::before{opacity:1;}
  .stat-num{font-family:var(--font-display);font-size:42px;color:#fff;line-height:1;}
  .stat-label{font-size:13px;color:var(--n400);font-weight:500;letter-spacing:.04em;margin-top:4px;}
  section{position:relative;}
  .section-label{font-size:11px;font-weight:700;letter-spacing:.14em;color:var(--blue400);text-transform:uppercase;margin-bottom:12px;}
  .section-title{font-family:var(--font-display);font-size:clamp(28px,4vw,44px);color:#fff;line-height:1.2;margin-bottom:16px;}
  .section-body{font-size:16px;color:var(--n400);line-height:1.7;max-width:560px;}
  .grid-2{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;}
  .grid-3{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;}
  @media(max-width:768px){
    .hide-mobile{display:none!important;}
    .hero-grid,.two-col{grid-template-columns:1fr!important;}
  }
`;

// ─── Animated map preview ─────────────────────────────────────────────────────
function MapPreview(){
  const clusters=[
    {x:55,y:42,r:48,color:T.telecom,count:31,svc:"Comms"},
    {x:30,y:58,r:36,color:T.electric,count:14,svc:"Power"},
    {x:72,y:65,r:28,color:T.telecom,count:9,svc:"Comms"},
    {x:20,y:30,r:22,color:T.water,count:5,svc:"Water"},
  ];
  const [active,setActive]=useState(null);
  return(
    <div style={{position:"relative",width:"100%",aspectRatio:"16/10",borderRadius:14,overflow:"hidden",
      background:T.navy800,border:`1px solid ${T.neutral900}`,boxShadow:"0 24px 64px rgba(0,0,0,.5)"}}>
      <BlueprintGrid opacity={0.06} color={T.blue600}/>
      <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}}>
        <line x1="0%" y1="50%" x2="100%" y2="50%" stroke="rgba(255,255,255,.06)" strokeWidth="2"/>
        <line x1="35%" y1="0%" x2="35%" y2="100%" stroke="rgba(255,255,255,.06)" strokeWidth="1.5"/>
        <line x1="65%" y1="0%" x2="65%" y2="100%" stroke="rgba(255,255,255,.04)" strokeWidth="1"/>
        <line x1="0%" y1="25%" x2="100%" y2="40%" stroke="rgba(255,255,255,.04)" strokeWidth="1"/>
        <rect x="0" y="0" width="100%" height="2" fill="rgba(37,99,235,.15)"
          style={{animation:"scanLine 4s linear infinite"}}/>
      </svg>
      {clusters.map((c,i)=>(
        <div key={i} onMouseEnter={()=>setActive(i)} onMouseLeave={()=>setActive(null)}
          style={{position:"absolute",left:`${c.x}%`,top:`${c.y}%`,transform:"translate(-50%,-50%)",
            cursor:"pointer",animation:`float ${3+i*.8}s ease-in-out ${i*.4}s infinite`}}>
          <div style={{width:c.r*2.2,height:c.r*2.2,borderRadius:"50%",
            background:`${c.color}12`,border:`1.5px dashed ${c.color}50`,
            position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
            transition:"all .3s",...(active===i?{width:c.r*2.6,height:c.r*2.6,background:`${c.color}18`}:{})}}/>
          <div style={{width:14,height:14,borderRadius:"50%",background:c.color,
            border:"2.5px solid rgba(255,255,255,.9)",boxShadow:`0 0 10px ${c.color}80`,
            position:"relative",zIndex:2}}/>
          {active===i&&(
            <div style={{position:"absolute",bottom:"calc(100% + 8px)",left:"50%",transform:"translateX(-50%)",
              background:T.navy700,border:`1px solid ${T.neutral800}`,borderRadius:8,padding:"8px 12px",
              fontSize:11,fontWeight:600,color:"#fff",whiteSpace:"nowrap",zIndex:10,
              boxShadow:"0 4px 16px rgba(0,0,0,.4)"}}>
              <div style={{color:c.color,marginBottom:2}}>{c.count} reports · {c.svc}</div>
              <div style={{color:T.neutral400,fontSize:10}}>~1km area · community reported</div>
            </div>
          )}
        </div>
      ))}
      {/* Service type legend — colors only, no APWA reference */}
      <div style={{position:"absolute",bottom:14,left:14,display:"flex",gap:8,flexWrap:"wrap"}}>
        {[{color:T.telecom,label:"Comms"},{color:T.electric,label:"Power"},{color:T.water,label:"Water"}].map(l=>(
          <div key={l.label} style={{display:"flex",alignItems:"center",gap:5,
            background:"rgba(10,22,40,.85)",border:"1px solid rgba(255,255,255,.1)",
            borderRadius:6,padding:"4px 8px",fontSize:10,fontWeight:600,color:"#fff"}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:l.color}}/>
            {l.label}
          </div>
        ))}
      </div>
      <div style={{position:"absolute",top:14,right:14,background:"rgba(37,99,235,.15)",
        border:"1px solid rgba(37,99,235,.3)",borderRadius:6,padding:"5px 10px",
        fontSize:10,fontWeight:700,color:T.blue400,letterSpacing:".06em"}}>
        COMMUNITY VIEW
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ClearLineWebsite(){
  const [menuOpen,setMenuOpen]=useState(false);
  const [scrolled,setScrolled]=useState(false);
  const [activeTab,setActiveTab]=useState("provider");
  const revealRefs=useRef([]);

  useEffect(()=>{
    const s=document.createElement("style");s.textContent=CSS;document.head.appendChild(s);
    return()=>document.head.removeChild(s);
  },[]);

  useEffect(()=>{
    const obs=new IntersectionObserver(entries=>{
      entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add("visible");});
    },{threshold:0.12});
    revealRefs.current.forEach(el=>el&&obs.observe(el));
    return()=>obs.disconnect();
  },[]);

  useEffect(()=>{
    const fn=()=>setScrolled(window.scrollY>40);
    window.addEventListener("scroll",fn);return()=>window.removeEventListener("scroll",fn);
  },[]);

  const addReveal=el=>{if(el&&!revealRefs.current.includes(el))revealRefs.current.push(el);};

  const features=[
    {icon:"camera",  color:T.telecom, title:"Field Damage Reporting",
      desc:"Field reporters photograph and GPS-stamp infrastructure damage in real time. Broken poles, hanging splice closures, downed cables — documented and routed to the right party instantly."},
    {icon:"activity",color:T.electric,title:"Service Disruption Intelligence",
      desc:"Community disruption reports correlate with field observations to confirm damage. Service providers see the customer impact layer their own monitoring systems never surface."},
    {icon:"bell",    color:T.blue600, title:"Closed-Loop Notifications",
      desc:"Customers report once and get notified when service is restored. Follow-up checks confirm resolution. No more 'when will it be back?' calls flooding your contact center."},
    {icon:"map",     color:T.water,   title:"Live Disruption Map",
      desc:"Real-time map of damage reports and disruption clusters. Field crews see what's ahead. Dispatch prioritises by density. Service providers have situational awareness before the first truck rolls."},
    {icon:"shield",  color:T.green,   title:"Proximity Alerts",
      desc:"Field reporters receive automatic alerts when approaching reported damage or hazards. Safety-critical for crews working near Danger / Emergency incidents."},
    {icon:"trending",color:T.amber,   title:"Contractor Pipeline",
      desc:"Contractors receive geo-targeted repair leads in their service area. Every documented damage event is a pre-qualified job opportunity. A self-sustaining repair ecosystem."},
  ];

  // ── Role tabs — four stakeholders ──────────────────────────────────────────
  const roles={
    provider:{
      label:"Service Providers",
      title:"Service Providers & Infrastructure Owners",
      subtitle:"Know before your customers call.",
      points:[
        "Real-time damage map across your entire service area",
        "Community disruption reports routed directly to your ops dashboard",
        "Independent verification of restoration — before and after crew dispatch",
        "SLA-defensible timestamps from community and field sources",
        "Disruption data your own network monitoring cannot produce",
      ],
      cta:"Request a Demo",
      color:T.blue600,
      icon:"building",
      stat:"$4–8",
      statDesc:"Cost per inbound 'when will it be back?' call that ClearLine absorbs — before a single crew rolls.",
    },
    contractor:{
      label:"Contractors",
      title:"Repair Contractors",
      subtitle:"A steady pipeline of verified repair jobs.",
      points:[
        "Geo-targeted damage leads delivered to your service area",
        "GPS-stamped photos, damage type, asset ID — everything you need before dispatch",
        "No business development spend — jobs come to you",
        "Resolution tracking closes the loop with service providers automatically",
        "Grow crew utilisation without growing overhead",
      ],
      cta:"Join the Network",
      color:T.telecom,
      icon:"tool",
      stat:"100%",
      statDesc:"Of repair leads are pre-qualified — GPS stamped, photographed, and damage-typed before you're notified.",
    },
    reporter:{
      label:"Field Reporters",
      title:"Field Reporters",
      subtitle:"Document damage as you see it.",
      points:[
        "One-tap photo capture with auto GPS stamp",
        "11 damage types including Danger / Emergency with immediate community alerts",
        "Works offline — reports queue and sync when connectivity returns",
        "Directional cone shows camera heading on the map",
        "Proximity alerts warn you before you reach an unreported hazard",
      ],
      cta:"Get the App",
      color:T.green,
      icon:"camera",
      stat:"250ft",
      statDesc:"Proximity alert radius — field crews warned before they reach a reported hazard or danger site.",
    },
    city:{
      label:"Cities & Municipalities",
      title:"Cities & Municipalities",
      subtitle:"Give your community a place to report. Give yourself a way to respond.",
      points:[
        "Post the ClearLine reporting link during service disruptions — residents get answers, you look responsive",
        "Structured escalation path for infrastructure complaints beyond 311",
        "Real-time damage documentation for city infrastructure planning and accountability",
        "Free disaster reporting tool for residents during declared emergencies",
        "No budget approval, no IT procurement, no contract required to get started",
      ],
      cta:"Explore Municipal Partnership",
      color:"#7C3AED",
      icon:"city",
      stat:"$0",
      statDesc:"Cost to get started. Municipal partnerships begin as a free collaboration. No contract. No procurement process.",
    },
  };

  // ── Service type colors (no APWA label, no hex codes) ─────────────────────
  const serviceColors=[
    {color:T.telecom, label:"Communications",  icon:"wifi",        desc:"Internet · Phone · Cable · Fiber"},
    {color:T.electric,label:"Electric Power",  icon:"zap",         desc:"Power lines · Utilities"},
    {color:T.water,   label:"Water",           icon:"droplets",    desc:"Water mains · Infrastructure"},
  ];

  return(
    <div style={{fontFamily:"var(--font-body)",background:T.navy900,color:"#fff",minHeight:"100vh",overflowX:"hidden"}}>

      {/* ── NAVBAR ────────────────────────────────────────────────────────── */}
      <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:100,
        background:scrolled?"rgba(10,22,40,.96)":"transparent",
        backdropFilter:scrolled?"blur(12px)":"none",
        borderBottom:scrolled?`1px solid ${T.neutral900}`:"1px solid transparent",
        transition:"all .3s",padding:"0 24px"}}>
        <div style={{maxWidth:1200,margin:"0 auto",height:64,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:T.blue600,animation:"glow 2s infinite",flexShrink:0}}/>
            <span style={{fontFamily:"var(--font-display)",fontSize:22,color:"#fff",lineHeight:1}}>ClearLine</span>
            <span style={{fontSize:10,color:T.neutral400,fontWeight:600,letterSpacing:".1em",marginTop:2}}>FIELD INTEL</span>
          </div>
          <div className="hide-mobile" style={{display:"flex",alignItems:"center",gap:32}}>
            {["Platform","For Providers","For Cities","Disaster Mode","About"].map(l=>(
              <a key={l} href="#" className="nav-link">{l}</a>
            ))}
          </div>
          <div className="hide-mobile" style={{display:"flex",alignItems:"center",gap:12}}>
            <button className="btn-ghost">Sign In</button>
            <button className="btn-primary" style={{padding:"10px 20px",fontSize:13}}>Request Demo</button>
          </div>
          <button onClick={()=>setMenuOpen(m=>!m)}
            style={{background:"none",border:"none",color:"#fff",cursor:"pointer",padding:4,display:"none"}}
            className="show-mobile">
            <Icon name={menuOpen?"close":"menu"} size={22} color="#fff"/>
          </button>
        </div>
      </nav>

      {menuOpen&&(
        <div style={{position:"fixed",inset:0,zIndex:90,background:T.navy900,
          padding:"80px 24px 24px",display:"flex",flexDirection:"column",gap:20}}>
          {["Platform","For Providers","For Cities","Disaster Mode","About"].map(l=>(
            <a key={l} href="#" style={{color:"#fff",textDecoration:"none",fontSize:18,fontWeight:600}}
              onClick={()=>setMenuOpen(false)}>{l}</a>
          ))}
          <button className="btn-primary" style={{marginTop:16}}>Request Demo</button>
        </div>
      )}

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section style={{minHeight:"100vh",display:"flex",alignItems:"center",
        background:`linear-gradient(160deg,${T.navy900} 0%,${T.navy800} 50%,${T.navy900} 100%)`,
        padding:"120px 24px 80px",position:"relative",overflow:"hidden"}}>
        <BlueprintGrid opacity={0.04} color={T.blue600}/>
        <div style={{position:"absolute",top:"30%",left:"50%",transform:"translate(-50%,-50%)",
          width:600,height:600,borderRadius:"50%",
          background:"radial-gradient(circle,rgba(37,99,235,.08) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div style={{maxWidth:1200,margin:"0 auto",width:"100%"}}>
          <div className="hero-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:64,alignItems:"center"}}>
            <div style={{animation:"fadeUp .7s ease both"}}>
              <div className="section-label" style={{marginBottom:16}}>Infrastructure Damage Intelligence</div>
              <h1 style={{fontFamily:"var(--font-display)",fontSize:"clamp(36px,5vw,60px)",lineHeight:1.1,
                color:"#fff",marginBottom:20}}>
                The damage is reported.<br/>
                <span style={{color:T.blue400}}>Before the disruption begins.</span>
              </h1>
              <p style={{fontSize:17,color:T.neutral400,lineHeight:1.7,marginBottom:16,maxWidth:500}}>
                ClearLine connects field reporters, contractors, service providers,
                and communities on a single real-time platform.
              </p>
              {/* Tagline */}
              <p style={{fontSize:19,color:"#fff",fontWeight:700,letterSpacing:"-.01em",marginBottom:32,
                borderLeft:`3px solid ${T.blue600}`,paddingLeft:16,lineHeight:1.4}}>
                One platform. Every stakeholder. Closed loop.
              </p>
              <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:40}}>
                <button className="btn-primary" style={{fontSize:15,padding:"14px 32px"}}>
                  Request a Demo
                </button>
                <button className="btn-outline">See How It Works</button>
              </div>
              {/* Service color indicators — no labels or hex codes */}
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                <span style={{fontSize:11,color:T.neutral400,fontWeight:500,marginRight:4}}>Disruption types:</span>
                {serviceColors.map(s=>(
                  <div key={s.label} style={{display:"flex",alignItems:"center",gap:5,
                    padding:"5px 10px",borderRadius:9999,
                    background:`${s.color}15`,border:`1px solid ${s.color}35`,
                    fontSize:11,fontWeight:700,color:s.color}}>
                    <Icon name={s.icon} size={12} color={s.color}/>
                    {s.label}
                  </div>
                ))}
              </div>
            </div>
            <div style={{animation:"fadeUp .7s .2s ease both"}}>
              <MapPreview/>
              <div style={{display:"flex",justifyContent:"center",gap:32,marginTop:20}}>
                {[{n:"79",l:"Active reports"},{n:"5",l:"Areas mapped"},{n:"<2h",l:"Avg. resolution"}].map((s,i)=>(
                  <div key={i} style={{textAlign:"center"}}>
                    <div className="stat-num" style={{fontSize:26}}>{s.n}</div>
                    <div className="stat-label">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURE STRIP ─────────────────────────────────────────────────── */}
      <section style={{background:T.navy800,borderTop:`1px solid ${T.neutral900}`,
        borderBottom:`1px solid ${T.neutral900}`,padding:"28px 24px"}}>
        <div style={{maxWidth:1200,margin:"0 auto",display:"flex",gap:40,flexWrap:"wrap",
          justifyContent:"center",alignItems:"center"}}>
          {[
            {icon:"camera",  label:"Field Reporting"},
            {icon:"map",     label:"Live Disruption Map"},
            {icon:"bell",    label:"SMS Notifications"},
            {icon:"shield",  label:"Proximity Alerts"},
            {icon:"users",   label:"Contractor Network"},
            {icon:"building",label:"Provider Dashboard"},
            {icon:"city",    label:"Municipal Partnerships"},
          ].map((f,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,color:T.neutral400,
              fontSize:13,fontWeight:600,letterSpacing:".03em"}}>
              <Icon name={f.icon} size={16} color={T.blue400}/>
              {f.label}
            </div>
          ))}
        </div>
      </section>

      {/* ── THE PROBLEM ───────────────────────────────────────────────────── */}
      <section style={{padding:"100px 24px",background:T.navy900,position:"relative",overflow:"hidden"}}>
        <BlueprintGrid opacity={0.03}/>
        <div style={{maxWidth:1200,margin:"0 auto"}}>
          <div ref={addReveal} className="reveal" style={{textAlign:"center",marginBottom:64}}>
            <div className="section-label">The Problem</div>
            <h2 className="section-title" style={{maxWidth:680,margin:"0 auto 16px"}}>
              Right now, neighborhood social platforms know about service disruptions before you do.
            </h2>
            <p style={{fontSize:16,color:T.neutral400,lineHeight:1.7,maxWidth:580,margin:"0 auto"}}>
              Residents post "is anyone else's internet down?" in community groups.
              Field techs see damage and have no structured way to report it.
              Service providers find out from frustrated customers.
              None of that community intelligence routes anywhere useful.
            </p>
          </div>
          <div className="grid-3" style={{gap:24}}>
            {[
              {icon:"users", color:T.telecom,title:"Customers are left without answers",
                desc:"\"When will it be back?\" floods your contact center. Each call costs real money in handling time. A major disruption event generates thousands of contacts before you've deployed a single crew."},
              {icon:"tool",  color:T.electric,title:"Field techs have no reporting path",
                desc:"A splicer sees a hanging closure that will fail within 48 hours. There's no structured way to document it. It goes unrecorded. The disruption happens on schedule."},
              {icon:"signal",color:T.water,   title:"Service providers are always last to know",
                desc:"Network monitoring surfaces logical faults after the fact. Physical damage — broken poles, downed aerial plant — is invisible until a customer loses service and calls it in."},
            ].map((c,i)=>(
              <div key={i} ref={addReveal} className="reveal feature-card">
                <div style={{width:44,height:44,borderRadius:10,background:`${c.color}15`,
                  border:`1px solid ${c.color}30`,display:"flex",alignItems:"center",justifyContent:"center",
                  marginBottom:16}}>
                  <Icon name={c.icon} size={20} color={c.color}/>
                </div>
                <h3 style={{fontSize:17,fontWeight:700,color:"#fff",marginBottom:10}}>{c.title}</h3>
                <p style={{fontSize:14,color:T.neutral400,lineHeight:1.6}}>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLATFORM ──────────────────────────────────────────────────────── */}
      <section style={{padding:"100px 24px",background:T.navy800,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,transparent 0%,rgba(26,78,216,.04) 100%)",pointerEvents:"none"}}/>
        <div style={{maxWidth:1200,margin:"0 auto"}}>
          <div ref={addReveal} className="reveal" style={{textAlign:"center",marginBottom:64}}>
            <div className="section-label">The Platform</div>
            <h2 className="section-title">One platform. Every stakeholder. Closed loop.</h2>
            <p className="section-body" style={{margin:"0 auto"}}>
              Field reporters document damage. Contractors receive repair leads. Service providers get intelligence
              their own monitoring can't produce. Customers get answers instead of silence.
            </p>
          </div>
          <div className="grid-2" style={{gap:20}}>
            {features.map((f,i)=>(
              <div key={i} ref={addReveal} className="reveal feature-card"
                style={{display:"flex",gap:20,padding:"24px"}}>
                <div style={{width:48,height:48,borderRadius:12,background:`${f.color}12`,
                  border:`1px solid ${f.color}25`,display:"flex",alignItems:"center",justifyContent:"center",
                  flexShrink:0}}>
                  <Icon name={f.icon} size={22} color={f.color}/>
                </div>
                <div>
                  <h3 style={{fontSize:16,fontWeight:700,color:"#fff",marginBottom:8}}>{f.title}</h3>
                  <p style={{fontSize:13,color:T.neutral400,lineHeight:1.6}}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROLE TABS — four stakeholders ─────────────────────────────────── */}
      <section style={{padding:"100px 24px",background:T.navy900,position:"relative"}}>
        <BlueprintGrid opacity={0.03}/>
        <div style={{maxWidth:1200,margin:"0 auto"}}>
          <div ref={addReveal} className="reveal" style={{textAlign:"center",marginBottom:48}}>
            <div className="section-label">Built For Every Stakeholder</div>
            <h2 className="section-title">Your role. Your value.</h2>
            <p className="section-body" style={{margin:"0 auto"}}>
              One platform. Every stakeholder. Closed loop. — each participant's self-interest
              drives the next participant's value.
            </p>
          </div>
          {/* Tab buttons */}
          <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:48,flexWrap:"wrap"}}>
            {Object.entries(roles).map(([key,r])=>(
              <button key={key} onClick={()=>setActiveTab(key)}
                style={{padding:"10px 24px",borderRadius:9999,
                  border:`1.5px solid ${activeTab===key?r.color:"rgba(255,255,255,.12)"}`,
                  background:activeTab===key?`${r.color}18`:"transparent",
                  color:activeTab===key?r.color:T.neutral400,
                  fontFamily:"var(--font-body)",fontSize:14,fontWeight:700,cursor:"pointer",
                  transition:"all .2s",letterSpacing:".02em"}}>
                {r.label}
              </button>
            ))}
          </div>
          {/* Tab content */}
          {Object.entries(roles).map(([key,r])=>activeTab===key&&(
            <div key={key} className="two-col"
              style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:64,alignItems:"center",
              animation:"fadeIn .3s ease"}}>
              <div>
                <h3 style={{fontFamily:"var(--font-display)",fontSize:36,color:"#fff",marginBottom:8}}>{r.title}</h3>
                <p style={{fontSize:16,color:r.color,fontWeight:600,marginBottom:28}}>{r.subtitle}</p>
                <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:36}}>
                  {r.points.map((pt,i)=>(
                    <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                      <div style={{width:22,height:22,borderRadius:"50%",background:`${r.color}18`,
                        border:`1px solid ${r.color}35`,display:"flex",alignItems:"center",justifyContent:"center",
                        flexShrink:0,marginTop:1}}>
                        <Icon name="check" size={12} color={r.color}/>
                      </div>
                      <span style={{fontSize:15,color:T.offwhite,lineHeight:1.5}}>{pt}</span>
                    </div>
                  ))}
                </div>
                <button className="btn-primary" style={{background:r.color,boxShadow:`0 4px 16px ${r.color}50`}}>
                  {r.cta} →
                </button>
              </div>
              <div style={{background:T.navy800,border:`1px solid ${T.neutral900}`,borderRadius:16,padding:40,
                position:"relative",overflow:"hidden"}}>
                <BlueprintGrid opacity={0.05} color={r.color}/>
                <div style={{position:"relative",zIndex:1}}>
                  <div style={{width:64,height:64,borderRadius:16,background:`${r.color}15`,
                    border:`1px solid ${r.color}30`,display:"flex",alignItems:"center",justifyContent:"center",
                    marginBottom:24,animation:"float 3s ease-in-out infinite"}}>
                    <Icon name={r.icon} size={32} color={r.color}/>
                  </div>
                  <div className="stat-num" style={{color:r.color,marginBottom:6}}>{r.stat}</div>
                  <div style={{fontSize:14,color:T.neutral400,lineHeight:1.6,maxWidth:280}}>{r.statDesc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── MUNICIPAL PARTNERSHIP ─────────────────────────────────────────── */}
      <section style={{padding:"100px 24px",background:T.navy800,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,
          background:"radial-gradient(ellipse at 80% 50%,rgba(124,58,237,.06) 0%,transparent 60%)",
          pointerEvents:"none"}}/>
        <div style={{maxWidth:1200,margin:"0 auto"}}>
          <div className="two-col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:64,alignItems:"center"}}>
            <div ref={addReveal} className="reveal">
              <div className="section-label">Municipal Partnerships</div>
              <h2 style={{fontFamily:"var(--font-display)",fontSize:"clamp(28px,4vw,42px)",
                color:"#fff",lineHeight:1.2,marginBottom:16}}>
                Give your community a place to report.<br/>
                <span style={{color:"#7C3AED"}}>Give yourself a way to respond.</span>
              </h2>
              <p style={{fontSize:16,color:T.neutral400,lineHeight:1.7,marginBottom:24,maxWidth:480}}>
                Cities are the first to hear about service disruptions from residents — and currently
                the last to have a structured tool to do anything about it. ClearLine gives municipalities
                a community reporting link, a damage escalation path, and a disaster response tool.
                No procurement process. No contract to start.
              </p>
              <p style={{fontSize:14,color:T.neutral600,lineHeight:1.6,marginBottom:32,
                borderLeft:"3px solid #7C3AED",paddingLeft:16}}>
                When a ward councilman posts the ClearLine link during a service disruption, residents
                get answers and the city looks responsive — using a tool that costs them nothing
                and builds a relationship with the service providers responsible for the repair.
              </p>
              <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                <button className="btn-primary" style={{background:"#7C3AED",boxShadow:"0 4px 16px rgba(124,58,237,.4)"}}>
                  Explore Municipal Partnership →
                </button>
                <button className="btn-outline" style={{borderColor:"rgba(124,58,237,.4)",color:"#A78BFA"}}>
                  Contact Us
                </button>
              </div>
            </div>
            <div ref={addReveal} className="reveal" style={{display:"flex",flexDirection:"column",gap:14}}>
              {[
                {icon:"link",  label:"Distribution channel",    desc:"Post the ClearLine link on city social during disruptions — residents report, you look responsive"},
                {icon:"map",   label:"Damage escalation",       desc:"Infrastructure complaints route beyond 311 to the responsible service provider automatically"},
                {icon:"heart", label:"Community trust",         desc:"A neutral third-party platform your residents trust more than the carrier's own status page"},
                {icon:"city",  label:"Disaster reporting",      desc:"Free disruption reporting for residents during declared emergencies — no barriers, no cost"},
                {icon:"shield",label:"No contract to start",    desc:"Municipal partnerships begin as a free collaboration. No budget approval, no IT procurement"},
              ].map((f,i)=>(
                <div key={i} style={{display:"flex",gap:14,alignItems:"center",padding:"14px 18px",
                  background:"rgba(124,58,237,.06)",border:"1px solid rgba(124,58,237,.15)",borderRadius:10}}>
                  <Icon name={f.icon} size={18} color="#7C3AED"/>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color:"#fff",marginBottom:2}}>{f.label}</div>
                    <div style={{fontSize:12,color:T.neutral400}}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── DISASTER MODE ─────────────────────────────────────────────────── */}
      <section style={{padding:"100px 24px",position:"relative",overflow:"hidden",
        background:`linear-gradient(135deg,#150000 0%,${T.navy900} 40%,${T.navy800} 100%)`}}>
        <BlueprintGrid opacity={0.04} color={T.electric}/>
        <div style={{position:"absolute",inset:0,
          background:"radial-gradient(ellipse at 20% 50%,rgba(220,38,38,.06) 0%,transparent 60%)",
          pointerEvents:"none"}}/>
        <div style={{maxWidth:1200,margin:"0 auto"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:64,alignItems:"center"}} className="two-col">
            <div ref={addReveal} className="reveal">
              <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"6px 14px",
                borderRadius:9999,background:"rgba(220,38,38,.15)",border:"1px solid rgba(220,38,38,.3)",
                fontSize:11,fontWeight:700,color:T.electric,letterSpacing:".1em",
                marginBottom:20,animation:"pulse 2s infinite"}}>
                🚨 DISASTER MODE
              </div>
              <h2 style={{fontFamily:"var(--font-display)",fontSize:"clamp(28px,4vw,44px)",
                color:"#fff",lineHeight:1.2,marginBottom:16}}>
                When it matters most,<br/>
                <span style={{color:T.electric}}>the community comes first.</span>
              </h2>
              <p style={{fontSize:16,color:T.neutral400,lineHeight:1.7,marginBottom:20,maxWidth:480}}>
                During declared emergencies, ClearLine activates a dedicated disaster response mode —
                removing barriers so field crews, mutual aid teams, and residents can document and
                report damage without friction. No accounts required. No paywalls for reporters
                or affected communities.
              </p>
              <p style={{fontSize:15,color:T.neutral400,lineHeight:1.7,marginBottom:20,maxWidth:480}}>
                Sustaining disaster response infrastructure requires resources. ClearLine is actively
                pursuing federal grant programs, state emergency management partnerships, and public
                agency support to fund this capability at scale.
              </p>
              <p style={{fontSize:14,color:T.neutral600,lineHeight:1.6,marginBottom:32,
                borderLeft:`3px solid ${T.electric}`,paddingLeft:16,fontStyle:"italic"}}>
                If your organization works in emergency management, public infrastructure, or
                disaster preparedness — we want to hear from you.
              </p>
              <button className="btn-outline" style={{borderColor:"rgba(220,38,38,.4)",color:T.electric}}>
                Partner With Us on Disaster Response →
              </button>
            </div>
            <div ref={addReveal} className="reveal" style={{display:"flex",flexDirection:"column",gap:14}}>
              {[
                {icon:"zap",     label:"Automatic activation",    desc:"Triggers for declared state or federal emergency in affected geography"},
                {icon:"users",   label:"No account required",     desc:"Any reporter, any device — zero friction for field crews and residents"},
                {icon:"map",     label:"Cross-provider visibility",desc:"All disruptions visible regardless of which service provider is affected"},
                {icon:"signal",  label:"SMS text-to-report",      desc:"Works when data infrastructure is compromised — Starlink emergency messaging supported"},
                {icon:"shield",  label:"Power clearance layer",   desc:"Zone-level safety status overlay for crew dispatch coordination"},
                {icon:"trending",label:"ICS / FEMA export",       desc:"Structured damage data for incident command systems and federal reporting"},
              ].map((f,i)=>(
                <div key={i} style={{display:"flex",gap:14,alignItems:"center",padding:"14px 18px",
                  background:"rgba(220,38,38,.06)",border:"1px solid rgba(220,38,38,.15)",borderRadius:10}}>
                  <Icon name={f.icon} size={18} color={T.electric}/>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color:"#fff",marginBottom:2}}>{f.label}</div>
                    <div style={{fontSize:12,color:T.neutral400}}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICE TYPE COLORS ───────────────────────────────────────────── */}
      <section style={{padding:"80px 24px",background:T.navy800,
        borderTop:`1px solid ${T.neutral900}`,borderBottom:`1px solid ${T.neutral900}`}}>
        <div style={{maxWidth:1200,margin:"0 auto"}}>
          <div ref={addReveal} className="reveal" style={{textAlign:"center",marginBottom:48}}>
            <div className="section-label">At a Glance</div>
            <h2 className="section-title">The map speaks the language of the field.</h2>
            <p className="section-body" style={{margin:"0 auto"}}>
              Every disruption type has a distinct visual identity on the map — drawn from the
              same color standards infrastructure professionals already use every day.
              No legend required in the field.
            </p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:16}}>
            {serviceColors.map((s,i)=>(
              <div key={i} ref={addReveal} className="reveal feature-card" style={{textAlign:"center",padding:32}}>
                <div style={{width:64,height:64,borderRadius:14,background:`${s.color}15`,
                  border:`1px solid ${s.color}30`,display:"flex",alignItems:"center",justifyContent:"center",
                  margin:"0 auto 16px"}}>
                  <Icon name={s.icon} size={28} color={s.color}/>
                </div>
                <div style={{fontSize:17,fontWeight:700,color:"#fff",marginBottom:6}}>{s.label}</div>
                <div style={{fontSize:13,color:T.neutral400,lineHeight:1.5}}>{s.desc}</div>
                {/* Color dot only — no hex code */}
                <div style={{width:12,height:12,borderRadius:"50%",background:s.color,
                  margin:"14px auto 0",boxShadow:`0 2px 10px ${s.color}60`}}/>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section style={{padding:"120px 24px",textAlign:"center",position:"relative",overflow:"hidden",
        background:`linear-gradient(160deg,${T.navy900} 0%,${T.navy800} 100%)`}}>
        <BlueprintGrid opacity={0.05} color={T.blue600}/>
        <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
          width:500,height:500,borderRadius:"50%",
          background:"radial-gradient(circle,rgba(37,99,235,.1) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div style={{position:"relative",maxWidth:640,margin:"0 auto"}} ref={addReveal}>
          <div className="section-label reveal" style={{marginBottom:16}}>Get Started</div>
          <h2 className="section-title reveal" style={{marginBottom:16}}>
            One platform. Every stakeholder.<br/>
            <span style={{color:T.blue400}}>Closed loop.</span>
          </h2>
          <p style={{fontSize:16,color:T.neutral400,lineHeight:1.7,
            maxWidth:480,margin:"0 auto 40px"}}>
            ClearLine is live and operating in Cleveland. Request a demo to see
            real disruption and damage data from your service area.
          </p>
          <div style={{display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap",marginBottom:32}}>
            <button className="btn-primary" style={{padding:"16px 40px",fontSize:16}}>
              Request a Demo →
            </button>
            <button className="btn-outline" style={{padding:"15px 32px",fontSize:15}}>
              View the App
            </button>
          </div>
          {/* Municipal path */}
          <p style={{fontSize:13,color:T.neutral600}}>
            City or municipality?{" "}
            <a href="#" style={{color:T.blue400,textDecoration:"none",fontWeight:600}}
              onMouseEnter={e=>e.target.style.textDecoration="underline"}
              onMouseLeave={e=>e.target.style.textDecoration="none"}>
              Explore our municipal partnership program →
            </a>
          </p>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer style={{background:T.navy900,borderTop:`1px solid ${T.neutral900}`,padding:"48px 24px 32px"}}>
        <div style={{maxWidth:1200,margin:"0 auto"}}>
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:48,marginBottom:48,flexWrap:"wrap"}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                <div style={{width:9,height:9,borderRadius:"50%",background:T.blue600}}/>
                <span style={{fontFamily:"var(--font-display)",fontSize:20,color:"#fff"}}>ClearLine</span>
              </div>
              <p style={{fontSize:13,color:T.neutral400,lineHeight:1.7,maxWidth:280,marginBottom:16}}>
                Infrastructure damage intelligence. One platform. Every stakeholder. Closed loop.
              </p>
              <p style={{fontSize:12,color:T.neutral600,lineHeight:1.6,maxWidth:280}}>
                Actively pursuing federal grant programs and emergency management partnerships
                to sustain free community access during declared disasters.
              </p>
            </div>
            {[
              {title:"Platform",links:["Field Reporter","Disruption Reporter","Provider Dashboard","Disaster Mode"]},
              {title:"Partners", links:["For Service Providers","For Contractors","For Municipalities","Emergency Management"]},
              {title:"Company",  links:["About","Contact","Privacy Policy","Terms of Use"]},
            ].map(col=>(
              <div key={col.title}>
                <div style={{fontSize:11,fontWeight:700,letterSpacing:".1em",color:T.neutral400,
                  textTransform:"uppercase",marginBottom:16}}>{col.title}</div>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {col.links.map(l=>(
                    <a key={l} href="#" style={{fontSize:13,color:T.neutral600,textDecoration:"none",transition:"color .15s"}}
                      onMouseEnter={e=>e.target.style.color="#fff"}
                      onMouseLeave={e=>e.target.style.color=T.neutral600}>{l}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{borderTop:`1px solid ${T.neutral900}`,paddingTop:24,
            display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
            <div style={{fontSize:12,color:T.neutral600}}>
              © 2026 ClearLine. Infrastructure Damage Intelligence.
            </div>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:T.green}}/>
              <span style={{fontSize:12,color:T.neutral600}}>Live — Cleveland, OH</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
