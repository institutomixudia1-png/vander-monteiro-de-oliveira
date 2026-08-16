# HUNTER DESKTOP - Guia de Publicação no Netlify 🚀

Este aplicativo é um projeto React + Vite de alta performance otimizado para deploy instantâneo na plataforma Netlify.

---

### Opção 1: Deploy Automático via Repositório GitHub (Recomendado)
1. Faça o commit e push do projeto para um repositório no seu **GitHub**, **GitLab** ou **Bitbucket**.
2. Acesse sua conta no **[Netlify](https://app.netlify.com)** e clique em **"Add new site"** > **"Import an existing project"**.
3. Selecione o repositório do Hunter Desktop.
4. O Netlify reconhecerá automaticamente o arquivo `netlify.toml`:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Clique em **"Deploy site"**. Em menos de 1 minuto seu sistema estará online!

---

### Opção 2: Deploy Direto por Arrastar e Soltar (Netlify Drop)
1. No seu terminal local, gere os arquivos finais de produção executando:
   ```bash
   npm run build
   ```
2. Acesse **[Netlify Drop](https://app.netlify.com/drop)**.
3. Arraste e solte a pasta **`dist`** gerada dentro do Netlify.
4. Seu aplicativo será publicado instantaneamente sem necessidade de servidor backend!

---

### Arquivos de Configuração Inclusos
- **`netlify.toml`**: Configuração automática de comando de build (`npm run build`), diretório de saída (`dist`) e rotas SPA com status 200.
- **`public/_redirects`**: Regra de redirecionamento SPA `/* /index.html 200` para garantir que o recarregamento de páginas funcione perfeitamente.
