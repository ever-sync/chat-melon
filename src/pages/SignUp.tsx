import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, Quote } from 'lucide-react';

export default function SignUp() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inviteId = searchParams.get('invite');

  // Personal Data
  const [personalData, setPersonalData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    agreedToTerms: false,
  });

  // Load invite data if invite ID is present
  useEffect(() => {
    const loadInviteData = async () => {
      if (!inviteId) return;

      try {
        console.log('Carregando dados do convite:', inviteId);

        const { data, error } = await supabase
          .from('company_invites')
          .select('email, role, company_id')
          .eq('id', inviteId)
          .eq('status', 'pending')
          .maybeSingle(); // Use maybeSingle ao invés de single para evitar erro 406

        console.log('Resultado da busca:', { data, error });

        if (error) {
          console.error('Erro ao carregar convite:', error);
          toast.error('Convite inválido ou expirado');
          return;
        }

        if (data) {
          console.log('Convite encontrado:', data);
          setPersonalData(prev => ({
            ...prev,
            email: data.email,
          }));
          toast.success('Convite encontrado! Complete seu cadastro.');
        } else {
          console.warn('Nenhum convite pendente encontrado');
          toast.error('Convite inválido ou já foi usado');
        }
      } catch (err) {
        console.error('Erro ao processar convite:', err);
        toast.error('Erro ao carregar convite');
      }
    };

    loadInviteData();
  }, [inviteId]);

  const handlePersonalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPersonalData({ ...personalData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!personalData.agreedToTerms) {
      toast.error('Você precisa concordar com os Termos e Condições');
      return;
    }

    if (personalData.password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      // If coming from invite, update the existing invite and create user
      if (inviteId) {
        console.log('Processando convite:', inviteId);

        // Get invite data
        const { data: inviteData, error: inviteError } = await supabase
          .from('company_invites')
          .select('*')
          .eq('id', inviteId)
          .eq('status', 'pending')
          .maybeSingle();

        if (inviteError || !inviteData) {
          toast.error('Convite inválido ou expirado');
          setLoading(false);
          return;
        }

        // Try to sign up (create new user)
        console.log('Tentando criar novo usuário...');
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: personalData.email,
          password: personalData.password,
          options: {
            data: {
              full_name: personalData.fullName,
              phone: personalData.phone,
            },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });

        let userId: string | null = null;

        // Se deu erro de usuário já existente, tentar fazer login
        if (authError) {
          // Detecta vários tipos de erro de usuário duplicado
          const isDuplicateUser = authError.message.includes('already registered') ||
                                  authError.message.includes('User already registered') ||
                                  authError.message.includes('Database error updating user') ||
                                  authError.status === 500;

          if (isDuplicateUser) {
            console.log('Usuário já existe, fazendo login...');

            // Tentar fazer login
            const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
              email: personalData.email,
              password: personalData.password,
            });

            if (loginError) {
              toast.error('Credenciais inválidas. Este email já está cadastrado com outra senha.');
              setLoading(false);
              return;
            }

            userId = loginData.user?.id || null;
          } else {
            // Outro erro que não é de usuário duplicado
            throw authError;
          }
        } else {
          userId = authData.user?.id || null;
        }

        if (!userId) {
          toast.error('Erro ao criar/autenticar usuário');
          setLoading(false);
          return;
        }

        console.log('Usuário autenticado, ID:', userId);

        // Update invite status to accepted
        const { error: updateError } = await supabase
          .from('company_invites')
          .update({ status: 'accepted' })
          .eq('id', inviteId);

        if (updateError) {
          console.error('Erro ao atualizar convite:', updateError);
        }

        // Check if user is already a member
        const { data: existingMember } = await supabase
          .from('company_members')
          .select('id')
          .eq('user_id', userId)
          .eq('company_id', inviteData.company_id)
          .maybeSingle();

        if (existingMember) {
          console.log('Usuário já é membro desta empresa');
          toast.success('Você já faz parte desta empresa! Redirecionando...', { duration: 3000 });
          setTimeout(() => navigate('/dashboard'), 1500);
          return;
        }

        // Create company member
        console.log('Adicionando usuário à empresa...');
        const { error: memberError } = await supabase
          .from('company_members')
          .insert({
            user_id: userId,
            company_id: inviteData.company_id,
            role: inviteData.role,
            display_name: personalData.fullName,
            email: personalData.email,
            phone: personalData.phone,
            is_active: true,
          });

        if (memberError) {
          console.error('Erro ao criar membro:', memberError);
          toast.error('Erro ao adicionar você à empresa: ' + memberError.message);
          setLoading(false);
          return;
        }

        console.log('Usuário adicionado à empresa com sucesso!');
        toast.success('Conta criada com sucesso! Redirecionando...', { duration: 3000 });
        // Redirect to dashboard directly (user is already authenticated)
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        // Normal signup without invite
        const { data, error } = await supabase.auth.signUp({
          email: personalData.email,
          password: personalData.password,
          options: {
            data: {
              full_name: personalData.fullName,
              phone: personalData.phone,
            },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });

        if (error) throw error;

        if (data.user) {
          toast.success('Conta criada! Por favor, verifique seu e-mail para continuar.', { duration: 8000 });
          navigate('/auth');
        }
      }
    } catch (error: any) {
      console.error('Erro completo:', error);
      toast.error(error.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar conta com Google');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden flex min-h-[750px]">
        {/* Left Side - Testimonial with Image */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          {/* Background Image */}
          <img
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
            alt="Professional workspace"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/90 via-indigo-800/85 to-indigo-900/90"></div>

          {/* Pattern Overlay */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_1px)] [background-size:24px_24px]"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 p-12 flex flex-col justify-between w-full">
            {/* Logo */}
            <div>
              <Link to="/" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full border-2 border-white"></div>
                </div>
                <span className="text-white font-bold text-2xl tracking-tight">Nucleus</span>
              </Link>
            </div>

            {/* Testimonial */}
            <div className="space-y-8">
              <Quote className="w-12 h-12 text-white/30" />

              <blockquote className="space-y-6">
                <p className="text-2xl md:text-3xl font-bold text-white leading-tight">
                  "O Nucleus organizou nosso WhatsApp, CRM e automações. Hoje cada conversa vira uma oportunidade real."
                </p>

                <footer className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-white font-bold text-lg">A</span>
                  </div>
                  <div>
                    <div className="text-white font-semibold text-lg">Ana Ribeiro</div>
                    <div className="text-indigo-200 text-sm">Head de Vendas, Grupo Lumina</div>
                  </div>
                </footer>
              </blockquote>
            </div>

            {/* Decorative Element */}
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -z-10"></div>
          </div>
        </div>

        {/* Right Side - Sign Up Form */}
        <div className="w-full lg:w-1/2 p-8 lg:p-16 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            {/* Back to Login Link */}
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors mb-8 font-medium text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para login
            </Link>

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
                Criar Conta
              </h1>
              <p className="text-lg text-slate-500">
                Preencha seus dados para começar com o Nucleus.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-slate-700 font-medium text-sm">
                  Nome Completo
                </Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={personalData.fullName}
                  onChange={handlePersonalChange}
                  placeholder="Seu nome completo"
                  className="h-12 rounded-xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium text-sm">
                  E-mail
                  {inviteId && <span className="ml-2 text-xs text-indigo-600">(do convite)</span>}
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={personalData.email}
                  onChange={handlePersonalChange}
                  placeholder="seuemail@empresa.com"
                  className="h-12 rounded-xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={!!inviteId}
                  required
                />
                {inviteId && (
                  <p className="text-xs text-slate-500">
                    Este email foi pré-definido pelo convite que você recebeu.
                  </p>
                )}
              </div>

              {/* Password and Phone */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700 font-medium text-sm">
                    Senha
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={personalData.password}
                      onChange={handlePersonalChange}
                      placeholder="Mín. 6 caracteres"
                      className="h-12 rounded-xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-slate-700 font-medium text-sm">
                    Telefone
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={personalData.phone}
                    onChange={handlePersonalChange}
                    placeholder="(00) 00000-0000"
                    className="h-12 rounded-xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start gap-3 pt-2">
                <Checkbox
                  id="terms"
                  checked={personalData.agreedToTerms}
                  onCheckedChange={(checked) =>
                    setPersonalData({ ...personalData, agreedToTerms: checked as boolean })
                  }
                  className="mt-1 border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                />
                <label
                  htmlFor="terms"
                  className="text-sm text-slate-600 leading-relaxed cursor-pointer"
                >
                  Eu concordo com os{' '}
                  <Link
                    to="/termos-uso"
                    className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline"
                  >
                    Termos de Uso
                  </Link>{' '}
                  e{' '}
                  <Link
                    to="/politica-privacidade"
                    className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline"
                  >
                    Política de Privacidade
                  </Link>
                  .
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl font-semibold text-base transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  <>
                    Criar Conta
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-slate-500">ou</span>
                </div>
              </div>

              {/* Google Sign Up Button */}
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignUp}
                className="w-full h-12 rounded-xl border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-semibold transition-all flex items-center gap-3 justify-center"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Criar conta com Google
              </Button>

              {/* Footer - Login Link */}
              <div className="text-center mt-6 pt-6 border-t border-slate-100">
                <span className="text-slate-600 text-sm">Já tem uma conta? </span>
                <Link
                  to="/auth"
                  className="text-indigo-600 font-semibold hover:text-indigo-700 hover:underline text-sm transition-colors"
                >
                  Fazer login
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
