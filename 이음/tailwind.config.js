/* fx-scaffold */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      "colors": {
        "fx-background": "var(--fx-color-background)",
        "fx-surface": "var(--fx-color-surface)",
        "fx-text": "var(--fx-color-text)",
        "fx-text-muted": "var(--fx-color-text-muted)",
        "fx-border": "var(--fx-color-border)",
        "fx-overlay": "var(--fx-color-overlay)",
        "fx-primary": "var(--fx-color-primary)",
        "fx-on-primary": "var(--fx-color-on-primary)",
        "fx-success": "var(--fx-color-success)",
        "fx-warning": "var(--fx-color-warning)",
        "fx-error": "var(--fx-color-error)",
        "fx-info": "var(--fx-color-info)",
        "fx-accent": "var(--fx-color-accent)",
        "fx-accent-soft": "var(--fx-color-accent-soft)",
        "fx-data-1": "var(--fx-color-data-1)",
        "fx-data-2": "var(--fx-color-data-2)",
        "fx-data-3": "var(--fx-color-data-3)",
        "fx-data-4": "var(--fx-color-data-4)",
        "fx-data-5": "var(--fx-color-data-5)",
        "fx-data-6": "var(--fx-color-data-6)",
        "fx-primary-soft": "var(--fx-color-primary-soft)",
        "fx-secondary": "var(--fx-color-secondary)",
        "fx-secondary-soft": "var(--fx-color-secondary-soft)"
      },
      "borderRadius": {
        "fx-sm": "var(--fx-radius-sm)",
        "fx-md": "var(--fx-radius-md)",
        "fx-lg": "var(--fx-radius-lg)",
        "fx-pill": "var(--fx-radius-pill)"
      },
      "spacing": {
        "fx-xs": "var(--fx-space-xs)",
        "fx-sm": "var(--fx-space-sm)",
        "fx-md": "var(--fx-space-md)",
        "fx-lg": "var(--fx-space-lg)",
        "fx-xl": "var(--fx-space-xl)",
        "fx-section": "var(--fx-space-section)",
        "fx-1": "var(--fx-space-1)",
        "fx-2": "var(--fx-space-2)",
        "fx-3": "var(--fx-space-3)",
        "fx-4": "var(--fx-space-4)",
        "fx-5": "var(--fx-space-5)",
        "fx-6": "var(--fx-space-6)",
        "fx-8": "var(--fx-space-8)",
        "fx-10": "var(--fx-space-10)",
        "fx-12": "var(--fx-space-12)",
        "fx-16": "var(--fx-space-16)",
        "fx-20": "var(--fx-space-20)",
        "fx-24": "var(--fx-space-24)"
      },
      "fontSize": {
        "xs": [
          "12px",
          "16px"
        ],
        "sm": [
          "14px",
          "20px"
        ],
        "base": [
          "16px",
          "24px"
        ],
        "lg": [
          "18px",
          "28px"
        ],
        "xl": [
          "20px",
          "28px"
        ],
        "2xl": [
          "24px",
          "32px"
        ],
        "3xl": [
          "30px",
          "36px"
        ],
        "4xl": [
          "36px",
          "40px"
        ],
        "5xl": [
          "48px",
          "48px"
        ]
      },
      "fontFamily": {
        "fx-description": [
          "var(--fx-font-description)"
        ],
        "fx-plain": [
          "var(--fx-font-plain)"
        ],
        "fx-title": [
          "var(--fx-font-title)"
        ],
        "sans": [
          "var(--fx-font-plain)"
        ]
      }
    },
  },
};
