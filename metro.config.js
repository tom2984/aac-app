// metro.config.js – Expo + NativeWind v4 + Expo Router + Supabase Fix
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Note: Removed crypto polyfills for Expo Go compatibility

// Apply NativeWind configuration
module.exports = withNativeWind(config, {
  input: './global.css',
});
