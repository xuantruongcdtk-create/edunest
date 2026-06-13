/** Expo app config. See https://docs.expo.dev/versions/latest/config/app/ */
module.exports = {
  expo: {
    name: 'EduNest',
    slug: 'edunest',
    scheme: 'edunest',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    backgroundColor: '#F9FAFB',
    newArchEnabled: false,
    assetBundlePatterns: ['**/*'],
    ios: {
      bundleIdentifier: 'vn.edunest.app',
      supportsTablet: true,
    },
    android: {
      package: 'vn.edunest.app',
    },
    plugins: ['expo-router'],
    extra: {
      // EAS project id is filled in by `eas init` when you set up store builds.
      eas: { projectId: '' },
    },
  },
}
