import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from "framer-motion";
import { useState, useRef } from "react";
import { ExternalLink, Globe, MapPin, Star, X, Heart, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type Exhibitor = {
  id: number;
  name: string;
  stand: string | null;
  website: string | null;
  description: string | null;
  shortDescription: string | null;
  sector: string | null;
  themes: string | null;
  tier: "A" | "B" | "C" | "D";
  sodexoScore: number | null;
  sodexoReason: string | null;
  thematicTags: string | null;
};

type VoteType = "like" | "superlike" | "dislike";

interface SwipeCardProps {
  exhibitor: Exhibitor;
  onVote: (voteType: VoteType) => void;
  onOpenSite: (url: string) => void;
  isTop: boolean;
  stackIndex: number;
}

const TIER_LABELS: Record<string, string> = {
  A: "⭐ Incontournable",
  B: "✅ Intéressant",
  C: "👀 À surveiller",
  D: "⬇️ Faible intérêt",
};

const SWIPE_THRESHOLD = 80;

export default function SwipeCard({ exhibitor, onVote, onOpenSite, isTop, stackIndex }: SwipeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [voteIndicator, setVoteIndicator] = useState<VoteType | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const controls = useAnimation();

  const rotate = useTransform(x, [-200, 0, 200], [-25, 0, 25]);
  const likeOpacity = useTransform(x, [20, 80], [0, 1]);
  const dislikeOpacity = useTransform(x, [-80, -20], [1, 0]);
  const superlikeOpacity = useTransform(y, [-80, -20], [1, 0]);

  const tags: string[] = (() => {
    try { return JSON.parse(exhibitor.thematicTags || "[]"); }
    catch { return exhibitor.thematicTags ? [exhibitor.thematicTags] : []; }
  })();

  const handleDragEnd = async (_: any, info: PanInfo) => {
    const { offset, velocity } = info;
    const swipeX = Math.abs(offset.x) > SWIPE_THRESHOLD || Math.abs(velocity.x) > 400;
    const swipeUp = offset.y < -SWIPE_THRESHOLD || velocity.y < -400;

    if (swipeUp) {
      await controls.start({ y: -600, opacity: 0, transition: { duration: 0.3 } });
      onVote("superlike");
    } else if (swipeX && offset.x > 0) {
      await controls.start({ x: 600, opacity: 0, rotate: 20, transition: { duration: 0.3 } });
      onVote("like");
    } else if (swipeX && offset.x < 0) {
      await controls.start({ x: -600, opacity: 0, rotate: -20, transition: { duration: 0.3 } });
      onVote("dislike");
    } else {
      controls.start({ x: 0, y: 0, rotate: 0, transition: { type: "spring", stiffness: 300, damping: 20 } });
    }
  };

  const handleButtonVote = async (type: VoteType) => {
    setVoteIndicator(type);
    await new Promise(r => setTimeout(r, 150));
    if (type === "like") {
      await controls.start({ x: 600, opacity: 0, rotate: 20, transition: { duration: 0.35 } });
    } else if (type === "dislike") {
      await controls.start({ x: -600, opacity: 0, rotate: -20, transition: { duration: 0.35 } });
    } else {
      await controls.start({ y: -600, opacity: 0, transition: { duration: 0.35 } });
    }
    onVote(type);
  };

  if (!isTop) {
    return (
      <div
        className={`absolute inset-0 rounded-2xl bg-card border border-border shadow-md ${
          stackIndex === 1 ? "card-stack-1" : "card-stack-2"
        }`}
        style={{ zIndex: 10 - stackIndex }}
      />
    );
  }

  return (
    <motion.div
      className="absolute inset-0 swipe-card"
      style={{ x, y, rotate, zIndex: 20 }}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      animate={controls}
      whileDrag={{ scale: 1.02 }}
    >
      {/* Vote indicators */}
      <motion.div
        className="absolute top-6 left-6 z-30 bg-green-500 text-white font-black text-2xl px-4 py-2 rounded-xl rotate-[-15deg] border-4 border-white shadow-lg"
        style={{ opacity: likeOpacity }}
      >
        LIKE ✅
      </motion.div>
      <motion.div
        className="absolute top-6 right-6 z-30 bg-red-500 text-white font-black text-2xl px-4 py-2 rounded-xl rotate-[15deg] border-4 border-white shadow-lg"
        style={{ opacity: dislikeOpacity }}
      >
        NOPE ❌
      </motion.div>
      <motion.div
        className="absolute top-6 left-1/2 -translate-x-1/2 z-30 bg-blue-500 text-white font-black text-2xl px-4 py-2 rounded-xl border-4 border-white shadow-lg"
        style={{ opacity: superlikeOpacity }}
      >
        SUPER ⭐
      </motion.div>

      {/* Card */}
      <div
        className={`h-full rounded-2xl bg-card border-2 shadow-xl overflow-hidden flex flex-col ${
          voteIndicator === "like" ? "vote-like-overlay" :
          voteIndicator === "superlike" ? "vote-superlike-overlay" :
          voteIndicator === "dislike" ? "vote-dislike-overlay" : "border-border"
        }`}
      >
        {/* Header gradient */}
        <div className="relative h-32 flex-shrink-0 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 flex items-center justify-center">
          {/* Tier badge */}
          <div className={`absolute top-3 left-3 tier-${exhibitor.tier.toLowerCase()} px-2.5 py-1 rounded-lg text-xs font-bold`}>
            {TIER_LABELS[exhibitor.tier]}
          </div>

          {/* Score */}
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-background/80 backdrop-blur-sm px-2.5 py-1 rounded-lg">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="text-xs font-bold text-foreground">{exhibitor.sodexoScore ?? 0}</span>
          </div>

          {/* Company initial */}
          <div className="w-20 h-20 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center shadow-inner">
            <span className="text-3xl font-black text-primary">
              {exhibitor.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-4 flex flex-col gap-3">
          {/* Name + stand */}
          <div>
            <h2 className="text-xl font-black text-foreground leading-tight">{exhibitor.name}</h2>
            {exhibitor.stand && (
              <div className="flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-medium">Stand {exhibitor.stand}</span>
              </div>
            )}
          </div>

          {/* Thematic tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag, i) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          <div className="flex-1">
            <p className={`text-sm text-foreground/80 leading-relaxed ${!expanded ? "line-clamp-4" : ""}`}>
              {exhibitor.description || exhibitor.shortDescription || "Aucune description disponible."}
            </p>
            {(exhibitor.description?.length ?? 0) > 200 && (
              <button
                className="mt-1 text-xs text-primary font-medium flex items-center gap-0.5"
                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
              >
                {expanded ? <><ChevronUp className="w-3 h-3" /> Moins</> : <><ChevronDown className="w-3 h-3" /> Plus</>}
              </button>
            )}
          </div>

          {/* Sodexo reason */}
          {exhibitor.sodexoReason && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs font-semibold text-amber-800 mb-1">💡 Pertinence Sodexo</p>
              <p className="text-xs text-amber-700 leading-relaxed line-clamp-3">{exhibitor.sodexoReason}</p>
            </div>
          )}

          {/* Website button */}
          {exhibitor.website && (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-xs"
              onClick={(e) => { e.stopPropagation(); onOpenSite(exhibitor.website!); }}
            >
              <Globe className="w-3.5 h-3.5" />
              Voir le site
              <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
            </Button>
          )}
        </div>

        {/* Vote buttons */}
        <div className="flex-shrink-0 p-4 pt-2 border-t border-border bg-card">
          <div className="flex items-center justify-between gap-3">
            {/* Dislike */}
            <button
              className="w-14 h-14 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center shadow-md active:scale-95 transition-transform hover:bg-red-100 hover:border-red-300"
              onClick={() => handleButtonVote("dislike")}
            >
              <X className="w-6 h-6 text-red-500" strokeWidth={3} />
            </button>

            {/* Super Like */}
            <button
              className="w-12 h-12 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center shadow-md active:scale-95 transition-transform hover:bg-blue-100 hover:border-blue-300"
              onClick={() => handleButtonVote("superlike")}
            >
              <Star className="w-5 h-5 text-blue-500 fill-blue-500" />
            </button>

            {/* Like */}
            <button
              className="w-14 h-14 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center shadow-md active:scale-95 transition-transform hover:bg-green-100 hover:border-green-300"
              onClick={() => handleButtonVote("like")}
            >
              <Heart className="w-6 h-6 text-green-500 fill-green-500" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
