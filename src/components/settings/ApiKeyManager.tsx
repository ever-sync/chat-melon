import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Key,
  Plus,
  MoreHorizontal,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Check,
  AlertTriangle,
} from 'lucide-react';
import {
  useApiKeys,
  API_PERMISSIONS,
  API_SCOPES,
  type ApiKeyWithSecret,
} from '@/hooks/api/useApiKeys';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export const ApiKeyManager = () => {
  const { apiKeys, isLoading, createApiKey, revokeApiKey } = useApiKeys();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSecretDialog, setShowSecretDialog] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  const [newKeySecret, setNewKeySecret] = useState<string>('');
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['read']);
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['*']);

  const handleCreate = async () => {
    const result = (await createApiKey.mutateAsync({
      name,
      description,
      permissions: selectedPermissions,
      scopes: selectedScopes,
    })) as ApiKeyWithSecret;

    setNewKeySecret(result.secret);
    setShowCreateDialog(false);
    setShowSecretDialog(true);

    // Reset form
    setName('');
    setDescription('');
    setSelectedPermissions(['read']);
    setSelectedScopes(['*']);
  };

  const handleCopySecret = async () => {
    await navigator.clipboard.writeText(newKeySecret);
    setCopied(true);
    toast.success('Chave copiada!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = async () => {
    if (!selectedKeyId) return;
    await revokeApiKey.mutateAsync({ id: selectedKeyId });
    setShowRevokeDialog(false);
    setSelectedKeyId(null);
  };

  const togglePermission = (permission: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission) ? prev.filter((p) => p !== permission) : [...prev, permission]
    );
  };

  const toggleScope = (scope: string) => {
    if (scope === '*') {
      setSelectedScopes(['*']);
    } else {
      setSelectedScopes((prev) => {
        const newScopes = prev.filter((s) => s !== '*');
        return prev.includes(scope) ? newScopes.filter((s) => s !== scope) : [...newScopes, scope];
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">API Keys</h2>
          <p className="text-muted-foreground">Gerencie chaves de API para integrações externas</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Criar API Key</DialogTitle>
              <DialogDescription>Crie uma chave de API para integrações externas</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Integração Zapier"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Para que será usada esta chave"
                />
              </div>

              <div className="space-y-2">
                <Label>Permissões</Label>
                <div className="grid grid-cols-2 gap-2">
                  {API_PERMISSIONS.map((perm) => (
                    <div key={perm.value} className="flex items-start gap-2">
                      <Checkbox
                        id={`perm-${perm.value}`}
                        checked={selectedPermissions.includes(perm.value)}
                        onCheckedChange={() => togglePermission(perm.value)}
                      />
                      <div>
                        <label
                          htmlFor={`perm-${perm.value}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {perm.label}
                        </label>
                        <p className="text-xs text-muted-foreground">{perm.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Escopos</Label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {API_SCOPES.map((scope) => (
                    <div key={scope.value} className="flex items-start gap-2">
                      <Checkbox
                        id={`scope-${scope.value}`}
                        checked={selectedScopes.includes(scope.value)}
                        onCheckedChange={() => toggleScope(scope.value)}
                      />
                      <div>
                        <label
                          htmlFor={`scope-${scope.value}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {scope.label}
                        </label>
                        <p className="text-xs text-muted-foreground">{scope.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={!name || createApiKey.isPending}>
                {createApiKey.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Criar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Secret Display Dialog */}
      <Dialog open={showSecretDialog} onOpenChange={setShowSecretDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              API Key Criada
            </DialogTitle>
            <DialogDescription>
              Guarde esta chave em um lugar seguro. Ela não será mostrada novamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <Input
                value={showSecret ? newKeySecret : '•'.repeat(40)}
                readOnly
                className="font-mono text-sm"
              />
              <Button variant="outline" size="icon" onClick={() => setShowSecret(!showSecret)}>
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon" onClick={handleCopySecret}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-950 p-3 rounded-lg">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <p className="text-sm">Esta é a única vez que você verá esta chave. Copie-a agora!</p>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowSecretDialog(false)}>Entendi, fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation */}
      <AlertDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revogar API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todas as integrações que usam esta chave deixarão de
              funcionar imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revogar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* API Keys Table */}
      <Card>
        <CardHeader>
          <CardTitle>Suas API Keys</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma API Key criada</p>
              <p className="text-sm">Crie uma chave para começar a integrar</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Chave</TableHead>
                  <TableHead>Permissões</TableHead>
                  <TableHead>Último uso</TableHead>
                  <TableHead>Requisições</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{key.name}</div>
                        {key.description && (
                          <div className="text-sm text-muted-foreground">{key.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {key.key_prefix}•••••••
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {key.permissions.map((perm) => (
                          <Badge key={perm} variant="secondary" className="text-xs">
                            {perm}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {key.last_used_at ? (
                        formatDistanceToNow(new Date(key.last_used_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })
                      ) : (
                        <span className="text-muted-foreground">Nunca</span>
                      )}
                    </TableCell>
                    <TableCell>{key.total_requests.toLocaleString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedKeyId(key.id);
                              setShowRevokeDialog(true);
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Revogar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* API Documentation Link */}
      <Card>
        <CardHeader>
          <CardTitle>Documentação da API</CardTitle>
          <CardDescription>
            Consulte a documentação completa para integrar seus sistemas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm">
              <strong>Base URL:</strong>{' '}
              <code className="bg-muted px-2 py-1 rounded">{window.location.origin}/api/v1</code>
            </p>
            <p className="text-sm">
              <strong>Autenticação:</strong>{' '}
              <code className="bg-muted px-2 py-1 rounded">Authorization: Bearer YOUR_API_KEY</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
