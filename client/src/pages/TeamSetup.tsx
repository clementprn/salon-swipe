import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Loader2, ChevronLeft, Users, Plus, Link2, Copy, Check,
  UserPlus, LogIn, Crown, Mail
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

interface TeamSetupProps {
  eventId: number;
  eventName?: string;
  onBack: () => void;
}

export default function TeamSetup({ eventId, eventName, onBack }: TeamSetupProps) {
  const { isAuthenticated } = useAuth();
  const [newTeamName, setNewTeamName] = useState("");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<"view" | "create" | "join">("view");
  const utils = trpc.useUtils();

  const { data: myTeam, isLoading: myTeamLoading } = trpc.teams.myTeam.useQuery(
    { eventId },
    { enabled: isAuthenticated }
  );

  const { data: allTeams, isLoading: teamsLoading } = trpc.teams.list.useQuery(
    { eventId },
    { enabled: isAuthenticated }
  );

  const createTeam = trpc.teams.create.useMutation({
    onSuccess: () => {
      toast.success("Équipe créée !");
      utils.teams.myTeam.invalidate();
      utils.teams.list.invalidate();
      setNewTeamName("");
      setMode("view");
    },
    onError: (e) => toast.error(e.message),
  });

  const joinTeam = trpc.teams.join.useMutation({
    onSuccess: () => {
      toast.success("Vous avez rejoint l'équipe !");
      utils.teams.myTeam.invalidate();
      utils.teams.list.invalidate();
      setMode("view");
    },
    onError: (e) => toast.error(e.message),
  });

  const createInvite = trpc.teams.createInvite.useMutation({
    onSuccess: (data) => {
      setInviteUrl(data.url);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleCopy = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast.success("Lien copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareEmail = () => {
    if (!inviteUrl) return;
    const subject = encodeURIComponent(`Rejoins mon équipe sur SalonSwipe — ${eventName ?? ""}`);
    const body = encodeURIComponent(
      `Bonjour,\n\nJe t'invite à rejoindre mon équipe sur SalonSwipe pour préparer notre visite du salon ${eventName ?? ""}.\n\nClique sur ce lien pour rejoindre :\n${inviteUrl}\n\nÀ bientôt !`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
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

  const isLoading = myTeamLoading || teamsLoading;

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
            <Users className="w-4 h-4 text-primary" />
            Équipes
          </p>
          {eventName && <p className="text-xs text-muted-foreground">{eventName}</p>}
        </div>
        <div className="w-16" />
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4 space-y-5">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Mon équipe */}
            {myTeam ? (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <div className="bg-gradient-to-br from-primary/10 to-accent/20 border border-primary/20 rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Crown className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-black text-base text-foreground">{myTeam.name}</p>
                      <p className="text-xs text-muted-foreground">Mon équipe · {myTeam.members?.length ?? 0} membre{(myTeam.members?.length ?? 0) > 1 ? "s" : ""}</p>
                    </div>
                  </div>

                  {/* Membres */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(myTeam.members ?? []).map((m: any) => (
                      <div key={m.id} className="flex items-center gap-1.5 bg-white/60 border border-primary/20 rounded-full px-2.5 py-1">
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-primary">{m.name?.charAt(0)?.toUpperCase() ?? "?"}</span>
                        </div>
                        <span className="text-xs font-medium text-foreground">{m.name?.split(" ")[0] ?? "Anonyme"}</span>
                      </div>
                    ))}
                  </div>

                  {/* Invitation */}
                  {!inviteUrl ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-2 bg-white/60"
                      onClick={() => createInvite.mutate({ teamId: myTeam.id, origin: window.location.origin })}
                      disabled={createInvite.isPending}
                    >
                      {createInvite.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                      Générer un lien d'invitation
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 bg-white/80 border border-border rounded-xl p-2.5">
                        <p className="text-xs text-muted-foreground flex-1 truncate">{inviteUrl}</p>
                        <button onClick={handleCopy} className="flex-shrink-0">
                          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={handleCopy}>
                          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          Copier
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={handleShareEmail}>
                          <Mail className="w-3.5 h-3.5" />
                          Envoyer par mail
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              /* Pas encore d'équipe */
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                  <p className="text-sm font-semibold text-amber-800 mb-1">Vous n'avez pas encore d'équipe</p>
                  <p className="text-xs text-amber-700">Créez une équipe ou rejoignez-en une pour partager vos votes.</p>
                </div>
              </motion.div>
            )}

            {/* Actions */}
            <AnimatePresence mode="wait">
              {mode === "view" && (
                <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setMode("create")}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border-2 border-border hover:border-primary/40 transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Plus className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-xs font-bold text-foreground">Créer une équipe</p>
                  </button>
                  <button
                    onClick={() => setMode("join")}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border-2 border-border hover:border-primary/40 transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center">
                      <LogIn className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-xs font-bold text-foreground">Rejoindre</p>
                  </button>
                </motion.div>
              )}

              {mode === "create" && (
                <motion.div key="create" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                  <h3 className="font-bold text-sm text-foreground">Créer une nouvelle équipe</h3>
                  <input
                    type="text"
                    placeholder="Nom de l'équipe (ex: Équipe Achats)"
                    value={newTeamName}
                    onChange={e => setNewTeamName(e.target.value)}
                    maxLength={50}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setMode("view")}>Annuler</Button>
                    <Button
                      className="flex-1 gap-2"
                      disabled={!newTeamName.trim() || createTeam.isPending}
                      onClick={() => createTeam.mutate({ name: newTeamName.trim(), eventId })}
                    >
                      {createTeam.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Créer
                    </Button>
                  </div>
                </motion.div>
              )}

              {mode === "join" && (
                <motion.div key="join" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                  <h3 className="font-bold text-sm text-foreground">Rejoindre une équipe</h3>
                  {(allTeams ?? []).length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-sm text-muted-foreground">Aucune équipe disponible pour cet événement.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(allTeams ?? []).map((team: any) => (
                        <div
                          key={team.id}
                          className={`flex items-center justify-between p-3.5 rounded-xl border-2 ${
                            myTeam?.id === team.id ? "border-primary bg-primary/5" : "border-border bg-card"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Users className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-foreground">{team.name}</p>
                            </div>
                          </div>
                          {myTeam?.id === team.id ? (
                            <span className="text-xs text-primary font-bold">Mon équipe</span>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 text-xs"
                              disabled={joinTeam.isPending}
                              onClick={() => joinTeam.mutate({ teamId: team.id, eventId })}
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              Rejoindre
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <Button variant="outline" className="w-full" onClick={() => setMode("view")}>Retour</Button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}
