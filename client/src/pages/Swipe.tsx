import { useState, useCallback, useEffect, useRef } from "react";
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
  const [totalRemaining, setTotalRemaining] = useState<number | null>(null);
  const [lastVoted, setLastVoted] = useState<{ exhibitor: Exhibitor; voteType: string } | null>(null);
  const [siteUrl, setSiteUrl] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);
  const [serverConfirmedDone, setServerConfirmedDone] = useState(false);
  const initializedRef = useRef(false);
  const utils = trpc.useUtils();

  const { data, isLoading, refetch } = trpc.exhibitors.swipeQueue.useQuery(
    { eventId, batchSize: 10 },
    { enabled: isAuthenticated, staleTime: 0 }
  );

  // Initialiser la queue et le compteur total depuis le serveur
  useEffect(() => {
    if (!data) return;

    if (data.queue.length === 0 && initializedRef.current) {
      // Le serveur confirme qu'il n'y a plus rien
      setServerConfirmedDone(true);
      if (localQueue.length === 0) setIsDone(true);
      return;
    }

    if (data.queue.length > 0) {
      setLocalQueue(prev => {
        if (!initializedRef.current) {
          // Première initialisation
          initializedRef.current = true;
          setTotalRemaining(data.remaining);
          return data.queue as Exhibitor[];
        }
        // Merge : ajouter les nouveaux items non présents
        const existingIds = new Set(prev.map(e => e.id));
        const newItems = (data.queue as Exhibitor[]).filter(e => !existingIds.has(e.id));
        return newItems.length > 0 ? [...prev, ...newItems] : prev;
      });
      if (!initializedRef.current) {
        setTotalRemaining(data.remaining);
      }
      setIsDone(false);
    }
  }, [data]);

  const castVote = trpc.votes.cast.useMutation({
    onError: () => toast.error("Erreur lors du vote"),
  });

  const undoVote = trpc.votes.undo.useMutation({
    onSuccess: () => {
      toast.success("Vote annulé !");
      utils.votes.myVotes.invalidate();
      utils.votes.stats.invalidate();
    },
  });

  const handleVote = useCallback(async (voteType: "like" | "superlike" | "dislike") => {
    if (localQueue.length === 0) return;
    const current = localQueue[0];
    setLastVoted({ exhibitor: current, voteType });

    // Optimistic update : retirer de la queue locale
    setLocalQueue(prev => {
      const next = prev.slice(1);
      // N'afficher "tout vu" que si le serveur a confirmé qu'il n'y a plus rien
      if (next.length === 0 && serverConfirmedDone) setIsDone(true);
      return next;
    });
    setTotalRemaining(prev => (prev !== null ? Math.max(0, prev - 1) : null));

    try {
      await castVote.mutateAsync({ exhibitorId: current.id, eventId, voteType });
      utils.votes.myVotes.invalidate();
      utils.votes.stats.invalidate();

      // Refetch si la queue locale est presque vide
      setLocalQueue(prev => {
        if (prev.length <= 3) {
          refetch().then(res => {
            if (res.data?.queue.length === 0 && prev.length <= 1) {
              setServerConfirmedDone(true);
              if (prev.length === 0) setIsDone(true);
            }
          });
        }
        return prev;
      });
    } catch {
      // Rollback
      setLocalQueue(prev => [current, ...prev]);
      setTotalRemaining(prev => (prev !== null ? prev + 1 : null));
      setIsDone(false);
    }
  }, [localQueue, eventId, castVote, utils, refetch]);

  const handleUndo = useCallback(async () => {
    if (!lastVoted) return;
    try {
      await undoVote.mutateAsync({ exhibitorId: lastVoted.exhibitor.id });
      setLocalQueue(prev => [lastVoted.exhibitor, ...prev]);
      setTotalRemaining(prev => (prev !== null ? prev + 1 : null));
      setIsDone(false);
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

  if (isLoading && !initializedRef.current) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Afficher "tout vu" seulement si le serveur confirme ET la queue locale est vide
  if ((isDone || serverConfirmedDone) && localQueue.length === 0) {
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

  // Compteur : utiliser totalRemaining (du serveur) ou localQueue.length comme fallback
  const displayRemaining = totalRemaining !== null ? totalRemaining : localQueue.length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Retour
        </button>
        <div className="text-center">
          <p className="text-xs font-semibold text-muted-foreground truncate max-w-[140px]">{eventName}</p>
          <p className="text-xs text-muted-foreground font-medium">
            {displayRemaining} exposant{displayRemaining > 1 ? "s" : ""} restant{displayRemaining > 1 ? "s" : ""}
          </p>
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
      {totalRemaining !== null && data?.remaining !== undefined && (
        <div className="flex-shrink-0 h-1 bg-muted">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{
              width: `${Math.max(2, Math.round(
                ((data.remaining - totalRemaining) / Math.max(data.remaining, 1)) * 100
              ))}%`
            }}
            transition={{ duration: 0.4 }}
          />
        </div>
      )}

      {/* Card stack */}
      <div className="flex-1 relative p-4 pb-2 min-h-0">
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
