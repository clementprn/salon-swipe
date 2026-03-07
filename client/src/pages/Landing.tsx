import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import {
  Zap, Users, Navigation, Bot, BarChart3, Download,
  ArrowRight, CheckCircle2, Star, ChevronDown
} from "lucide-react";

const FEATURES = [
  {
    icon: Zap,
    color: "from-blue-500 to-blue-600",
    title: "Swipe & évaluez",
    desc: "Interface Tinder-like pour évaluer chaque exposant en quelques secondes. Like, Super Like ou Skip.",
  },
  {
    icon: Users,
    color: "from-violet-500 to-violet-600",
    title: "Vue équipe",
    desc: "Consolidez les votes de toute votre équipe. Classement pondéré, consensus instantané.",
  },
  {
    icon: Navigation,
    color: "from-emerald-500 to-emerald-600",
    title: "Parcours optimisé",
    desc: "Générez un chemin de visite intelligent basé sur vos favoris, organisé par hall.",
  },
  {
    icon: Bot,
    color: "from-amber-500 to-orange-500",
    title: "Assistant IA",
    desc: "Analysez les tendances, générez des rapports exportables, obtenez des recommandations.",
  },
  {
    icon: BarChart3,
    color: "from-rose-500 to-pink-500",
    title: "Rapports & exports",
    desc: "Exportez vos votes, classements et parcours en Markdown ou CSV en un clic.",
  },
  {
    icon: Download,
    color: "from-cyan-500 to-sky-500",
    title: "Multi-salons",
    desc: "Gérez plusieurs événements en parallèle. Chaque salon a son propre espace de votes.",
  },
];

const TESTIMONIALS = [
  {
    name: "Marie L.",
    role: "Directrice Achats, Groupe Sodexo",
    text: "On a réduit notre temps de préparation de 3 heures à 20 minutes. L'IA nous donne exactement les insights qu'on cherchait.",
    stars: 5,
  },
  {
    name: "Thomas R.",
    role: "Chef de projet, Elior",
    text: "La vue équipe est révolutionnaire. Tout le monde vote de son côté et on voit le consensus en temps réel.",
    stars: 5,
  },
  {
    name: "Sophie M.",
    role: "Responsable Innovation, Compass Group",
    text: "Le parcours optimisé nous a fait gagner 2 heures sur le salon. On ne rate plus aucun stand prioritaire.",
    stars: 5,
  },
];

const FAQ = [
  {
    q: "SalonSwipe fonctionne-t-il sur mobile ?",
    a: "Oui, SalonSwipe est conçu mobile-first. L'interface swipe est optimisée pour les smartphones, idéale pour préparer votre visite depuis n'importe où.",
  },
  {
    q: "Combien de membres peut avoir une équipe ?",
    a: "Il n'y a pas de limite. Invitez tous vos collègues via un lien unique. Chacun vote de son côté, les résultats sont consolidés automatiquement.",
  },
  {
    q: "Les données sont-elles sécurisées ?",
    a: "Oui. Chaque utilisateur ne voit que ses propres votes et ceux de son équipe. Les données sont stockées de manière sécurisée et ne sont jamais partagées entre organisations.",
  },
  {
    q: "Peut-on utiliser SalonSwipe pour plusieurs salons ?",
    a: "Absolument. Chaque salon est un espace indépendant avec ses propres exposants, votes et classements.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left gap-4"
      >
        <span className="font-semibold text-white text-sm md:text-base">{q}</span>
        <ChevronDown className={`w-5 h-5 text-blue-400 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <p className="pb-5 text-sm text-slate-400 leading-relaxed">{a}</p>
      )}
    </div>
  );
}

export default function Landing() {
  const [, navigate] = useLocation();

  const handleLogin = () => {
    window.location.href = getLoginUrl();
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white overflow-x-hidden">
      {/* ─── NAV ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0f1e]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-lg tracking-tight">
              Salon<span className="text-blue-400">Swipe</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogin}
              className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block"
            >
              Se connecter
            </button>
            <button
              onClick={handleLogin}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
            >
              Commencer
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />
          <div className="absolute top-40 left-1/4 w-[300px] h-[300px] bg-violet-600/15 rounded-full blur-[80px]" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Préparez vos salons professionnels
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6"
          >
            Swipez les exposants.{" "}
            <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-violet-400 bg-clip-text text-transparent">
              Visitez les meilleurs.
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            SalonSwipe transforme la préparation de vos salons professionnels. Évaluez les exposants en équipe, générez un parcours optimisé et obtenez des insights IA — en quelques minutes.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={handleLogin}
              className="flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base shadow-lg shadow-blue-600/30 transition-all hover:scale-105 active:scale-95"
            >
              Accéder à la plateforme
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
              className="flex items-center gap-2 px-6 py-4 rounded-2xl border border-white/10 text-slate-300 hover:text-white hover:border-white/20 text-sm font-medium transition-all"
            >
              Découvrir les fonctionnalités
            </button>
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-6 mt-12 text-xs text-slate-500"
          >
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Gratuit pour commencer</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Sans carte bancaire</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Équipes illimitées</span>
            </div>
          </motion.div>
        </div>

        {/* App preview mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="relative max-w-xs mx-auto mt-16"
        >
          <div className="relative rounded-[2.5rem] bg-gradient-to-b from-slate-800 to-slate-900 border border-white/10 shadow-2xl shadow-blue-900/40 p-4 overflow-hidden">
            {/* Phone notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#0a0f1e] rounded-b-2xl z-10" />
            {/* Mock swipe card */}
            <div className="mt-4 rounded-2xl bg-gradient-to-br from-blue-900/60 to-slate-800 border border-white/10 p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xl">A</div>
                <div>
                  <p className="font-bold text-white text-sm">Adoria</p>
                  <p className="text-xs text-slate-400">Stand C39 · Tier A</p>
                  <div className="flex gap-1 mt-1">
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-medium">Food</span>
                    <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-medium">IA</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">Solution FoodTech N°1 pour la gestion des groupes de restauration...</p>
              <div className="flex justify-center gap-6 mt-5">
                <div className="w-12 h-12 rounded-full bg-red-500/20 border-2 border-red-500/40 flex items-center justify-center text-xl">✕</div>
                <div className="w-12 h-12 rounded-full bg-blue-500/20 border-2 border-blue-500/40 flex items-center justify-center text-xl">★</div>
                <div className="w-12 h-12 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center text-xl">♥</div>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-blue-500 to-blue-400" />
              </div>
              <span className="text-xs text-slate-500">42 restants</span>
            </div>
          </div>
          {/* Glow under phone */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-48 h-12 bg-blue-600/30 blur-2xl rounded-full" />
        </motion.div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">Fonctionnalités</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
              Tout ce qu'il vous faut pour{" "}
              <span className="text-blue-400">préparer un salon</span>
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              De l'évaluation des exposants à la génération du parcours, SalonSwipe couvre tout le workflow de préparation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group p-6 rounded-2xl bg-white/3 border border-white/8 hover:border-blue-500/30 hover:bg-white/5 transition-all"
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-24 px-4 bg-gradient-to-b from-transparent via-blue-950/20 to-transparent">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">Comment ça marche</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">
              Prêt en <span className="text-blue-400">3 étapes</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Créez votre équipe", desc: "Invitez vos collègues via un lien unique. Chacun vote depuis son téléphone." },
              { step: "02", title: "Swipez les exposants", desc: "Évaluez chaque exposant en quelques secondes. Like, Super Like ou Skip." },
              { step: "03", title: "Visitez les meilleurs", desc: "Générez votre parcours optimisé et exportez le rapport pour toute l'équipe." },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-black text-blue-400">{s.step}</span>
                </div>
                <h3 className="font-bold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">Témoignages</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">
              Ils préparent leurs salons{" "}
              <span className="text-blue-400">différemment</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-white/3 border border-white/8"
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-300 leading-relaxed mb-5">"{t.text}"</p>
                <div>
                  <p className="font-bold text-white text-sm">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-24 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">Questions fréquentes</h2>
          </div>
          {FAQ.map((item, i) => (
            <FaqItem key={i} q={item.q} a={item.a} />
          ))}
        </div>
      </section>

      {/* ─── CTA FINAL ─── */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative p-10 md:p-16 rounded-3xl bg-gradient-to-br from-blue-600/20 via-blue-800/10 to-violet-600/20 border border-blue-500/20 overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-blue-600/20 rounded-full blur-3xl" />
            </div>
            <div className="relative">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
                Prêt à transformer votre{" "}
                <span className="text-blue-400">prochain salon</span> ?
              </h2>
              <p className="text-slate-400 mb-8 max-w-lg mx-auto">
                Rejoignez les équipes qui préparent leurs salons professionnels avec SalonSwipe.
              </p>
              <button
                onClick={handleLogin}
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base shadow-lg shadow-blue-600/30 transition-all hover:scale-105 active:scale-95"
              >
                Commencer maintenant
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/5 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-black text-sm tracking-tight">
              Salon<span className="text-blue-400">Swipe</span>
            </span>
          </div>
          <p className="text-xs text-slate-600">© 2026 SalonSwipe. Tous droits réservés.</p>
          <button
            onClick={handleLogin}
            className="text-xs text-slate-500 hover:text-blue-400 transition-colors"
          >
            Se connecter →
          </button>
        </div>
      </footer>
    </div>
  );
}
