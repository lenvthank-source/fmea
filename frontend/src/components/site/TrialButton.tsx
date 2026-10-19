import { ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
export function TrialButton({ small = false, label = 'Try it out' }: { small?: boolean; label?: string }) {
 const { token } = useAuth(); const navigate = useNavigate();
 return <button type="button" className={`story-button ${small ? 'story-button-small' : ''}`} onClick={() => {
  if (!token) sessionStorage.removeItem('logged_out');
  navigate(token ? '/app/projects' : '/app/initializing');
 }}>{token ? 'Open workspace' : label}<ArrowUpRight size={16} aria-hidden="true" /></button>;
}
