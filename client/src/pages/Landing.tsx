import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { Zap, ArrowRight, CheckCircle2, X, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

function WaitlistModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [done, setDone] = useState(false);

  const joinWaitlist = trpc.waitlist.join.useMutation({
    onSuccess: () => setDone(true),
    onError: (e) => toast.error(e.message || "Une erreur est survenue"),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) return;
    joinWaitlist.mutate({ email, name, company });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md bg-[#111827] border border-white/10 rounded-2xl p-8 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {done ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">Vous êtes sur la liste !</h3>
            <p className="text-slate-400 text-sm">Nous vous contacterons dès que votre accès sera disponible.</p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 transition-colors"
            >
              Fermer
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h3 className="text-xl font-black text-white mb-1">Rejoindre la liste d'attente</h3>
              <p className="text-slate-400 text-sm">Soyez parmi les premiers à accéder à SalonSwipe.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                required
                placeholder="Email professionnel *"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
              />
              <input
                type="text"
                placeholder="Prénom et nom"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
              />
              <input
                type="text"
                placeholder="Entreprise"
                value={company}
                onChange={e => setCompany(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
              />
              <button
                type="submit"
                disabled={joinWaitlist.isPending || !email}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
              >
                {joinWaitlist.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>Rejoindre la liste <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

const FEATURES = [
  { emoji: "⚡", title: "Swipe en équipe", desc: "Évaluez chaque exposant en quelques secondes. Like, Super Like ou Skip." },
  { emoji: "🗺️", title: "Parcours optimisé", desc: "Chemin de visite intelligent par hall, basé sur vos favoris." },
  { emoji: "🤖", title: "Insights IA", desc: "Tendances, rapports exportables, recommandations personnalisées." },
];

export default function Landing() {
  const [, navigate] = useLocation();
  const [showWaitlist, setShowWaitlist] = useState(false);

  return (
    <div className="min-h-screen bg-[#080d1a] text-white flex flex-col overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-blue-700/20 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-violet-700/10 rounded-full blur-[100px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-600/30">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-lg tracking-tight">
            Salon<span className="text-blue-400">Swipe</span>
          </span>
        </div>
        <button
          onClick={() => window.location.href = getLoginUrl()}
          className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
        >
          Se connecter <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-semibold mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Préparez vos salons professionnels
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.02] mb-6">
            Swipez.{" "}
            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
              Visitez les meilleurs.
            </span>
          </h1>

          <p className="text-lg text-slate-400 max-w-lg mx-auto mb-10 leading-relaxed">
            Évaluez les exposants en équipe, générez un parcours optimisé et obtenez des insights IA — en quelques minutes.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => window.location.href = getLoginUrl()}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base shadow-xl shadow-blue-600/25 transition-all hover:scale-105 active:scale-95"
            >
              Accéder à la plateforme
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowWaitlist(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border border-white/15 text-slate-300 hover:text-white hover:border-white/30 text-base font-medium transition-all"
            >
              Rejoindre la liste d'attente
            </button>
          </div>

          {/* Trust */}
          <div className="flex flex-wrap items-center justify-center gap-5 mt-10 text-xs text-slate-600">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />Gratuit pour commencer</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />Sans carte bancaire</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />Équipes illimitées</span>
          </div>
        </motion.div>

        {/* Features strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mt-20 w-full"
        >
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white/3 border border-white/8 text-left"
            >
              <span className="text-2xl mb-3 block">{f.emoji}</span>
              <p className="font-bold text-white text-sm mb-1">{f.title}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-6 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-xs text-slate-700">© 2026 SalonSwipe</span>
          <button
            onClick={() => setShowWaitlist(true)}
            className="text-xs text-slate-600 hover:text-blue-400 transition-colors"
          >
            Liste d'attente
          </button>
        </div>
      </footer>

      {/* Waitlist modal */}
      <AnimatePresence>
        {showWaitlist && <WaitlistModal onClose={() => setShowWaitlist(false)} />}
      </AnimatePresence>
    </div>
  );
}
