// src/components/Navbar.jsx
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { isAuthenticated, logout } from '../api/auth';

function Navbar() {
  const navigate = useNavigate();
  useLocation(); // re-check auth on every route change
  const loggedIn = isAuthenticated();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-ink/80 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-baseline gap-px font-display font-bold text-xl tracking-tight">
          <span className="text-fg">SpinoSoft</span>
          <span className="text-glow">Bits</span>
        </Link>

        <div className="flex items-center gap-6 font-mono text-xs tracking-widest uppercase">
          {loggedIn ? (
            <>
              <Link to="/admin" className="text-muted hover:text-glow transition-colors">Write</Link>
              <Link to="/manage" className="text-muted hover:text-glow transition-colors">Manage</Link>
              <Link to="/categories" className="text-muted hover:text-glow transition-colors">Categories</Link>
              <Link to="/newsletter" className="text-muted hover:text-glow transition-colors">Newsletter</Link>
              <button onClick={handleLogout} className="text-muted hover:text-glow transition-colors uppercase tracking-widest">
                Log out
              </button>
            </>
          ) : (
            <span className="text-muted">Field Notes</span>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;