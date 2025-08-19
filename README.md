## Overview

A simple one-page portfolio website built with plain HTML and CSS.

## Development

### Prerequisites

- Node.js and npm installed on your machine

### Content Management

The site uses a template system to inject content from JSON files during the build process.

#### Template Variables

Template strings in HTML files use double curly braces syntax to reference properties in the JSON content:

```html
<!-- In index.html -->
<title>{{meta.title}}</title>

<!-- Will be replaced with content from src/site-content.json -->
<!-- Where site-content.json contains: { "meta": { "title": "Jack Fitzgibbon | Software Engineer" } } -->
```

#### Foreach Loops

For dynamic content like lists, use the `@foreach` syntax to iterate over arrays:

```html
<!-- In index.html -->
<nav class="social-links">
  @foreach (content.socialLinks as link) {
  <a href="{{link.url}}" target="_blank" aria-label="{{link.ariaLabel}}"> {{link.iconSvg}} </a>
  }
</nav>
```

This requires the corresponding data structure in `site-content.json`:

```json
{
  "content": {
    "socialLinks": [
      {
        "url": "https://twitter.com/yourhandle",
        "ariaLabel": "Follow on Twitter",
        "iconSvg": "<svg>...</svg>"
      },
      {
        "url": "https://github.com/yourhandle",
        "ariaLabel": "View GitHub profile",
        "iconSvg": "<svg>...</svg>"
      }
    ]
  }
}
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
