import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function SignUp() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Personal Data
  const [personalData, setPersonalData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    agreedToTerms: false,
  });

  const handlePersonalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPersonalData({ ...personalData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!personalData.agreedToTerms) {
      toast.error('You need to agree to the Terms and Conditions');
      return;
    }

    if (personalData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      // Create Supabase auth user (email confirmation required)
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
        toast.success('Account created! Please verify your email to continue.', { duration: 8000 });
        navigate('/auth');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error creating account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex min-h-[750px]">
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
              <span className="text-white/80 text-sm">
                Director of Digital Marketing Technology
              </span>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-[55%] p-10 lg:p-20 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors mb-6 font-medium text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>

            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Create Account</h1>
              <p className="text-slate-500">Fill in your details to get started with Nucleus.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="fullName" className="text-slate-600 font-medium ml-1">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={personalData.fullName}
                  onChange={handlePersonalChange}
                  placeholder="John Doe"
                  className="h-12 rounded-xl border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="email" className="text-slate-600 font-medium ml-1">
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={personalData.email}
                  onChange={handlePersonalChange}
                  placeholder="john@company.com"
                  className="h-12 rounded-xl border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="password" className="text-slate-600 font-medium ml-1">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={personalData.password}
                      onChange={handlePersonalChange}
                      placeholder="Min 6 chars"
                      className="h-12 rounded-xl border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phone" className="text-slate-600 font-medium ml-1">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={personalData.phone}
                    onChange={handlePersonalChange}
                    placeholder="+1 (555) 000-0000"
                    className="h-12 rounded-xl border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

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
                  className="text-sm text-slate-500 leading-relaxed cursor-pointer"
                >
                  I agree to the{' '}
                  <Link
                    to="/terms"
                    className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline"
                  >
                    Terms & Conditions
                  </Link>{' '}
                  and{' '}
                  <Link
                    to="/privacy"
                    className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline"
                  >
                    Privacy Policy
                  </Link>
                  .
                </label>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-full font-bold text-base transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 mt-4"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              <div className="text-center mt-6">
                <span className="text-slate-400 text-sm">Already have an account? </span>
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
}
