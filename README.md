# Animated Paginator Web Component

A lightweight, framework-agnostic paginator built as a native Web Component.

## ✨ Features

• Smooth pill-style animation between pages  
• Fully encapsulated styles (Shadow DOM)  
• Zero dependencies – works everywhere modern ES modules are supported  
• Customisable via attributes & public API methods  
• Emits `page-changed` events so your app can react to user navigation

## 📦 Installation

```bash
npm install animated-paginator-web-component
# or
yarn add animated-paginator-web-component
```

## 🚀 Usage

Simply import the package once (ES module) and drop the element into your HTML. No framework required:

```html
<!-- main.js -->
import 'animated-paginator-web-component';
```

```html
<!-- index.html -->
<animated-paginator
  pages="5"
  initial-page="0"
  page-colors="#4285F4,#FDBB2D,#9A40D3,#34A853,#EA4335">
</animated-paginator>
```

### Reacting to page changes

```js
const paginator = document.querySelector('animated-paginator');
paginator.addEventListener('page-changed', ({ detail }) => {
  console.log(`Moved from ${detail.oldPage} → ${detail.newPage}`);
});
```

### Programmatic navigation

```js
paginator.next();      // advance one page
paginator.previous();  // go back one
console.log(paginator.getCurrentPage());
```

## 🛠️ Local Development

1. **Clone & install:**  
   `git clone https://github.com/yourgithub/animated-paginator-web-component && cd animated-paginator-web-component && npm i`
2. **Link the package (optional):**  
   `npm link` and in a demo project `npm link animated-paginator-web-component`
3. Open `demo/index.html` in your browser to see it in action.

## 📝 License

MIT © Elad Ben-Haim
