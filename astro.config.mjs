import { defineConfig } from 'astro/config';
import astroIcon from "astro-icon";
import UnoCSS from "unocss/astro";

// https://astro.build/config
export default defineConfig({
  integrations: [
    astroIcon({
      sets: ["simple-icons", "material-symbols"]
    }),
    UnoCSS()
  ]
});
