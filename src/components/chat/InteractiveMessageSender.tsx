import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ListOrdered, BarChart3, MapPin, Contact } from "lucide-react";
import { useSendPollMessage, useSendListMessage, useSendLocationMessage, useSendContactMessage } from "@/hooks/useEvolutionApi";
import { useCompany } from "@/contexts/CompanyContext";

interface InteractiveMessageSenderProps {
  conversationId: string;
  contactNumber?: string;
  onMessageSent?: () => void;
}

export function InteractiveMessageSender({ conversationId, contactNumber, onMessageSent }: InteractiveMessageSenderProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { currentCompany } = useCompany();
  const instanceName = currentCompany?.evolution_instance_name || '';

  const sendPollHook = useSendPollMessage(instanceName);
  const sendListHook = useSendListMessage(instanceName);
  const sendLocationHook = useSendLocationMessage(instanceName);
  const sendContactHook = useSendContactMessage(instanceName);

  // Poll state
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);

  // List state
  const [listTitle, setListTitle] = useState("");
  const [listDescription, setListDescription] = useState("");
  const [listOptions, setListOptions] = useState([{ title: "", description: "" }]);

  // Location state
  const [locationName, setLocationName] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  // Contact state
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const addPollOption = () => setPollOptions([...pollOptions, ""]);
  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const addListOption = () => setListOptions([...listOptions, { title: "", description: "" }]);
  const updateListOption = (index: number, field: 'title' | 'description', value: string) => {
    const newOptions = [...listOptions];
    newOptions[index][field] = value;
    setListOptions(newOptions);
  };

  const handleSendPoll = async () => {
    if (!contactNumber) {
      toast.error("Número do contato não encontrado");
      return;
    }
    if (!pollQuestion || pollOptions.filter(o => o).length < 2) {
      toast.error("Adicione uma pergunta e pelo menos 2 opções");
      return;
    }
    if (!instanceName) {
      toast.error("Evolution API não configurada");
      return;
    }

    setLoading(true);
    try {
      await sendPollHook.mutateAsync({
        number: contactNumber,
        name: pollQuestion,
        selectableCount: 1,
        values: pollOptions.filter(o => o)
      });

      setOpen(false);
      setPollQuestion("");
      setPollOptions(["", ""]);
      onMessageSent?.();
    } catch (error: any) {
      console.error('Error sending poll:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendList = async () => {
    if (!contactNumber) {
      toast.error("Número do contato não encontrado");
      return;
    }
    if (!listTitle || listOptions.filter(o => o.title).length < 1) {
      toast.error("Adicione um título e pelo menos 1 opção");
      return;
    }
    if (!instanceName) {
      toast.error("Evolution API não configurada");
      return;
    }

    setLoading(true);
    try {
      await sendListHook.mutateAsync({
        number: contactNumber,
        title: listTitle,
        description: listDescription,
        buttonText: "Ver Opções",
        sections: [{
          title: "Opções",
          rows: listOptions
            .filter(o => o.title)
            .map((o, i) => ({ title: o.title, description: o.description, rowId: `opt_${i}` }))
        }]
      });

      setOpen(false);
      setListTitle("");
      setListDescription("");
      setListOptions([{ title: "", description: "" }]);
      onMessageSent?.();
    } catch (error: any) {
      console.error('Error sending list:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendLocation = async () => {
    if (!contactNumber) {
      toast.error("Número do contato não encontrado");
      return;
    }
    if (!latitude || !longitude) {
      toast.error("Informe latitude e longitude");
      return;
    }
    if (!instanceName) {
      toast.error("Evolution API não configurada");
      return;
    }

    setLoading(true);
    try {
      await sendLocationHook.mutateAsync({
        number: contactNumber,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        name: locationName,
        address: locationAddress
      });

      setOpen(false);
      setLocationName("");
      setLocationAddress("");
      setLatitude("");
      setLongitude("");
      onMessageSent?.();
    } catch (error: any) {
      console.error('Error sending location:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendContact = async () => {
    if (!contactNumber) {
      toast.error("Número do contato não encontrado");
      return;
    }
    if (!contactName || !contactPhone) {
      toast.error("Informe nome e telefone do contato");
      return;
    }
    if (!instanceName) {
      toast.error("Evolution API não configurada");
      return;
    }

    setLoading(true);
    try {
      await sendContactHook.mutateAsync({
        number: contactNumber,
        contact: [{
          fullName: contactName,
          wuid: contactPhone.includes('@') ? contactPhone : `${contactPhone}@s.whatsapp.net`,
          phoneNumber: contactPhone
        }]
      });

      setOpen(false);
      setContactName("");
      setContactPhone("");
      onMessageSent?.();
    } catch (error: any) {
      console.error('Error sending contact:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Mensagem Interativa" className="rounded-full hover:bg-primary/10">
          <ListOrdered className="w-5 h-5 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enviar Mensagem Interativa</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="poll">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="poll"><BarChart3 className="h-4 w-4 mr-1" />Enquete</TabsTrigger>
            <TabsTrigger value="list"><ListOrdered className="h-4 w-4 mr-1" />Lista</TabsTrigger>
            <TabsTrigger value="location"><MapPin className="h-4 w-4 mr-1" />Local</TabsTrigger>
            <TabsTrigger value="contact"><Contact className="h-4 w-4 mr-1" />Contato</TabsTrigger>
          </TabsList>

          <TabsContent value="poll" className="space-y-4">
            <div>
              <Label>Pergunta</Label>
              <Input
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                placeholder="Ex: Qual horário prefere?"
              />
            </div>
            {pollOptions.map((option, i) => (
              <div key={i}>
                <Label>Opção {i + 1}</Label>
                <Input
                  value={option}
                  onChange={(e) => updatePollOption(i, e.target.value)}
                  placeholder={`Opção ${i + 1}`}
                />
              </div>
            ))}
            <Button variant="outline" onClick={addPollOption} className="w-full">
              Adicionar Opção
            </Button>
            <Button onClick={handleSendPoll} disabled={loading} className="w-full">
              Enviar Enquete
            </Button>
          </TabsContent>

          <TabsContent value="list" className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input
                value={listTitle}
                onChange={(e) => setListTitle(e.target.value)}
                placeholder="Ex: Menu de Serviços"
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={listDescription}
                onChange={(e) => setListDescription(e.target.value)}
                placeholder="Escolha uma opção"
              />
            </div>
            {listOptions.map((option, i) => (
              <div key={i} className="space-y-2 p-3 border rounded">
                <Input
                  value={option.title}
                  onChange={(e) => updateListOption(i, 'title', e.target.value)}
                  placeholder={`Título da opção ${i + 1}`}
                />
                <Input
                  value={option.description}
                  onChange={(e) => updateListOption(i, 'description', e.target.value)}
                  placeholder="Descrição (opcional)"
                />
              </div>
            ))}
            <Button variant="outline" onClick={addListOption} className="w-full">
              Adicionar Opção
            </Button>
            <Button onClick={handleSendList} disabled={loading} className="w-full">
              Enviar Lista
            </Button>
          </TabsContent>

          <TabsContent value="location" className="space-y-4">
            <div>
              <Label>Nome do Local</Label>
              <Input
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Ex: Escritório"
              />
            </div>
            <div>
              <Label>Endereço</Label>
              <Input
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
                placeholder="Rua, número, bairro"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Latitude</Label>
                <Input
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="-23.550520"
                />
              </div>
              <div>
                <Label>Longitude</Label>
                <Input
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="-46.633308"
                />
              </div>
            </div>
            <Button onClick={handleSendLocation} disabled={loading} className="w-full">
              Enviar Localização
            </Button>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <div>
              <Label>Nome do Contato</Label>
              <Input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Ex: João Silva"
              />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="5511999999999"
              />
            </div>
            <Button onClick={handleSendContact} disabled={loading} className="w-full">
              Enviar Contato
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}