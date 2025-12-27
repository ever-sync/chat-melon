# Configuração do WhatsApp - Evolution API

## Visão Geral

O sistema agora utiliza uma **Evolution API centralizada** para todos os clientes. Cada cliente terá sua própria instância identificada pelo CNPJ da empresa.

## Configuração das Variáveis de Ambiente

### Passo 1: Editar o arquivo `.env`

No arquivo `.env` na raiz do projeto, configure as seguintes variáveis:

```bash
# ==========================================
# EVOLUTION API (WhatsApp)
# ==========================================
VITE_EVOLUTION_API_URL=https://sua-evolution-api.com
VITE_EVOLUTION_API_KEY=sua-chave-api-secreta
```

### Valores a configurar:

- **VITE_EVOLUTION_API_URL**: URL da sua Evolution API centralizada
  - Exemplo: `https://evolution.minhaempresa.com`
  - Não adicione `/` no final da URL

- **VITE_EVOLUTION_API_KEY**: Chave de API global da Evolution
  - Esta é a API Key configurada na sua instalação da Evolution API
  - Mantenha esta chave em segredo

## Como Funciona

### 1. Nome da Instância Automático

Cada empresa terá uma instância única criada automaticamente usando o **CNPJ** (somente números):

- Empresa com CNPJ `12.345.678/0001-90` → Instância: `12345678000190`
- Empresa com CNPJ `98.765.432/0001-10` → Instância: `98765432000110`

### 2. Processo de Conexão

Quando o cliente clica em "Conectar WhatsApp":

1. O sistema pega o CNPJ da empresa atual
2. Cria/atualiza as configurações no banco de dados
3. Faz uma chamada para a Evolution API para criar a instância
4. Exibe o QR Code para o cliente escanear
5. O cliente escaneia com o WhatsApp
6. A conexão é estabelecida

### 3. Interface Simplificada

O cliente não precisa:
- ❌ Informar URL da Evolution API
- ❌ Informar API Key
- ❌ Escolher nome da instância
- ❌ Configurar webhook

Apenas:
- ✅ Clicar em "Conectar WhatsApp"
- ✅ Escanear o QR Code

## Requisitos

### Antes de usar:

1. **CNPJ Configurado**: A empresa deve ter o CNPJ cadastrado no perfil
2. **Evolution API Ativa**: Sua Evolution API deve estar rodando e acessível
3. **Variáveis Configuradas**: `.env` deve ter as URLs e chaves corretas

### Recomendações:

- Use HTTPS para a Evolution API em produção
- Mantenha a API Key em segredo
- Configure backups regulares da Evolution API
- Monitore o uso de cada instância

## Onde os Clientes Conectam

1. Acesse: **Menu → Canais** (`/channels`)
2. Clique em: **Adicionar Canal**
3. Selecione: **WhatsApp**
4. Clique em: **Conectar WhatsApp**
5. Escaneie o QR Code exibido

## Troubleshooting

### QR Code não aparece

- Verifique se as variáveis de ambiente estão corretas
- Confirme que a Evolution API está acessível
- Verifique os logs do console do navegador

### "CNPJ não configurado"

- Vá em **Configurações → Perfil Corporativo**
- Preencha o CNPJ da empresa
- Salve as alterações

### "Erro ao criar instância"

- Verifique se a Evolution API está online
- Confirme que a API Key está correta
- Verifique se há limite de instâncias na Evolution

### Instância já existe

Se a instância já existe, o sistema tentará reconectar automaticamente.

## Segurança

⚠️ **IMPORTANTE**:
- Nunca exponha suas variáveis de ambiente em repositórios públicos
- Use `.env` local e `.env.example` para referência
- Em produção, configure as variáveis no servidor/painel de hospedagem
- A API Key da Evolution deve ser tratada como senha

## Próximos Passos

Após conectar o WhatsApp:
1. Teste enviando uma mensagem para o número conectado
2. Verifique se as mensagens aparecem no chat
3. Configure as automações e chatbots
4. Configure as filas de atendimento

## Suporte

Para problemas com:
- **Evolution API**: Consulte a documentação da Evolution API
- **Conexão WhatsApp**: Verifique se o número não está banido
- **QR Code**: Tente gerar um novo QR Code
- **Configurações**: Entre em contato com o suporte técnico
