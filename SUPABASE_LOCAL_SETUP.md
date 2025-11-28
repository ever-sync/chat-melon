# 🚀 Configuração do Supabase Local

Guia completo para rodar o Supabase localmente com Docker.

## 📋 Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e rodando
- [Supabase CLI](https://supabase.com/docs/guides/cli) instalado
- Node.js 18+ e npm/yarn

## 🔧 Instalação do Supabase CLI

### Windows (PowerShell)
```powershell
# Via npm (recomendado)
npm install -g supabase

# OU via Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### macOS
```bash
brew install supabase/tap/supabase
```

### Linux
```bash
npm install -g supabase
```

## 🚀 Iniciando o Supabase Local

### 1. Inicialize o Supabase no seu projeto
```bash
# Na raiz do projeto
supabase init
```

Isso criará uma pasta `supabase/` com a configuração.

### 2. Inicie os serviços locais
```bash
supabase start
```

Isso vai:
- ✅ Baixar as imagens Docker necessárias (primeira vez demora ~5min)
- ✅ Iniciar PostgreSQL, Auth, Storage, Realtime, etc
- ✅ Aplicar as migrações do banco de dados

### 3. Pegue as credenciais locais
Após o `supabase start`, você verá algo assim:

```
Started supabase local development setup.

         API URL: http://localhost:54321
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Configure o `.env` para desenvolvimento local
```env
# .env.local (para desenvolvimento)
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5. Acesse o Supabase Studio
Abra no navegador: http://localhost:54323

Aqui você pode:
- Ver e editar tabelas
- Testar queries SQL
- Gerenciar usuários
- Ver logs em tempo real

## 📊 Aplicando as Migrações do Banco

Se você já tem um schema no Supabase Cloud, pode puxar:

```bash
# Login no Supabase
supabase login

# Link com seu projeto
supabase link --project-ref seu-project-id

# Puxa o schema remoto
supabase db pull

# Aplica as migrações localmente
supabase db reset
```

## 🔄 Comandos Úteis

```bash
# Ver status dos serviços
supabase status

# Parar os serviços
supabase stop

# Reiniciar (apaga dados!)
supabase db reset

# Ver logs
supabase logs

# Criar nova migração
supabase migration new nome-da-migracao

# Aplicar migrações pendentes
supabase db push
```

## 📁 Estrutura de Arquivos

Após `supabase init`, você terá:

```
supabase/
├── config.toml          # Configuração do Supabase local
├── seed.sql             # Dados iniciais (opcional)
└── migrations/          # Migrações SQL
    └── 20240101000000_initial_schema.sql
```

## 🎯 Workflow Recomendado

### Desenvolvimento Local
1. `supabase start` - Inicia serviços locais
2. Desenvolve com `.env.local`
3. Testa no Studio local (http://localhost:54323)
4. Cria migrações: `supabase migration new nome`
5. Testa migrações: `supabase db reset`

### Deploy para Cloud
```bash
# Envia migrações para produção
supabase db push --linked

# OU faz deploy completo
supabase db push --linked --include-seed
```

## 🔧 Troubleshooting

### Docker não está rodando
```bash
# Windows: Abra Docker Desktop

# Linux: Inicie o serviço
sudo systemctl start docker
```

### Porta já em uso
```bash
# Veja quem está usando a porta
netstat -ano | findstr :54321  # Windows
lsof -i :54321                 # macOS/Linux

# Pare o Supabase e reinicie
supabase stop
supabase start
```

### Erro de permissão (Linux)
```bash
# Adicione seu usuário ao grupo docker
sudo usermod -aG docker $USER
newgrp docker
```

### Reset completo (apaga tudo!)
```bash
supabase stop --no-backup
supabase start
```

## 🌐 Alternando entre Local e Cloud

Você pode usar arquivos `.env` diferentes:

```bash
# Desenvolvimento local
.env.local           # http://localhost:54321

# Staging/Cloud
.env.staging         # https://staging.supabase.co

# Produção
.env.production      # https://prod.supabase.co
```

Scripts no `package.json`:
```json
{
  "scripts": {
    "dev": "vite --mode development",
    "dev:local": "vite --mode local",
    "dev:staging": "vite --mode staging"
  }
}
```

## 📚 Recursos

- [Documentação Oficial](https://supabase.com/docs/guides/cli)
- [CLI Reference](https://supabase.com/docs/reference/cli/introduction)
- [Migrações](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Seeding](https://supabase.com/docs/guides/cli/seeding-your-database)

## ✅ Checklist de Setup

- [ ] Docker Desktop instalado e rodando
- [ ] Supabase CLI instalado (`supabase --version`)
- [ ] `supabase init` executado
- [ ] `supabase start` rodando sem erros
- [ ] `.env.local` configurado com credenciais locais
- [ ] Supabase Studio acessível em http://localhost:54323
- [ ] Projeto rodando com `npm run dev`

---

💡 **Dica**: Para desenvolvimento rápido, use o Supabase Cloud e só rode local quando precisar testar migrações complexas ou trabalhar offline.
