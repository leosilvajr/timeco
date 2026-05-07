const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// EXPERIMENTO: substitui react-native-reanimated por stub vazio no web.
// Reanimated 4.x usa worklets que tem JS fallback no web, mas suspeita
// que essa runtime crasha V8 em Chrome mobile (STATUS_ILLEGAL_INSTRUCTION).
// @react-navigation funciona sem reanimated com transicoes nativas mais
// simples — perda aceitavel se isso resolver o crash.
const originalResolver = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    platform === 'web' &&
    (moduleName === 'react-native-reanimated' ||
      moduleName.startsWith('react-native-reanimated/'))
  ) {
    return {
      type: 'sourceFile',
      filePath: path.resolve(__dirname, 'src/stubs/reanimatedWeb.js'),
    };
  }
  if (originalResolver) return originalResolver(context, moduleName, platform);
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
