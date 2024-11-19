const nextConfig = {
  reactStrictMode: false,
  compiler: {
    styledComponents: {
      ssr: true,
      displayName: true,
      fileName: false,
    },
  },

  i18n: {
    // Define which locales you want to support
    locales: ["en", "zh-TW"],

    // Default locale when user first visits the app
    defaultLocale: "zh-TW",

    // Whether to automatically detect user's locale based on their browser settings
    localeDetection: false,
  },
};

export default nextConfig;
