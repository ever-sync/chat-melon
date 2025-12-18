import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, Quote } from 'lucide-react';

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      if (error) throw error;
      toast.success('Login realizado com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer login com Google');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden flex min-h-[700px]">
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

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 p-8 lg:p-16 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            {/* Header */}
            <div className="mb-10">
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
                Entrar no Nucleus
              </h1>
              <p className="text-lg text-slate-500">
                Acesse seu painel com chat, CRM, automação e IA em um só lugar.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium text-sm">
                  E-mail
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="seuemail@empresa.com"
                  className="h-12 rounded-xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-medium text-sm">
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Digite sua senha"
                    className="h-12 rounded-xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl font-semibold text-base transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    'Entrar'
                  )}
                </Button>
              </div>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-slate-500">ou</span>
                </div>
              </div>

              {/* Google Login Button */}
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleLogin}
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
                Entrar com Google
              </Button>

              {/* Footer - Sign Up Link */}
              <div className="text-center mt-6 pt-6 border-t border-slate-100">
                <span className="text-slate-600 text-sm">Ainda não tem conta? </span>
                <Link
                  to="/signup"
                  className="text-indigo-600 font-semibold hover:text-indigo-700 hover:underline text-sm transition-colors"
                >
                  Criar conta
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
