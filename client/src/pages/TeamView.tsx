import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2, Heart, Star, X, Users, ChevronLeft, Globe, Trophy, Medal, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getLoginUrl } from "@/const";

interface TeamViewProps {
  eventId?: number;
  eventName?: string;
  onBack: () => void;
}

const TIER_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
  A: { bg: "bg-amber-50",  text: "text-amber-800",  border: "border-amber-300" },
  B: { bg: "bg-green-50",  text: "text-green-800",  border: "border-green-300" },
  C: { bg: "bg-blue-50",   text: "text-blue-800",   border: "border-blue-300" },
  D: { bg: "bg-gray-50",   text: "text-gray-600",   border: "border-gray-300" },
};

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="w-4 h-4 text-amber-500" />;
  if (rank === 2) return <Medal className="w-4 h-4 text-slate-400" />;
  if (rank === 3) return <Award className="w-4 h-4 text-amber-700" />;
  return <span className="w-4 h-4 flex items-center justify-center text-xs font-bold text-muted-foreground">#{rank}</span>;
}

export default function TeamView({ eventId, eventName, onBack }: TeamViewProps) {
  const { isAuthenticated } = useAuth();
  const [filter, setFilter] = useState<"all" | "like" | "superlike" | "dislike">("all");
  const [siteUrl, setSiteUrl] = useState<string | null>(null);

  const { data: teamVotes, isLoading } = trpc.votes.teamVotes.useQuery(
    { eventId },
    { enabled: isAuthenticated }
  );

  const { data: stats } = trpc.votes.stats.useQuery(
    { eventId },
    { enabled: isAuthenticated }
  );

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
        <div className="text-5xl">🔐</div>
        <h2 className="text-xl font-bold">Connexion requise</h2>
        <Button onClick={() => window.location.href = getLoginUrl()}>Se connecter</Button>
      </div>
    );
  }

  // Grouper par exposant
  const byExhibitor = (teamVotes ?? []).reduce<Record<number, { exhibitor: any; votes: any[] }>>((acc, v) => {
    if (!v.exhibitor) return acc;
    if (!acc[v.exhibitorId]) acc[v.exhibitorId] = { exhibitor: v.exhibitor, votes: [] };
    acc[v.exhibitorId].votes.push(v);
    return acc;
  }, {});

  // Score pondéré : superlike = 3pts, like = 1pt, dislike = -1pt
  const allGrouped = Object.values(byExhibitor).map(g => ({
    ...g,
    score: g.votes.reduce((s, v) =>
      s + (v.voteType === "superlike" ? 3 : v.voteType === "like" ? 1 : -1), 0),
    superlikeCount: g.votes.filter(v => v.voteType === "superlike").length,
    likeCount: g.votes.filter(v => v.voteType === "like").length,
    dislikeCount: g.votes.filter(v => v.voteType === "dislike").length,
  })).sort((a, b) => b.score - a.score);

  // Filtrer selon l'onglet actif
  const filtered = filter === "all"
    ? allGrouped
    : allGrouped.filter(g => g.votes.some(v => v.voteType === filter));

  const filterCounts = {
    all: allGrouped.length,
    superlike: allGrouped.filter(g => g.superlikeCount > 0).length,
    like: allGrouped.filter(g => g.likeCount > 0).length,
    dislike: allGrouped.filter(g => g.dislikeCount > 0).length,
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-4 h-4" />
          Retour
        </button>
        <div className="text-center">
          <p className="text-sm font-bold">Vue Équipe</p>
          {eventName && <p className="text-xs text-muted-foreground">{eventName}</p>}
        </div>
        <div className="w-16" />
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Stats banner */}
        {stats && (
          <div className="p-4 grid grid-cols-3 gap-2">
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-green-600">{stats.likes}</p>
              <p className="text-xs text-green-700 font-medium">Likes</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-blue-600">{stats.superlikes}</p>
              <p className="text-xs text-blue-700 font-medium">Super Likes</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-red-600">{stats.dislikes}</p>
              <p className="text-xs text-red-700 font-medium">Pas intéressé</p>
            </div>
          </div>
        )}

        {/* Team members */}
        {stats?.byUser && stats.byUser.length > 0 && (
          <div className="px-4 pb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              Membres de l'équipe
            </p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {stats.byUser.map(u => (
                <div key={u.userId} className="flex-shrink-0 bg-card border border-border rounded-xl p-3 min-w-[130px]">
                  <p className="text-xs font-bold truncate">{u.userName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{u.total} votes</p>
                  <div className="flex gap-2 mt-1.5">
                    <span className="text-xs text-green-600 font-semibold">✅ {u.likes}</span>
                    <span className="text-xs text-blue-600 font-semibold">⭐ {u.superlikes}</span>
                    <span className="text-xs text-red-600 font-semibold">❌ {u.dislikes}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Classement label */}
        <div className="px-4 pb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            Classement (⭐×3 + ✅×1 − ❌×1)
          </p>
        </div>

        {/* Filter tabs */}
        <div className="px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {(["all", "superlike", "like", "dislike"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  filter === f
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary/50"
                }`}
              >
                {f === "all"       ? `Tous (${filterCounts.all})` :
                 f === "superlike" ? `⭐ Super Likes (${filterCounts.superlike})` :
                 f === "like"      ? `✅ Likes (${filterCounts.like})` :
                                    `❌ Pas intéressé (${filterCounts.dislike})`}
              </button>
            ))}
          </div>
        </div>

        {/* Ranked list */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center px-8">
            <p className="text-4xl mb-3">🗳️</p>
            <p className="font-bold text-foreground">Aucun vote pour l'instant</p>
            <p className="text-sm text-muted-foreground mt-1">Les votes de l'équipe apparaîtront ici.</p>
          </div>
        ) : (
          <div className="px-4 pb-6 space-y-2">
            {filtered.map(({ exhibitor, votes: exVotes, score, superlikeCount, likeCount, dislikeCount }, i) => {
              const tier = TIER_CONFIG[exhibitor.tier] ?? TIER_CONFIG.C;
              const rank = allGrouped.findIndex(g => g.exhibitor.id === exhibitor.id) + 1;

              return (
                <motion.div
                  key={exhibitor.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.025 }}
                  className="bg-card border border-border rounded-2xl p-3.5 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    {/* Rank */}
                    <div className="flex-shrink-0 flex flex-col items-center gap-1 pt-0.5 w-8">
                      <RankIcon rank={rank} />
                      <span className="text-[10px] font-black text-muted-foreground leading-none">{score}pt</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${tier.bg} ${tier.text} ${tier.border}`}>
                          {exhibitor.tier}
                        </span>
                        <h3 className="font-bold text-sm truncate">{exhibitor.name}</h3>
                      </div>
                      {exhibitor.stand && (
                        <p className="text-xs text-muted-foreground mb-1">Stand {exhibitor.stand}</p>
                      )}
                      <p className="text-xs text-foreground/70 line-clamp-2 leading-relaxed">
                        {exhibitor.shortDescription || exhibitor.description || ""}
                      </p>

                      {/* Vote counts + voters */}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {superlikeCount > 0 && (
                          <span className="flex items-center gap-0.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                            <Star className="w-3 h-3 fill-blue-600" /> {superlikeCount}
                          </span>
                        )}
                        {likeCount > 0 && (
                          <span className="flex items-center gap-0.5 text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                            <Heart className="w-3 h-3 fill-green-600" /> {likeCount}
                          </span>
                        )}
                        {dislikeCount > 0 && (
                          <span className="flex items-center gap-0.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                            <X className="w-3 h-3" strokeWidth={3} /> {dislikeCount}
                          </span>
                        )}
                        <div className="ml-auto flex gap-1">
                          {exVotes.slice(0, 3).map((v: any, vi: number) => (
                            <span key={vi} className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">
                              {v.user?.name?.split(" ")[0] ?? "?"}
                            </span>
                          ))}
                          {exVotes.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">+{exVotes.length - 3}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Website */}
                    {exhibitor.website && (
                      <button
                        onClick={() => setSiteUrl(exhibitor.website)}
                        className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors"
                      >
                        <Globe className="w-4 h-4 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

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
