# @stylexjs/postcss-plugin

## Documentation Website

[https://stylexjs.com](https://stylexjs.com)

## Installation

Install the package by using:

```bash
npm install --save-dev @stylexjs/postcss-plugin autoprefixer
```

or with yarn:

```
yarn add --dev @stylexjs/postcss-plugin autoprefixer
```

Add the following to your `postcss.config.js`

```javascript
// postcss.config.js
module.exports = {
  plugins: {
    '@stylexjs/postcss-plugin': {
      include: ['src/**/*.{js,jsx,ts,tsx}'],
    },
    autoprefixer: {},
  },
};
```

Add the following to your `babel.config.js`

```javascript
import styleXPlugin from '@stylexjs/babel-plugin';

const config = {
  plugins: [
    [
      styleXPlugin,
      {
        // Required for this plugin
        runtimeInjection: false,
        dev: true,
        // Set this to true for snapshot testing
        // default: false
        test: false,
        // Required for CSS variable support
        unstable_moduleResolution: {
          // type: 'commonJS' | 'haste'
          // default: 'commonJS'
          type: 'commonJS',
          // The absolute path to the root directory of your project
          rootDir: __dirname,
        },
      },
    ],
  ],
};

export default config;
```

Add the following to `src/stylex.css`

```css
/**
 * The @stylex directive is used by the @stylexjs/postcss-plugin.
 * It is automatically replaced with generated CSS during builds.
 */
@stylex;
```

Then, import this file from your application entrypoint:

```javascript
// src/index.js
import './stylex.css';
```

## Plugin Options

### include

```js
include: string[] // Required
```

Array of paths or glob patterns to compile.

---

### exclude

```js
exclude: string[] // Default: []
```

Array of paths or glob patterns to exclude from compilation. Paths in exclude
take precedence over include.

---

### cwd

```js
cwd: string; // Default: process.cwd()
```

Working directory for the plugin; defaults to process.cwd().

---

### babelConfig

```js
babelConfig: object; // Default: {}
```

Options for Babel configuration. By default, the plugin reads from
babel.config.js in your project. For custom configurations, set babelrc: false
and specify desired options. Refer to
[Babel Config Options](https://babeljs.io/docs/options) for available options.

---

### useCSSLayers

```js
useCSSLayers: 'none' | 'native' | 'polyfill'; // Default: 'none'
```

The `useCSSLayers` option controls how StyleX handles CSS specificity and layer
management. It supports three strategies:

- `'none'` (default): Uses `:not(#\#)` to handle CSS specificity without layers
- `'native'`: Uses native CSS `@layer` for handling CSS specificity
- `'polyfill'`: Uses `@csstools/postcss-cascade-layers` to polyfill CSS layers
  for browsers that don't support them

---

### importSources

```js
importSources: Array<string | { from: string, as: string }>; // Default: ['@stylexjs/stylex', 'stylex']
```

Possible strings where you can import stylex from. Files that do not match the
import sources may be skipped from being processed to speed up compilation.
