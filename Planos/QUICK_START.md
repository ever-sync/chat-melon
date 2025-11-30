# 🚀 Guia Rápido - EvoTalk Gateway

Escolha como quer rodar o projeto:

## Opção 1: Supabase Cloud (Recomendado) ⭐

Mais fácil e rápido para começar!

### 1️⃣ Configure suas credenciais
```bash
# Copie o arquivo de exemplo
cp .env.example .env
```

### 2️⃣ Edite o arquivo `.env`
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-aqui
```

👉 Pegue suas credenciais em: https://app.supabase.com/project/_/settings/api

### 3️⃣ Instale e rode
```bash
npm install
npm run dev
```

### 4️⃣ Acesse
Abra http://localhost:5173

---

## Opção 2: Supabase Local 🐳

Para desenvolvimento offline ou testes de migrações.

### Pré-requisitos
- ✅ Docker Desktop instalado e rodando
- ✅ Node.js 18+

### 1️⃣ Setup Automático (Recomendado)

**Windows:**
```bash
# Execute o script
setup-local.bat
```

**Linux/macOS:**
```bash
# Dê permissão
chmod +x setup-local.sh

# Execute
./setup-local.sh
```

### 2️⃣ Setup Manual

```bash
# Instale o Supabase CLI
npm install -g supabase

# Inicialize
supabase init

# Inicie os serviços
supabase start

# Copie as credenciais que aparecem para .env.local
```

### 3️⃣ Configure o `.env.local`
Após o `supabase start`, copie as credenciais:

```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGc... (copie do terminal)
```

### 4️⃣ Rode o projeto
```bash
npm install
npm run dev:local
```

### 5️⃣ Acesse
- **App:** http://localhost:5173
- **Studio:** http://localhost:54323
- **Emails (Inbucket):** http://localhost:54324

---

## 📋 Comandos Úteis

### Desenvolvimento
```bash
npm run dev              # Modo normal (usa .env)
npm run dev:local        # Modo local (usa .env.local)
npm run build            # Build de produção
npm run preview          # Preview do build
```

### Supabase Local
```bash
npm run supabase:start   # Inicia serviços
npm run supabase:stop    # Para serviços
npm run supabase:status  # Ver status
npm run supabase:reset   # Resetar banco (apaga dados!)
npm run supabase:studio  # Abre Studio no navegador
```

### Qualidade de Código
```bash
npm run lint             # Verifica código
npm run lint:fix         # Corrige automaticamente
npm run format           # Formata código
npm run type-check       # Verifica tipos TypeScript
```

---

## 🗂️ Estrutura do Projeto

```
evo-talk-gateway/
├── src/
│   ├── components/        # Componentes React
│   │   ├── ErrorBoundary.tsx
│   │   ├── LoadingFallback.tsx
│   │   └── ...
│   ├── hooks/            # Hooks customizados
│   │   ├── useDebounce.ts
│   │   ├── useVirtualList.ts
│   │   └── ...
│   ├── lib/              # Utilitários
│   │   ├── sanitize.ts   # Proteção XSS
│   │   ├── formatters.ts # Formatadores
│   │   └── utils.ts
│   ├── config/           # Configurações
│   │   ├── constants.ts
│   │   └── env.ts        # Validação de env vars
│   ├── pages/            # Páginas
│   ├── integrations/     # Supabase, APIs
│   └── App.tsx
├── supabase/             # Configuração Supabase Local
│   ├── config.toml
│   ├── seed.sql
│   └── migrations/
├── .env                  # Credenciais Cloud (não commitar!)
├── .env.local            # Credenciais Local (não commitar!)
├── .env.example          # Template de env vars
└── package.json
```

---

## 🔧 Troubleshooting

### Docker não está rodando
- **Windows:** Abra o Docker Desktop
- **Linux:** `sudo systemctl start docker`

### Porta já em uso (54321)
```bash
npm run supabase:stop
npm run supabase:start
```

### Erro de permissão (Linux)
```bash
sudo usermod -aG docker $USER
newgrp docker
```

### Reset completo do banco
```bash
npm run supabase:reset
```

### Limpar tudo e recomeçar
```bash
npm run supabase:stop --no-backup
rm -rf supabase
npm run supabase:start
```

---

## 📚 Documentação Completa

- **Setup Local Detalhado:** [SUPABASE_LOCAL_SETUP.md](./SUPABASE_LOCAL_SETUP.md)
- **Melhorias Implementadas:** [IMPROVEMENTS.md](./IMPROVEMENTS.md)
- **Changelog:** [CHANGELOG.md](./CHANGELOG.md)
- **Resumo das Melhorias:** [MELHORIAS_RESUMO.md](./MELHORIAS_RESUMO.md)

---

## 🎯 Próximos Passos

Após configurar e rodar:

1. ✅ Acesse o Supabase Studio
2. ✅ Configure suas tabelas e políticas RLS
3. ✅ Importe o schema do seu projeto (se tiver)
4. ✅ Crie usuários de teste
5. ✅ Comece a desenvolver!

---

## ❓ Precisa de Ajuda?

- 📖 Veja a documentação completa
- 🐛 Reporte bugs no GitHub Issues
- 💬 Entre em contato com o time de desenvolvimento

**Bom desenvolvimento! 🚀**
