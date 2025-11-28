# 🚀 EvoTalk Gateway

> Plataforma Multi-tenant de CRM com Integração WhatsApp via Evolution API

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-3ecf8e.svg)](https://supabase.com/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff.svg)](https://vitejs.dev/)

---

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Recursos](#recursos)
- [Início Rápido](#início-rápido)
- [Tecnologias](#tecnologias)
- [Documentação](#documentação)
- [Deploy](#deploy)

---

## 🎯 Sobre o Projeto

EvoTalk Gateway é uma plataforma completa de CRM multi-tenant com foco em atendimento via WhatsApp através da Evolution API. Desenvolvido com as melhores práticas de TypeScript, React e arquitetura escalável.

### ✨ Destaques

- 🏢 **Multi-tenant** com isolamento completo de dados
- 💬 **WhatsApp Integration** via Evolution API
- 🎨 **UI Moderna** com shadcn/ui e Tailwind CSS
- 🔒 **Seguro** com RLS (Row Level Security) no Supabase
- ⚡ **Performático** com lazy loading e code splitting
- 📱 **Responsivo** com suporte mobile completo
- 🎮 **Gamificação** integrada para engajamento
- 📊 **Analytics** e relatórios executivos

---

## 🚀 Recursos

### Chat & Atendimento
- ✅ Inbox unificado com múltiplas conversas
- ✅ Respostas rápidas e templates
- ✅ Transferência de conversas entre agentes
- ✅ Filas de atendimento
- ✅ Chatbot com IA (planejado)

### CRM & Vendas
- ✅ Pipeline de vendas customizável (Kanban)
- ✅ Gestão de contatos com tags e campos customizados
- ✅ Funil de vendas com automações
- ✅ Propostas comerciais
- ✅ Produtos e catálogo

### Automação
- ✅ Workflows visuais (drag & drop)
- ✅ Campanhas de mensagens em massa
- ✅ Segmentação de contatos
- ✅ Playbooks de atendimento

### Analytics
- ✅ Dashboard executivo
- ✅ Relatórios de desempenho por agente
- ✅ Métricas de atendimento (TMA, FCR, etc)
- ✅ Insights de vendas

### Administração
- ✅ Gestão de usuários e permissões (RBAC)
- ✅ Multi-empresa (companies)
- ✅ Configurações por empresa
- ✅ Super Admin (gerenciar plataforma)

---

## 🏁 Início Rápido

### Opção 1: Supabase Cloud (Recomendado) ⭐

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/evo-talk-gateway.git
cd evo-talk-gateway

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais do Supabase

# 4. Inicie o projeto
npm run dev
```

👉 **Pegue suas credenciais em:** https://app.supabase.com/project/_/settings/api

### Opção 2: Supabase Local 🐳

**Pré-requisitos:** Docker Desktop instalado e rodando

**Windows:**
```bash
setup-local.bat
npm run dev:local
```

**Linux/macOS:**
```bash
chmod +x setup-local.sh
./setup-local.sh
npm run dev:local
```

📖 **Guia completo:** [QUICK_START.md](./QUICK_START.md) | [SUPABASE_LOCAL_SETUP.md](./SUPABASE_LOCAL_SETUP.md)

---

## 🛠️ Tecnologias

### Core
- **React 18.3** - Framework UI
- **TypeScript 5.8** - Type safety (strict mode)
- **Vite 5.4** - Build tool & dev server
- **React Router 6.30** - Roteamento

### UI & Styling
- **shadcn/ui** - Componentes acessíveis
- **Tailwind CSS** - Utility-first CSS
- **Radix UI** - Primitives headless
- **Lucide React** - Ícones

### Backend & Database
- **Supabase** - BaaS (PostgreSQL + Auth + Storage + Realtime)
- **React Query 5** - Data fetching & caching
- **Zod** - Validação de schemas

### Integrations
- **Evolution API** - WhatsApp Business API
- **React Hook Form** - Formulários
- **date-fns** - Manipulação de datas
- **DOMPurify** - Sanitização XSS

### DevOps & Quality
- **ESLint** - Linting
- **Prettier** - Formatação
- **GitHub Actions** - CI/CD
- **TypeScript Strict Mode** - Máxima segurança de tipos

---

## 📚 Documentação

- **[QUICK_START.md](./QUICK_START.md)** - Início rápido
- **[SUPABASE_LOCAL_SETUP.md](./SUPABASE_LOCAL_SETUP.md)** - Setup local detalhado
- **[IMPROVEMENTS.md](./IMPROVEMENTS.md)** - Melhorias implementadas
- **[CHANGELOG.md](./CHANGELOG.md)** - Histórico de versões
- **[MELHORIAS_RESUMO.md](./MELHORIAS_RESUMO.md)** - Resumo executivo

### Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Modo normal
npm run dev:local        # Modo local (Supabase local)

# Build
npm run build            # Build de produção
npm run preview          # Preview do build

# Qualidade
npm run lint             # Verificar código
npm run lint:fix         # Corrigir automaticamente
npm run format           # Formatar código
npm run type-check       # Verificar tipos

# Supabase Local
npm run supabase:start   # Iniciar
npm run supabase:stop    # Parar
npm run supabase:status  # Status
npm run supabase:reset   # Resetar (apaga dados!)
npm run supabase:studio  # Abrir Studio
```

---

## 🚀 Deploy

### Opção 1: Lovable (Recomendado)

1. Abra [Lovable Project](https://lovable.dev/projects/cc34f5a2-9f9c-45fd-8afa-152c2212263d)
2. Clique em **Share → Publish**
3. Configure domínio customizado em **Project → Settings → Domains**

### Opção 2: Manual (Vercel/Netlify)

```bash
# Build
npm run build

# Deploy (exemplo: Vercel)
vercel --prod
```

**Variáveis de ambiente obrigatórias:**
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-aqui
```

---

## 📁 Estrutura do Projeto

```
evo-talk-gateway/
├── src/
│   ├── components/        # Componentes React
│   │   ├── chat/         # Módulo de chat
│   │   ├── crm/          # Módulo CRM
│   │   ├── auth/         # Autenticação
│   │   └── ui/           # Componentes base (shadcn)
│   ├── hooks/            # Hooks customizados
│   ├── lib/              # Utilitários
│   ├── config/           # Configurações
│   ├── pages/            # Páginas/Rotas
│   ├── integrations/     # APIs externas
│   └── App.tsx
├── supabase/             # Supabase local config
├── public/               # Assets estáticos
├── docs/                 # Documentação
└── .github/workflows/    # CI/CD
```

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

## 🆘 Suporte

- 📖 Leia a [documentação completa](./docs)
- 🐛 Reporte bugs no [GitHub Issues](https://github.com/seu-usuario/evo-talk-gateway/issues)
- 💬 Dúvidas? Entre em contato

---

## 🎯 Roadmap

- [ ] Chatbot com IA (GPT/Claude)
- [ ] Integração com outras plataformas (Telegram, Instagram)
- [ ] Mobile app (React Native)
- [ ] Integração com CRMs externos
- [ ] Marketplace de templates e automações

---

**Desenvolvido com ❤️ pela equipe EvoTalk**
