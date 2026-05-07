const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// EXPERIMENTO: desabilita mangling/compress no bundle web pra testar se o
// minifier (terser) está corrompendo bytecode (suspeita do crash
// STATUS_ILLEGAL_INSTRUCTION em Chrome mobile no Vercel). Se essa flag
// fizer o web parar de crashar, o problema é o minifier — daí podemos
// ajustar opções específicas em vez de desabilitar tudo.
if (process.env.EXPO_PUBLIC_NO_MINIFY === '1') {
  config.transformer.minifierConfig = {
    compress: false,
    mangle: false,
    keep_classnames: true,
    keep_fnames: true,
  };
}

module.exports = config;
