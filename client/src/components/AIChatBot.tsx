import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bot, Send, Loader2, Sparkles, ChevronDown, Download, FileText } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  isReport?: boolean; // indique que ce message est un rapport exportable
}

interface AIChatBotProps {
  eventId?: number;
  eventName?: string;
  onClose: () => void;
}

// Invites prédéfinies pertinentes pour l'exploration des données de vote
const SUGGESTED_PROMPTS = [
  { icon: "🏆", label: "Top exposants", prompt: "Quels sont les exposants les mieux notés par l'équipe ?" },
  { icon: "📊", label: "Tendances", prompt: "Quelles sont les grandes tendances des votes de l'équipe ?" },
  { icon: "⭐", label: "Mes super likes", prompt: "Quels exposants ai-je mis en super like ?" },
  { icon: "🏷️", label: "Par tier", prompt: "Comment se répartissent les votes par tier (A, B, C, D) ?" },
  { icon: "🤝", label: "Consensus", prompt: "Sur quels exposants l'équipe est-elle la plus unanime ?" },
  { icon: "💡", label: "Recommandations", prompt: "Quels exposants devrais-je prioriser lors de ma visite ?" },
  { icon: "📈", label: "Statistiques", prompt: "Donne-moi un résumé statistique des votes." },
  { icon: "🔍", label: "Secteurs", prompt: "Quels secteurs d'activité ont le plus de votes positifs ?" },
  { icon: "📝", label: "Rapport complet", prompt: "Génère un rapport complet d'analyse des votes de l'équipe pour ce salon, avec classement, tendances, consensus et recommandations. Formate-le en Markdown avec des sections claires." },
  { icon: "🗺️", label: "Rapport visite", prompt: "Génère un rapport de préparation de visite avec les exposants prioritaires à voir en premier, organisés par hall si possible. Formate-le en Markdown." },
];

function downloadMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Détecte si un message ressemble à un rapport Markdown (contient des headers)
function isMarkdownReport(content: string): boolean {
  return content.includes("##") || (content.includes("#") && content.length > 300);
}

export default function AIChatBot({ eventId, eventName, onClose }: AIChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Bonjour ! Je suis votre assistant d'analyse pour ${eventName ?? "ce salon"}. Je peux analyser les votes, identifier les tendances, et **générer des rapports exportables en Markdown**. Utilisez les suggestions ci-dessous ou posez votre question.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chat = trpc.ai.chat.useMutation({
    onSuccess: (data) => {
      const reply = String(data.reply);
      setMessages(prev => [...prev, {
        role: "assistant" as const,
        content: reply,
        isReport: isMarkdownReport(reply),
      }]);
    },
    onError: (e) => {
      setMessages(prev => [...prev, { role: "assistant", content: `Désolé, une erreur s'est produite : ${e.message}` }]);
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || chat.isPending) return;

    setMessages(prev => [...prev, { role: "user", content: message }]);
    setInput("");
    setShowSuggestions(false);
    chat.mutate({ message, eventId });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleExportMessage = (content: string, index: number) => {
    const slug = (eventName ?? "salon").replace(/\s+/g, "-").toLowerCase();
    const date = new Date().toISOString().split("T")[0];
    // Ajouter un header si pas déjà présent
    const fullContent = content.startsWith("#")
      ? content
      : `# Rapport IA — ${eventName ?? "Salon"}\n\n*Généré le ${new Date().toLocaleDateString("fr-FR")}*\n\n${content}`;
    downloadMarkdown(fullContent, `rapport-ia-${slug}-${date}-${index}.md`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="w-full max-w-sm bg-card rounded-t-3xl shadow-2xl flex flex-col"
        style={{ maxHeight: "85vh" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
        </div>

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground flex items-center gap-1">
                Assistant IA
                <Sparkles className="w-3.5 h-3.5 text-primary" />
              </p>
              <p className="text-xs text-muted-foreground">Analyse · Rapports exportables</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-3 space-y-3 min-h-0">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
              )}
              <div className="max-w-[80%] flex flex-col gap-1.5">
                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>
                {/* Bouton export si c'est un rapport */}
                {msg.role === "assistant" && msg.isReport && (
                  <button
                    onClick={() => handleExportMessage(msg.content, i)}
                    className="flex items-center gap-1.5 self-start px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    Exporter en Markdown
                  </button>
                )}
              </div>
            </motion.div>
          ))}

          {chat.isPending && (
            <div className="flex justify-start">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        <AnimatePresence>
          {showSuggestions && messages.length <= 1 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex-shrink-0 px-4 pb-2"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Suggestions & rapports
                </p>
                <button onClick={() => setShowSuggestions(false)} className="text-muted-foreground">
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {SUGGESTED_PROMPTS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(s.prompt)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                  >
                    <span>{s.icon}</span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        <div className="flex-shrink-0 px-4 pb-6 pt-2 border-t border-border">
          <div className="flex items-center gap-2 bg-muted rounded-2xl px-3 py-2">
            <input
              type="text"
              placeholder="Posez votre question ou demandez un rapport..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
              disabled={chat.isPending}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || chat.isPending}
              className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center disabled:opacity-40 transition-opacity"
            >
              {chat.isPending ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Send className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
