import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Heart, Star, X, Users, BarChart3, ChevronLeft, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { getLoginUrl } from "@/const";

interface TeamViewProps {
  eventId?: number;
  eventName?: string;
  onBack: () => void;
}

const VOTE_CONFIG = {
  like: { label: "Like", icon: Heart, color: "text-green-600", bg: "bg-green-50 border-green-200" },
  superlike: { label: "Super Like", icon: Star, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
  dislike: { label: "Pas intéressé", icon: X, color: "text-red-600", bg: "bg-red-50 border-red-200" },
};

const TIER_COLORS: Record<string, string> = {
  A: "tier-a", B: "tier-b", C: "tier-c", D: "tier-d",
};

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

  const filtered = (teamVotes ?? []).filter(v =>
    filter === "all" ? true : v.voteType === filter
  );

  // Group by exhibitor for consensus view
  const byExhibitor = filtered.reduce<Record<number, { exhibitor: any; votes: any[] }>>((acc, v) => {
    if (!v.exhibitor) return acc;
    if (!acc[v.exhibitorId]) acc[v.exhibitorId] = { exhibitor: v.exhibitor, votes: [] };
    acc[v.exhibitorId].votes.push(v);
    return acc;
  }, {});

  const grouped = Object.values(byExhibitor).sort((a, b) => {
    // Sort: superlikes first, then likes, then by count
    const scoreA = a.votes.filter(v => v.voteType === "superlike").length * 3 + a.votes.filter(v => v.voteType === "like").length;
    const scoreB = b.votes.filter(v => v.voteType === "superlike").length * 3 + b.votes.filter(v => v.voteType === "like").length;
    return scoreB - scoreA;
  });

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

        {/* Team members stats */}
        {stats?.byUser && stats.byUser.length > 0 && (
          <div className="px-4 pb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              <Users className="w-3.5 h-3.5 inline mr-1" />
              Membres de l'équipe
            </p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {stats.byUser.map(u => (
                <div key={u.userId} className="flex-shrink-0 bg-card border border-border rounded-xl p-3 min-w-[120px]">
                  <p className="text-xs font-bold truncate">{u.userName}</p>
                  <p className="text-xs text-muted-foreground mt-1">{u.total} votes</p>
                  <div className="flex gap-1.5 mt-1.5">
                    <span className="text-xs text-green-600">✅{u.likes}</span>
                    <span className="text-xs text-blue-600">⭐{u.superlikes}</span>
                    <span className="text-xs text-red-600">❌{u.dislikes}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
                {f === "all" ? `Tous (${teamVotes?.length ?? 0})` :
                 f === "superlike" ? `⭐ Super Likes (${stats?.superlikes ?? 0})` :
                 f === "like" ? `✅ Likes (${stats?.likes ?? 0})` :
                 `❌ Pas intéressé (${stats?.dislikes ?? 0})`}
              </button>
            ))}
          </div>
        </div>

        {/* Votes list */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : grouped.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center px-8">
            <p className="text-4xl mb-3">🗳️</p>
            <p className="font-bold text-foreground">Aucun vote pour l'instant</p>
            <p className="text-sm text-muted-foreground mt-1">Les votes de l'équipe apparaîtront ici.</p>
          </div>
        ) : (
          <div className="px-4 pb-6 space-y-3">
            {grouped.map(({ exhibitor, votes: exVotes }, i) => {
              const superlikeCount = exVotes.filter(v => v.voteType === "superlike").length;
              const likeCount = exVotes.filter(v => v.voteType === "like").length;
              const dislikeCount = exVotes.filter(v => v.voteType === "dislike").length;

              return (
                <motion.div
                  key={exhibitor.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-card border border-border rounded-2xl p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-md font-bold ${TIER_COLORS[exhibitor.tier] || "tier-c"}`}>
                          {exhibitor.tier}
                        </span>
                        <h3 className="font-bold text-sm truncate">{exhibitor.name}</h3>
                      </div>
                      {exhibitor.stand && (
                        <p className="text-xs text-muted-foreground mb-2">Stand {exhibitor.stand}</p>
                      )}
                      <p className="text-xs text-foreground/70 line-clamp-2 leading-relaxed">
                        {exhibitor.shortDescription || exhibitor.description || ""}
                      </p>
                    </div>

                    {exhibitor.website && (
                      <button
                        onClick={() => setSiteUrl(exhibitor.website)}
                        className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors"
                      >
                        <Globe className="w-4 h-4 text-muted-foreground" />
                      </button>
                    )}
                  </div>

                  {/* Vote counts */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                    {superlikeCount > 0 && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-1 rounded-full">
                        <Star className="w-3 h-3 fill-blue-600" /> {superlikeCount}
                      </span>
                    )}
                    {likeCount > 0 && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-2 py-1 rounded-full">
                        <Heart className="w-3 h-3 fill-green-600" /> {likeCount}
                      </span>
                    )}
                    {dislikeCount > 0 && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded-full">
                        <X className="w-3 h-3" strokeWidth={3} /> {dislikeCount}
                      </span>
                    )}
                    {/* Voter names */}
                    <div className="ml-auto flex gap-1">
                      {exVotes.slice(0, 3).map((v, vi) => (
                        <span key={vi} className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">
                          {v.user?.name?.split(" ")[0] ?? "?"}
                        </span>
                      ))}
                      {exVotes.length > 3 && (
                        <span className="text-xs text-muted-foreground">+{exVotes.length - 3}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Site embed modal */}
      {siteUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 flex flex-col">
          <div className="flex items-center justify-between p-3 bg-card border-b border-border">
            <p className="text-sm font-medium truncate flex-1 mr-2">{siteUrl}</p>
            <Button size="sm" variant="ghost" onClick={() => setSiteUrl(null)}>✕</Button>
          </div>
          <iframe src={siteUrl} className="flex-1 w-full bg-white" title="Site exposant" sandbox="allow-scripts allow-same-origin allow-popups" />
        </div>
      )}
    </div>
  );
}
