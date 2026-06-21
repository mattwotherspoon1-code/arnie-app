import { useState, useEffect, useRef } from "react";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');`;

const C = {
  midnight: "#0D1117", navy: "#161B27", navyLift: "#1E2637",
  accent: "#4F8EF7", accentGlow: "rgba(79,142,247,0.15)",
  accentSoft: "#3DD68C", accentSoftGlow: "rgba(61,214,140,0.15)",
  textPrime: "#EEF2FF", textMid: "#8B93A8", textDim: "#4A5168",
  border: "#252D40", danger: "#F75F5F",
};

const LS = {
  get: (k, fallback = null) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  clear: (keys) => keys.forEach(k => { try { localStorage.removeItem(k); } catch {} }),
};

const ARNIE_SYSTEM = `You are Arnie, a warm but no-nonsense personal trainer AI built into a gym app. You're knowledgeable, encouraging, and direct. You remember the user's program and goals across the conversation.

PERSONALITY:
- Friendly and human, not robotic
- Encouraging but honest — you don't sugarcoat poor effort
- Use plain language. Short sentences. No jargon unless explaining it.
- Occasionally use light humour but stay professional
- Never be sycophantic

WHEN BUILDING A PROGRAM (onboarding flow):
Ask these questions ONE AT A TIME in a natural conversational way:
1. Name
2. Main goal (lose fat / build muscle / both / get stronger / improve fitness)
3. Experience level (complete beginner / some experience / intermediate / advanced)
4. How many days per week can they train
5. Equipment access (home only / commercial gym / both)
6. Any injuries or physical limitations
7. How long per session (30 / 45 / 60+ minutes)

After collecting all 7 answers, output the program in this EXACT JSON format wrapped in <PROGRAM> tags:

<PROGRAM>
{
  "userName": "...",
  "splits": [
    {
      "id": "unique_id",
      "name": "DAY NAME",
      "label": "Short description",
      "emoji": "💪",
      "exercises": [
        {
          "id": "unique_ex_id",
          "name": "Exercise Name",
          "sets": 3,
          "reps": "10-12",
          "cue": "Friendly, clear coaching cue in plain English. What to focus on. What to avoid.",
          "why": "One sentence explaining why this exercise is in their program."
        }
      ]
    }
  ]
}
</PROGRAM>

Then after the JSON, write a short friendly summary of the program explaining the logic.

FOR GENERAL GYM QUESTIONS:
- Answer concisely and practically
- Give cues, modifications, alternatives
- Reference their program context when relevant
- Push back gently if they're overthinking or sandbagging`;

const ONBOARDING_OPENER = {
  role: "assistant",
  content: "Hey! I'm Arnie, your personal training coach. I'm going to ask you a few quick questions so I can build a program that's actually right for you — not just a generic plan.\n\nLet's start simple. What's your name? 👋"
};

const IllustrationWelcome = () => (
  <svg viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:"100%",maxWidth:200}}>
    <ellipse cx="100" cy="120" rx="60" ry="8" fill={C.accentGlow}/>
    <rect x="82" y="55" width="36" height="48" rx="8" fill={C.navyLift}/>
    <circle cx="100" cy="42" r="16" fill={C.navyLift}/>
    <circle cx="95" cy="40" r="2" fill={C.accent}/>
    <circle cx="105" cy="40" r="2" fill={C.accent}/>
    <path d="M94 47 Q100 52 106 47" stroke={C.accentSoft} strokeWidth="2" strokeLinecap="round" fill="none"/>
    <rect x="55" y="38" width="90" height="6" rx="3" fill={C.border}/>
    <rect x="50" y="30" width="20" height="14" rx="4" fill={C.accent} opacity="0.7"/>
    <rect x="130" y="30" width="20" height="14" rx="4" fill={C.accent} opacity="0.7"/>
    <line x1="82" y1="58" x2="62" y2="41" stroke={C.navyLift} strokeWidth="8" strokeLinecap="round"/>
    <line x1="118" y1="58" x2="138" y2="41" stroke={C.navyLift} strokeWidth="8" strokeLinecap="round"/>
    <rect x="84" y="98" width="14" height="22" rx="6" fill={C.navyLift}/>
    <rect x="102" y="98" width="14" height="22" rx="6" fill={C.navyLift}/>
    <circle cx="100" cy="70" r="55" stroke={C.accent} strokeWidth="1" strokeDasharray="4 6" opacity="0.3"/>
  </svg>
);

const IllustrationEmpty = () => (
  <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:140}}>
    <rect x="20" y="30" width="120" height="70" rx="12" fill={C.navyLift}/>
    <rect x="35" y="48" width="55" height="8" rx="4" fill={C.border}/>
    <rect x="35" y="62" width="40" height="6" rx="3" fill={C.border}/>
    <rect x="35" y="74" width="50" height="6" rx="3" fill={C.border}/>
    <circle cx="120" cy="38" r="18" fill={C.midnight} stroke={C.border} strokeWidth="2"/>
    <path d="M120 30 L120 38 L126 44" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ProgressRing = ({ progress, size=56, stroke=4, color=C.accent, children }) => {
  const r = (size - stroke*2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (progress/100) * circ;
  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition:"stroke-dashoffset 0.3s ease" }}/>
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>{children}</div>
    </div>
  );
};

export default function ArnieApp() {
  const [screen, setScreen] = useState("home");
  const [program, setProgram] = useState(() => LS.get("arnie_program"));
  const [userName, setUserName] = useState(() => LS.get("arnie_username", ""));
  const [programBuilt, setProgramBuilt] = useState(() => LS.get("arnie_program_built", false));
  const [chatMessages, setChatMessages] = useState(() => LS.get("arnie_chat", [ONBOARDING_OPENER]));
  const [weightLog, setWeightLog] = useState(() => LS.get("arnie_weightlog", {}));
  const [activeSession, setActiveSession] = useState(null);
  const [completedSets, setCompletedSets] = useState({});
  const [setWeights, setSetWeights] = useState({});
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerDuration, setTimerDuration] = useState(90);
  const [expandedEx, setExpandedEx] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [historyModal, setHistoryModal] = useState(null);

  const chatEndRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => { LS.set("arnie_program", program); }, [program]);
  useEffect(() => { LS.set("arnie_username", userName); }, [userName]);
  useEffect(() => { LS.set("arnie_program_built", programBuilt); }, [programBuilt]);
  useEffect(() => { LS.set("arnie_chat", chatMessages); }, [chatMessages]);
  useEffect(() => { LS.set("arnie_weightlog", weightLog); }, [weightLog]);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = FONTS + `
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html, body { background: ${C.midnight}; color: ${C.textPrime}; font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased; }
      input, textarea, button { font-family: 'DM Sans', sans-serif; }
      ::-webkit-scrollbar { width: 3px; }
      ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 10px; }
      @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }
      @keyframes fadeIn { from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)} }
      @keyframes glow { 0%,100%{box-shadow:0 0 12px rgba(79,142,247,0.3)}50%{box-shadow:0 0 28px rgba(79,142,247,0.6)} }
      .fade-in { animation: fadeIn 0.25s ease forwards; }
      .timer-glow { animation: glow 1.5s ease-in-out infinite; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [chatMessages, chatLoading]);

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(s => { if (s<=1) { setTimerRunning(false); clearInterval(timerRef.current); return 0; } return s-1; });
      }, 1000);
    } else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  const startTimer = (secs) => { setTimerSeconds(secs); setTimerDuration(secs); setTimerRunning(true); };
  const formatTime = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
  const timerPct = timerDuration ? ((timerDuration-timerSeconds)/timerDuration)*100 : 0;

  const sessionProgress = () => {
    if (!activeSession) return 0;
    const total = activeSession.exercises.reduce((a,e)=>a+e.sets,0);
    const done = activeSession.exercises.reduce((a,e)=>a+Array.from({length:e.sets},(_,i)=>completedSets[`${e.id}-${i}`]?1:0).reduce((x,y)=>x+y,0),0);
    return total ? Math.round((done/total)*100) : 0;
  };

  const getLastWeight = (exId) => {
    const log = weightLog[exId];
    if (!log || !log.length) return null;
    return log[log.length-1];
  };

  const toggleSet = (exId, setIdx) => {
    const key = `${exId}-${setIdx}`;
    setCompletedSets(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      if (updated[key]) startTimer(90);
      return updated;
    });
  };

  const saveSessionWeights = () => {
    if (!activeSession) return;
    const today = new Date().toLocaleDateString("en-AU", { day:"numeric", month:"short", year:"numeric" });
    const newLog = { ...weightLog };
    activeSession.exercises.forEach(ex => {
      const sets = Array.from({length:ex.sets},(_,i) => {
        const k = `${ex.id}-${i}`;
        return setWeights[k] || { reps: ex.reps, weight: "" };
      });
      if (sets.some(s => s.weight)) {
        if (!newLog[ex.id]) newLog[ex.id] = [];
        newLog[ex.id] = [...newLog[ex.id], { date: today, sets }].slice(-20);
      }
    });
    setWeightLog(newLog);
  };

  const sendChat = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    const userMsg = { role:"user", content:text };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatInput("");
    setChatLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model:"claude-sonnet-4-6", max_tokens:1000,
          system: ARNIE_SYSTEM,
          messages: newMessages.map(m=>({role:m.role,content:m.content}))
        })
      });
      const data = await res.json();
      const reply = data.content?.find(b=>b.type==="text")?.text || "Something went wrong. Try again.";
      const programMatch = reply.match(/<PROGRAM>([\s\S]*?)<\/PROGRAM>/);
      if (programMatch) {
        try {
          const parsed = JSON.parse(programMatch[1].trim());
          setProgram(parsed);
          setUserName(parsed.userName || "");
          setProgramBuilt(true);
          const clean = reply.replace(/<PROGRAM>[\s\S]*?<\/PROGRAM>/,"").trim();
          setChatMessages(prev=>[...prev,{role:"assistant",content:clean||"Your program is ready! Head to the Program tab."}]);
        } catch { setChatMessages(prev=>[...prev,{role:"assistant",content:reply}]); }
      } else {
        setChatMessages(prev=>[...prev,{role:"assistant",content:reply}]);
      }
    } catch {
      setChatMessages(prev=>[...prev,{role:"assistant",content:"Connection issue. Try again."}]);
    }
    setChatLoading(false);
  };

  const NavBar = () => {
    const tabs = [
      { id:"home", label:"Home", icon:(a)=>(
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z" stroke={a?C.accent:C.textDim} strokeWidth="2" strokeLinejoin="round" fill={a?C.accentGlow:"none"}/>
        </svg>
      )},
      { id:"session", label:"Session", hide:!activeSession, icon:(a)=>(
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke={a?C.accent:C.textDim} strokeWidth="2" fill={a?C.accentGlow:"none"}/>
          <path d="M12 7V12L15 15" stroke={a?C.accent:C.textDim} strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )},
      { id:"chat", label:"Arnie", icon:(a)=>(
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M20 2H4C2.9 2 2 2.9 2 4V16C2 17.1 2.9 18 4 18H8L12 22L16 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" stroke={a?C.accent:C.textDim} strokeWidth="2" fill={a?C.accentGlow:"none"}/>
          <circle cx="8" cy="10" r="1.5" fill={a?C.accent:C.textDim}/>
          <circle cx="12" cy="10" r="1.5" fill={a?C.accent:C.textDim}/>
          <circle cx="16" cy="10" r="1.5" fill={a?C.accent:C.textDim}/>
        </svg>
      )},
      { id:"program", label:"Program", icon:(a)=>(
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="3" stroke={a?C.accent:C.textDim} strokeWidth="2" fill={a?C.accentGlow:"none"}/>
          <path d="M7 8H17M7 12H13M7 16H15" stroke={a?C.accent:C.textDim} strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )},
    ].filter(t=>!t.hide);
    return (
      <nav style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, background:C.navy, borderTop:`1px solid ${C.border}`, display:"flex", zIndex:100, paddingBottom:"env(safe-area-inset-bottom)" }}>
        {tabs.map(t=>{
          const active = screen===t.id;
          return (
            <button key={t.id} onClick={()=>setScreen(t.id)} style={{ flex:1, padding:"10px 4px 8px", background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
              {t.icon(active)}
              <span style={{ fontSize:10, fontWeight:600, color:active?C.accent:C.textDim, letterSpacing:0.5 }}>{t.label}</span>
            </button>
          );
        })}
      </nav>
    );
  };

  const AppShell = ({ children, title, subtitle, action }) => (
    <div style={{ maxWidth:430, margin:"0 auto", minHeight:"100vh", background:C.midnight, paddingBottom:80 }}>
      <div style={{ background:C.navy, borderBottom:`1px solid ${C.border}`, padding:"16px 20px 14px", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:20, fontWeight:800, color:C.textPrime, letterSpacing:-0.3 }}>{title}</div>
            {subtitle && <div style={{ fontSize:12, color:C.textMid, marginTop:1 }}>{subtitle}</div>}
          </div>
          {action}
        </div>
      </div>
      <div style={{ padding:"20px 16px" }}>{children}</div>
      <NavBar />
    </div>
  );

  const HistoryModal = ({ exId, exName, onClose }) => {
    const log = weightLog[exId] || [];
    return (
      <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:200, display:"flex", alignItems:"flex-end", justifyContent:"center" }} onClick={onClose}>
        <div style={{ background:C.navy, borderTop:`2px solid ${C.accent}`, borderRadius:"20px 20px 0 0", width:"100%", maxWidth:430, padding:24, maxHeight:"70vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <div>
              <div style={{ fontSize:16, fontWeight:700, color:C.textPrime }}>{exName}</div>
              <div style={{ fontSize:12, color:C.textMid }}>Weight history</div>
            </div>
            <button onClick={onClose} style={{ background:C.navyLift, border:"none", borderRadius:8, padding:"6px 12px", color:C.textMid, fontSize:13, cursor:"pointer" }}>Close</button>
          </div>
          {log.length === 0 ? (
            <div style={{ textAlign:"center", padding:"30px 0", color:C.textDim, fontSize:13 }}>No history yet. Log some sets to see progress here.</div>
          ) : (
            [...log].reverse().map((entry, i) => (
              <div key={i} style={{ background:C.navyLift, borderRadius:12, padding:"12px 14px", marginBottom:10 }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.accent, marginBottom:8 }}>{entry.date}</div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {entry.sets.map((s, si) => (
                    <div key={si} style={{ background:C.midnight, borderRadius:8, padding:"6px 12px", fontSize:12 }}>
                      <span style={{ color:C.textMid }}>Set {si+1}: </span>
                      <span style={{ color:C.textPrime, fontWeight:600 }}>{s.weight ? `${s.weight}kg` : "—"}</span>
                      <span style={{ color:C.textDim }}> × {s.reps || "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // HOME
  if (screen === "home") {
    if (!program) return (
      <div style={{ maxWidth:430, margin:"0 auto", minHeight:"100vh", background:C.midnight, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:32, paddingBottom:100 }}>
        <div style={{ marginBottom:24 }}><IllustrationWelcome /></div>
        <div style={{ fontSize:28, fontWeight:800, color:C.textPrime, textAlign:"center", letterSpacing:-0.5, marginBottom:8 }}>Hey, I'm Arnie 👋</div>
        <div style={{ fontSize:15, color:C.textMid, textAlign:"center", lineHeight:1.6, marginBottom:32 }}>Your personal AI training coach. I'll build a program made for you — not a generic plan lifted from the internet.</div>
        <button onClick={()=>setScreen("chat")} style={{ background:C.accent, color:"#fff", border:"none", borderRadius:14, padding:"16px 40px", fontSize:16, fontWeight:700, cursor:"pointer", width:"100%", boxShadow:`0 8px 24px rgba(79,142,247,0.35)` }}>
          Build My Program
        </button>
        <div style={{ marginTop:16, fontSize:13, color:C.textDim }}>Takes about 2 minutes</div>
        <NavBar />
      </div>
    );

    return (
      <AppShell title={`Hey, ${userName || "Coach"} 👋`} subtitle={new Date().toLocaleDateString("en-AU",{weekday:"long",day:"numeric",month:"long"})}>
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:12, fontWeight:700, color:C.textMid, marginBottom:10, letterSpacing:0.5, textTransform:"uppercase" }}>Your Split</div>
          <div style={{ background:C.navy, borderRadius:12, padding:"10px 14px", display:"flex", gap:6, flexWrap:"wrap" }}>
            {program.splits.map(s=>(
              <span key={s.id} style={{ background:C.navyLift, borderRadius:8, padding:"4px 10px", fontSize:12, color:C.textMid }}>
                <span style={{ color:C.accent, fontWeight:700 }}>{s.emoji}</span> {s.name}
              </span>
            ))}
            <span style={{ background:C.navyLift, borderRadius:8, padding:"4px 10px", fontSize:12, color:C.textDim }}>Rest</span>
          </div>
        </div>
        <div style={{ fontSize:12, fontWeight:700, color:C.textMid, marginBottom:10, letterSpacing:0.5, textTransform:"uppercase" }}>Select a Session</div>
        {program.splits.map(split=>(
          <div key={split.id} className="fade-in" style={{ background:C.navy, border:`1px solid ${C.border}`, borderRadius:16, marginBottom:12, overflow:"hidden" }}>
            <div style={{ padding:"16px 16px 12px", display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ width:48, height:48, borderRadius:14, background:C.accentGlow, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{split.emoji}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:17, fontWeight:700, color:C.textPrime }}>{split.name}</div>
                <div style={{ fontSize:12, color:C.textMid, marginTop:2 }}>{split.label} · {split.exercises.length} exercises</div>
              </div>
              <button onClick={()=>{ setActiveSession(split); setCompletedSets({}); setSetWeights({}); setScreen("session"); }} style={{ background:C.accent, border:"none", borderRadius:10, padding:"8px 16px", fontSize:13, fontWeight:700, color:"#fff", cursor:"pointer", flexShrink:0 }}>
                Start
              </button>
            </div>
            <div style={{ borderTop:`1px solid ${C.border}`, padding:"6px 0" }}>
              {split.exercises.map(ex=>{
                const last = getLastWeight(ex.id);
                return (
                  <div key={ex.id} style={{ padding:"6px 16px", display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:6, height:6, borderRadius:"50%", background:C.accent, opacity:0.5, flexShrink:0 }}/>
                    <div style={{ fontSize:13, color:C.textMid, flex:1 }}>{ex.name}</div>
                    <div style={{ fontSize:11, color: last ? C.accentSoft : C.textDim }}>
                      {last ? `Last: ${last.sets.find(s=>s.weight)?.weight||"—"}kg` : `${ex.sets}×${ex.reps}`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </AppShell>
    );
  }

  // SESSION
  if (screen === "session") {
    const prog = sessionProgress();
    const done = prog === 100;
    return (
      <div style={{ maxWidth:430, margin:"0 auto", minHeight:"100vh", background:C.midnight, paddingBottom:80 }}>
        <div style={{ background:C.navy, borderBottom:`1px solid ${C.border}`, padding:"12px 16px", position:"sticky", top:0, zIndex:50 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
            <button onClick={()=>{ saveSessionWeights(); setScreen("home"); }} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 10px", color:C.textMid, fontSize:13, cursor:"pointer" }}>← Back</button>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:18, fontWeight:800, color:C.textPrime }}>{activeSession?.emoji} {activeSession?.name}</div>
              <div style={{ fontSize:11, color:C.textMid }}>{activeSession?.label}</div>
            </div>
            <ProgressRing progress={prog} size={48} stroke={4} color={done?C.accentSoft:C.accent}>
              <span style={{ fontSize:11, fontWeight:700, color:done?C.accentSoft:C.accent }}>{prog}%</span>
            </ProgressRing>
          </div>
          <div style={{ background:C.navyLift, borderRadius:12, padding:"10px 14px", display:"flex", alignItems:"center", gap:10 }} className={timerRunning?"timer-glow":""}>
            <ProgressRing progress={timerSeconds>0 ? 100-timerPct : 0} size={44} stroke={3} color={timerRunning?C.accent:C.textDim}>
              <span style={{ fontSize:11, fontWeight:700, color:timerRunning?C.accent:C.textDim }}>{formatTime(timerSeconds)}</span>
            </ProgressRing>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:11, color:C.textMid, marginBottom:5 }}>Rest timer</div>
              <div style={{ display:"flex", gap:6 }}>
                {[60,90,120].map(s=>(
                  <button key={s} onClick={()=>startTimer(s)} style={{ background:timerDuration===s&&timerRunning?C.accent:C.border, border:"none", borderRadius:6, padding:"4px 10px", fontSize:12, fontWeight:600, color:timerDuration===s&&timerRunning?"#fff":C.textMid, cursor:"pointer" }}>
                    {s===60?"1m":s===90?"90s":"2m"}
                  </button>
                ))}
                <button onClick={()=>{ setTimerRunning(false); setTimerSeconds(0); }} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, padding:"4px 10px", fontSize:12, color:C.textDim, cursor:"pointer" }}>Reset</button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding:16 }}>
          {done && (
            <div className="fade-in" style={{ background:C.accentSoftGlow, border:`1px solid ${C.accentSoft}`, borderRadius:16, padding:"18px 20px", textAlign:"center", marginBottom:16 }}>
              <div style={{ fontSize:28 }}>🎉</div>
              <div style={{ fontSize:18, fontWeight:800, color:C.accentSoft, marginTop:4 }}>Session Complete!</div>
              <div style={{ fontSize:13, color:C.textMid, marginTop:4 }}>Weights saved. Rest up.</div>
            </div>
          )}

          {activeSession?.exercises.map(ex=>{
            const exDone = Array.from({length:ex.sets},(_,i)=>completedSets[`${ex.id}-${i}`]).every(Boolean);
            const exProg = Array.from({length:ex.sets},(_,i)=>completedSets[`${ex.id}-${i}`]?1:0).reduce((a,b)=>a+b,0);
            const isExpanded = expandedEx===ex.id;
            const last = getLastWeight(ex.id);
            return (
              <div key={ex.id} className="fade-in" style={{ background:exDone?C.accentSoftGlow:C.navy, border:`1px solid ${exDone?C.accentSoft:C.border}`, borderRadius:16, marginBottom:12, overflow:"hidden", transition:"all 0.2s" }}>
                <div style={{ padding:"14px 16px" }}>
                  <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ fontSize:15, fontWeight:700, color:exDone?C.accentSoft:C.textPrime }}>{ex.name}</div>
                        {exDone && <span style={{ fontSize:12 }}>✅</span>}
                      </div>
                      <div style={{ fontSize:12, color:C.textMid, marginTop:2 }}>{ex.sets} sets × {ex.reps} reps</div>
                      {last && (
                        <div style={{ fontSize:11, color:C.accentSoft, marginTop:3 }}>
                          Last: {last.sets.map((s,i)=>`${s.weight||"?"}kg×${s.reps||"?"}`).join(" · ")}
                        </div>
                      )}
                    </div>
                    <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                      <button onClick={()=>setHistoryModal({id:ex.id,name:ex.name})} style={{ background:C.navyLift, border:"none", borderRadius:8, padding:"6px 10px", fontSize:11, fontWeight:600, color:C.textMid, cursor:"pointer" }}>📈</button>
                      <button onClick={()=>setExpandedEx(isExpanded?null:ex.id)} style={{ background:C.navyLift, border:"none", borderRadius:8, padding:"6px 10px", fontSize:11, fontWeight:600, color:C.accent, cursor:"pointer" }}>
                        {isExpanded?"Less":"Cues"}
                      </button>
                    </div>
                  </div>

                  <div style={{ marginTop:12, display:"flex", flexDirection:"column", gap:8 }}>
                    {Array.from({length:ex.sets},(_,i)=>{
                      const key = `${ex.id}-${i}`;
                      const checked = completedSets[key];
                      const sw = setWeights[key] || { weight:"", reps: ex.reps };
                      const lastSet = last?.sets?.[i];
                      return (
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <button onClick={()=>toggleSet(ex.id,i)} style={{ width:36, height:36, borderRadius:"50%", border:`2px solid ${checked?C.accentSoft:C.border}`, background:checked?C.accentSoft:"transparent", color:checked?C.midnight:C.textDim, fontWeight:700, fontSize:13, cursor:"pointer", transition:"all 0.15s", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                            {checked?"✓":i+1}
                          </button>
                          <div style={{ display:"flex", gap:6, flex:1, alignItems:"center" }}>
                            <div style={{ position:"relative", flex:1 }}>
                              <input type="number" inputMode="decimal" placeholder={lastSet?.weight || "kg"}
                                value={sw.weight}
                                onChange={e=>setSetWeights(prev=>({...prev,[key]:{...sw,weight:e.target.value}}))}
                                style={{ width:"100%", background:C.navyLift, border:`1px solid ${checked?C.accentSoft:C.border}`, borderRadius:8, padding:"7px 10px", fontSize:13, color:C.textPrime, outline:"none" }}/>
                              <span style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", fontSize:11, color:C.textDim, pointerEvents:"none" }}>kg</span>
                            </div>
                            <span style={{ fontSize:12, color:C.textDim, flexShrink:0 }}>×</span>
                            <div style={{ position:"relative", flex:1 }}>
                              <input type="text" placeholder={ex.reps}
                                value={sw.reps===ex.reps?"":sw.reps}
                                onChange={e=>setSetWeights(prev=>({...prev,[key]:{...sw,reps:e.target.value||ex.reps}}))}
                                style={{ width:"100%", background:C.navyLift, border:`1px solid ${checked?C.accentSoft:C.border}`, borderRadius:8, padding:"7px 10px", fontSize:13, color:C.textPrime, outline:"none" }}/>
                              <span style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", fontSize:11, color:C.textDim, pointerEvents:"none" }}>reps</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ fontSize:11, color:C.textDim, marginTop:8 }}>{exProg}/{ex.sets} sets done</div>
                </div>

                {isExpanded && (
                  <div className="fade-in" style={{ borderTop:`1px solid ${C.border}`, padding:"12px 16px", background:C.navyLift }}>
                    <div style={{ fontSize:11, fontWeight:700, color:C.accent, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 }}>Coaching cue</div>
                    <div style={{ fontSize:13, color:C.textPrime, lineHeight:1.65, marginBottom:ex.why?10:0 }}>{ex.cue}</div>
                    {ex.why && <>
                      <div style={{ fontSize:11, fontWeight:700, color:C.textMid, textTransform:"uppercase", letterSpacing:0.5, marginBottom:4, marginTop:8 }}>Why it's here</div>
                      <div style={{ fontSize:13, color:C.textMid, lineHeight:1.65 }}>{ex.why}</div>
                    </>}
                  </div>
                )}
              </div>
            );
          })}

          {done && (
            <button onClick={()=>{ saveSessionWeights(); setScreen("home"); }} style={{ width:"100%", background:C.accentSoft, border:"none", borderRadius:14, padding:"16px", fontSize:16, fontWeight:700, color:C.midnight, cursor:"pointer", marginTop:8 }}>
              Save & Finish Session
            </button>
          )}
        </div>
        <NavBar />
        {historyModal && <HistoryModal exId={historyModal.id} exName={historyModal.name} onClose={()=>setHistoryModal(null)}/>}
      </div>
    );
  }

  // CHAT
  if (screen === "chat") return (
    <div style={{ maxWidth:430, margin:"0 auto", height:"100vh", background:C.midnight, display:"flex", flexDirection:"column" }}>
      <div style={{ background:C.navy, borderBottom:`1px solid ${C.border}`, padding:"14px 20px", flexShrink:0 }}>
        <div style={{ fontSize:18, fontWeight:800, color:C.textPrime }}>Arnie 🤖</div>
        <div style={{ fontSize:12, color:programBuilt?C.accentSoft:C.accent, marginTop:1 }}>
          {programBuilt ? "Program built · Ask me anything" : "Building your program..."}
        </div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:16, display:"flex", flexDirection:"column", gap:12 }}>
        {chatMessages.map((msg,i)=>(
          <div key={i} className="fade-in" style={{ display:"flex", flexDirection:"column", alignItems:msg.role==="user"?"flex-end":"flex-start" }}>
            <div style={{ fontSize:10, fontWeight:700, color:C.textDim, marginBottom:4, letterSpacing:0.5, textTransform:"uppercase" }}>
              {msg.role==="user"?"You":"Arnie"}
            </div>
            <div style={{ maxWidth:"85%", background:msg.role==="user"?C.accent:C.navyLift, borderRadius:msg.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px", padding:"12px 16px", fontSize:14, lineHeight:1.65, color:msg.role==="user"?"#fff":C.textPrime, boxShadow:msg.role==="user"?`0 4px 16px rgba(79,142,247,0.25)`:"none" }}>
              {msg.content}
            </div>
          </div>
        ))}
        {chatLoading && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-start" }}>
            <div style={{ fontSize:10, fontWeight:700, color:C.textDim, marginBottom:4, letterSpacing:0.5, textTransform:"uppercase" }}>Arnie</div>
            <div style={{ background:C.navyLift, borderRadius:"18px 18px 18px 4px", padding:"12px 16px", display:"flex", gap:5, alignItems:"center" }}>
              {[0,1,2].map(i=><div key={i} style={{ width:7, height:7, borderRadius:"50%", background:C.accent, animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite` }}/>)}
            </div>
          </div>
        )}
        <div ref={chatEndRef}/>
      </div>
      <div style={{ padding:"12px 16px", borderTop:`1px solid ${C.border}`, background:C.navy, display:"flex", gap:10, flexShrink:0, paddingBottom:"calc(12px + env(safe-area-inset-bottom))" }}>
        <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendChat()}
          placeholder="Message Arnie..." style={{ flex:1, background:C.navyLift, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 16px", fontSize:14, color:C.textPrime, outline:"none" }}/>
        <button onClick={sendChat} disabled={chatLoading||!chatInput.trim()} style={{ background:chatInput.trim()&&!chatLoading?C.accent:C.border, border:"none", borderRadius:12, width:48, height:48, display:"flex", alignItems:"center", justifyContent:"center", cursor:chatInput.trim()?"pointer":"default", transition:"background 0.15s", flexShrink:0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#fff" strokeWidth="2.5" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );

  // PROGRAM
  if (screen === "program") {
    if (!program) return (
      <AppShell title="My Program" subtitle="No program yet">
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"40px 20px", textAlign:"center" }}>
          <IllustrationEmpty />
          <div style={{ fontSize:17, fontWeight:700, color:C.textPrime, marginTop:20, marginBottom:8 }}>No program yet</div>
          <div style={{ fontSize:13, color:C.textMid, lineHeight:1.6, marginBottom:24 }}>Chat with Arnie to build a personalised program. Takes about 2 minutes.</div>
          <button onClick={()=>setScreen("chat")} style={{ background:C.accent, color:"#fff", border:"none", borderRadius:12, padding:"14px 32px", fontSize:15, fontWeight:700, cursor:"pointer" }}>Chat with Arnie</button>
        </div>
      </AppShell>
    );

    return (
      <AppShell title="My Program" subtitle={`${program.splits.length} days · Built for ${userName||"you"}`}
        action={<button onClick={()=>{ if(window.confirm("Reset and build a new program?")){ LS.clear(["arnie_program","arnie_username","arnie_program_built","arnie_chat"]); setProgram(null); setUserName(""); setProgramBuilt(false); setChatMessages([ONBOARDING_OPENER]); setScreen("chat"); }}} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 12px", fontSize:12, color:C.textMid, cursor:"pointer" }}>Rebuild</button>}>
        <div style={{ background:C.navy, borderRadius:14, padding:"12px 14px", marginBottom:20, display:"flex", gap:6, flexWrap:"wrap" }}>
          {program.splits.map(s=>(
            <div key={s.id} style={{ background:C.navyLift, borderRadius:8, padding:"6px 12px", display:"flex", alignItems:"center", gap:6 }}>
              <span>{s.emoji}</span>
              <span style={{ fontSize:12, fontWeight:600, color:C.textMid }}>{s.name}</span>
            </div>
          ))}
          <div style={{ background:C.navyLift, borderRadius:8, padding:"6px 12px" }}><span style={{ fontSize:12, color:C.textDim }}>Rest</span></div>
          <div style={{ width:"100%", fontSize:11, color:C.textDim, marginTop:4 }}>Repeat the cycle. Rest when you need it.</div>
        </div>

        {program.splits.map(split=>(
          <div key={split.id} style={{ background:C.navy, border:`1px solid ${C.border}`, borderRadius:16, marginBottom:14, overflow:"hidden" }}>
            <div style={{ padding:"14px 16px", display:"flex", alignItems:"center", gap:12, borderBottom:`1px solid ${C.border}` }}>
              <div style={{ width:44, height:44, borderRadius:12, background:C.accentGlow, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{split.emoji}</div>
              <div>
                <div style={{ fontSize:16, fontWeight:700, color:C.textPrime }}>{split.name}</div>
                <div style={{ fontSize:12, color:C.textMid }}>{split.label}</div>
              </div>
            </div>
            {split.exercises.map((ex,idx)=>{
              const isOpen = expandedEx===`prog-${ex.id}`;
              const last = getLastWeight(ex.id);
              return (
                <div key={ex.id}>
                  <button onClick={()=>setExpandedEx(isOpen?null:`prog-${ex.id}`)} style={{ width:"100%", background:"none", border:"none", padding:"12px 16px", display:"flex", alignItems:"center", gap:12, cursor:"pointer", borderBottom:idx<split.exercises.length-1?`1px solid ${C.border}`:"none" }}>
                    <div style={{ width:32, height:32, borderRadius:10, background:C.navyLift, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <span style={{ fontSize:12, fontWeight:700, color:C.accent }}>{idx+1}</span>
                    </div>
                    <div style={{ flex:1, textAlign:"left" }}>
                      <div style={{ fontSize:14, fontWeight:600, color:C.textPrime }}>{ex.name}</div>
                      <div style={{ fontSize:12, color:C.textMid, marginTop:1 }}>
                        {ex.sets} sets × {ex.reps}
                        {last && <span style={{ color:C.accentSoft }}> · Last: {last.sets.find(s=>s.weight)?.weight||"—"}kg</span>}
                      </div>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ transform:isOpen?"rotate(180deg)":"rotate(0)", transition:"transform 0.2s", flexShrink:0 }}>
                      <path d="M6 9L12 15L18 9" stroke={C.textDim} strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="fade-in" style={{ background:C.navyLift, padding:"12px 16px 14px", borderBottom:idx<split.exercises.length-1?`1px solid ${C.border}`:"none" }}>
                      <div style={{ fontSize:11, fontWeight:700, color:C.accent, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 }}>How to do it</div>
                      <div style={{ fontSize:13, color:C.textPrime, lineHeight:1.65, marginBottom:ex.why?10:0 }}>{ex.cue}</div>
                      {ex.why && <>
                        <div style={{ fontSize:11, fontWeight:700, color:C.textMid, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6, marginTop:8 }}>Why it's here</div>
                        <div style={{ fontSize:13, color:C.textMid, lineHeight:1.65 }}>{ex.why}</div>
                      </>}
                      {last && (
                        <button onClick={()=>setHistoryModal({id:ex.id,name:ex.name})} style={{ marginTop:12, background:C.midnight, border:`1px solid ${C.border}`, borderRadius:8, padding:"8px 14px", fontSize:12, color:C.accent, cursor:"pointer", fontWeight:600 }}>
                          📈 View full history
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </AppShell>
    );
  }

  return null;
}
