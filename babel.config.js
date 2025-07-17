// babel.config.js – Expo + NativeWind v4 + Expo Router
module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      // 1️⃣ Expo’s preset, plus the React-compiler options NativeWind needs
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],

      // 2️⃣ NativeWind v4 **as a preset** (not a plugin!)
      'nativewind/babel',
    ],

    // 3️⃣ Any *real* plugins go here
    plugins: [
      // No need for expo-router/babel as it's included in babel-preset-expo
    ],
  };
};
