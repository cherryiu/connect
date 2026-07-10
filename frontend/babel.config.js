module.exports = function (api) {
    api.cache(true);
    return {
      presets: ["babel-preset-expo"],
      plugins: [
        "react-native-reanimated/plugin",
        [
          "module:react-native-dotenv",
          {
            envName: "APP_ENV",
            moduleName: "@env",
            path:".env"
              // process.env.APP_ENV === "production"
              //   ? ".env.production"
              //   : ".env.development",
          },
        ],
      ],
    };
  };
  
