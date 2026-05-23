// Metro bundler configuration para Expo
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Adiciona suporte a módulos Node.js necessários para crypto-js
config.resolver.extraNodeModules = {
  crypto: require.resolve('crypto-js'),
};

module.exports = config;
