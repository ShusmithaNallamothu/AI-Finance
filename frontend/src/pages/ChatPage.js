import { useState, useEffect, useRef } from "react";
import { useAuth, api } from "@/App";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sprout, Send, Loader2, Sparkles, MessageCircle,
  Lightbulb, PiggyBank, TrendingUp, Trash2
} from "lucide-react";
import { toast } from "sonner";

const MENTOR_AVATAR = "https://images.unsplash.com/photo-1744451658473-cf5c564d37?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2ODh8MHwxfHNlYXJjaHwzfHxjdXRlJTIwM2QlMjByb2JvdCUyMGNoYXJhY3RlciUyMGZyaWVuZGx5JTIwZmFjZSUyMG1pbmltYWx8ZW58MHx8fHwxNzczMjI1MTQ1fDA&ixlib=rb-4.1.0&q=85";

const SUGGESTED_PROMPTS = [
  { icon: Lightbulb, text: "What is compounding and why does it matter?" },
  { icon: PiggyBank, text: "How should I start building an emergency fund?" },
  { icon: TrendingUp, text: "What's the difference between saving and investing?" },
  { icon: Sparkles, text: "Help me make a plan for my surplus cash" },
];

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadHistory = async () => {
    try {
      const res = await api.get("/chat/history");
      setMessages(res.data.messages || []);
    } catch {
      // No history yet
    } finally {
      setHistoryLoaded(true);
    }
  };

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { id: Date.now().toString(), role: "user", content: text.trim(), created_at: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post("/chat/send", { message: text.trim() });
      const assistantMsg = { id: res.data.message_id, role: "assistant", content: res.data.response, created_at: new Date().toISOString() };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const errMsg = err.response?.data?.detail || "Failed to get response";
      const isQuota = errMsg.toLowerCase().includes("quota") || errMsg.toLowerCase().includes("rate");
      toast.error(isQuota ? "AI service quota exceeded. Please check your OpenAI billing." : errMsg);
      setMessages(prev => prev.filter(m => m.id !== userMsg.id));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const clearChat = async () => {
    try {
      await api.delete("/chat/clear");
      setMessages([]);
      toast.success("Chat cleared");
    } catch {
      toast.error("Failed to clear chat");
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background" data-testid="chat-container">
      <Navbar />
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {/* Chat Header */}
        <div className="px-4 md:px-8 py-4 flex items-center justify-between border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-orange-400 flex items-center justify-center">
              <Sprout className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-nunito font-bold text-stone-800 text-lg">Bloom Mentor</h2>
              <p className="text-xs text-stone-400">Analysis . Education . Guidance</p>
            </div>
          </div>
          {messages.length > 0 && (
            <Button
              data-testid="chat-clear-btn"
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="text-stone-400 hover:text-stone-600 rounded-full"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6" data-testid="chat-messages">
          {historyLoaded && messages.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-100 to-purple-100 flex items-center justify-center mb-4 mx-auto">
                  <MessageCircle className="w-9 h-9 text-primary" />
                </div>
                <h3 className="font-nunito text-xl font-bold text-stone-700">Start a conversation</h3>
                <p className="text-stone-500 text-sm mt-2 max-w-md font-manrope">
                  I'm here to help you understand finance in the simplest way possible. Pick a topic or ask anything!
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg"
              >
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    data-testid={`chat-suggested-prompt-${i}`}
                    onClick={() => sendMessage(prompt.text)}
                    className="flex items-center gap-3 p-4 rounded-2xl border-2 border-stone-100 bg-white text-left hover:border-primary/20 hover:bg-rose-50/30 transition-all duration-200 group"
                  >
                    <prompt.icon className="w-5 h-5 text-stone-400 group-hover:text-primary transition-colors flex-shrink-0" />
                    <span className="text-sm text-stone-600 font-medium">{prompt.text}</span>
                  </button>
                ))}
              </motion.div>
            </div>
          ) : (
            <div className="space-y-5">
              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <Avatar className="w-8 h-8 mr-3 mt-1 flex-shrink-0">
                        <AvatarImage src={MENTOR_AVATAR} alt="Bloom" />
                        <AvatarFallback className="bg-gradient-to-br from-rose-400 to-orange-400 text-white text-xs">B</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      data-testid={`chat-message-${msg.role}`}
                      className={`max-w-[80%] px-5 py-3.5 ${
                        msg.role === "user" ? "msg-user" : "msg-assistant"
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <Avatar className="w-8 h-8 mr-3 mt-1 flex-shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-rose-400 to-orange-400 text-white text-xs">B</AvatarFallback>
                  </Avatar>
                  <div className="msg-assistant px-5 py-4">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-stone-400 typing-dot" />
                      <div className="w-2 h-2 rounded-full bg-stone-400 typing-dot" />
                      <div className="w-2 h-2 rounded-full bg-stone-400 typing-dot" />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="px-4 md:px-8 pb-4 pt-2">
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                data-testid="chat-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Bloom anything about finance..."
                disabled={loading}
                className="w-full h-12 rounded-full border-2 border-stone-100 bg-white px-5 pr-14 text-sm font-manrope focus:outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/10 transition-all disabled:opacity-50"
              />
            </div>
            <Button
              data-testid="chat-send-btn"
              type="submit"
              disabled={!input.trim() || loading}
              className="w-12 h-12 rounded-full bg-gradient-to-r from-rose-400 to-orange-400 hover:from-rose-500 hover:to-orange-500 text-white shadow-[0_10px_40px_-10px_rgba(255,139,167,0.4)] transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 p-0 flex-shrink-0"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </form>
          <p className="text-center text-xs text-stone-400 mt-3 font-manrope">
            I am an AI educational assistant, not a licensed financial advisor.
          </p>
        </div>
      </div>
    </div>
  );
}
