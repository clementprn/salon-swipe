import { useState, useCallback, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import SwipeCard, { Exhibitor } from "@/components/SwipeCard";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw, CheckCircle2, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { getLoginUrl } from "@/const";

interface SwipePageProps {
  eventId: number;
  eventName: string;
  eventColor: string;
  onBack: () => void;
}

export default function SwipePage({ eventId, eventName, eventColor, onBack }: SwipePageProps) {
  const { user, isAuthenticated } = useAuth();
  const [localQueue, setLocalQueue] = useState<Exhibitor[]>([]);
  const [lastVoted, setLastVoted] = useState<{ exhibitor: Exhibitor; voteType: string } | null>(null);
  const [siteUrl, setSiteUrl] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);
  const utils = trpc.useUtils();

  const { data, isLoading, refetch } = trpc.exhibitors.swipeQueue.useQuery(
    { eventId, batchSize: 8 },
    { enabled: isAuthenticated }
  );

  // Sync queue when data arrives
  useEffect(() => {
    if (data?.queue && data.queue.length > 0) {
      setLocalQueue(prev => {
        // Merge: add new items not already in local queue
        const existingIds = new Set(prev.map(e => e.id));
        const newItems = (data.queue as Exhibitor[]).filter(e => !existingIds.has(e.id));
        return prev.length === 0 ? (data.queue as Exhibitor[]) : [...prev, ...newItems];
      });
      setIsDone(false);
    } else if (data && data.queue.length === 0) {
      setIsDone(true);
    }
  }, [data]);

  const castVote = trpc.votes.cast.useMutation({
    onError: () => toast.error("Erreur lors du vote"),
  });

  const undoVote = trpc.votes.undo.useMutation({
    onSuccess: () => {
      toast.success("Vote annulé !");
      utils.exhibitors.swipeQueue.invalidate();
      utils.votes.myVotes.invalidate();
      utils.votes.stats.invalidate();
    },
  });

  const handleVote = useCallback(async (voteType: "like" | "superlike" | "dislike") => {
    if (localQueue.length === 0) return;
    const current = localQueue[0];
    setLastVoted({ exhibitor: current, voteType });

    // Optimistic update
    setLocalQueue(prev => prev.slice(1));

    try {
      await castVote.mutateAsync({ exhibitorId: current.id, eventId, voteType });
      utils.votes.myVotes.invalidate();
      utils.votes.stats.invalidate();

      // Refetch si la queue est presque vide
      if (localQueue.length <= 2) {
        refetch();
      }
    } catch {
      // Rollback
      setLocalQueue(prev => [current, ...prev]);
    }
  }, [localQueue, eventId, castVote, utils, refetch]);

  const handleUndo = useCallback(async () => {
    if (!lastVoted) return;
    try {
      await undoVote.mutateAsync({ exhibitorId: lastVoted.exhibitor.id });
      setLocalQueue(prev => [lastVoted.exhibitor, ...prev]);
      setLastVoted(null);
    } catch {
      toast.error("Impossible d'annuler");
    }
  }, [lastVoted, undoVote]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center">
        <div className="text-5xl">🔐</div>
        <h2 className="text-xl font-bold">Connexion requise</h2>
        <p className="text-muted-foreground text-sm">Connectez-vous pour voter et synchroniser vos votes avec l'équipe.</p>
        <Button onClick={() => window.location.href = getLoginUrl()}>Se connecter</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isDone || localQueue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
          <CheckCircle2 className="w-20 h-20 text-green-500" />
        </motion.div>
        <h2 className="text-2xl font-black">Tous les exposants vus !</h2>
        <p className="text-muted-foreground text-sm">Vous avez évalué tous les exposants de {eventName}.</p>
        <Button onClick={onBack} variant="outline">Retour aux événements</Button>
      </div>
    );
  }

  const remaining = data?.remaining ?? localQueue.length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Retour
        </button>
        <div className="text-center">
          <p className="text-xs font-semibold text-muted-foreground">{eventName}</p>
          <p className="text-xs text-muted-foreground">{remaining} restant{remaining > 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={handleUndo}
          disabled={!lastVoted || undoVote.isPending}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Annuler
        </button>
      </div>

      {/* Progress bar */}
      <div className="flex-shrink-0 h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${Math.max(0, 100 - (remaining / Math.max(remaining + (data?.queue?.length ?? 0), 1)) * 100)}%` }}
        />
      </div>

      {/* Card stack */}
      <div className="flex-1 relative p-4 pb-2">
        <div className="relative h-full max-w-sm mx-auto">
          <AnimatePresence>
            {localQueue.slice(0, 3).map((exhibitor, index) => (
              <SwipeCard
                key={exhibitor.id}
                exhibitor={exhibitor}
                onVote={handleVote}
                onOpenSite={setSiteUrl}
                isTop={index === 0}
                stackIndex={index}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Hint */}
      <div className="flex-shrink-0 flex justify-center gap-6 pb-3 text-xs text-muted-foreground">
        <span>← Pas intéressé</span>
        <span>↑ Super like</span>
        <span>Intéressé →</span>
      </div>

      {/* Site embed modal */}
      <AnimatePresence>
        {siteUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col"
          >
            <div className="flex items-center justify-between p-3 bg-card border-b border-border">
              <p className="text-sm font-medium truncate flex-1 mr-2">{siteUrl}</p>
              <Button size="sm" variant="ghost" onClick={() => setSiteUrl(null)}>✕ Fermer</Button>
            </div>
            <iframe
              src={siteUrl}
              className="flex-1 w-full bg-white"
              title="Site exposant"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
