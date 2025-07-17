import 'dotenv/config';

export default {
  expo: {
    name: "AAC Forms App",
    slug: "aac-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "aacapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    updates: {
      url: "https://u.expo.dev/cc0aaf35-c879-4ee6-9d18-4359adf73c32"
    },
    runtimeVersion: {
      policy: "appVersion"
    },
    ios: {
      bundleIdentifier: "com.aac.forms",
      supportsTablet: true
    },
    android: {
      package: "com.aac.forms",
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/logo.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#FF5C4D"
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      // Fixed environment variable names to match .env.local format
      // These will now correctly read from your .env.local file
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      eas: {
        projectId: "cc0aaf35-c879-4ee6-9d18-4359adf73c32"
      }
    }
  }
};
