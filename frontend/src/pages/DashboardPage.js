import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, api } from "@/App";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Navbar } from "@/components/Navbar";
import { CompoundingChart } from "@/components/CompoundingChart";
import {
  Banknote, Wallet, Shield, Target, Activity, MessageCircle,
  TrendingUp, AlertTriangle, RotateCcw, Loader2, Sparkles, ArrowRight
} from "lucide-react";
import { toast } from "sonner";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const riskLabels = ["", "Very nervous", "Somewhat nervous", "Neutral", "Fairly calm", "Very comfortable"];
const efLabels = { yes: "Yes", no: "No", working_on_it: "Working on it" };

export default function DashboardPage() {
  const { user, quizData, fetchProfile, setUser, setQuizData } = useAuth();
  const navigate = useNavigate();
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (!quizData) fetchProfile();
  }, [quizData, fetchProfile]);

  const chartData = useMemo(() => {
    if (!quizData) return [];
    const monthly = quizData.monthly_surplus;
    const monthlyRate = 0.07 / 12;
    const points = [];
    let balance = 0;
    for (let m = 0; m <= 120; m++) {
      if (m > 0) balance = (balance + monthly) * (1 + monthlyRate);
      if (m % 12 === 0) {
        points.push({ year: `Year ${m / 12}`, balance: Math.round(balance), contributed: Math.round(monthly * m) });
      }
    }
    return points;
  }, [quizData]);

  const handleReset = async () => {
    setResetting(true);
    try {
      await api.post("/quiz/reset");
      setQuizData(null);
      setUser(prev => ({ ...prev, quiz_completed: false }));
      toast.success("Quiz reset! Let's start fresh.");
      navigate("/quiz");
    } catch {
      toast.error("Failed to reset");
    } finally {
      setResetting(false);
    }
  };

  if (!quizData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  const finalBalance = chartData.length > 0 ? chartData[chartData.length - 1].balance : 0;
  const totalContributed = chartData.length > 0 ? chartData[chartData.length - 1].contributed : 0;
  const growthAmount = finalBalance - totalContributed;
  const noEmergencyFund = quizData.emergency_fund !== "yes";

  const stats = [
    { icon: Banknote, label: "Monthly Income", value: `$${quizData.monthly_income.toLocaleString()}`, color: "bg-emerald-50 text-emerald-600" },
    { icon: Wallet, label: "Monthly Surplus", value: `$${quizData.monthly_surplus.toLocaleString()}`, color: "bg-blue-50 text-blue-600" },
    { icon: Shield, label: "Emergency Fund", value: efLabels[quizData.emergency_fund], color: noEmergencyFund ? "bg-red-50 text-red-500" : "bg-green-50 text-green-600" },
    { icon: Target, label: "Primary Goal", value: quizData.primary_goal, color: "bg-purple-50 text-purple-600" },
    { icon: Activity, label: "Risk Comfort", value: `${quizData.risk_comfort}/5 — ${riskLabels[quizData.risk_comfort]}`, color: "bg-amber-50 text-amber-600" },
  ];

  return (
    <div className="min-h-screen bg-background" data-testid="dashboard-container">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Emergency fund warning */}
        {noEmergencyFund && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <Card data-testid="emergency-fund-warning" className="bg-amber-50 border-amber-200 rounded-2xl">
              <CardContent className="p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-amber-800 text-sm">Safety First</p>
                  <p className="text-amber-700 text-sm mt-0.5">Consider building an emergency fund (3-6 months of expenses) before investing. It's your financial safety net!</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-nunito text-3xl md:text-4xl font-extrabold text-stone-800">
            Hey {user?.name?.split(" ")[0]} <span className="gradient-text">!</span>
          </h1>
          <p className="text-stone-500 mt-2 font-manrope text-base md:text-lg">Here's your financial snapshot and growth potential.</p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-8">
          {stats.map((s) => (
            <motion.div key={s.label} variants={item}>
              <Card data-testid={`stat-${s.label.toLowerCase().replace(/\s/g, "-")}`} className="rounded-2xl border-stone-100 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-shadow duration-300">
                <CardContent className="p-4">
                  <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
                    <s.icon className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-stone-400 font-medium uppercase tracking-wider">{s.label}</p>
                  <p className="font-bold text-stone-800 text-sm mt-1 leading-tight">{s.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Chart Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card data-testid="dashboard-chart" className="rounded-3xl border-stone-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h2 className="font-nunito text-xl font-bold text-stone-800">Compounding Visualizer</h2>
                  </div>
                  <p className="text-stone-500 text-sm font-manrope">Your ${quizData.monthly_surplus.toLocaleString()}/mo surplus growing at 7% annually over 10 years</p>
                </div>
                <div className="flex gap-4">
                  <div className="text-right">
                    <p className="text-xs text-stone-400 uppercase tracking-wider">Projected Balance</p>
                    <p className="text-xl font-bold text-stone-800">${finalBalance.toLocaleString()}</p>
                  </div>
                  <Separator orientation="vertical" className="h-10" />
                  <div className="text-right">
                    <p className="text-xs text-stone-400 uppercase tracking-wider">Growth from Interest</p>
                    <p className="text-xl font-bold text-emerald-600">+${growthAmount.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <CompoundingChart data={chartData} />
              <p className="text-xs text-stone-400 mt-4 text-center italic">
                Like a snowball rolling down a hill — the longer it rolls, the bigger it gets. That's compounding!
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA & Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card
              data-testid="dashboard-chat-cta"
              className="rounded-3xl border-0 bg-gradient-to-br from-rose-400 to-orange-400 text-white cursor-pointer hover:scale-[1.01] transition-transform duration-300 shadow-[0_10px_40px_-10px_rgba(255,139,167,0.4)]"
              onClick={() => navigate("/chat")}
            >
              <CardContent className="p-6 md:p-8 flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-nunito text-xl font-bold">Chat with Bloom</h3>
                  <p className="text-white/80 text-sm mt-1 font-manrope">Ask anything about saving, investing, or budgeting</p>
                </div>
                <ArrowRight className="w-5 h-5 ml-auto flex-shrink-0 opacity-70" />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card className="rounded-3xl border-stone-100 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)]">
              <CardContent className="p-6 md:p-8 flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center flex-shrink-0">
                  <RotateCcw className="w-6 h-6 text-stone-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-nunito text-lg font-bold text-stone-800">Retake Quiz</h3>
                  <p className="text-stone-500 text-sm mt-0.5 font-manrope">Update your financial profile</p>
                </div>
                <Button
                  data-testid="dashboard-reset-btn"
                  variant="outline"
                  onClick={handleReset}
                  disabled={resetting}
                  className="rounded-full px-5 border-stone-200 text-stone-600 hover:bg-stone-50"
                >
                  {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reset"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-xs text-stone-400 mt-10 font-manrope">
          I am an AI educational assistant, not a licensed financial advisor. Past performance doesn't guarantee future results.
        </p>
      </div>
    </div>
  );
}
