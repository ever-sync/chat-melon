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
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex min-h-[700px]">
        {/* Left Side - Image */}
        <div className="hidden lg:block lg:w-[45%] relative">
          <img
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
            alt="Workspace"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20"></div>

          <div className="absolute top-12 left-12 flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 rounded-full border-2 border-white"></div>
            </div>
            <span className="text-white font-bold text-xl">Nucleus</span>
          </div>

          <div className="absolute bottom-12 left-12 right-12 text-white">
            <h2 className="text-3xl font-bold leading-tight mb-6">
              "Simply all the tools that my team and I need."
            </h2>
            <div className="flex flex-col">
              <span className="font-semibold text-lg">Karen Yue</span>
              <span className="text-white/80 text-sm">Director of Digital Marketing Technology</span>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-[55%] p-12 lg:p-24 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold text-slate-900 mb-3">Create your account</h1>
              <p className="text-slate-500">
                Join Nucleus UI and start designing with ease.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-slate-600 font-medium ml-1">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="alex.jordan@gmail.com"
                    className="h-12 rounded-xl border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="password" className="text-slate-600 font-medium ml-1">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••••••"
                      className="h-12 rounded-xl border-2 border-indigo-500 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all pr-12"
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
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-full font-bold text-base transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create account"
                  )}
                </Button>
              </div>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-wider font-bold">
                  <span className="px-4 bg-white text-slate-400">OR</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-slate-700 font-bold transition-all flex items-center gap-3 justify-center"
              >
                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center p-0.5">
                  <svg viewBox="0 0 24 24" className="w-full h-full">
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
                </div>
                Sign up with Google
              </Button>

              <div className="text-center mt-8">
                <span className="text-slate-400 text-sm">Have an account? </span>
                <Link to="/auth" className="text-indigo-600 font-bold hover:underline text-sm">
                  Log in
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
