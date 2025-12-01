import React, { useState, useEffect } from 'react';
import { Users, Trophy, Star, Shuffle, Plus, Trash2, ArrowLeft, Sparkles, Zap } from 'lucide-react';

const SPORTS = [
  { name: 'Futebol', emoji: '⚽', gradient: 'from-green-400 to-blue-500' },
  { name: 'Vôlei', emoji: '🏐', gradient: 'from-orange-400 to-pink-500' },
  { name: 'Basquete', emoji: '🏀', gradient: 'from-orange-500 to-red-500' },
  { name: 'Futsal', emoji: '⚽', gradient: 'from-blue-400 to-purple-500' },
  { name: 'Handball', emoji: '🤾', gradient: 'from-purple-400 to-pink-500' }
];
const TEAM_OPTIONS = [2, 3, 4, 5];

const App = () => {
  const [step, setStep] = useState('config');
  const [sport, setSport] = useState(null);
  const [numTeams, setNumTeams] = useState(2);
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [playerName, setPlayerName] = useState('');
  const [playerLevel, setPlayerLevel] = useState(3);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('timeco-data');
    if (saved) {
      const data = JSON.parse(saved);
      setSport(data.sport || null);
      setNumTeams(data.numTeams || 2);
      setPlayers(data.players || []);
    }
  }, []);

  useEffect(() => {
    if (players.length > 0 || sport) {
      localStorage.setItem('timeco-data', JSON.stringify({ sport, numTeams, players }));
    }
  }, [sport, numTeams, players]);

  const addPlayer = () => {
    if (playerName.trim()) {
      setPlayers([...players, { id: Date.now(), name: playerName.trim(), level: playerLevel }]);
      setPlayerName('');
      setPlayerLevel(3);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  const removePlayer = (id) => {
    setPlayers(players.filter(p => p.id !== id));
  };

  const distributeTeams = () => {
    if (players.length < numTeams) {
      alert(`É necessário ter pelo menos ${numTeams} jogadores para ${numTeams} times!`);
      return;
    }

    setIsAnimating(true);
    
    setTimeout(() => {
      const sortedPlayers = [...players].sort((a, b) => b.level - a.level);
      const newTeams = Array.from({ length: numTeams }, () => ({ players: [], totalLevel: 0 }));

      sortedPlayers.forEach(player => {
        const teamIndex = newTeams.reduce((minIdx, team, idx, arr) => 
          team.totalLevel < arr[minIdx].totalLevel ? idx : minIdx, 0);
        
        newTeams[teamIndex].players.push(player);
        newTeams[teamIndex].totalLevel += player.level;
      });

      newTeams.forEach((team) => {
        for (let i = team.players.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [team.players[i], team.players[j]] = [team.players[j], team.players[i]];
        }
      });

      setTeams(newTeams);
      setStep('result');
      setIsAnimating(false);
    }, 1000);
  };

  const reset = () => {
    setStep('config');
    setTeams([]);
  };

  const clearAll = () => {
    setSport(null);
    setPlayers([]);
    setTeams([]);
    setStep('config');
    localStorage.removeItem('timeco-data');
  };

  const renderStars = (level) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        className={`transition-all duration-300 ${
          i < level ? 'fill-yellow-400 text-yellow-400 scale-110' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (step === 'config' && !sport) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 p-4 animate-gradient-x relative overflow-hidden">
        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full opacity-20 animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 10}s`
              }}
            />
          ))}
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-12 transform hover:scale-[1.02] transition-all duration-500">
            <div className="text-center mb-12 animate-fade-in">
              <div className="relative inline-block mb-6">
                <Trophy className="w-20 h-20 text-blue-600 mx-auto animate-bounce-slow" />
                <Sparkles className="w-8 h-8 text-yellow-400 absolute -top-2 -right-2 animate-pulse" />
              </div>
              <h1 className="text-6xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 animate-gradient-x">
                timeco
              </h1>
              <p className="text-xl text-gray-600 font-semibold">Sorteio equilibrado de times 🚀</p>
            </div>

            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
              Escolha seu Esporte
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {SPORTS.map((s, idx) => (
                <button
                  key={s.name}
                  onClick={() => setSport(s)}
                  className="group relative p-8 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 border-2 border-transparent hover:border-blue-400 overflow-hidden"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                  <div className="relative z-10">
                    <div className="text-6xl mb-4 transform group-hover:scale-125 transition-transform duration-300">
                      {s.emoji}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                      {s.name}
                    </h3>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'config' && sport) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 p-4 animate-gradient-x">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-10 animate-slide-up">
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={() => setSport(null)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <ArrowLeft size={20} />
                Voltar
              </button>
              <button
                onClick={clearAll}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Limpar Tudo
              </button>
            </div>

            <div className="text-center mb-10">
              <div className="text-6xl mb-4 animate-bounce-slow">{sport.emoji}</div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                {sport.name}
              </h1>
              <p className="text-gray-600 font-semibold">Configure seus times</p>
            </div>

            <div className="mb-10">
              <label className="block text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Zap className="text-yellow-500" />
                Quantidade de Times
              </label>
              <div className="flex gap-4 flex-wrap justify-center">
                {TEAM_OPTIONS.map(num => (
                  <button
                    key={num}
                    onClick={() => setNumTeams(num)}
                    className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-110 shadow-lg ${
                      numTeams === num
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-2xl scale-110'
                        : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300'
                    }`}
                  >
                    {num} Times
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-10 bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl">
              <label className="block text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Plus className="text-green-500" />
                Adicionar Jogador
              </label>
              <div className="flex flex-col lg:flex-row gap-4">
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
                  placeholder="Nome do jogador"
                  className="flex-1 px-6 py-4 border-3 border-blue-300 rounded-xl focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-200 transition-all duration-300 text-lg font-semibold"
                />
                <div className="flex items-center gap-4 bg-white px-6 py-4 rounded-xl shadow-lg">
                  <span className="text-lg font-bold text-gray-700 whitespace-nowrap">Nível:</span>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    value={playerLevel}
                    onChange={(e) => setPlayerLevel(Number(e.target.value))}
                    className="flex-1 accent-purple-500"
                  />
                  <span className="font-black text-2xl text-purple-600 w-10 text-center">{playerLevel}</span>
                  <div className="flex gap-1">{renderStars(playerLevel)}</div>
                </div>
                <button
                  onClick={addPlayer}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 flex items-center justify-center gap-2 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Plus size={24} />
                  Adicionar
                </button>
              </div>
            </div>

            {players.length > 0 && (
              <>
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Users size={28} className="text-blue-600" />
                    Jogadores Cadastrados ({players.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
                    {players.map((player, idx) => (
                      <div
                        key={player.id}
                        className={`flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-blue-200 ${
                          isAnimating && idx === players.length - 1 ? 'animate-slide-in' : ''
                        }`}
                      >
                        <div className="flex-1">
                          <span className="font-bold text-lg text-gray-800">{player.name}</span>
                          <div className="flex gap-1 mt-2">{renderStars(player.level)}</div>
                        </div>
                        <button
                          onClick={() => removePlayer(player.id)}
                          className="text-red-500 hover:text-red-700 p-3 hover:bg-red-100 rounded-lg transition-all duration-300 transform hover:scale-110"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={distributeTeams}
                  disabled={isAnimating}
                  className={`w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 font-black text-xl shadow-2xl transform hover:scale-105 ${
                    isAnimating ? 'animate-pulse' : 'hover:shadow-3xl'
                  }`}
                >
                  <Shuffle size={28} className={isAnimating ? 'animate-spin' : ''} />
                  {isAnimating ? 'Sorteando...' : 'Sortear Times'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'result') {
    const teamGradients = [
      'from-blue-500 to-cyan-500',
      'from-green-500 to-emerald-500',
      'from-red-500 to-pink-500',
      'from-purple-500 to-fuchsia-500',
      'from-orange-500 to-amber-500'
    ];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 p-4 animate-gradient-x">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-10 animate-slide-up">
            <div className="text-center mb-10">
              <div className="relative inline-block mb-6">
                <Trophy className="w-24 h-24 text-yellow-500 mx-auto animate-bounce-slow" />
                <Sparkles className="w-10 h-10 text-yellow-300 absolute -top-2 -right-2 animate-ping" />
              </div>
              <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3 animate-gradient-x">
                Times Sorteados!
              </h1>
              <p className="text-2xl text-gray-700 font-bold flex items-center justify-center gap-2">
                <span className="text-4xl">{sport.emoji}</span>
                {sport.name}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
              {teams.map((team, idx) => (
                <div 
                  key={idx} 
                  className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl overflow-hidden transform hover:scale-105 transition-all duration-300 hover:shadow-2xl animate-fade-in border-2 border-gray-200"
                  style={{ animationDelay: `${idx * 150}ms` }}
                >
                  <div className={`bg-gradient-to-r ${teamGradients[idx]} text-white p-6 relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16" />
                    <div className="relative z-10">
                      <h3 className="text-3xl font-black mb-2 flex items-center gap-2">
                        <Trophy size={28} />
                        Time {idx + 1}
                      </h3>
                      <p className="text-lg font-semibold opacity-90">
                        ⭐ Nível médio: {(team.totalLevel / team.players.length).toFixed(1)}
                      </p>
                    </div>
                  </div>
                  <div className="p-5 space-y-3">
                    {team.players.map((player, pIdx) => (
                      <div 
                        key={pIdx} 
                        className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                      >
                        <div className="font-bold text-lg text-gray-800 mb-2">{player.name}</div>
                        <div className="flex gap-1">{renderStars(player.level)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={distributeTeams}
                className="flex-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-5 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 font-black text-lg shadow-xl hover:shadow-2xl transform hover:scale-105"
              >
                <Shuffle size={24} />
                Sortear Novamente
              </button>
              <button
                onClick={reset}
                className="flex-1 bg-gradient-to-r from-gray-700 to-gray-900 text-white py-5 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 font-black text-lg shadow-xl hover:shadow-2xl transform hover:scale-105"
              >
                <ArrowLeft size={24} />
                Voltar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default App;