import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User, Send, Sparkles, Terminal } from 'lucide-react';

export function AIPlayground() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Olá! Sou seu assistente de teste. Como posso ajudar com base nas configurações atuais?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;
    
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Esta é uma resposta simulada baseada nas suas configurações. Em breve, estarei conectado ao backend real!',
        debugInfo: {
            reasoning: "User asked specific question.",
            tools_called: [],
            docs_used: ["Manual do Produto.pdf"]
        }
      }]);
    }, 1500);
  };

  return (
    <Card className="h-full flex flex-col border-l rounded-none shadow-none h-screen max-h-screen">
      <CardHeader className="border-b px-4 py-3 bg-gray-50 dark:bg-gray-900/50">
        <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-purple-600" />
            <CardTitle className="text-sm font-semibold">Playground de Teste</CardTitle>
        </div>
      </CardHeader>
      
      <div className="flex-1 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                            {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </div>
                        <div className={`max-w-[80%] space-y-2`}>
                            <div className={`p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'}`}>
                                {msg.content}
                            </div>
                            {/* Debug Info for Assistant */}
                            {msg.role === 'assistant' && (msg as any).debugInfo && (
                                <div className="text-[10px] text-muted-foreground bg-gray-50 dark:bg-gray-900 border p-2 rounded font-mono">
                                    <p>DOCS: {JSON.stringify((msg as any).debugInfo.docs_used)}</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex gap-3">
                         <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                            <Bot className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100" />
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200" />
                        </div>
                    </div>
                )}
            </div>
        </ScrollArea>

        <div className="p-4 border-t bg-white dark:bg-gray-950">
            <div className="flex gap-2">
                <Input 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Teste uma mensagem..."
                    className="flex-1"
                />
                <Button size="icon" onClick={handleSend} disabled={isTyping}>
                    <Send className="h-4 w-4" />
                </Button>
            </div>
        </div>
      </div>
    </Card>
  );
}
