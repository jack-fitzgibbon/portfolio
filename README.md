## Overview

A simple one-page portfolio website built with plain HTML and CSS.

## Development

### Prerequisites

- Node.js and npm installed on your machine

### Content Management

The site uses a template system to inject content from JSON files during the build process.

Template strings in HTML files use double curly braces syntax to reference properties in the JSON content:

```html
<!-- In index.html -->
<title>{{meta.title}}</title>

<!-- Will be replaced with content from src/site-content.json -->
<!-- Where site-content.json contains: { "meta": { "title": "Jack Fitzgibbon | Software Engineer" } } -->
```

### Installation

```
npm install
```

### Development Server (with hot reload)

Run the development server that will automatically refresh on changes:

```
npm run dev
```

This will start a local server at http://localhost:3000

### Production Build

To create a minified production build:

```
npm run build
```

This will generate optimized files in the `dist` directory:

- Minified HTML
- Minified CSS
