import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function Onboarding() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cnpj: '',
    legalName: '',
    fantasyName: '',
    responsibleName: '',
    responsiblePhone: '',
    email: '',
    phone: '',
    postalCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const searchCEP = async () => {
    if (formData.postalCode.length !== 8) {
      toast.error('CEP deve ter 8 dígitos');
      return;
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${formData.postalCode}/json/`);
      const data = await response.json();

      if (data.erro) {
        toast.error('CEP não encontrado');
        return;
      }

      setFormData((prev) => ({
        ...prev,
        street: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || '',
      }));

      toast.success('Endereço encontrado!');
    } catch (error) {
      toast.error('Erro ao buscar CEP');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error('Usuário não autenticado');
        navigate('/auth');
        return;
      }

      // Calculate trial end date (3 days from now)
      const trialStartsAt = new Date();
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 3);

      // Create company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: formData.fantasyName,
          legal_name: formData.legalName,
          cnpj: formData.cnpj,
          email: formData.email,
          phone: formData.phone,
          responsible_name: formData.responsibleName,
          responsible_phone: formData.responsiblePhone,
          postal_code: formData.postalCode,
          street: formData.street,
          number: formData.number,
          complement: formData.complement,
          neighborhood: formData.neighborhood,
          city: formData.city,
          state: formData.state,
          status: 'active',
          is_active: true,
          subscription_status: 'trial',
          trial_started_at: trialStartsAt.toISOString(),
          trial_ends_at: trialEndsAt.toISOString(),
          created_by: user.id,
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // Create company_users relationship
      const { error: companyUserError } = await supabase.from('company_users').insert({
        user_id: user.id,
        company_id: company.id,
        is_default: true,
      });

      if (companyUserError) throw companyUserError;

      // Create company_members with admin role
      const { error: memberError } = await supabase.from('company_members').insert({
        user_id: user.id,
        company_id: company.id,
        role: 'admin',
        display_name: formData.responsibleName,
        email: user.email,
        is_active: true,
      });

      if (memberError) throw memberError;

      toast.success('Cadastro concluído! Você tem 3 dias de trial gratuito.');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Erro ao cadastrar empresa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Bem-vindo! Complete seu cadastro</CardTitle>
          <CardDescription>
            Preencha os dados da sua empresa para começar a usar gratuitamente por 3 dias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dados da Empresa */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Dados da Empresa</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cnpj">CNPJ *</Label>
                  <Input
                    id="cnpj"
                    name="cnpj"
                    value={formData.cnpj}
                    onChange={handleChange}
                    placeholder="00.000.000/0000-00"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="legalName">Razão Social *</Label>
                  <Input
                    id="legalName"
                    name="legalName"
                    value={formData.legalName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="fantasyName">Nome Fantasia *</Label>
                <Input
                  id="fantasyName"
                  name="fantasyName"
                  value={formData.fantasyName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email da Empresa *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone da Empresa</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="(00) 0000-0000"
                  />
                </div>
              </div>
            </div>

            {/* Responsável */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Responsável</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="responsibleName">Nome do Respons\u00e1vel *</Label>
                  <Input
                    id="responsibleName"
                    name="responsibleName"
                    value={formData.responsibleName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="responsiblePhone">Telefone do Responsável *</Label>
                  <Input
                    id="responsiblePhone"
                    name="responsiblePhone"
                    value={formData.responsiblePhone}
                    onChange={handleChange}
                    placeholder="(00) 00000-0000"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Endereço</h3>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="postalCode">CEP *</Label>
                  <Input
                    id="postalCode"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    placeholder="00000-000"
                    required
                    maxLength={8}
                  />
                </div>
                <div className="flex items-end">
                  <Button type="button" variant="outline" onClick={searchCEP} className="w-full">
                    Buscar CEP
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="street">Rua *</Label>
                  <Input
                    id="street"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="number">Número *</Label>
                  <Input
                    id="number"
                    name="number"
                    value={formData.number}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="complement">Complemento</Label>
                  <Input
                    id="complement"
                    name="complement"
                    value={formData.complement}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label htmlFor="neighborhood">Bairro *</Label>
                  <Input
                    id="neighborhood"
                    name="neighborhood"
                    value={formData.neighborhood}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="city">Cidade *</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="state">Estado *</Label>
                <Input
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  maxLength={2}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                'Começar Trial Gratuito (3 dias)'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
