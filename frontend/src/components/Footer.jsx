// src/components/Footer.jsx
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="border-t border-border mt-24">
      <div className="max-w-5xl mx-auto px-6 py-10 flex items-center justify-between">
        <p className="font-mono text-xs text-muted">
          © {new Date().getFullYear()} SpinoSoftBits — Brooklyn, NY
        </p>
        <Link to="/login" className="font-mono text-xs text-muted/50 hover:text-glow transition-colors">
          admin
        </Link>
      </div>
    </footer>
  );
}

export default Footer;