import { useState } from "react";
import { useAuth, api } from "@/App";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sprout, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AuthPage() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email: loginEmail, password: loginPassword });
      login(res.data.token, res.data.user);
      toast.success("Welcome back!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/register", { name: regName, email: regEmail, password: regPassword });
      login(res.data.token, res.data.user);
      toast.success("Account created! Let's get started.");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-20 left-10 w-72 h-72 blob-pink pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 blob-purple pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-48 h-48 blob-yellow pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md z-10"
      >
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-18 h-18 rounded-full bg-gradient-to-br from-rose-400 to-orange-400 mb-5 shadow-[0_10px_40px_-10px_rgba(255,139,167,0.4)] p-4"
          >
            <Sprout className="w-9 h-9 text-white" />
          </motion.div>
          <h1 className="font-nunito text-4xl font-extrabold text-gray-800 tracking-tight">Bloom</h1>
          <p className="text-stone-500 mt-2 font-manrope text-base">Your friendly AI financial mentor</p>
        </div>

        <Card className="glass-card shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-3xl border-0">
          <CardContent className="p-8">
            <Tabs defaultValue="login">
              <TabsList className="grid grid-cols-2 mb-6 bg-stone-100/80 rounded-xl p-1 h-11">
                <TabsTrigger data-testid="auth-tab-login" value="login" className="rounded-lg font-semibold text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">Sign In</TabsTrigger>
                <TabsTrigger data-testid="auth-tab-register" value="register" className="rounded-lg font-semibold text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <Label htmlFor="login-email" className="text-sm font-bold text-stone-600 ml-1 mb-2 block">Email</Label>
                    <Input data-testid="login-email" id="login-email" type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="you@example.com" className="rounded-xl bg-stone-50/80 border-stone-200 h-11" required />
                  </div>
                  <div>
                    <Label htmlFor="login-password" className="text-sm font-bold text-stone-600 ml-1 mb-2 block">Password</Label>
                    <Input data-testid="login-password" id="login-password" type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="Your password" className="rounded-xl bg-stone-50/80 border-stone-200 h-11" required />
                  </div>
                  <Button data-testid="login-submit" type="submit" className="w-full rounded-full h-12 bg-gradient-to-r from-rose-400 to-orange-400 hover:from-rose-500 hover:to-orange-500 text-white font-bold shadow-[0_10px_40px_-10px_rgba(255,139,167,0.4)] transition-all duration-300 hover:scale-[1.02]" disabled={loading}>
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="flex items-center gap-2">Sign In <ArrowRight className="w-4 h-4" /></span>}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-5">
                  <div>
                    <Label htmlFor="reg-name" className="text-sm font-bold text-stone-600 ml-1 mb-2 block">Name</Label>
                    <Input data-testid="register-name" id="reg-name" type="text" value={regName} onChange={e => setRegName(e.target.value)} placeholder="Your name" className="rounded-xl bg-stone-50/80 border-stone-200 h-11" required />
                  </div>
                  <div>
                    <Label htmlFor="reg-email" className="text-sm font-bold text-stone-600 ml-1 mb-2 block">Email</Label>
                    <Input data-testid="register-email" id="reg-email" type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="you@example.com" className="rounded-xl bg-stone-50/80 border-stone-200 h-11" required />
                  </div>
                  <div>
                    <Label htmlFor="reg-password" className="text-sm font-bold text-stone-600 ml-1 mb-2 block">Password</Label>
                    <Input data-testid="register-password" id="reg-password" type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="At least 6 characters" className="rounded-xl bg-stone-50/80 border-stone-200 h-11" required minLength={6} />
                  </div>
                  <Button data-testid="register-submit" type="submit" className="w-full rounded-full h-12 bg-gradient-to-r from-rose-400 to-orange-400 hover:from-rose-500 hover:to-orange-500 text-white font-bold shadow-[0_10px_40px_-10px_rgba(255,139,167,0.4)] transition-all duration-300 hover:scale-[1.02]" disabled={loading}>
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="flex items-center gap-2">Create Account <Sparkles className="w-4 h-4" /></span>}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-stone-400 mt-8 font-manrope leading-relaxed px-4">
          I am an AI educational assistant, not a licensed financial advisor.
        </p>
      </motion.div>
    </div>
  );
}
