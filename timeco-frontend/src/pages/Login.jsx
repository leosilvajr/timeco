import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gift, User, Lock, Eye, EyeOff, Star, LogIn, TreePine } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

// Componente do Papai Noel voando
const FlyingSanta = () => (
  <motion.div
    className="absolute z-10 pointer-events-none"
    initial={{ x: -200, y: 100 }}
    animate={{
      x: ['-200px', '110vw'],
      y: [100, 50, 120, 80, 100]
    }}
    transition={{
      duration: 12,
      repeat: Infinity,
      ease: "linear",
      y: {
        duration: 12,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }}
  >
    <div className="relative">
      {/* Trenó */}
      <svg width="180" height="100" viewBox="0 0 180 100" className="drop-shadow-lg">
        {/* Renas (simplificadas) */}
        <g transform="translate(0, 35)">
          {/* Rena 1 */}
          <ellipse cx="25" cy="20" rx="12" ry="8" fill="#8B4513"/>
          <circle cx="20" cy="15" r="6" fill="#8B4513"/>
          <path d="M18 9 L15 2 M18 9 L21 2" stroke="#5D3A1A" strokeWidth="2" fill="none"/>
          <circle cx="18" cy="14" r="1.5" fill="#FF0000"/>
          {/* Pernas */}
          <line x1="20" y1="28" x2="18" y2="38" stroke="#8B4513" strokeWidth="3"/>
          <line x1="30" y1="28" x2="32" y2="38" stroke="#8B4513" strokeWidth="3"/>

          {/* Rena 2 */}
          <ellipse cx="55" cy="20" rx="12" ry="8" fill="#A0522D"/>
          <circle cx="50" cy="15" r="6" fill="#A0522D"/>
          <path d="M48 9 L45 2 M48 9 L51 2" stroke="#6B4423" strokeWidth="2" fill="none"/>
          <circle cx="48" cy="14" r="1.5" fill="#FF0000"/>
          <line x1="50" y1="28" x2="48" y2="38" stroke="#A0522D" strokeWidth="3"/>
          <line x1="60" y1="28" x2="62" y2="38" stroke="#A0522D" strokeWidth="3"/>

          {/* Cordas do trenó */}
          <line x1="35" y1="20" x2="55" y2="20" stroke="#DAA520" strokeWidth="2"/>
          <line x1="65" y1="20" x2="90" y2="25" stroke="#DAA520" strokeWidth="2"/>
        </g>

        {/* Trenó */}
        <g transform="translate(85, 40)">
          {/* Base do trenó */}
          <path d="M0 30 Q5 40 20 40 L70 40 Q85 40 90 30 L85 25 L5 25 Z" fill="#8B0000"/>
          <path d="M5 25 L85 25 L80 15 L10 15 Z" fill="#DC143C"/>
          {/* Detalhes dourados */}
          <path d="M0 30 Q5 40 20 40" stroke="#FFD700" strokeWidth="3" fill="none"/>
          <path d="M70 40 Q85 40 90 30" stroke="#FFD700" strokeWidth="3" fill="none"/>
        </g>

        {/* Papai Noel */}
        <g transform="translate(105, 5)">
          {/* Corpo */}
          <ellipse cx="30" cy="45" rx="20" ry="15" fill="#DC143C"/>
          {/* Cinto */}
          <rect x="10" y="42" width="40" height="6" fill="#1a1a1a"/>
          <rect x="25" y="40" width="10" height="10" fill="#FFD700" rx="2"/>
          {/* Cabeça */}
          <circle cx="30" cy="20" r="14" fill="#FFDAB9"/>
          {/* Barba */}
          <ellipse cx="30" cy="30" rx="12" ry="10" fill="#FFFFFF"/>
          <ellipse cx="30" cy="28" rx="10" ry="6" fill="#FFFFFF"/>
          {/* Bigode */}
          <ellipse cx="24" cy="24" rx="5" ry="3" fill="#FFFFFF"/>
          <ellipse cx="36" cy="24" rx="5" ry="3" fill="#FFFFFF"/>
          {/* Nariz */}
          <circle cx="30" cy="22" r="3" fill="#FFB6C1"/>
          {/* Olhos */}
          <circle cx="25" cy="17" r="2" fill="#1a1a1a"/>
          <circle cx="35" cy="17" r="2" fill="#1a1a1a"/>
          {/* Bochechas */}
          <circle cx="20" cy="22" r="3" fill="#FFB6C1" opacity="0.5"/>
          <circle cx="40" cy="22" r="3" fill="#FFB6C1" opacity="0.5"/>
          {/* Gorro */}
          <path d="M16 18 Q30 -5 44 18" fill="#DC143C"/>
          <ellipse cx="30" cy="18" rx="16" ry="4" fill="#FFFFFF"/>
          <circle cx="48" cy="5" r="5" fill="#FFFFFF"/>
          {/* Braço acenando */}
          <ellipse cx="55" cy="35" rx="6" ry="8" fill="#DC143C" transform="rotate(-30 55 35)"/>
          <circle cx="62" cy="28" r="5" fill="#FFFFFF"/>
        </g>

        {/* Saco de presentes */}
        <g transform="translate(140, 35)">
          <ellipse cx="15" cy="20" rx="15" ry="18" fill="#8B0000"/>
          <path d="M5 8 Q15 0 25 8" fill="#8B0000"/>
          <ellipse cx="15" cy="8" rx="8" ry="4" fill="#DC143C"/>
        </g>
      </svg>
    </div>
  </motion.div>
);

// Componente de floco de neve
const Snowflake = ({ delay, duration, left, size }) => (
  <motion.div
    className="absolute text-white pointer-events-none select-none"
    style={{ left: `${left}%`, fontSize: size }}
    initial={{ y: -20, opacity: 0, rotate: 0 }}
    animate={{
      y: '100vh',
      opacity: [0, 1, 1, 0],
      rotate: 360
    }}
    transition={{
      duration: duration,
      repeat: Infinity,
      delay: delay,
      ease: "linear"
    }}
  >
    ❄
  </motion.div>
);

// Componente de estrela brilhante
const TwinkleStar = ({ top, left, delay }) => (
  <motion.div
    className="absolute text-yellow-300 pointer-events-none"
    style={{ top: `${top}%`, left: `${left}%` }}
    animate={{
      scale: [1, 1.5, 1],
      opacity: [0.5, 1, 0.5]
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
      delay: delay
    }}
  >
    ✦
  </motion.div>
);

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      toast.error('Preencha todos os campos');
      return;
    }

    setLoading(true);
    try {
      await login(username, password);
      toast.success('Login realizado com sucesso! 🎄');
      navigate('/');
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.errors?.[0] || 'Erro ao fazer login';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Gerar flocos de neve
  const snowflakes = [...Array(30)].map((_, i) => ({
    id: i,
    delay: Math.random() * 10,
    duration: 8 + Math.random() * 7,
    left: Math.random() * 100,
    size: `${12 + Math.random() * 16}px`
  }));

  // Gerar estrelas
  const stars = [...Array(15)].map((_, i) => ({
    id: i,
    top: Math.random() * 60,
    left: Math.random() * 100,
    delay: Math.random() * 3
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0c1445] via-[#1a237e] to-[#0d47a1] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Céu estrelado de fundo */}
      {stars.map((star) => (
        <TwinkleStar key={star.id} {...star} />
      ))}

      {/* Papai Noel voando */}
      <FlyingSanta />

      {/* Flocos de neve */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {snowflakes.map((flake) => (
          <Snowflake key={flake.id} {...flake} />
        ))}
      </div>

      {/* Montanhas de neve no fundo */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <svg viewBox="0 0 1440 200" className="w-full">
          <path fill="#FFFFFF" fillOpacity="0.3" d="M0,160 C200,100 400,180 600,120 C800,60 1000,140 1200,100 C1300,80 1400,120 1440,100 L1440,200 L0,200 Z"/>
          <path fill="#FFFFFF" fillOpacity="0.5" d="M0,180 C150,140 350,190 500,150 C700,100 900,170 1100,130 C1250,100 1350,150 1440,130 L1440,200 L0,200 Z"/>
          <path fill="#FFFFFF" fillOpacity="0.8" d="M0,190 C100,170 300,200 450,180 C650,150 850,190 1050,170 C1200,155 1350,185 1440,170 L1440,200 L0,200 Z"/>
        </svg>
      </div>

      {/* Árvores de Natal decorativas */}
      <div className="absolute bottom-0 left-10 pointer-events-none opacity-80">
        <svg width="80" height="120" viewBox="0 0 80 120">
          <polygon points="40,0 80,100 0,100" fill="#228B22"/>
          <polygon points="40,20 70,80 10,80" fill="#2E8B2E"/>
          <polygon points="40,35 60,65 20,65" fill="#32CD32"/>
          <rect x="32" y="100" width="16" height="20" fill="#8B4513"/>
          <circle cx="40" cy="25" r="4" fill="#FFD700"/>
          <circle cx="30" cy="50" r="3" fill="#FF0000"/>
          <circle cx="50" cy="45" r="3" fill="#0000FF"/>
          <circle cx="35" cy="70" r="3" fill="#FFD700"/>
          <circle cx="55" cy="65" r="3" fill="#FF0000"/>
        </svg>
      </div>

      <div className="absolute bottom-0 right-10 pointer-events-none opacity-80">
        <svg width="100" height="150" viewBox="0 0 80 120">
          <polygon points="40,0 80,100 0,100" fill="#228B22"/>
          <polygon points="40,20 70,80 10,80" fill="#2E8B2E"/>
          <polygon points="40,35 60,65 20,65" fill="#32CD32"/>
          <rect x="32" y="100" width="16" height="20" fill="#8B4513"/>
          <circle cx="40" cy="25" r="4" fill="#FFD700"/>
          <circle cx="25" cy="55" r="3" fill="#FF0000"/>
          <circle cx="55" cy="50" r="3" fill="#00FF00"/>
          <circle cx="40" cy="75" r="3" fill="#0000FF"/>
        </svg>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-20"
      >
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-10 border-4 border-red-600 relative overflow-hidden">
          {/* Decoração de luzes de Natal no topo */}
          <div className="absolute top-0 left-0 right-0 flex justify-around">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className={`w-3 h-3 rounded-full ${i % 4 === 0 ? 'bg-red-500' : i % 4 === 1 ? 'bg-green-500' : i % 4 === 2 ? 'bg-yellow-400' : 'bg-blue-500'}`}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </div>

          {/* Laços decorativos nos cantos */}
          <div className="absolute -top-2 -left-2 text-3xl">🎀</div>
          <div className="absolute -top-2 -right-2 text-3xl">🎀</div>

          <div className="text-center mb-8 mt-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative inline-block mb-4"
            >
              <TreePine className="w-16 h-16 text-green-600 mx-auto" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute -top-2 left-1/2 -translate-x-1/2"
              >
                <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
              </motion.div>
            </motion.div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-red-600 via-green-600 to-red-600 bg-clip-text text-transparent mb-2">
              timeco
            </h1>
            <p className="text-gray-600 font-medium flex items-center justify-center gap-2">
              <span>🎄</span> Feliz Natal! <span>🎄</span>
            </p>
            <p className="text-sm text-gray-500">Acesse sua conta</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Usuário
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-green-600 w-5 h-5" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-green-200 rounded-xl focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-100 transition-all font-medium"
                  placeholder="Digite seu usuário"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-green-600 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 border-2 border-green-200 rounded-xl focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-100 transition-all font-medium"
                  placeholder="Digite sua senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 via-red-500 to-green-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
              ) : (
                <>
                  <Gift size={22} />
                  Entrar 🎅
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Não tem uma conta?{' '}
              <Link
                to="/register"
                className="text-red-600 hover:text-green-600 font-semibold transition-colors"
              >
                Cadastre-se
              </Link>
            </p>
          </div>

          <div className="mt-6 p-4 bg-gradient-to-r from-red-50 to-green-50 rounded-xl border-2 border-dashed border-red-200">
            <p className="text-sm text-gray-700 font-medium text-center">
              🎁 Usuário padrão: <span className="font-bold text-red-600">admin</span> / Senha: <span className="font-bold text-green-600">123</span> 🎁
            </p>
          </div>

          {/* Decoração inferior */}
          <div className="flex justify-center gap-2 mt-4">
            <span className="text-2xl">🎄</span>
            <span className="text-2xl">🎅</span>
            <span className="text-2xl">🎁</span>
            <span className="text-2xl">⛄</span>
            <span className="text-2xl">🦌</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
