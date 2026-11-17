'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, Clock3, Expand, Medal, RefreshCw, Search, Trophy } from 'lucide-react';
import { ageBands, genders, type Athlete, type Gender, type AgeBand } from '../lib/results';

type Payload = { athletes: Athlete[]; updatedAt: string };
const qualifyingTimes: Record<AgeBand, Record<Gender, string>> = {
  '8/9': { Male: '13:06', Female: '14:01' },
  '10/11': { Male: '14:42', Female: '15:58' },
  '12/13': { Male: '28:27', Female: '27:38' },
  '14/15': { Male: '41:09', Female: '34:26' },
};

function Board({ athletes, gender, ageBand, query }: { athletes: Athlete[]; gender: Gender; ageBand: AgeBand; query: string }) {
  const all = athletes.filter(a => a.gender === gender && a.ageBand === ageBand);
  const finished = all.filter(a => a.status.toLowerCase() === 'finished' && a.seconds !== null)
    .sort((a,b) => (a.seconds! - b.seconds!) || a.name.localeCompare(b.name));
  const unranked = all.filter(a => /^(dnf|dq)$/i.test(a.status))
    .sort((a,b) => (a.status.toUpperCase() === 'DNF' ? 0 : 1) - (b.status.toUpperCase() === 'DNF' ? 0 : 1) || a.name.localeCompare(b.name));
  const rankMap = new Map<string,number>(); let last: number | null = null; let rank = 0;
  finished.forEach((a,i) => { if (a.seconds !== last) rank = i + 1; rankMap.set(a.id,rank); last = a.seconds; });
  const shown = [...finished, ...unranked].filter(a => a.name.toLowerCase().includes(query.toLowerCase()));
  return <section className="board">
    <div className="board-head"><div><div className="division">{gender === 'Male' ? 'BOYS' : 'GIRLS'}</div><h2>AGES {ageBand.replace('/','–')}</h2></div><div className="finish-count"><strong>{finished.length}</strong><span>/{all.length} finished</span></div></div>
    <div className="qualifying-benchmark" style={{padding:'10px 20px',borderTop:'1px solid rgba(215,255,50,.28)',background:'rgba(215,255,50,.065)',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
      <span style={{fontSize:11,fontWeight:800,letterSpacing:'.075em',color:'#d9ff35'}}>ANAHEIM REGIONAL · QUALIFYING TIME</span>
      <strong style={{fontSize:22,color:'#f5f5f0',whiteSpace:'nowrap'}}>{qualifyingTimes[ageBand][gender]}</strong>
    </div>
    <div className="column-head"><span>RANK / ATHLETE</span><span>FINISH TIME / STATUS</span></div>
    {shown.length ? <div className="entries">{shown.map(a => {
      const r = rankMap.get(a.id);
      const isFinished = r !== undefined;
      const status = a.status.toUpperCase();
      return <div className={`entry ${isFinished && r <= 3 ? `place-${r}` : ''}`} key={a.id}>
        <div className="athlete"><span className="rank">{isFinished ? (r <= 3 ? <Medal size={17}/> : String(r).padStart(2,'0')) : '—'}</span><span className="athlete-name">{a.name}</span></div>
        <span className="athlete-time" style={!isFinished ? {color:status==='DQ'?'#ff7474':'#ffbd69',fontWeight:800} : undefined}>{isFinished ? a.time : status}</span>
      </div>;
    })}</div> : <div className="empty">{query ? 'No matching results' : 'Awaiting results'}</div>}
  </section>;
}
export default function Home() {
  const [data,setData] = useState<Payload | null>(null);
  const [error,setError] = useState('');
  const [loading,setLoading] = useState(true);
  const [mode,setMode] = useState<'all'|'focus'>('all');
  const [focus,setFocus] = useState('Male-8/9');
  const [query,setQuery] = useState('');
  const load = useCallback(async () => { try { const response = await fetch('/api/results',{cache:'no-store'}); const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Could not load results'); setData(body); setError(''); } catch(e) { setError(e instanceof Error ? e.message : 'Connection unavailable'); } finally { setLoading(false); } },[]);
  useEffect(() => { load(); const timer = window.setInterval(load,60000); const onVisible=()=>{if(document.visibilityState==='visible')load();}; document.addEventListener('visibilitychange',onVisible); return ()=>{window.clearInterval(timer);document.removeEventListener('visibilitychange',onVisible);}; },[load]);
  const athletes = data?.athletes || [];
  const finished = athletes.filter(a=>a.seconds !== null).length;
  const divisions = useMemo(()=>ageBands.flatMap(ageBand=>genders.map(gender=>({ageBand,gender,key:`${gender}-${ageBand}`}))),[]);
  const visible = mode === 'all' ? divisions : divisions.filter(d=>d.key===focus);
  return <main className="shell"><header className="topbar"><div className="identity"><div className="mark">TSA<span>✦</span></div><div className="brand-label">TEXAS SPORTS ACADEMY <span>/ ATHLETIC DEVELOPMENT</span></div></div><div className="live-tag"><span className={`live-dot ${error?'offline':''}`}/>{error?'CONNECTION ISSUE':'LIVE LEADERBOARD'}</div></header>
    <section className="hero"><div className="eyebrow"><Activity size={15}/> THE COMPETITION IS ON</div><h1>TSA <em>THUNDERSTARS</em><span className="headline-dot">.</span></h1><p>OFFICIAL EVENT LEADERBOARDS <span>—</span> TEXAS SPORTS ACADEMY</p></section>
    <section className="toolbar"><div className="stats"><div className="stat"><strong>{athletes.length}</strong><span>ATHLETES</span></div><div className="stat"><strong>{finished}</strong><span>FINISHERS</span></div><div className="stat"><strong>08</strong><span>DIVISIONS</span></div></div><div className="actions"><label className="search"><Search size={16}/><input aria-label="Search athlete" placeholder="Search athletes" value={query} onChange={e=>setQuery(e.target.value)}/></label><div className="toggle"><button className={mode==='all'?'selected':''} onClick={()=>setMode('all')}>ALL 8</button><button className={mode==='focus'?'selected':''} onClick={()=>setMode('focus')}>FOCUS</button></div><button className="icon-button" title="Fullscreen" aria-label="Toggle fullscreen" onClick={()=>{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen?.();}}><Expand size={17}/></button><button className="icon-button" title="Refresh now" aria-label="Refresh results" onClick={load}><RefreshCw size={17}/></button></div></section>
    {mode==='focus' && <div className="focus-select"><label htmlFor="division">DIVISION</label><select id="division" value={focus} onChange={e=>setFocus(e.target.value)}>{divisions.map(d=><option key={d.key} value={d.key}>{d.gender==='Male'?'Boys':'Girls'} {d.ageBand.replace('/','–')}</option>)}</select></div>}
    {error && <div className="error" role="alert">Results connection problem: {error}. {data ? 'Showing previously loaded results; these may be outdated.' : 'No live results are available.'}</div>}
    {loading && !data && <div className="loading">Connecting to event results…</div>}
    <div className={`boards ${mode==='focus'?'focused':''}`}>{visible.map(d=><Board key={d.key} athletes={athletes} gender={d.gender} ageBand={d.ageBand} query={query}/>)}</div>
    <footer><div><Trophy size={16}/> BUILT FOR THE NEXT GENERATION OF ATHLETES</div><div className="foot-right"><Clock3 size={15}/>{data ? `LAST SYNC ${new Date(data.updatedAt).toLocaleTimeString([], {hour:'numeric',minute:'2-digit',second:'2-digit'})}` : 'AWAITING SYNC'} <span>• AUTO REFRESH 60 SEC</span></div></footer>
  </main>;
}
