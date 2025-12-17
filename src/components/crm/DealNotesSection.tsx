import { useState } from 'react';
import { useDealNotes } from '@/hooks/crm/useDealNotes';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Pin, Trash2, Edit2, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
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

interface DealNotesSectionProps {
  dealId: string;
}

export const DealNotesSection = ({ dealId }: DealNotesSectionProps) => {
  const { notes, isLoading, createNote, updateNote, togglePin, deleteNote } = useDealNotes(dealId);

  const [newNote, setNewNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    createNote.mutate({ note: newNote.trim() });
    setNewNote('');
  };

  const handleStartEdit = (noteId: string, currentText: string) => {
    setEditingNoteId(noteId);
    setEditingNoteText(currentText);
  };

  const handleSaveEdit = () => {
    if (!editingNoteId || !editingNoteText.trim()) return;
    updateNote.mutate({ noteId: editingNoteId, note: editingNoteText.trim() });
    setEditingNoteId(null);
    setEditingNoteText('');
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingNoteText('');
  };

  const handleDeleteNote = () => {
    if (!deleteNoteId) return;
    deleteNote.mutate(deleteNoteId);
    setDeleteNoteId(null);
  };

  const getInitials = (name: string | null) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Formulário de adicionar nota */}
      <div className="space-y-2">
        <Textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Digite sua nota aqui..."
          className="min-h-[80px] resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
              handleAddNote();
            }
          }}
        />
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Ctrl + Enter para adicionar</span>
          <Button onClick={handleAddNote} disabled={!newNote.trim() || createNote.isPending}>
            Adicionar Nota
          </Button>
        </div>
      </div>

      {/* Lista de notas */}
      {notes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Nenhuma nota ainda</p>
          <p className="text-xs mt-1">Adicione a primeira nota acima</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className={cn(
                'p-4 border rounded-lg transition-colors',
                note.is_pinned &&
                  'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/10 dark:border-yellow-800'
              )}
            >
              {/* Header da nota */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={note.profiles?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {getInitials(note.profiles?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {note.profiles?.full_name || 'Usuário desconhecido'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(note.created_at), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>

                {note.is_pinned && <Pin className="w-4 h-4 text-yellow-600 fill-yellow-600" />}
              </div>

              {/* Conteúdo da nota */}
              {editingNoteId === note.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editingNoteText}
                    onChange={(e) => setEditingNoteText(e.target.value)}
                    className="min-h-[60px]"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveEdit}
                      disabled={!editingNoteText.trim() || updateNote.isPending}
                    >
                      <Save className="w-3 h-3 mr-1" />
                      Salvar
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                      <X className="w-3 h-3 mr-1" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm whitespace-pre-wrap">{note.note}</p>

                  {/* Ações */}
                  <div className="flex gap-1 mt-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        togglePin.mutate({
                          noteId: note.id,
                          isPinned: !note.is_pinned,
                        })
                      }
                      disabled={togglePin.isPending}
                    >
                      <Pin className={cn('w-3 h-3 mr-1', note.is_pinned && 'fill-current')} />
                      {note.is_pinned ? 'Desafixar' : 'Fixar'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleStartEdit(note.id, note.note)}
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteNoteId(note.id)}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={!!deleteNoteId} onOpenChange={() => setDeleteNoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir nota?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A nota será permanentemente excluída.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteNote}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
