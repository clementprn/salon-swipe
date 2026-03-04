import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2, Users, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

export default function JoinTeam() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");
  const [teamName, setTeamName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Extraire le token depuis l'URL
  const token = new URLSearchParams(window.location.search).get("token");

  const resolveInvite = trpc.teams.resolveInvite.useMutation({
    onSuccess: (data) => {
      setTeamName(data.teamName);
      setStatus("success");
    },
    onError: (e) => {
      setErrorMsg(e.message);
      setStatus("error");
    },
  });

  useEffect(() => {
    if (!loading && isAuthenticated && token && status === "pending") {
      resolveInvite.mutate({ token });
    }
  }, [loading, isAuthenticated, token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Sauvegarder l'URL pour rediriger après login
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-8 text-center max-w-sm mx-auto">
        <div className="text-5xl">🔐</div>
        <h2 className="text-xl font-bold">Connexion requise</h2>
        <p className="text-sm text-muted-foreground">
          Connectez-vous pour rejoindre l'équipe.
        </p>
        <Button onClick={() => window.location.href = getLoginUrl()}>
          Se connecter
        </Button>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 text-center max-w-sm mx-auto">
        <AlertCircle className="w-16 h-16 text-red-500" />
        <h2 className="text-xl font-bold">Lien invalide</h2>
        <p className="text-sm text-muted-foreground">Ce lien d'invitation est incorrect.</p>
        <Button onClick={() => navigate("/")}>Retour à l'accueil</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-8 text-center max-w-sm mx-auto">
      {status === "pending" && (
        <>
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Traitement de l'invitation...</p>
        </>
      )}

      {status === "success" && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <CheckCircle2 className="w-20 h-20 text-green-500" />
          <h2 className="text-2xl font-black">Bienvenue dans l'équipe !</h2>
          {teamName && (
            <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-2xl px-4 py-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="font-bold text-primary">{teamName}</span>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Vous avez rejoint l'équipe avec succès. Vous pouvez maintenant collaborer sur les votes.
          </p>
          <Button onClick={() => navigate("/")} className="mt-2">
            Aller à l'accueil
          </Button>
        </motion.div>
      )}

      {status === "error" && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <AlertCircle className="w-20 h-20 text-red-500" />
          <h2 className="text-xl font-black">Invitation invalide</h2>
          <p className="text-sm text-muted-foreground">{errorMsg ?? "Ce lien d'invitation est expiré ou invalide."}</p>
          <Button onClick={() => navigate("/")} variant="outline">
            Retour à l'accueil
          </Button>
        </motion.div>
      )}
    </div>
  );
}
