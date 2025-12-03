import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/dashboard");
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
      toast.success("Login realizado com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-[#111111] rounded-3xl shadow-2xl overflow-hidden flex border border-[#1F1F1F]">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0A0A0A] via-[#0F0F0F] to-[#0A0A0A] p-12 flex-col justify-between relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#10B981]/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#10B981]/5 rounded-full blur-3xl"></div>

          {/* Logo */}
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-[#10B981] shadow-lg shadow-[#10B981]/20">
                <img src="/icon-512.png" alt="Logo" className="w-10 h-10" />
              </div>
              <span className="text-2xl font-bold text-white">CamalaChat</span>
            </Link>
          </div>

          {/* Center Content */}
          <div className="relative z-10 text-center">
            <h2 className="text-4xl font-bold text-white mb-4">
              Bem-vindo de volta!
            </h2>
            <p className="text-gray-400 text-lg">
              O chat que se adapta ao seu negócio
            </p>

            {/* Decorative Chameleon Pattern */}
            <div className="mt-12 flex justify-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#10B981] animate-pulse"></div>
              <div className="w-3 h-3 rounded-full bg-[#10B981]/60 animate-pulse delay-100"></div>
              <div className="w-3 h-3 rounded-full bg-[#10B981]/30 animate-pulse delay-200"></div>
            </div>
          </div>

          {/* Footer */}
          <div className="relative z-10 text-center text-gray-500 text-sm">
            © 2025 CamalaChat. Todos os direitos reservados.
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center bg-[#111111]">
          <div className="max-w-md mx-auto w-full">
            {/* Mobile Logo */}
            <div className="lg:hidden mb-8 text-center">
              <div className="inline-flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#10B981]">
                  <img src="/icon-512.png" alt="Logo" className="w-8 h-8" />
                </div>
                <span className="text-2xl font-bold text-white">CamalaChat</span>
              </div>
            </div>

            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Entrar</h1>
              <p className="text-gray-400">
                Não tem uma conta?{" "}
                <Link
                  to="/signup"
                  className="text-[#10B981] hover:text-[#059669] font-medium transition-colors"
                >
                  Criar Conta
                </Link>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email" className="text-gray-200 font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="seu@email.com"
                  className="mt-2 h-12 rounded-xl bg-[#1A1A1A] border-[#2A2A2A] text-white placeholder:text-gray-500 focus:border-[#10B981] focus:ring-[#10B981]"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-gray-200 font-medium">
                  Senha
                </Label>
                <div className="relative mt-2">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="h-12 rounded-xl bg-[#1A1A1A] border-[#2A2A2A] text-white placeholder:text-gray-500 focus:border-[#10B981] focus:ring-[#10B981] pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#10B981] transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm text-gray-400 hover:text-[#10B981] font-medium transition-colors"
                >
                  Esqueceu a senha?
                </Link>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#10B981] hover:bg-[#059669] text-black rounded-xl font-medium text-base transition-all shadow-lg shadow-[#10B981]/20 hover:shadow-xl hover:shadow-[#10B981]/30"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#2A2A2A]"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-[#111111] text-gray-500">ou</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-xl border-2 border-[#2A2A2A] bg-[#1A1A1A] hover:border-[#10B981] hover:bg-[#10B981]/5 transition-all text-gray-300"
                >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-xl border-2 border-[#2A2A2A] bg-[#1A1A1A] hover:border-[#10B981] hover:bg-[#10B981]/5 transition-all text-gray-300"
                >
                  <svg className="mr-2 h-5 w-5" fill="#1877F2" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </Button>
              </div>
            </form>

            <div className="mt-8 text-center">
              <Link
                to="/"
                className="text-sm text-gray-400 hover:text-[#10B981] transition-colors inline-flex items-center gap-2"
              >
                ← Voltar para o site
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
