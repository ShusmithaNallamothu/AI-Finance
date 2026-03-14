import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, api } from "@/App";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Sprout, ArrowRight, ArrowLeft, Banknote, Wallet, Shield, Target, Activity, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const STEPS = [
  {
    key: "monthly_income",
    icon: Banknote,
    title: "Let's start with the basics",
    question: "What is your typical monthly take-home pay?",
    hint: "This is the amount that lands in your account after taxes.",
    type: "number",
  },
  {
    key: "monthly_surplus",
    icon: Wallet,
    title: "How much breathing room do you have?",
    question: "After bills, how much 'extra cash' do you usually have left?",
    hint: "Think of this as money that's sitting around without a job.",
    type: "number",
  },
  {
    key: "emergency_fund",
    icon: Shield,
    title: "Safety net check",
    question: "Do you have 3-6 months of expenses saved for emergencies?",
    hint: "This is your financial airbag \u2014 it catches you when life throws curveballs.",
    type: "radio",
    options: [
      { value: "yes", label: "Yes, I'm covered" },
      { value: "no", label: "Not yet" },
      { value: "working_on_it", label: "Working on it" },
    ],
  },
  {
    key: "primary_goal",
    icon: Target,
    title: "What's your money dream?",
    question: "What are you saving for?",
    hint: "No wrong answers! This helps me tailor my advice to you.",
    type: "goal",
    options: ["First home", "Retirement", "Travel fund", "Education", "Just learning", "Other"],
  },
  {
    key: "risk_comfort",
    icon: Activity,
    title: "Let's talk comfort zones",
    question: "How nervous would you be if your balance dropped 10% in a month?",
    hint: "1 = \"I'd lose sleep\" \u2192 5 = \"Meh, it'll bounce back\"",
    type: "slider",
  },
];

const riskLabels = ["", "Very nervous", "Somewhat nervous", "Neutral", "Fairly calm", "Very comfortable"];

export default function QuizPage() {
  const { fetchProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [answers, setAnswers] = useState({
    monthly_income: "",
    monthly_surplus: "",
    emergency_fund: "",
    primary_goal: "",
    risk_comfort: 3,
  });

  const current = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  const updateAnswer = (key, value) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const canProceed = () => {
    const val = answers[current.key];
    if (current.type === "number") return val !== "" && Number(val) >= 0;
    if (current.type === "radio") return val !== "";
    if (current.type === "goal") return val !== "";
    return true;
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await api.post("/quiz/save", {
        monthly_income: Number(answers.monthly_income),
        monthly_surplus: Number(answers.monthly_surplus),
        emergency_fund: answers.emergency_fund,
        primary_goal: answers.primary_goal,
        risk_comfort: answers.risk_comfort,
      });
      await fetchProfile();
      toast.success("Profile saved! Let's explore your finances.");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save quiz");
    } finally {
      setSaving(false);
    }
  };

  const renderInput = () => {
    switch (current.type) {
      case "number":
        return (
          <div className="relative mt-6">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-lg">$</span>
            <Input
              data-testid={`quiz-${current.key}-input`}
              type="number"
              min="0"
              value={answers[current.key]}
              onChange={(e) => updateAnswer(current.key, e.target.value)}
              placeholder="0"
              className="pl-10 h-14 text-xl font-semibold rounded-2xl bg-white border-stone-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        );
      case "radio":
        return (
          <RadioGroup
            data-testid="quiz-emergency-group"
            value={answers[current.key]}
            onValueChange={(v) => updateAnswer(current.key, v)}
            className="mt-6 space-y-3"
          >
            {current.options.map((opt) => (
              <Label
                key={opt.value}
                htmlFor={`radio-${opt.value}`}
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                  answers[current.key] === opt.value
                    ? "border-primary bg-rose-50/50 shadow-sm"
                    : "border-stone-100 bg-white hover:border-stone-200"
                }`}
              >
                <RadioGroupItem data-testid={`quiz-emergency-${opt.value}`} value={opt.value} id={`radio-${opt.value}`} />
                <span className="font-medium text-stone-700">{opt.label}</span>
              </Label>
            ))}
          </RadioGroup>
        );
      case "goal":
        return (
          <div className="mt-6 grid grid-cols-2 gap-3">
            {current.options.map((opt) => (
              <button
                key={opt}
                data-testid={`quiz-goal-${opt.toLowerCase().replace(/\s/g, "-")}`}
                onClick={() => updateAnswer(current.key, opt)}
                className={`p-4 rounded-2xl border-2 text-left font-medium transition-all duration-200 ${
                  answers[current.key] === opt
                    ? "border-primary bg-rose-50/50 shadow-sm text-stone-800"
                    : "border-stone-100 bg-white hover:border-stone-200 text-stone-600"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        );
      case "slider":
        return (
          <div className="mt-8 space-y-6">
            <div className="px-2">
              <Slider
                data-testid="quiz-risk-slider"
                value={[answers[current.key]]}
                onValueChange={([v]) => updateAnswer(current.key, v)}
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
            </div>
            <div className="flex justify-between text-xs text-stone-400 px-1">
              <span>Very nervous</span>
              <span>Very comfortable</span>
            </div>
            <div className="text-center">
              <span className="inline-flex items-center px-5 py-2 rounded-full bg-rose-50 text-primary font-bold text-lg">
                {answers[current.key]} — {riskLabels[answers[current.key]]}
              </span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-10 right-20 w-64 h-64 blob-pink pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 blob-purple pointer-events-none" />

      <div className="w-full max-w-lg z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sprout className="w-6 h-6 text-primary" />
            <span className="font-nunito font-bold text-lg text-stone-700">Bloom</span>
          </div>
          <Progress data-testid="quiz-progress" value={progress} className="h-2 rounded-full" />
          <p className="text-sm text-stone-400 mt-2 font-manrope">Step {step + 1} of {STEPS.length}</p>
        </div>

        {/* Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="glass-card shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-3xl border-0">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                    <current.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-stone-400 uppercase tracking-wider">{current.title}</span>
                </div>

                <h2 className="font-nunito text-2xl font-bold text-stone-800 mt-4 leading-snug">
                  {current.question}
                </h2>

                <p className="text-stone-500 text-sm mt-2 leading-relaxed font-manrope">
                  {current.hint}
                </p>

                {renderInput()}

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8 gap-4">
                  {step > 0 ? (
                    <Button
                      data-testid="quiz-back-btn"
                      variant="ghost"
                      onClick={handleBack}
                      className="rounded-full px-6 h-11 font-semibold text-stone-600 hover:bg-stone-100"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                  ) : (
                    <div />
                  )}

                  {step < STEPS.length - 1 ? (
                    <Button
                      data-testid="quiz-next-btn"
                      onClick={handleNext}
                      disabled={!canProceed()}
                      className="rounded-full px-8 h-11 bg-gradient-to-r from-rose-400 to-orange-400 hover:from-rose-500 hover:to-orange-500 text-white font-bold shadow-[0_10px_40px_-10px_rgba(255,139,167,0.4)] transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                    >
                      Next <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      data-testid="quiz-submit-btn"
                      onClick={handleSubmit}
                      disabled={!canProceed() || saving}
                      className="rounded-full px-8 h-11 bg-gradient-to-r from-rose-400 to-orange-400 hover:from-rose-500 hover:to-orange-500 text-white font-bold shadow-[0_10px_40px_-10px_rgba(255,139,167,0.4)] transition-all duration-300 hover:scale-[1.02] disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Finish</span>}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
