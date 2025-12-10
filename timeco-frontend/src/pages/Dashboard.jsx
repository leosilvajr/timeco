import React, { useState, useEffect } from 'react';
import { Users, Trophy, Star, Shuffle, Plus, Trash2, ArrowLeft, Sparkles, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { sportService, gameService } from '../services/api';

const TEAM_OPTIONS = [2, 3, 4, 5];

const Dashboard = () => {
  const [step, setStep] = useState('sport');
  const [sports, setSports] = useState([]);
  const [selectedSport, setSelectedSport] = useState(null);
  const [numTeams, setNumTeams] = useState(2);
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [playerName, setPlayerName] = useState('');
  const [playerLevel, setPlayerLevel] = useState(3);
  const [isAnimating, setIsAnimating] = useState(false);
  const [loadingSports, setLoadingSports] = useState(true);

  useEffect(() => {
    loadSports();
    const saved = localStorage.getItem('timeco-session');
    if (saved) {
      const data = JSON.parse(saved);
      setSelectedSport(data.sport || null);
      setNumTeams(data.numTeams || 2);
      setPlayers(data.players || []);
      if (data.sport) setStep('config');
    }
  }, []);

  useEffect(() => {
    if (players.length > 0 || selectedSport) {
      localStorage.setItem('timeco-session', JSON.stringify({
        sport: selectedSport,
        numTeams,
        players
      }));
    }
  }, [selectedSport, numTeams, players]);

  const loadSports = async () => {
    try {
      const data = await sportService.getAll();
      setSports(data);
    } catch (error) {
      toast.error('Erro ao carregar esportes');
    } finally {
      setLoadingSports(false);
    }
  };

  const addPlayer = () => {
    if (playerName.trim()) {
      setPlayers([...players, {
        id: crypto.randomUUID(),
        name: playerName.trim(),
        skillLevel: playerLevel
      }]);
      setPlayerName('');
      setPlayerLevel(3);
      toast.success('Jogador adicionado!');
    }
  };

  const removePlayer = (id) => {
    setPlayers(players.filter(p => p.id !== id));
    toast.success('Jogador removido!');
  };

  const distributeTeams = async () => {
    if (players.length < numTeams) {
      toast.error('Minimo de ' + numTeams + ' jogadores para ' + numTeams + ' times!');
      return;
    }

    setIsAnimating(true);

    try {
      const response = await gameService.distributeTeams(
        selectedSport.id,
        numTeams,
        players
      );

      setTimeout(() => {
        setTeams(response.teams);
        setStep('result');
        setIsAnimating(false);
      }, 1000);
    } catch (error) {
      toast.error('Erro ao sortear times');
      setIsAnimating(false);
    }
  };

  const reset = () => {
    setStep('config');
    setTeams([]);
  };

  const clearAll = () => {
    setSelectedSport(null);
    setPlayers([]);
    setTeams([]);
    setStep('sport');
    localStorage.removeItem('timeco-session');
    toast.success('Dados limpos!');
  };

  const renderStars = (level) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        className={'transition-all duration-300 ' + (i < level ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300')}
      />
    ));
  };

  if (loadingSports) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
        </div>
      </Layout>
    );
  }

  if (step === 'sport') {
    return (
      <Layout>
        <div className="p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-12">
              <div className="text-center mb-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring" }}
                  className="relative inline-block mb-6"
                >
                  <Trophy className="w-20 h-20 text-blue-600 mx-auto" />
                  <Sparkles className="w-8 h-8 text-yellow-400 absolute -top-2 -right-2 animate-pulse" />
                </motion.div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  Escolha seu Esporte
                </h2>
                <p className="text-gray-600">Selecione a modalidade para comecar</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sports.map((sport, idx) => (
                  <motion.button
                    key={sport.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedSport(sport);
                      setStep('config');
                    }}
                    className="group relative p-8 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg hover:shadow-2xl transition-all border-2 border-transparent hover:border-blue-400 overflow-hidden"
                  >
                    <div className={'absolute inset-0 bg-gradient-to-br ' + sport.gradient + ' opacity-0 group-hover:opacity-10 transition-opacity'} />
                    <div className="relative z-10">
                      <div className="text-6xl mb-4 transform group-hover:scale-125 transition-transform">
                        {sport.emoji}
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                        {sport.name}
                      </h3>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  if (step === 'config') {
    return (
      <Layout>
        <div className="p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto"
          >
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-10">
              <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStep('sport')}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold shadow-lg"
                >
                  <ArrowLeft size={20} />
                  Voltar
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={clearAll}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-semibold shadow-lg"
                >
                  Limpar Tudo
                </motion.button>
              </div>

              <div className="text-center mb-10">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="text-6xl mb-4"
                >
                  {selectedSport?.emoji}
                </motion.div>
                <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  {selectedSport?.name}
                </h1>
                <p className="text-gray-600 font-semibold">Configure seus times</p>
              </div>

              <div className="mb-10">
                <label className="block text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Zap className="text-yellow-500" />
                  Quantidade de Times
                </label>
                <div className="flex gap-4 flex-wrap justify-center">
                  {TEAM_OPTIONS.map(num => (
                    <motion.button
                      key={num}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setNumTeams(num)}
                      className={'px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg ' + (numTeams === num ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-2xl scale-110' : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700')}
                    >
                      {num} Times
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="mb-10 bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl">
                <label className="block text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
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
                    className="flex-1 px-6 py-4 border-2 border-blue-300 rounded-xl focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-200 transition-all text-lg font-semibold"
                  />
                  <div className="flex items-center gap-4 bg-white px-6 py-4 rounded-xl shadow-lg">
                    <span className="text-lg font-bold text-gray-700 whitespace-nowrap">Nivel:</span>
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
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={addPlayer}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2"
                  >
                    <Plus size={24} />
                    Adicionar
                  </motion.button>
                </div>
              </div>

              <AnimatePresence>
                {players.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Users size={24} className="text-blue-600" />
                        Jogadores ({players.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
                        {players.map((player, idx) => (
                          <motion.div
                            key={player.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: idx * 0.05 }}
                            className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl shadow-md hover:shadow-xl transition-all border-2 border-blue-200"
                          >
                            <div className="flex-1">
                              <span className="font-bold text-lg text-gray-800">{player.name}</span>
                              <div className="flex gap-1 mt-2">{renderStars(player.skillLevel)}</div>
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => removePlayer(player.id)}
                              className="text-red-500 hover:text-red-700 p-3 hover:bg-red-100 rounded-lg transition-all"
                            >
                              <Trash2 size={20} />
                            </motion.button>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={distributeTeams}
                      disabled={isAnimating}
                      className={'w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-6 rounded-2xl transition-all flex items-center justify-center gap-3 font-black text-xl shadow-2xl ' + (isAnimating ? 'animate-pulse' : '')}
                    >
                      <Shuffle size={28} className={isAnimating ? 'animate-spin' : ''} />
                      {isAnimating ? 'Sorteando...' : 'Sortear Times'}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </Layout>
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
      <Layout>
        <div className="p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto"
          >
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-10">
              <div className="text-center mb-10">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring" }}
                  className="relative inline-block mb-6"
                >
                  <Trophy className="w-24 h-24 text-yellow-500 mx-auto" />
                  <Sparkles className="w-10 h-10 text-yellow-300 absolute -top-2 -right-2 animate-ping" />
                </motion.div>
                <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
                  Times Sorteados!
                </h1>
                <p className="text-2xl text-gray-700 font-bold flex items-center justify-center gap-2">
                  <span className="text-4xl">{selectedSport?.emoji}</span>
                  {selectedSport?.name}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
                {teams.map((team, idx) => (
                  <motion.div
                    key={team.id || idx}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.15 }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl overflow-hidden border-2 border-gray-200"
                  >
                    <div className={'bg-gradient-to-r ' + teamGradients[idx] + ' text-white p-6 relative overflow-hidden'}>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16" />
                      <div className="relative z-10">
                        <h3 className="text-3xl font-black mb-2 flex items-center gap-2">
                          <Trophy size={28} />
                          {team.name}
                        </h3>
                        <p className="text-lg font-semibold opacity-90">
                          Nivel medio: {team.averageSkillLevel?.toFixed(1) || '0.0'}
                        </p>
                      </div>
                    </div>
                    <div className="p-5 space-y-3">
                      {team.players.map((player, pIdx) => (
                        <motion.div
                          key={player.id || pIdx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.15 + pIdx * 0.05 }}
                          className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-4"
                        >
                          <div className="font-bold text-lg text-gray-800 mb-2">{player.name}</div>
                          <div className="flex gap-1">{renderStars(player.skillLevel)}</div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={distributeTeams}
                  className="flex-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-5 rounded-2xl font-black text-lg shadow-xl flex items-center justify-center gap-3"
                >
                  <Shuffle size={24} />
                  Sortear Novamente
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={reset}
                  className="flex-1 bg-gradient-to-r from-gray-700 to-gray-900 text-white py-5 rounded-2xl font-black text-lg shadow-xl flex items-center justify-center gap-3"
                >
                  <ArrowLeft size={24} />
                  Voltar
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return null;
};

export default Dashboard;
