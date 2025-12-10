import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, User, LogOut, Menu, X, Home, History } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white/10 backdrop-blur-lg border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Trophy className="w-8 h-8 text-white" />
            <span className="text-2xl font-black text-white">timeco</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors font-medium"
            >
              <Home size={18} />
              Inicio
            </Link>
            <Link
              to="/history"
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors font-medium"
            >
              <History size={18} />
              Historico
            </Link>
            <div className="flex items-center gap-4 ml-4 pl-4 border-l border-white/20">
              <div className="flex items-center gap-2 text-white">
                <User size={18} />
                <span className="font-medium">{user?.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all font-medium"
              >
                <LogOut size={18} />
                Sair
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white p-2"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-3">
            <Link
              to="/"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors font-medium py-2"
            >
              <Home size={18} />
              Inicio
            </Link>
            <Link
              to="/history"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors font-medium py-2"
            >
              <History size={18} />
              Historico
            </Link>
            <div className="pt-3 border-t border-white/20">
              <div className="flex items-center gap-2 text-white mb-3">
                <User size={18} />
                <span className="font-medium">{user?.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all font-medium w-full justify-center"
              >
                <LogOut size={18} />
                Sair
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
