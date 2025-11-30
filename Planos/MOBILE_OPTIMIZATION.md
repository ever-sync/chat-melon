# 📱 Guia de Otimização Mobile

Este documento descreve as otimizações mobile implementadas no CRM WhatsApp.

## 🎯 Componentes Mobile

### 1. MobileBottomNav
Navegação inferior fixa com badges de notificação.

```tsx
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";

// Automático em MainLayout - aparece apenas em mobile
```

**Funcionalidades:**
- 4 tabs principais: Chat, Pipeline, Tarefas, Menu
- Badges dinâmicos para notificações não lidas
- Indicador visual de rota ativa
- Oculto automaticamente em desktop

---

### 2. MobileChatLayout
Layout otimizado para chat em mobile com navegação entre lista e conversa.

```tsx
import { MobileChatLayout } from "@/components/mobile/MobileChatLayout";

const [selectedConversation, setSelectedConversation] = useState(null);

<MobileChatLayout
  selectedConversationId={selectedConversation}
  onSelectConversation={setSelectedConversation}
/>
```

**Funcionalidades:**
- Lista fullscreen de conversas
- Navegação para conversa individual
- Botão voltar
- FAB para nova conversa

---

### 3. MobilePipelineLayout
Pipeline Kanban adaptado para mobile com swipe horizontal.

```tsx
import { MobilePipelineLayout } from "@/components/mobile/MobilePipelineLayout";

<MobilePipelineLayout />
```

**Funcionalidades:**
- Uma coluna por vez (swipe para navegar)
- Dots indicator mostrando stage atual
- Navegação com botões laterais
- FAB para criar novo deal
- Touch-optimized cards

---

### 4. PullToRefresh
Componente de pull-to-refresh para listas.

```tsx
import { PullToRefresh } from "@/components/mobile/PullToRefresh";

<PullToRefresh onRefresh={async () => {
  await refetch();
}}>
  <ConversationList />
</PullToRefresh>
```

**Funcionalidades:**
- Pull down para atualizar
- Indicador visual animado
- Threshold configurável
- Funciona em qualquer lista scrollável

---

### 5. SwipeActions
Ações de swipe para itens de lista (arquivar, deletar, etc).

```tsx
import { SwipeActions } from "@/components/mobile/SwipeActions";

<SwipeActions
  actions={[
    { 
      icon: Archive, 
      label: 'Arquivar', 
      color: 'bg-yellow-600', 
      onClick: () => archive(id) 
    },
    { 
      icon: Trash2, 
      label: 'Excluir', 
      color: 'bg-red-600', 
      onClick: () => deleteItem(id) 
    },
  ]}
>
  <ConversationItem />
</SwipeActions>
```

**Funcionalidades:**
- Swipe left para revelar ações
- Múltiplas ações configuráveis
- Cores customizáveis
- Animações suaves

---

### 6. VirtualizedList
Lista virtualizada para performance com listas longas.

```tsx
import { VirtualizedList } from "@/components/mobile/VirtualizedList";

<VirtualizedList
  items={contacts}
  itemHeight={72}
  renderItem={(contact) => <ContactCard contact={contact} />}
  overscan={5}
/>
```

**Funcionalidades:**
- Renderiza apenas itens visíveis
- Scroll infinito performático
- Overscan configurável
- Skeleton loading integrado

---

### 7. FloatingActionButton (FAB)
Botão flutuante para ações principais.

```tsx
import { FloatingActionButton } from "@/components/mobile/FloatingActionButton";

<FloatingActionButton
  icon={<Plus />}
  onClick={() => openNewDealModal()}
  position="bottom-right"
/>
```

**Funcionalidades:**
- Posição configurável (bottom-right, bottom-left, bottom-center)
- Hover effect
- Shadow e animações
- Touch-optimized (56x56px)

---

### 8. MobileModal
Modal fullscreen otimizado para mobile.

```tsx
import { MobileModal } from "@/components/mobile/MobileModal";

<MobileModal
  open={showModal}
  onOpenChange={setShowModal}
  title="Editar Contato"
  footer={
    <Button onClick={handleSave}>Salvar</Button>
  }
>
  <ContactForm />
</MobileModal>
```

**Funcionalidades:**
- Fullscreen em mobile, normal em desktop
- Header fixo com botão fechar
- Conteúdo scrollável
- Footer fixo opcional
- Teclado não sobrepõe inputs

---

## 🎣 Hooks Mobile

### useLongPress
Detecta long press para menus de contexto.

```tsx
import { useLongPress } from "@/hooks/useLongPress";

const longPressHandlers = useLongPress({
  onLongPress: () => openContextMenu(),
  onClick: () => selectItem(),
  delay: 500, // ms
});

<div {...longPressHandlers}>
  Mantenha pressionado
</div>
```

---

## 🛠️ Utilitários de Performance

### mobileOptimizations.ts

```tsx
import {
  lazyLoadImage,
  debounce,
  throttle,
  isSlowConnection,
  chunkArray,
  smoothScroll,
  isTouchDevice,
} from "@/lib/mobileOptimizations";

// Lazy load de imagem
lazyLoadImage(imgElement);

// Debounce search
const debouncedSearch = debounce(handleSearch, 300);

// Throttle scroll
const throttledScroll = throttle(handleScroll, 100);

// Detecta conexão lenta
if (isSlowConnection()) {
  // Reduz qualidade de imagens
}

// Processa array em batches
const batches = chunkArray(items, 50);
batches.forEach(async (batch) => {
  await processBatch(batch);
});

// Smooth scroll
smoothScroll(element, 500, 300);

// Detecta touch device
if (isTouchDevice()) {
  // Ativa gestos
}
```

---

## 📐 Layout Patterns

### 1. Fullscreen Mobile List → Detail

```tsx
// Chat, Contatos, etc.
{!selectedItem ? (
  <ListView />
) : (
  <DetailView onBack={() => setSelectedItem(null)} />
)}
```

### 2. Swipe Horizontal Navigation

```tsx
// Pipeline stages
const [currentIndex, setCurrentIndex] = useState(0);

// Swipe detection
onTouchEnd={(e) => {
  const diff = startX - e.changedTouches[0].clientX;
  if (diff > 50) setCurrentIndex(prev => prev + 1);
  if (diff < -50) setCurrentIndex(prev => prev - 1);
}}
```

### 3. Pull to Refresh Pattern

```tsx
<PullToRefresh onRefresh={refetch}>
  <VirtualizedList items={data} />
</PullToRefresh>
```

### 4. Swipe Actions Pattern

```tsx
<SwipeActions actions={quickActions}>
  <ListItem />
</SwipeActions>
```

---

## 🎨 Design Guidelines

### Tamanhos Touch-Friendly
- **Botões mínimos:** 44x44px (Apple) / 48x48px (Material)
- **FAB:** 56x56px
- **List items:** min 60px altura
- **Bottom nav:** 56-64px

### Espaçamento
- **Padding horizontal:** 16px mínimo
- **Gap entre items:** 8-16px
- **Safe areas:** Respeitar notch/home indicator

### Gestos
- **Tap:** Seleção
- **Long press:** Contexto (500ms)
- **Swipe left:** Ações destrutivas
- **Swipe right:** Voltar/Cancelar
- **Pull down:** Refresh
- **Swipe horizontal:** Navegação

---

## ⚡ Performance Tips

### 1. Lazy Loading
```tsx
// Imagens
<img 
  data-src={url} 
  onLoad={lazyLoadImage}
  className="lazy"
/>
```

### 2. Code Splitting
```tsx
// Lazy load pages
const Dashboard = lazy(() => import("./Dashboard"));

<Suspense fallback={<Loading />}>
  <Dashboard />
</Suspense>
```

### 3. Virtualização
Use `VirtualizedList` para listas com mais de 50 items.

### 4. Debounce/Throttle
```tsx
// Search
const handleSearch = debounce(search, 300);

// Scroll
const handleScroll = throttle(onScroll, 100);
```

### 5. Conexão Lenta
```tsx
if (isSlowConnection()) {
  // Reduz qualidade
  imageUrl = imageUrl.replace('_full', '_thumb');
}
```

---

## 🧪 Testing Mobile

### Testar em Dispositivos Reais
1. Abrir no celular via Wi-Fi local
2. Usar Chrome DevTools device emulation
3. Testar gestos (swipe, long press, pull)
4. Verificar safe areas (notch)
5. Testar teclado virtual

### Checklist
- [ ] Bottom nav não sobrepõe conteúdo
- [ ] Modals são fullscreen
- [ ] FAB não cobre elementos importantes
- [ ] Gestos funcionam suavemente
- [ ] Pull to refresh funciona
- [ ] Swipe actions revelam corretamente
- [ ] Listas longas são virtualizadas
- [ ] Imagens lazy loadam
- [ ] Formulários não são cobertos pelo teclado

---

## 🚀 Próximos Passos

### Melhorias Futuras
- [ ] Offline mode completo
- [ ] Background sync
- [ ] Native app wrapper (Capacitor)
- [ ] Biometric auth
- [ ] Push notifications nativas
- [ ] Camera integration
- [ ] Geolocation
- [ ] Share API

---

## 📚 Recursos

- [PWA Best Practices](https://web.dev/progressive-web-apps/)
- [Mobile UX Guidelines](https://material.io/design/platform-guidance/android-mobile.html)
- [Touch Target Sizes](https://www.nngroup.com/articles/touch-target-size/)
- [Mobile Performance](https://web.dev/fast/)
