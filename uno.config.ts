import {defineConfig, presetWind, transformerDirectives} from 'unocss'
import {presetRadixColors} from 'unocss-preset-radix-colors'

// Static fallback for system font families
const fontFamily = {
  'system-sans': "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
  'system-serif': "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
  sans: "Geist, 'Geist Fallback', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
  serif: "'Source Serif 4 Variable', 'Source Serif 4 Fallback', ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
  mono: "Monaco, ui-monospace, Menlo, 'Liberation Mono', 'Courier New', monospace"
}

export default defineConfig({
  theme: {
    fontFamily,
    letterSpacing: {
      serif: '-0.018em',
    },
  },
  shortcuts: {
    'font-serif': 'font-serif tracking-serif',
  },
  transformers: [
    // Enable @apply directives.
    transformerDirectives(),
  ],
  presets: [
    presetWind({dark: 'class'}),
    presetRadixColors({
      prefix: '',
      lightSelector: '.light',
      darkSelector: '.dark',
      colors: [
        // neutral
        'gray',
        // error
        'red',
        // success
        'green',
        // warning
        'yellow',
        'orange',
        // info
        'blue',
      ],
      aliases: {},
    }),
  ],
})
