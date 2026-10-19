import { Link } from 'react-router-dom';
import { GitBranch } from 'lucide-react';
import { TrialButton } from './TrialButton';
export function SiteFooter() {
 return <footer className="story-footer story-container">
  <div><Link to="/" className="story-brand"><span className="story-brand-mark"><GitBranch size={20} aria-hidden="true" /></span>fmeapex</Link><p>Connected thinking. Better quality.</p></div>
  <nav aria-label="Footer navigation"><Link to="/product">Platform</Link><Link to="/learn">Resources</Link><Link to="/blog">Journal</Link><Link to="/pricing">Pricing</Link><Link to="/about">About</Link><Link to="/#contact">Contact</Link></nav>
  <div className="story-footer-bottom"><span>© {new Date().getFullYear()} FMEApex</span><span>From design intent to verified action.</span><TrialButton small /></div>
 </footer>;
}
