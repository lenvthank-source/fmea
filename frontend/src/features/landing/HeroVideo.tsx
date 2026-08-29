import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

// CloudFront video from design_prompt — reuse until FMEA footage ready
const VIDEO_SRC = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260809_012548_ef22562c-c0ae-4816-ad9d-f8922af4e6a7.mp4';

export const HeroVideo: React.FC = () => {
  const navigate = useNavigate();
  const { token, guestLogin } = useAuth();
  const [guestLoading, setGuestLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const [counters, setCounters] = useState<number[]>([0, 0, 0, 0]);

  const handleCTA = async () => {
    if (token) { navigate('/app/projects'); return; }
    setGuestLoading(true);
    try { await guestLogin(); navigate('/app/initializing'); } catch(e){ console.error(e);} finally{ setGuestLoading(false); }
  };

  // fonts + icons injection (scoped, once)
  useEffect(() => {
    const add = (id:string, el: HTMLElement) => { if(!document.getElementById(id)){ el.id=id; document.head.appendChild(el);} };
    if(!document.querySelector('link[href*="BubbledotICG-FinePos"]')){
      const l=document.createElement('link'); l.rel='stylesheet'; l.href='https://db.onlinewebfonts.com/c/8cb707a9b8a73f8a7403336b861c3074?family=BubbledotICG-FinePos'; add('bubbledot-css', l);
    }
    if(!document.querySelector('link[href*="font-awesome"]')){
      const l=document.createElement('link'); l.rel='stylesheet'; l.href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css'; (l as HTMLLinkElement).integrity='sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W6A=='; l.setAttribute('crossorigin','anonymous'); add('fa-css', l);
    }
    // Inter already via index.css; ensure display stack fallback Geist Pixel
    if(!document.getElementById('geist-pixel-font')){
      const s=document.createElement('style'); s.id='geist-pixel-font'; s.textContent=`@font-face{font-family:"Geist Pixel Circle";src:url('/fonts/GeistPixel-Circle.woff2') format('woff2');font-weight:400;font-display:swap;}`; document.head.appendChild(s);
    }
  }, []);

  // stats count-up (IntersectionObserver, once, easeOutCubic)
  useEffect(() => {
    const el = statsRef.current; if(!el) return;
    let done=false;
    const obs = new IntersectionObserver(([e])=>{ if(e.isIntersecting && !done){ done=true;
      const targets=[120,99.99,24,2.4]; const durations=[1500,1580,1660,1740];
      targets.forEach((t,i)=>{
        setTimeout(()=>{
          const start=performance.now(); const dur=durations[i];
          const tick=(now:number)=>{
            const p=Math.min((now-start)/dur,1); const eased=1-Math.pow(1-p,3);
            const val = t===99.99 ? Math.round(eased*t*100)/100 : t===2.4 ? Math.round(eased*t*10)/10 : Math.round(eased*t);
            setCounters(prev=>{const n=[...prev]; n[i]=val; return n;});
            if(p<1) requestAnimationFrame(tick);
          }; requestAnimationFrame(tick);
        },0);
      });
      obs.unobserve(el);
    }},{threshold:0.25});
    obs.observe(el); return ()=>obs.disconnect();
  }, []);

  return (
    <div className="hv-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
        .hv-page{--bg:#000;--text:#fff;--muted:#8e8e8e;--nav-text:#2e2e2e;--pill-dark:#28282a;--sign-in-text:#c8c8c8;--nav-shadow:0 4px 14px rgba(0,0,0,0.16);--trust-bg:#28282a;--trust-border:rgba(255,255,255,0.4);--trust-text:#c4c2c3;--font-sans:"Inter","Segoe UI",system-ui,sans-serif;--font-display:"BubbledotICG-FinePos","Geist Pixel Circle",monospace; position:relative; height:100vh; height:100dvh; background:#000; overflow:hidden; display:flex; flex-direction:column; align-items:center; padding: clamp(16px,2.4vh,28px) clamp(14px,3vw,32px); font-family:var(--font-sans); -webkit-font-smoothing:antialiased;}
        .hv-bg{position:absolute; inset:0; overflow:hidden; background:#000; z-index:0;}
        .hv-bg video{position:absolute; inset:0; width:100%; height:100%; object-fit:cover; pointer-events:none;}
        .hv-header,.hv-hero,.hv-stats{position:relative; z-index:1; width:100%;}
        .hv-header{flex-shrink:0; display:flex; align-items:center; justify-content:center; gap:clamp(18px,2.8vw,28px); max-width:720px; width:100%; animation: hvSlideDown 0.7s cubic-bezier(0.22,1,0.36,1) both;}
        @keyframes hvSlideDown{from{opacity:0; transform:translateY(-18px)} to{opacity:1; transform:translateY(0)}}
        .hv-logo{width:clamp(40px,4.4vw,46px); height:clamp(40px,4.4vw,46px); border-radius:50%; background:#fff; box-shadow:var(--nav-shadow); display:grid; place-items:center; cursor:pointer; transition:transform 0.2s;}
        .hv-logo:hover{transform:scale(1.04)}
        .hv-logo img{width:72%; height:72%; object-fit:contain;}
        .hv-nav-pill{flex:1; max-width:430px; height:clamp(44px,5.2vw,48px); background:#fff; border-radius:999px; padding:4px 8px; display:flex; align-items:center; justify-content:space-around; box-shadow:var(--nav-shadow);}
        .hv-nav-pill a{font:500 clamp(13px,1.4vw,15px)/1 var(--font-sans); letter-spacing:-0.01em; color:#2e2e2e; text-decoration:none; opacity:0.5; position:relative; padding:6px 8px; cursor:pointer; transition:opacity 0.2s;}
        .hv-nav-pill a:hover{opacity:0.75} .hv-nav-pill a.active{opacity:1}
        .hv-nav-pill a.active::after{content:""; position:absolute; left:50%; bottom:5px; width:3px; height:3px; background:#000; border-radius:50%; box-shadow:-5px 0 0 #000, 5px 0 0 #000; transform:translateX(-50%);}
        .hv-signin{height:clamp(44px,5.2vw,48px); background:var(--pill-dark); color:var(--sign-in-text); border-radius:999px; padding:0 18px; display:inline-flex; align-items:center; font:600 13.5px var(--font-sans); box-shadow:var(--nav-shadow); cursor:pointer; transition: all 0.2s; white-space:nowrap;}
        .hv-signin:hover{background:#323234; color:#fff; transform:translateY(-1px);}
        .hv-burger{display:none; width:48px; height:48px; border-radius:50%; background:#28282a; border:none; flex-direction:column; align-items:center; justify-content:center; gap:5px; cursor:pointer;}
        .hv-burger span{width:18px; height:1.5px; background:#fff; transition:all 0.25s;}
        .hv-burger.open{background:#fff} .hv-burger.open span{background:#111} .hv-burger.open span:nth-child(1){transform:translateY(6.5px) rotate(45deg)} .hv-burger.open span:nth-child(2){opacity:0} .hv-burger.open span:nth-child(3){transform:translateY(-6.5px) rotate(-45deg)}
        .hv-overlay{position:fixed; inset:0; background:rgba(0,0,0,0.62); backdrop-filter:blur(6px); animation:hvOverlayIn 0.28s; z-index:10}
        @keyframes hvOverlayIn{from{opacity:0} to{opacity:1}}
        .hv-sheet{position:fixed; top:76px; left:50%; transform:translateX(-50%); width:min(360px, calc(100% - 28px)); background:#fff; border-radius:28px; padding:22px 18px 20px; box-shadow:0 20px 60px rgba(0,0,0,0.45); z-index:11; animation:hvMenuIn 0.38s cubic-bezier(0.22,1,0.36,1);}
        @keyframes hvMenuIn{from{opacity:0; transform:translate(-50%, -8px) scale(0.98)} to{opacity:1; transform:translate(-50%,0) scale(1)}}
        .hv-sheet a{display:block; padding:14px 0; font:600 15px var(--font-sans); color:#2e2e2e; border-bottom:1px solid rgba(0,0,0,0.06); text-align:center;}
        .hv-hero{flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; max-width:900px;}
        .hv-trust{--trust-size:clamp(36px,4.5vw,42px); display:inline-flex; align-items:center; margin-bottom:clamp(16px,2.5vh,26px); animation: hvReveal 0.85s cubic-bezier(0.22,1,0.36,1) both; animation-delay:0.05s;}
        .hv-avatar{width:var(--trust-size); height:var(--trust-size); background:#28282a; border:1px solid rgba(255,255,255,0.4); border-radius:50%; padding:5px; display:grid; place-items:center; margin-left:calc(var(--trust-size) * -0.42); position:relative; transition:transform 0.35s;}
        .hv-avatar:first-child{margin-left:0; z-index:1} .hv-avatar:nth-child(2){z-index:2} .hv-avatar:nth-child(3){z-index:4}
        .hv-avatar:hover{transform:translateY(-2px)} .hv-avatar:nth-child(2):hover{transform:translateY(-4px)}
        .hv-avatar-inner{width:100%; height:100%; background:#fff; border-radius:50%; display:grid; place-items:center;}
        .hv-avatar-inner i{color:#111; font-size:calc(var(--trust-size) * 0.34);}
        .hv-trust-pill{height:var(--trust-size); background:#28282a; border:1px solid rgba(255,255,255,0.4); border-radius:999px; margin-left:calc(var(--trust-size) * -0.42); padding:0 14px 0 calc(var(--trust-size) * 0.58); display:inline-flex; align-items:center; font:500 clamp(12px,1.4vw,13.5px) var(--font-sans); color:#c4c2c3;}
        .hv-headline{font-family:var(--font-display); color:#fff; font-size:clamp(28px,6.2vw,80px); letter-spacing:-0.04em; line-height:1.12; white-space:nowrap; overflow:hidden;}
        .hv-headline span{display:block; opacity:0; transform:translateY(14px); animation:hvHeadlineFade 0.85s cubic-bezier(0.22,1,0.36,1) forwards;}
        .hv-headline span:nth-child(1){animation-delay:0.12s} .hv-headline span:nth-child(2){animation-delay:0.3s}
        @keyframes hvHeadlineFade{to{opacity:1; transform:translateY(0)}}
        .hv-subhead{max-width:min(500px,92%); font-size:clamp(calc(13.5px + 2pt), calc(1.55vw + 2pt), calc(16.5px + 2pt)); color:#d0d0d0; opacity:0.8; line-height:1.55; font-weight:400; margin:14px auto 0; animation:hvReveal 0.85s both; animation-delay:0.28s;}
        .hv-cta{margin-top:18px; background:#fff; color:#000; font:600 clamp(13.5px,1.5vw,14.5px) var(--font-sans); padding: clamp(11px,1.6vh,13px) clamp(22px,3vw,28px); border-radius:999px; border:none; cursor:pointer; box-shadow:0 0 0 1px rgba(255,255,255,0.15),0 0 22px rgba(255,255,255,0.32),0 0 44px rgba(255,255,255,0.12); animation:hvRevealPulse 0.85s both; animation-delay:0.4s; transition:transform 0.2s, box-shadow 0.2s;}
        .hv-cta:hover{transform:translateY(-2px) scale(1.02); box-shadow:0 0 0 1px rgba(255,255,255,0.2),0 0 28px rgba(255,255,255,0.38),0 0 52px rgba(255,255,255,0.16);}
        .hv-stats{flex-shrink:0; display:grid; grid-template-columns:repeat(4,1fr); gap:16px; max-width:920px; width:100%; margin-top:18px;}
        .hv-stat{text-align:center}
        .hv-stat-icon{font-family:var(--font-display); color:#fff; font-size:clamp(22px,3vw,33px); line-height:1}
        .hv-stat-val{font:600 clamp(18px,2.2vw,26px)/1 var(--font-sans); color:#fff; letter-spacing:-0.025em; font-variant-numeric:tabular-nums; margin-top:4px}
        .hv-stat-label{font:400 clamp(11px,1.2vw,12.5px) var(--font-sans); color:#8e8e8e; margin-top:4px}
        @keyframes hvReveal{from{opacity:0; transform:translateY(22px) scale(0.98); filter:blur(6px)} to{opacity:1; transform:translateY(0) scale(1); filter:blur(0)}}
        @keyframes hvRevealPulse{from{opacity:0; transform:translateY(22px) scale(0.98); filter:blur(6px)} to{opacity:1; transform:translateY(0) scale(1); filter:blur(0)}}
        @media (max-width:720px){.hv-nav-pill,.hv-signin.desktop{display:none} .hv-burger{display:flex} .hv-header{justify-content:space-between} .hv-headline{letter-spacing:-0.08em; line-height:1.05} .hv-stats{grid-template-columns:repeat(2,1fr); gap:12px} .hv-trust{--trust-size:34px}}
        @media (max-width:420px){.hv-headline{letter-spacing:-0.09em; line-height:1.04; font-size:clamp(26px,8vw,40px)}}
        @media (prefers-reduced-motion:reduce){.hv-header,.hv-trust,.hv-headline span,.hv-subhead,.hv-cta,.hv-stats{animation:none !important; opacity:1 !important; transform:none !important; filter:none !important}}
      `}</style>

      {/* video bg */}
      <div className="hv-bg" aria-hidden>
        <video className="bg-video" autoPlay muted loop playsInline poster="/favicon.svg">
          <source src={VIDEO_SRC} type="video/mp4" />
        </video>
      </div>

      {/* header */}
      <header className="hv-header">
        <div className="hv-logo" onClick={()=>window.scrollTo({top:0,behavior:'smooth'})} title="FMEApex">
          <img src="/favicon.svg" alt="" width={52} height={52} />
        </div>
        <nav className="hv-nav-pill" aria-label="Primary">
          <a className="active">Home</a>
          <a onClick={()=>navigate('/product')}>Product</a>
          <a onClick={()=>navigate('/learn')}>Learn</a>
          <a onClick={()=>navigate('/pricing')}>Pricing</a>
          <a onClick={()=>{const el=document.getElementById('contact'); if(el) el.scrollIntoView({behavior:'smooth'}); else navigate('/about');}}>Contact</a>
        </nav>
        <button className="hv-signin desktop" onClick={handleCTA} disabled={guestLoading}>{guestLoading?'...':'Get Started'}</button>
        <button className={`hv-burger ${menuOpen?'open':''}`} aria-expanded={menuOpen} aria-label="Menu" onClick={()=>setMenuOpen(v=>!v)}>
          <span/><span/><span/>
        </button>
      </header>
      {menuOpen && <>
        <div className="hv-overlay" onClick={()=>setMenuOpen(false)} />
        <div className="hv-sheet">
          <a onClick={()=>{setMenuOpen(false); window.scrollTo({top:0,behavior:'smooth'})}}>Home</a>
          <a onClick={()=>{setMenuOpen(false); navigate('/product')}}>Product</a>
          <a onClick={()=>{setMenuOpen(false); navigate('/learn')}}>Learn</a>
          <a onClick={()=>{setMenuOpen(false); navigate('/pricing')}}>Pricing</a>
          <a onClick={()=>{setMenuOpen(false); navigate('/about')}}>About</a>
          <a onClick={()=>{setMenuOpen(false); const el=document.getElementById('contact'); el?.scrollIntoView({behavior:'smooth'})}}>Contact</a>
          <button className="hv-signin" style={{width:'100%', justifyContent:'center', marginTop:12}} onClick={()=>{setMenuOpen(false); handleCTA();}}>{guestLoading?'...':'Get Started'}</button>
        </div>
      </>}

      {/* hero */}
      <div className="hv-hero">
        <div className="hv-trust">
          <div className="hv-avatar"><div className="hv-avatar-inner"><i className="fa-solid fa-industry"/></div></div>
          <div className="hv-avatar"><div className="hv-avatar-inner"><i className="fa-solid fa-car"/></div></div>
          <div className="hv-avatar"><div className="hv-avatar-inner"><i className="fa-solid fa-microchip"/></div></div>
          <div className="hv-trust-pill">Trusted by 2000+ Enterprises</div>
        </div>
        <h1 className="hv-headline">
          <span>Quality</span>
          <span>Engineered To Evolve</span>
        </h1>
        <p className="hv-subhead">Build quality systems that reason, adapt and collaborate using a modular AI platform designed for production.</p>
        <button className="hv-cta" onClick={handleCTA} disabled={guestLoading}>{guestLoading?'Launching...':'Get Started'}</button>
      </div>

      {/* stats footer */}
      <div className="hv-stats" ref={statsRef}>
        {[
          {icon:'<', val:counters[0], suf:'ms', label:'Inference Time'},
          {icon:'%', val:counters[1].toFixed(2), suf:'', label:'Platform Uptime'},
          {icon:'*', val:counters[2], suf:'/7', label:'Autonomous Runtime'},
          {icon:'#', val:counters[3].toFixed(1), suf:'M', label:'Context Windows'},
        ].map(s=>(
          <div key={s.label} className="hv-stat">
            <div className="hv-stat-icon">{s.icon}</div>
            <div className="hv-stat-val">{s.val}{s.suf}</div>
            <div className="hv-stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
