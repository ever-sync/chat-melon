# 🔌 Como Conectar com o Supabase

Este guia mostra as **2 formas principais** de conectar seu projeto ao Supabase.

---

## 📊 Comparação Rápida

| Característica | Supabase Cloud ☁️ | Supabase Local 🐳 |
|---------------|-------------------|-------------------|
| **Facilidade** | ⭐⭐⭐⭐⭐ Muito fácil | ⭐⭐⭐ Médio |
| **Setup inicial** | 2 minutos | 5-10 minutos |
| **Requer Docker** | ❌ Não | ✅ Sim |
| **Trabalho offline** | ❌ Não | ✅ Sim |
| **Dados persistentes** | ✅ Sim | ⚠️ Temporários |
| **Colaboração** | ✅ Fácil | ⚠️ Complexo |
| **Custo** | 💰 Grátis até 500MB | 💰 Grátis |
| **Melhor para** | Produção, testes | Desenvolvimento, migrações |

---

## ☁️ Opção 1: Supabase Cloud (Recomendado)

### ✅ Quando usar?
- Você quer começar **rápido**
- Está desenvolvendo sozinho ou em equipe
- Quer dados persistentes entre sessões
- Está testando em produção

### 🚀 Setup em 3 Passos

#### 1. Crie um projeto no Supabase
👉 Acesse: https://supabase.com/dashboard

- Clique em "New Project"
- Escolha nome, senha e região
- Aguarde ~2 minutos (provisionamento)

#### 2. Copie suas credenciais
👉 Vá em: **Project Settings → API**

Você verá:
```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon key: eyJhbGc...
```

#### 3. Configure o .env
```bash
# Copie o exemplo
cp .env.example .env

# Edite o .env (use qualquer editor de texto)
# Cole as credenciais que você copiou
```

Arquivo `.env`:
```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 4. Rode o projeto
```bash
npm install
npm run dev
```

Pronto! 🎉 Acesse: http://localhost:5173

---

## 🐳 Opção 2: Supabase Local

### ✅ Quando usar?
- Quer testar **migrações de banco** antes de aplicar em produção
- Precisa trabalhar **offline**
- Quer ambiente de desenvolvimento isolado
- Está desenvolvendo features complexas de banco

### 🔧 Pré-requisitos
- **Docker Desktop** instalado e rodando
  - Windows/Mac: https://www.docker.com/products/docker-desktop/
  - Linux: `sudo apt install docker.io docker-compose`

### 🚀 Setup Automático (Recomendado)

#### Windows
```bash
# Execute o script de setup
setup-local.bat
```

#### Linux/macOS
```bash
# Dê permissão de execução
chmod +x setup-local.sh

# Execute
./setup-local.sh
```

O script vai:
1. ✅ Verificar se Docker está rodando
2. ✅ Instalar Supabase CLI (se necessário)
3. ✅ Inicializar o Supabase local
4. ✅ Criar arquivo `.env.local` automaticamente
5. ✅ Mostrar URLs de acesso

### 🚀 Setup Manual

Se preferir fazer manualmente:

```bash
# 1. Instale o Supabase CLI
npm install -g supabase

# 2. Inicialize o Supabase
supabase init

# 3. Inicie os serviços (demora ~5min na primeira vez)
supabase start
```

Após o `supabase start`, você verá:
```
Started supabase local development setup.

         API URL: http://localhost:54321
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Configure o .env.local
```bash
# Copie o exemplo
cp .env.local.example .env.local

# Edite com as credenciais que apareceram acima
```

Arquivo `.env.local`:
```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGc... (copie do terminal)
```

#### Rode o projeto em modo local
```bash
npm install
npm run dev:local
```

### 🌐 URLs Importantes

Quando o Supabase local está rodando:

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **App** | http://localhost:5173 | Seu projeto React |
| **Studio** | http://localhost:54323 | Interface visual do banco |
| **API** | http://localhost:54321 | Endpoint da API |
| **Inbucket** | http://localhost:54324 | Emails de teste |

### 📋 Comandos Úteis

```bash
# Ver status dos serviços
npm run supabase:status

# Parar serviços
npm run supabase:stop

# Reiniciar (apaga dados!)
npm run supabase:reset

# Abrir Studio no navegador
npm run supabase:studio
```

---

## 🔄 Alternando entre Cloud e Local

Você pode usar **os dois** ao mesmo tempo! Basta criar arquivos de ambiente diferentes:

### Estrutura de arquivos
```
.env          # Supabase Cloud (padrão)
.env.local    # Supabase Local
.env.example  # Template
```

### Usando cada um
```bash
# Usar Supabase Cloud
npm run dev

# Usar Supabase Local
npm run dev:local
```

---

## 🆘 Problemas Comuns

### Docker não está rodando
```bash
# Verifique
docker --version

# Se der erro, inicie o Docker Desktop (Windows/Mac)
# Ou no Linux:
sudo systemctl start docker
```

### Porta 54321 já em uso
```bash
# Pare o Supabase e reinicie
npm run supabase:stop
npm run supabase:start
```

### Erro "Cannot find module '@supabase/supabase-js'"
```bash
# Reinstale as dependências
rm -rf node_modules
npm install
```

### Credenciais inválidas
```bash
# Verifique se copiou corretamente do Supabase
# - Não deve ter espaços extras
# - Deve começar com "eyJ" (JWT token)
# - URL deve terminar com ".supabase.co" (cloud) ou "localhost:54321" (local)
```

---

## 💡 Dicas

### Para Produção
✅ Use **Supabase Cloud**  
✅ Configure `.env` com credenciais de produção  
✅ **NUNCA** commite o arquivo `.env` no Git  
✅ Use variáveis de ambiente no serviço de deploy (Vercel, Netlify, etc)

### Para Desenvolvimento
✅ Use **Supabase Local** para testar migrações  
✅ Use **Supabase Cloud** para colaboração em equipe  
✅ Mantenha `.env.local` no `.gitignore`

### Segurança
⚠️ **IMPORTANTE**: Arquivos `.env*` estão no `.gitignore`  
⚠️ Nunca exponha suas chaves em código  
⚠️ Use apenas `anon key` no frontend  
⚠️ `service_role key` deve ficar APENAS no backend

---

## 📚 Próximos Passos

Depois de conectar:

1. ✅ Acesse o Supabase Studio
2. ✅ Explore as tabelas existentes
3. ✅ Configure Row Level Security (RLS)
4. ✅ Crie usuários de teste
5. ✅ Comece a desenvolver!

**Guias relacionados:**
- [QUICK_START.md](./QUICK_START.md) - Início rápido
- [SUPABASE_LOCAL_SETUP.md](./SUPABASE_LOCAL_SETUP.md) - Guia detalhado do setup local
- [README.md](./README.md) - Documentação principal

---

**Dúvidas?** Consulte a [documentação oficial do Supabase](https://supabase.com/docs) 📖
