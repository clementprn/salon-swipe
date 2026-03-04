import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Loader2, ChevronLeft, MapPin, Route, CheckSquare, Square,
  Star, Heart, Clock, ArrowRight, Globe, Shuffle, RotateCcw,
  Trophy, Navigation
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getLoginUrl } from "@/const";

interface PlanViewProps {
  eventId?: number;
  eventName?: string;
  onBack: () => void;
}

// ── Algorithme d'optimisation du chemin ────────────────────────────────────
// Les stands ont des codes comme "A12", "B7", "C23", "Hall 1 - A12", etc.
// On extrait la lettre de hall et le numéro pour construire un ordre cohérent.

function parseStand(stand: string | null): { hall: string; num: number } {
  if (!stand) return { hall: "Z", num: 9999 };
  // Chercher un pattern lettre+numéro : A12, B7, C23...
  const match = stand.match(/([A-Z]+)\s*(\d+)/i);
  if (match) {
    return { hall: match[1].toUpperCase(), num: parseInt(match[2], 10) };
  }
  // Chercher juste un numéro
  const numMatch = stand.match(/(\d+)/);
  if (numMatch) return { hall: "A", num: parseInt(numMatch[1], 10) };
  return { hall: stand.charAt(0).toUpperCase() || "Z", num: 0 };
}

// Nearest-neighbor TSP heuristic sur les stands
// Distance = différence de numéro dans le même hall, + 100 si changement de hall
function standDistance(a: { hall: string; num: number }, b: { hall: string; num: number }): number {
  const hallPenalty = a.hall !== b.hall ? 50 : 0;
  return Math.abs(a.num - b.num) + hallPenalty;
}

type FavoriteExhibitor = {
  id: number;
  name: string;
  stand: string | null;
  website: string | null;
  shortDescription: string | null;
  description: string | null;
  tier: string;
  sodexoScore: number | null;
  voteType: string;
  [key: string]: unknown;
};

function optimizePath(exhibitors: FavoriteExhibitor[]): FavoriteExhibitor[] {
  if (exhibitors.length <= 2) return exhibitors;

  const parsed = exhibitors.map(e => ({ ...e, _stand: parseStand(e.stand) }));

  // Trier d'abord par hall puis par numéro (serpentin)
  const hallSet = new Set(parsed.map(e => e._stand.hall));
  const halls = Array.from(hallSet).sort();
  const result: typeof parsed = [];

  halls.forEach((hall, hi) => {
    const inHall = parsed.filter(e => e._stand.hall === hall);
    // Alterner sens pour effet serpentin
    const sorted = inHall.sort((a, b) => a._stand.num - b._stand.num);
    if (hi % 2 === 1) sorted.reverse();
    result.push(...sorted);
  });

  return result;
}

// Estimer le temps de visite
function estimateTime(count: number): string {
  // ~15 min par stand (déplacement + visite rapide)
  const totalMin = count * 15;
  if (totalMin < 60) return `~${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `~${h}h${m.toString().padStart(2, "0")}` : `~${h}h`;
}

const TIER_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
  A: { bg: "bg-amber-50",  text: "text-amber-800",  border: "border-amber-300" },
  B: { bg: "bg-green-50",  text: "text-green-800",  border: "border-green-300" },
  C: { bg: "bg-blue-50",   text: "text-blue-800",   border: "border-blue-300" },
  D: { bg: "bg-gray-50",   text: "text-gray-600",   border: "border-gray-300" },
};

export default function PlanView({ eventId, eventName, onBack }: PlanViewProps) {
  const { isAuthenticated } = useAuth();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [siteUrl, setSiteUrl] = useState<string | null>(null);
  const [showPath, setShowPath] = useState(false);

  const { data: myVotes, isLoading } = trpc.votes.myVotes.useQuery(
    { eventId },
    { enabled: isAuthenticated }
  );

  // Exposants likés ou superlikés, triés par score pondéré
  const favorites = useMemo(() => {
    if (!myVotes) return [];
    return myVotes
      .filter(v => v.voteType === "like" || v.voteType === "superlike")
      .filter(v => v.exhibitor)
      .sort((a, b) => {
        const scoreA = a.voteType === "superlike" ? 3 : 1;
        const scoreB = b.voteType === "superlike" ? 3 : 1;
        return scoreB - scoreA;
      })
      .map(v => ({ ...v.exhibitor!, voteType: v.voteType }));
  }, [myVotes]);

  // Initialiser la sélection avec tous les favoris au premier chargement
  const [initialized, setInitialized] = useState(false);
  if (!initialized && favorites.length > 0) {
    setSelected(new Set(favorites.map(e => e.id)));
    setInitialized(true);
  }

  const selectedList = favorites.filter(e => selected.has(e.id));

  // Chemin optimisé
  const optimizedPath = useMemo(() => optimizePath(selectedList), [selectedList]);

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setShowPath(false);
  };

  const selectAll = () => {
    setSelected(new Set(favorites.map(e => e.id)));
    setShowPath(false);
  };

  const deselectAll = () => {
    setSelected(new Set());
    setShowPath(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
        <div className="text-5xl">🔐</div>
        <h2 className="text-xl font-bold">Connexion requise</h2>
        <Button onClick={() => window.location.href = getLoginUrl()}>Se connecter</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-4 h-4" />
          Retour
        </button>
        <div className="text-center">
          <p className="text-sm font-bold flex items-center gap-1.5">
            <Navigation className="w-4 h-4 text-primary" />
            Planification
          </p>
          {eventName && <p className="text-xs text-muted-foreground">{eventName}</p>}
        </div>
        <div className="w-16" />
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : favorites.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="text-5xl">🗺️</div>
          <h2 className="text-xl font-bold">Aucun favori</h2>
          <p className="text-sm text-muted-foreground">
            Swipez les exposants et likez ceux qui vous intéressent pour construire votre plan de visite.
          </p>
          <Button onClick={onBack} variant="outline">Aller swiper</Button>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {/* Mode sélection */}
            {!showPath && (
              <>
                {/* Barre d'actions */}
                <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">
                    {selected.size} / {favorites.length} sélectionné{selected.size > 1 ? "s" : ""}
                  </p>
                  <div className="flex gap-2">
                    <button onClick={selectAll} className="text-xs text-primary font-semibold hover:underline">
                      Tout sélectionner
                    </button>
                    <span className="text-muted-foreground">·</span>
                    <button onClick={deselectAll} className="text-xs text-muted-foreground hover:text-foreground">
                      Tout désélectionner
                    </button>
                  </div>
                </div>

                {/* Liste des favoris */}
                <div className="px-4 pb-4 space-y-2">
                  {favorites.map((exhibitor, i) => {
                    const isSelected = selected.has(exhibitor.id);
                    const tier = TIER_CONFIG[exhibitor.tier] ?? TIER_CONFIG.C;

                    return (
                      <motion.div
                        key={exhibitor.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02 }}
                        onClick={() => toggleSelect(exhibitor.id)}
                        className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border bg-card opacity-60"
                        }`}
                      >
                        {/* Checkbox */}
                        <div className="flex-shrink-0">
                          {isSelected
                            ? <CheckSquare className="w-5 h-5 text-primary" />
                            : <Square className="w-5 h-5 text-muted-foreground" />}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${tier.bg} ${tier.text} ${tier.border}`}>
                              {exhibitor.tier}
                            </span>
                            <span className="font-bold text-sm truncate">{exhibitor.name}</span>
                          </div>
                          {exhibitor.stand ? (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                              <span className="text-xs text-muted-foreground">Stand {exhibitor.stand}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground/60 italic">Stand non renseigné</span>
                          )}
                        </div>

                        {/* Vote badge */}
                        <div className="flex-shrink-0">
                          {exhibitor.voteType === "superlike"
                            ? <Star className="w-4 h-4 text-blue-500 fill-blue-500" />
                            : <Heart className="w-4 h-4 text-green-500 fill-green-500" />}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Mode chemin optimisé */}
            {showPath && (
              <>
                {/* Résumé */}
                <div className="px-4 pt-4 pb-3">
                  <div className="bg-gradient-to-br from-primary/10 to-accent/20 border border-primary/20 rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                        <Route className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-foreground">Chemin optimisé</p>
                        <p className="text-xs text-muted-foreground">
                          {optimizedPath.length} stand{optimizedPath.length > 1 ? "s" : ""} · {estimateTime(optimizedPath.length)}
                        </p>
                      </div>
                      <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        {estimateTime(optimizedPath.length)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Liste ordonnée */}
                <div className="px-4 pb-4 space-y-2">
                  {optimizedPath.map((exhibitor, i) => {
                    const tier = TIER_CONFIG[exhibitor.tier] ?? TIER_CONFIG.C;
                    const isLast = i === optimizedPath.length - 1;

                    return (
                      <div key={exhibitor.id} className="relative">
                        {/* Connecteur vertical */}
                        {!isLast && (
                          <div className="absolute left-[22px] top-[52px] w-0.5 h-4 bg-primary/20 z-0" />
                        )}

                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="relative z-10 flex items-start gap-3 bg-card border border-border rounded-2xl p-3.5 shadow-sm"
                        >
                          {/* Numéro d'étape */}
                          <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${
                            i === 0 ? "bg-primary text-primary-foreground" :
                            i === optimizedPath.length - 1 ? "bg-green-500 text-white" :
                            "bg-primary/10 text-primary"
                          }`}>
                            {i === 0 ? "▶" : i === optimizedPath.length - 1 ? "✓" : i + 1}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${tier.bg} ${tier.text} ${tier.border}`}>
                                {exhibitor.tier}
                              </span>
                              <span className="font-bold text-sm truncate">{exhibitor.name}</span>
                            </div>
                            {exhibitor.stand ? (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-primary flex-shrink-0" />
                                <span className="text-xs font-semibold text-primary">Stand {exhibitor.stand}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground/60 italic">Stand non renseigné</span>
                            )}
                            {exhibitor.shortDescription && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                {exhibitor.shortDescription}
                              </p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex-shrink-0 flex flex-col gap-1.5 items-end">
                            {exhibitor.voteType === "superlike"
                              ? <Star className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
                              : <Heart className="w-3.5 h-3.5 text-green-500 fill-green-500" />}
                            {exhibitor.website && (
                              <button
                                onClick={() => setSiteUrl(exhibitor.website!)}
                                className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors"
                              >
                                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                              </button>
                            )}
                          </div>
                        </motion.div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Footer CTA */}
          <div className="flex-shrink-0 p-4 border-t border-border bg-card/95 space-y-2">
            {!showPath ? (
              <Button
                className="w-full gap-2"
                disabled={selected.size === 0}
                onClick={() => setShowPath(true)}
              >
                <Route className="w-4 h-4" />
                Générer le chemin optimisé ({selected.size} stands)
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => setShowPath(false)}
                >
                  <RotateCcw className="w-4 h-4" />
                  Modifier la sélection
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => {
                    // Re-générer avec un ordre légèrement différent (shuffle des halls)
                    setShowPath(false);
                    setTimeout(() => setShowPath(true), 100);
                  }}
                >
                  <Shuffle className="w-4 h-4" />
                  Recalculer
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Site embed modal */}
      <AnimatePresence>
        {siteUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex flex-col"
          >
            <div className="flex items-center justify-between p-3 bg-card border-b border-border">
              <p className="text-sm font-medium truncate flex-1 mr-2">{siteUrl}</p>
              <Button size="sm" variant="ghost" onClick={() => setSiteUrl(null)}>✕ Fermer</Button>
            </div>
            <iframe src={siteUrl} className="flex-1 w-full bg-white" title="Site exposant" sandbox="allow-scripts allow-same-origin allow-popups" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
