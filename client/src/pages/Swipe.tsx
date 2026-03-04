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
  const { isAuthenticated } = useAuth();
  const [localQueue, setLocalQueue] = useState<Exhibitor[]>([]);
  // totalSeen : nombre d'exposants déjà vus (pour la barre de progression)
  const [totalSeen, setTotalSeen] = useState(0);
  // totalForEvent : nombre total d'exposants de l'event (initialisé au premier chargement)
  const [totalForEvent, setTotalForEvent] = useState<number | null>(null);
  const [lastVoted, setLastVoted] = useState<{ exhibitor: Exhibitor; voteType: string } | null>(null);
  const [siteUrl, setSiteUrl] = useState<string | null>(null);

  // isDone est UNIQUEMENT contrôlé par le serveur :
  // true seulement si le serveur renvoie queue vide ET remaining = 0
  const [isDone, setIsDone] = useState(false);

  // Évite de déclencher isDone avant que la queue soit initialisée
  const hasInitialized = useRef(false);
  // Évite de refetch en boucle
  const isFetching = useRef(false);

  const utils = trpc.useUtils();

  const { data, isLoading, refetch } = trpc.exhibitors.swipeQueue.useQuery(
    { eventId, batchSize: 10 },
    {
      enabled: isAuthenticated,
      staleTime: 0,
      // Ne pas refetch automatiquement en arrière-plan
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    }
  );

  // Initialiser / mettre à jour la queue depuis le serveur
  useEffect(() => {
    if (!data) return;

    isFetching.current = false;

    if (!hasInitialized.current) {
      // Premier chargement
      hasInitialized.current = true;

      if (data.queue.length === 0 && data.remaining === 0) {
        // Le serveur confirme dès le départ que tout est vu
        setIsDone(true);
        return;
      }

      // Initialiser le total pour la barre de progression
      // remaining = exposants non encore vus, donc total = remaining + déjà vus
      // On ne connaît pas les "déjà vus" au départ, on utilise remaining comme référence
      setTotalForEvent(data.remaining);
      setLocalQueue(data.queue as Exhibitor[]);
      return;
    }

    // Rechargement suite à refetch
    if (data.queue.length === 0 && data.remaining === 0) {
      // Serveur confirme : tout est vu
      setLocalQueue(prev => {
        if (prev.length === 0) setIsDone(true);
        return prev;
      });
      return;
    }

    if (data.queue.length > 0) {
      setLocalQueue(prev => {
        const existingIds = new Set(prev.map(e => e.id));
        const newItems = (data.queue as Exhibitor[]).filter(e => !existingIds.has(e.id));
        return newItems.length > 0 ? [...prev, ...newItems] : prev;
      });
    }
  }, [data]);

  const castVote = trpc.votes.cast.useMutation({
    onError: (_err, _vars, context: any) => {
      toast.error("Erreur lors du vote");
      // Rollback
      if (context?.rollback) context.rollback();
    },
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

    // Retirer de la queue locale (optimistic)
    setLocalQueue(prev => prev.slice(1));
    setTotalSeen(prev => prev + 1);

    try {
      await castVote.mutateAsync({ exhibitorId: current.id, eventId, voteType });
      utils.votes.myVotes.invalidate();
      utils.votes.stats.invalidate();

      // Refetch si la queue locale est presque vide (≤ 3 items)
      setLocalQueue(prev => {
        if (prev.length <= 3 && !isFetching.current) {
          isFetching.current = true;
          refetch().then(res => {
            if (res.data?.queue.length === 0 && res.data?.remaining === 0) {
              // Attendre que la queue locale soit vide pour afficher "tout vu"
              setLocalQueue(current => {
                if (current.length === 0) setIsDone(true);
                return current;
              });
            }
          });
        }
        return prev;
      });
    } catch {
      // Rollback optimistic
      setLocalQueue(prev => [current, ...prev]);
      setTotalSeen(prev => Math.max(0, prev - 1));
    }
  }, [localQueue, eventId, castVote, utils, refetch]);

  // Quand la queue locale se vide, vérifier auprès du serveur
  useEffect(() => {
    if (!hasInitialized.current) return;
    if (localQueue.length === 0 && !isFetching.current) {
      isFetching.current = true;
      refetch().then(res => {
        isFetching.current = false;
        if (res.data?.queue.length === 0 && res.data?.remaining === 0) {
          setIsDone(true);
        } else if (res.data && res.data.queue.length > 0) {
          // Il reste des exposants
          setLocalQueue(res.data.queue as Exhibitor[]);
        }
      });
    }
  }, [localQueue.length, refetch]);

  const handleUndo = useCallback(async () => {
    if (!lastVoted) return;
    try {
      await undoVote.mutateAsync({ exhibitorId: lastVoted.exhibitor.id });
      setLocalQueue(prev => [lastVoted.exhibitor, ...prev]);
      setTotalSeen(prev => Math.max(0, prev - 1));
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

  if (isLoading && !hasInitialized.current) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Afficher "tout vu" UNIQUEMENT si le serveur a confirmé remaining = 0
  if (isDone && localQueue.length === 0) {
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

  // Compteur : nombre restant = total - vus
  const displayRemaining = totalForEvent !== null
    ? Math.max(0, totalForEvent - totalSeen)
    : localQueue.length;

  // Progression : % de vus sur le total
  const progressPct = totalForEvent && totalForEvent > 0
    ? Math.min(100, Math.round((totalSeen / totalForEvent) * 100))
    : 0;

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
            {displayRemaining} exposant{displayRemaining !== 1 ? "s" : ""} restant{displayRemaining !== 1 ? "s" : ""}
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
      <div className="flex-shrink-0 h-1 bg-muted">
        <motion.div
          className="h-full bg-primary"
          animate={{ width: `${Math.max(progressPct > 0 ? 2 : 0, progressPct)}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

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
