import React, { useState, useEffect } from 'react';
import { Trophy, Star, Calendar, Trash2, Eye, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { gameService } from '../services/api';

const History = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState(null);

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      const data = await gameService.getAll();
      setGames(data);
    } catch (error) {
      toast.error('Erro ao carregar historico');
    } finally {
      setLoading(false);
    }
  };

  const deleteGame = async (id) => {
    if (!window.confirm('Deseja excluir este jogo?')) return;

    try {
      await gameService.delete(id);
      setGames(games.filter(g => g.id !== id));
      toast.success('Jogo excluido!');
    } catch (error) {
      toast.error('Erro ao excluir jogo');
    }
  };

  const renderStars = (level) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={14}
        className={'transition-all ' + (i < level ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300')}
      />
    ));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-10">
            <div className="text-center mb-10">
              <Trophy className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Historico de Jogos
              </h1>
              <p className="text-gray-600">Veja seus sorteios anteriores</p>
            </div>

            {games.length === 0 ? (
              <div className="text-center py-16">
                <Calendar className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <p className="text-xl text-gray-500 font-medium">Nenhum jogo registrado ainda</p>
                <p className="text-gray-400 mt-2">Seus sorteios salvos aparecerao aqui</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {games.map((game, idx) => (
                  <motion.div
                    key={game.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg hover:shadow-xl transition-all border-2 border-gray-200 overflow-hidden"
                  >
                    <div className={'bg-gradient-to-r ' + (game.sport?.gradient || 'from-blue-500 to-purple-500') + ' text-white p-4'}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-3xl">{game.sport?.emoji}</span>
                          <span className="font-bold text-lg">{game.sport?.name}</span>
                        </div>
                        <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                          {game.numberOfTeams} times
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                        <Calendar size={16} />
                        {formatDate(game.playedAt)}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedGame(game)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
                        >
                          <Eye size={18} />
                          Ver
                        </button>
                        <button
                          onClick={() => deleteGame(game.id)}
                          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Modal de detalhes */}
      <AnimatePresence>
        {selectedGame && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedGame(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{selectedGame.sport?.emoji}</span>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{selectedGame.sport?.name}</h2>
                    <p className="text-gray-500 text-sm">{formatDate(selectedGame.playedAt)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedGame(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedGame.teams?.map((team, idx) => (
                  <div
                    key={team.id || idx}
                    className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border-2 border-blue-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                        <Trophy size={20} className="text-yellow-500" />
                        {team.name}
                      </h3>
                      <span className="text-sm font-medium text-purple-600">
                        Media: {team.averageSkillLevel?.toFixed(1)}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {team.players?.map((player, pIdx) => (
                        <div
                          key={player.id || pIdx}
                          className="flex items-center justify-between bg-white rounded-lg p-3"
                        >
                          <span className="font-medium text-gray-700">{player.name}</span>
                          <div className="flex gap-0.5">{renderStars(player.skillLevel)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default History;
