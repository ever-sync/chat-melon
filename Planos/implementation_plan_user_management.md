# Implementação de Edição e Permissões de Usuários

Este plano detalha a implementação das funcionalidades de edição de usuários e gerenciamento de permissões na página de Configurações de Usuários.

## 1. Componente de Edição de Usuário (`UserEditDialog.tsx`)
Criar um novo componente para editar os detalhes do membro:
- Nome de exibição
- Cargo (Role)
- Setor (Department)
- Equipe (Team)
- Status de recebimento de chats
- Limite de chats simultâneos

## 2. Componente de Permissões (`UserPermissionsDialog.tsx`)
Criar um componente para gerenciar as permissões granulares do usuário:
- Buscar as permissões atuais do usuário em `member_permissions`.
- Fornecer uma interface para ativar/desativar permissões específicas.
- Sincronizar as alterações com o banco de dados.

## 3. Integração na `UsersPage.tsx`
- Importar e adicionar os novos componentes de Dialog.
- Atualizar as ações do DropdownMenu na tabela para abrir os respectivos Dialogs com o usuário selecionado.
- Adicionar funções de callback para atualizar a lista de usuários após as edições.

## 4. Verificação de Segurança (RLS)
- Garantir que apenas administradores/proprietários possam editar outros usuários.
- Verificar se as políticas de RLS permitem a inserção/atualização na tabela `member_permissions`.
