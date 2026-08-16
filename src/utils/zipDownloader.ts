import JSZip from 'jszip';

export async function downloadProjectZip() {
  const zip = new JSZip();

  // Root package.json
  const packageJsonContent = JSON.stringify({
    "name": "hunter-desktop",
    "private": true,
    "version": "1.0.0",
    "type": "module",
    "scripts": {
      "dev": "vite --port=3000 --host=0.0.0.0",
      "build": "vite build",
      "preview": "vite preview",
      "lint": "tsc --noEmit"
    },
    "dependencies": {
      "@supabase/supabase-js": "^2.49.1",
      "@tailwindcss/vite": "^4.1.14",
      "@vitejs/plugin-react": "^5.0.4",
      "html2pdf.js": "^0.14.0",
      "jszip": "^3.10.1",
      "lucide-react": "^0.546.0",
      "motion": "^12.23.24",
      "react": "^19.0.1",
      "react-dom": "^19.0.1",
      "recharts": "^3.10.1",
      "vite": "^6.2.3"
    },
    "devDependencies": {
      "@types/node": "^22.14.0",
      "@types/jszip": "^3.4.1",
      "autoprefixer": "^10.4.21",
      "tailwindcss": "^4.1.14",
      "typescript": "~5.8.2"
    }
  }, null, 2);

  // Root index.html
  const indexHtmlContent = `<!doctype html>
<html lang="pt-BR" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#000000" />
    <title>Hunter Desktop</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
  </head>
  <body class="bg-black text-white antialiased overflow-hidden select-none">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

  // Root vite.config.ts
  const viteConfigContent = `import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
    },
  };
});
`;

  // Root tsconfig.json
  const tsConfigContent = JSON.stringify({
    "compilerOptions": {
      "target": "ES2022",
      "useDefineForClassFields": true,
      "lib": ["ES2022", "DOM", "DOM.Iterable"],
      "module": "ESNext",
      "skipLibCheck": true,
      "moduleResolution": "bundler",
      "allowImportingTsExtensions": true,
      "resolveJsonModule": true,
      "isolatedModules": true,
      "noEmit": true,
      "jsx": "react-jsx",
      "strict": false,
      "noUnusedLocals": false,
      "noUnusedParameters": false,
      "noFallthroughCasesInSwitch": true,
      "baseUrl": ".",
      "paths": {
        "@/*": ["./*"]
      },
      "types": ["vite/client"]
    },
    "include": ["src"]
  }, null, 2);

  // Netlify config files
  const netlifyToml = `[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
`;

  // Place core root files explicitly
  zip.file('package.json', packageJsonContent);
  zip.file('index.html', indexHtmlContent);
  zip.file('vite.config.ts', viteConfigContent);
  zip.file('tsconfig.json', tsConfigContent);
  zip.file('netlify.toml', netlifyToml);
  zip.file('_redirects', `/* /index.html 200\n`);
  zip.file('public/_redirects', `/* /index.html 200\n`);

  // Dynamically load all source modules using Vite's glob import
  const globFn = (import.meta as any).glob;
  if (globFn) {
    const rawModules = globFn([
      '../**/*.*',
      '!../node_modules/**',
      '!../dist/**',
      '!../.git/**'
    ], { query: '?raw', import: 'default' });

    for (const [filepath, loader] of Object.entries(rawModules)) {
      try {
        const content = await (loader as () => Promise<string>)();
        // Clean relative path from src/utils/
        let cleanPath = filepath.replace(/^\.\.\//, '');
        if (cleanPath.startsWith('utils/')) cleanPath = 'src/' + cleanPath;
        if (!cleanPath.startsWith('src/') && !cleanPath.includes('/')) {
          // root file
        } else if (!cleanPath.startsWith('src/') && !cleanPath.startsWith('public/')) {
          cleanPath = 'src/' + cleanPath;
        }
        
        if (typeof content === 'string') {
          zip.file(cleanPath, content);
        }
      } catch (err) {
        console.warn('Erro ao ler arquivo para o zip:', filepath, err);
      }
    }
  }

  // Generate the zip blob
  const contentBlob = await zip.generateAsync({ type: 'blob' });

  // Trigger download
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `hunter-desktop-netlify-${dateStr}.zip`;

  const url = URL.createObjectURL(contentBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

