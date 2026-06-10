// src/components/Navbar.jsx
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-ink/80 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-baseline gap-px font-display font-bold text-xl tracking-tight">
          <span className="text-fg">SpinozaSoft</span>
          <span className="text-glow">Bits</span>
        </Link>

        {/* Right side — mono section label */}
        <span className="font-mono text-xs text-muted tracking-widest uppercase">
          Field Notes
        </span>
      </div>
    </nav>
  );
}

export default Navbar;
