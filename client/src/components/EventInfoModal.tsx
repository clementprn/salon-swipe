import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Calendar, ExternalLink, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EventInfo {
  id: number;
  name: string;
  location?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
  color?: string | null;
  logoUrl?: string | null;
}

interface EventInfoModalProps {
  event: EventInfo | null;
  onClose: () => void;
}

// Génère les liens de navigation GPS selon la plateforme
function getNavLinks(location: string) {
  const encoded = encodeURIComponent(location);
  return [
    {
      name: "Google Maps",
      icon: "🗺️",
      url: `https://www.google.com/maps/search/?api=1&query=${encoded}`,
      color: "bg-blue-50 border-blue-200 text-blue-700",
    },
    {
      name: "Waze",
      icon: "🚗",
      url: `https://waze.com/ul?q=${encoded}&navigate=yes`,
      color: "bg-sky-50 border-sky-200 text-sky-700",
    },
    {
      name: "Apple Plans",
      icon: "🍎",
      url: `maps://maps.apple.com/?q=${encoded}`,
      color: "bg-gray-50 border-gray-200 text-gray-700",
    },
    {
      name: "Maps (web)",
      icon: "📍",
      url: `https://maps.apple.com/?q=${encoded}`,
      color: "bg-orange-50 border-orange-200 text-orange-700",
    },
  ];
}

export default function EventInfoModal({ event, onClose }: EventInfoModalProps) {
  if (!event) return null;

  const navLinks = event.location ? getNavLinks(event.location) : [];

  return (
    <AnimatePresence>
      {event && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="w-full max-w-sm bg-card rounded-t-3xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
            </div>

            {/* Header coloré */}
            <div
              className="mx-4 rounded-2xl p-4 mb-4 text-white"
              style={{ backgroundColor: event.color ?? "#2C3E7A" }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-black leading-tight">{event.name}</h2>
                  {event.location && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <MapPin className="w-3.5 h-3.5 opacity-80 flex-shrink-0" />
                      <p className="text-sm opacity-90">{event.location}</p>
                    </div>
                  )}
                  {event.startDate && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Calendar className="w-3.5 h-3.5 opacity-80 flex-shrink-0" />
                      <p className="text-sm opacity-90">
                        {event.startDate}
                        {event.endDate && event.endDate !== event.startDate ? ` → ${event.endDate}` : ""}
                      </p>
                    </div>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="px-4 pb-6 space-y-4">
              {/* Description */}
              {event.description && (
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">À propos</h3>
                  <p className="text-sm text-foreground leading-relaxed">{event.description}</p>
                </div>
              )}

              {/* Navigation GPS */}
              {event.location && (
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5" />
                    Ouvrir dans
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {navLinks.map(link => (
                      <a
                        key={link.name}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-opacity hover:opacity-80 ${link.color}`}
                      >
                        <span className="text-base">{link.icon}</span>
                        <span>{link.name}</span>
                        <ExternalLink className="w-3 h-3 ml-auto opacity-60" />
                      </a>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2 text-center">
                    {event.location}
                  </p>
                </div>
              )}

              <Button variant="outline" className="w-full" onClick={onClose}>
                Fermer
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
