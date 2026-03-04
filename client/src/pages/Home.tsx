import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Zap, LogOut, User, BarChart3, Navigation } from "lucide-react";
import { motion } from "framer-motion";
import { getLoginUrl } from "@/const";
import SwipePage from "./Swipe";
import TeamView from "./TeamView";
import PlanView from "./PlanView";

type View = "home" | "swipe" | "team" | "plan";

interface SelectedEvent {
  id: number;
  name: string;
  color: string;
  slug: string;
}

export default function Home() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [view, setView] = useState<View>("home");
  const [selectedEvent, setSelectedEvent] = useState<SelectedEvent | null>(null);

  const { data: events, isLoading: eventsLoading } = trpc.events.list.useQuery();

  const { data: myStats } = trpc.votes.stats.useQuery(
    { eventId: selectedEvent?.id },
    { enabled: isAuthenticated }
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Swipe view
  if (view === "swipe" && selectedEvent) {
    return (
      <div className="h-screen flex flex-col max-w-sm mx-auto">
        <SwipePage
          eventId={selectedEvent.id}
          eventName={selectedEvent.name}
          eventColor={selectedEvent.color}
          onBack={() => setView("home")}
        />
      </div>
    );
  }

  // Team view
  if (view === "team") {
    return (
      <div className="h-screen flex flex-col max-w-sm mx-auto">
        <TeamView
          eventId={selectedEvent?.id}
          eventName={selectedEvent?.name}
          onBack={() => setView("home")}
        />
      </div>
    );
  }

  // Plan view
  if (view === "plan") {
    return (
      <div className="h-screen flex flex-col max-w-sm mx-auto">
        <PlanView
          eventId={selectedEvent?.id}
          eventName={selectedEvent?.name}
          onBack={() => setView("home")}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-sm mx-auto flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-12 pb-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">
              Salon<span className="text-primary">Swipe</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Préparez vos salons pro</p>
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">
                  {user?.name?.charAt(0)?.toUpperCase() ?? "?"}
                </span>
              </div>
              <button onClick={logout} className="text-muted-foreground hover:text-foreground">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Button size="sm" onClick={() => window.location.href = getLoginUrl()}>
              <User className="w-4 h-4 mr-1.5" />
              Connexion
            </Button>
          )}
        </div>

        {/* Welcome */}
        {isAuthenticated && user && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-primary/10 to-accent/20 border border-primary/20 rounded-2xl p-4 mb-6"
          >
            <p className="text-sm font-semibold text-foreground">Bonjour, {user.name?.split(" ")[0]} 👋</p>
            <p className="text-xs text-muted-foreground mt-0.5">Prêt à découvrir les exposants ?</p>
          </motion.div>
        )}
      </div>

      <div className="flex-1 px-4 pb-8 space-y-6">
        {/* Events */}
        <div>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">
            Événements disponibles
          </h2>

          {eventsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-3">
              {(events ?? []).map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div
                    className={`rounded-2xl border-2 p-4 cursor-pointer transition-all ${
                      selectedEvent?.id === event.id
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border bg-card hover:border-primary/40 hover:shadow-sm"
                    }`}
                    onClick={() => setSelectedEvent({
                      id: event.id,
                      name: event.name,
                      color: event.color ?? "#2C3E7A",
                      slug: event.slug,
                    })}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-lg flex-shrink-0"
                        style={{ backgroundColor: event.color ?? "#2C3E7A" }}
                      >
                        {event.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm text-foreground">{event.name}</h3>
                        {event.location && (
                          <p className="text-xs text-muted-foreground mt-0.5">📍 {event.location}</p>
                        )}
                        {event.startDate && (
                          <p className="text-xs text-muted-foreground">
                            📅 {event.startDate}{event.endDate && event.endDate !== event.startDate ? ` → ${event.endDate}` : ""}
                          </p>
                        )}
                      </div>
                      {selectedEvent?.id === event.id && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
              Actions — {selectedEvent.name.split(" ")[0]}
            </h2>

            {/* Swipe */}
            <button
              onClick={() => isAuthenticated ? setView("swipe") : window.location.href = getLoginUrl()}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-primary text-primary-foreground shadow-lg active:scale-98 transition-transform"
            >
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm">Swiper les exposants</p>
                <p className="text-xs opacity-80">Évaluez chaque exposant rapidement</p>
              </div>
              <span className="ml-auto text-xl">→</span>
            </button>

            {/* Vue équipe */}
            <button
              onClick={() => isAuthenticated ? setView("team") : window.location.href = getLoginUrl()}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border-2 border-border hover:border-primary/40 transition-all active:scale-98"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm text-foreground">Vue équipe</p>
                <p className="text-xs text-muted-foreground">Classement et votes de l'équipe</p>
              </div>
              <span className="ml-auto text-muted-foreground">→</span>
            </button>

            {/* Planification */}
            <button
              onClick={() => isAuthenticated ? setView("plan") : window.location.href = getLoginUrl()}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border-2 border-border hover:border-primary/40 transition-all active:scale-98"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <Navigation className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm text-foreground">Planifier ma visite</p>
                <p className="text-xs text-muted-foreground">Chemin optimisé par stands</p>
              </div>
              <span className="ml-auto text-muted-foreground">→</span>
            </button>

            {/* Quick stats */}
            {isAuthenticated && myStats && myStats.total > 0 && (
              <div className="bg-muted/50 rounded-2xl p-4">
                <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1">
                  <BarChart3 className="w-3.5 h-3.5" />
                  Vos votes sur {selectedEvent.name.split(" ")[0]}
                </p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xl font-black text-green-600">{myStats.likes}</p>
                    <p className="text-xs text-muted-foreground">Likes</p>
                  </div>
                  <div>
                    <p className="text-xl font-black text-blue-600">{myStats.superlikes}</p>
                    <p className="text-xs text-muted-foreground">Super Likes</p>
                  </div>
                  <div>
                    <p className="text-xl font-black text-red-600">{myStats.dislikes}</p>
                    <p className="text-xs text-muted-foreground">Skips</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* No event selected hint */}
        {!selectedEvent && !eventsLoading && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">👆 Sélectionnez un événement pour commencer</p>
          </div>
        )}
      </div>
    </div>
  );
}
