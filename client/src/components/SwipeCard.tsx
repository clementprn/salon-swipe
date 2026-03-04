import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from "framer-motion";
import { useState } from "react";
import { ExternalLink, Globe, MapPin, Star, X, Heart, ChevronDown, ChevronUp } from "lucide-react";
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

const TIER_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  A: { label: "⭐ Incontournable", bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-300" },
  B: { label: "✅ Intéressant",    bg: "bg-green-50",  text: "text-green-800",  border: "border-green-300" },
  C: { label: "👀 À surveiller",   bg: "bg-blue-50",   text: "text-blue-800",   border: "border-blue-300" },
  D: { label: "⬇️ Faible intérêt", bg: "bg-gray-50",   text: "text-gray-600",   border: "border-gray-300" },
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

  const tier = TIER_CONFIG[exhibitor.tier] ?? TIER_CONFIG.C;
  const description = exhibitor.description || exhibitor.shortDescription || "";
  const isLongDesc = description.length > 180;

  const handleDragEnd = async (_: unknown, info: PanInfo) => {
    const { offset, velocity } = info;
    const swipeX = Math.abs(offset.x) > SWIPE_THRESHOLD || Math.abs(velocity.x) > 400;
    const swipeUp = offset.y < -SWIPE_THRESHOLD || velocity.y < -400;

    if (swipeUp) {
      await controls.start({ y: -700, opacity: 0, transition: { duration: 0.3 } });
      onVote("superlike");
    } else if (swipeX && offset.x > 0) {
      await controls.start({ x: 700, opacity: 0, rotate: 20, transition: { duration: 0.3 } });
      onVote("like");
    } else if (swipeX && offset.x < 0) {
      await controls.start({ x: -700, opacity: 0, rotate: -20, transition: { duration: 0.3 } });
      onVote("dislike");
    } else {
      controls.start({ x: 0, y: 0, rotate: 0, transition: { type: "spring", stiffness: 300, damping: 20 } });
    }
  };

  const handleButtonVote = async (type: VoteType) => {
    setVoteIndicator(type);
    await new Promise(r => setTimeout(r, 150));
    if (type === "like") {
      await controls.start({ x: 700, opacity: 0, rotate: 20, transition: { duration: 0.35 } });
    } else if (type === "dislike") {
      await controls.start({ x: -700, opacity: 0, rotate: -20, transition: { duration: 0.35 } });
    } else {
      await controls.start({ y: -700, opacity: 0, transition: { duration: 0.35 } });
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
      {/* Vote overlays */}
      <motion.div
        className="absolute top-6 left-5 z-30 bg-green-500 text-white font-black text-xl px-4 py-2 rounded-xl rotate-[-15deg] border-4 border-white shadow-lg pointer-events-none"
        style={{ opacity: likeOpacity }}
      >
        LIKE ✅
      </motion.div>
      <motion.div
        className="absolute top-6 right-5 z-30 bg-red-500 text-white font-black text-xl px-4 py-2 rounded-xl rotate-[15deg] border-4 border-white shadow-lg pointer-events-none"
        style={{ opacity: dislikeOpacity }}
      >
        NOPE ❌
      </motion.div>
      <motion.div
        className="absolute top-6 left-1/2 -translate-x-1/2 z-30 bg-blue-500 text-white font-black text-xl px-4 py-2 rounded-xl border-4 border-white shadow-lg pointer-events-none"
        style={{ opacity: superlikeOpacity }}
      >
        SUPER ⭐
      </motion.div>

      {/* Card container */}
      <div
        className={`h-full rounded-2xl bg-card shadow-xl overflow-hidden flex flex-col border-2 ${
          voteIndicator === "like" ? "border-green-400" :
          voteIndicator === "superlike" ? "border-blue-400" :
          voteIndicator === "dislike" ? "border-red-400" : "border-border"
        }`}
      >
        {/* ── HEADER (fixed height) ── */}
        <div className="flex-shrink-0 relative bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 px-4 pt-4 pb-3">
          {/* Tier badge */}
          <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${tier.bg} ${tier.text} ${tier.border}`}>
            {tier.label}
          </div>

          {/* Company name + stand */}
          <div className="mt-2 flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-black text-foreground leading-tight truncate">{exhibitor.name}</h2>
              {exhibitor.stand && (
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs text-muted-foreground">Stand {exhibitor.stand}</span>
                </div>
              )}
            </div>

            {/* Score Sodexo */}
            {exhibitor.sodexoScore != null && (
              <div className="flex-shrink-0 flex flex-col items-center bg-background/80 backdrop-blur-sm px-2.5 py-1.5 rounded-xl border border-border">
                <span className="text-base font-black text-foreground leading-none">{exhibitor.sodexoScore}</span>
                <span className="text-[10px] text-muted-foreground font-medium leading-none mt-0.5">/ 100</span>
                <span className="text-[9px] text-amber-600 font-semibold uppercase tracking-wide mt-0.5">Sodexo</span>
              </div>
            )}
          </div>

          {/* Thematic tags — fixed row, no wrap to avoid overflow */}
          {tags.length > 0 && (
            <div className="mt-2 flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
              {tags.map((tag, i) => (
                <span
                  key={i}
                  className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium border border-primary/20 whitespace-nowrap"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── BODY (scrollable) ── */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-3 flex flex-col gap-3 min-h-0">
          {/* Description */}
          {description && (
            <div>
              <p className={`text-sm text-foreground/80 leading-relaxed ${!expanded && isLongDesc ? "line-clamp-4" : ""}`}>
                {description}
              </p>
              {isLongDesc && (
                <button
                  className="mt-1 text-xs text-primary font-semibold flex items-center gap-0.5"
                  onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                >
                  {expanded
                    ? <><ChevronUp className="w-3 h-3" /> Réduire</>
                    : <><ChevronDown className="w-3 h-3" /> Lire la suite</>}
                </button>
              )}
            </div>
          )}

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

        {/* ── VOTE BUTTONS (fixed footer) ── */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-border bg-card/95">
          <div className="flex items-center justify-between gap-3">
            {/* Dislike */}
            <button
              className="w-14 h-14 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center shadow-md active:scale-90 transition-transform hover:bg-red-100 hover:border-red-300"
              onClick={() => handleButtonVote("dislike")}
            >
              <X className="w-6 h-6 text-red-500" strokeWidth={3} />
            </button>

            {/* Super Like */}
            <button
              className="w-12 h-12 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center shadow-md active:scale-90 transition-transform hover:bg-blue-100 hover:border-blue-300"
              onClick={() => handleButtonVote("superlike")}
            >
              <Star className="w-5 h-5 text-blue-500 fill-blue-500" />
            </button>

            {/* Like */}
            <button
              className="w-14 h-14 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center shadow-md active:scale-90 transition-transform hover:bg-green-100 hover:border-green-300"
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
