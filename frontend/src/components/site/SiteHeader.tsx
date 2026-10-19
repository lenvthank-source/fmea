import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { GitBranch, Menu, X } from 'lucide-react';
import { TrialButton } from './TrialButton';
import '../../features/landing/landing-story.css';
import './public-site.css';
export function SiteHeader() {
 const [open, setOpen] = useState(false);
 const header = useRef<HTMLElement>(null); const toggle = useRef<HTMLButtonElement>(null);
 const closeMenus = () => {
  setOpen(false); header.current?.querySelectorAll('details[open]').forEach(item => item.removeAttribute('open'));
 };
 useEffect(() => {
  const close = (event: KeyboardEvent) => { if(event.key === 'Escape') { closeMenus(); toggle.current?.focus(); } };
  const outside = (event: PointerEvent) => { if(!header.current?.contains(event.target as Node)) closeMenus(); };
  window.addEventListener('keydown', close); window.addEventListener('pointerdown', outside);
  return () => { window.removeEventListener('keydown', close); window.removeEventListener('pointerdown', outside); };
 }, []);
 const nav = () => <>
  <NavLink to="/product">Platform</NavLink>
  <details className="public-nav-group"><summary>Solutions</summary><div className="public-nav-panel">
   <Link to="/fmea/automotive-iatf-16949">Automotive</Link><Link to="/fmea/aerospace-as9100">Aerospace</Link>
   <Link to="/fmea/medical-iso-13485">Medical devices</Link><Link to="/fmea/semiconductor-jedec">Semiconductors</Link>
  </div></details>
  <details className="public-nav-group"><summary>Resources</summary><div className="public-nav-panel">
   <Link to="/learn">Engineering guides</Link><Link to="/learn?category=Glossary">Glossary</Link>
   <Link to="/learn?category=Comparison">Comparisons</Link><Link to="/blog">Journal</Link>
  </div></details><NavLink to="/pricing">Pricing</NavLink>
 </>;
 const closeLink = (event: React.MouseEvent) => { if((event.target as HTMLElement).closest('a')) closeMenus(); };
 return <header className="story-header public-header" ref={header}>
  <Link to="/" className="story-brand" aria-label="FMEApex home"><span className="story-brand-mark"><GitBranch size={21} aria-hidden="true" /></span>fmeapex</Link>
  <nav className="story-desktop-nav" aria-label="Main navigation" onClick={closeLink}>{nav()}</nav>
  <div className="story-header-actions"><Link to="/login" className="story-login">Log in</Link><TrialButton small label="Try FMEApex" />
   <button ref={toggle} type="button" className="story-menu-button" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="public-mobile-nav" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
  </div>
  {open && <nav id="public-mobile-nav" className="story-mobile-nav" aria-label="Mobile navigation" onClick={closeLink}>{nav()}<Link to="/about">About</Link><Link to="/login">Log in</Link><TrialButton small label="Try FMEApex" /></nav>}
 </header>;
}
