// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ["@nuxt/icon", "motion-v/nuxt"],
  vite: {
    plugins: [tailwindcss()],
  },

  css: ["~/assets/css/index.css"],

  nitro: {
    routeRules: {
      "/api/**": {
        cors: true,
        headers: {
          "Access-Control-Allow-Methods": "GET",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "*",
        },
      },
    },
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NODE_ENV === "development" ? "" : "/api",
    },
  },
});
