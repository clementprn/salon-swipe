import { useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Zap, ArrowLeft, Loader2 } from "lucide-react";

// SVG icons for SSO providers
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <path d="M11.4 2H2v9.4h9.4V2z" fill="#F25022"/>
      <path d="M22 2h-9.4v9.4H22V2z" fill="#7FBA00"/>
      <path d="M11.4 12.6H2V22h9.4v-9.4z" fill="#00A4EF"/>
      <path d="M22 12.6h-9.4V22H22v-9.4z" fill="#FFB900"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

export default function Login() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  // Redirect to app if already logged in
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/app");
    }
  }, [isAuthenticated, loading, navigate]);

  const handleMicrosoftLogin = () => {
    // Microsoft SSO via Manus OAuth — même endpoint, le portail propose le choix
    window.location.href = getLoginUrl();
  };

  const handleGoogleLogin = () => {
    window.location.href = getLoginUrl();
  };

  const handleAppleLogin = () => {
    window.location.href = getLoginUrl();
  };

  const handleEmailLogin = () => {
    window.location.href = getLoginUrl();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white flex flex-col">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-600/15 rounded-full blur-[100px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-black text-sm tracking-tight">
            Salon<span className="text-blue-400">Swipe</span>
          </span>
        </div>
        <div className="w-16" />
      </nav>

      {/* Main */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-600/30">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight mb-2">Connexion</h1>
            <p className="text-slate-400 text-sm">Accédez à votre espace SalonSwipe</p>
          </div>

          {/* SSO Buttons */}
          <div className="space-y-3 mb-6">
            {/* Google */}
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/20 transition-all text-sm font-medium text-white"
            >
              <GoogleIcon />
              <span className="flex-1 text-center">Continuer avec Google</span>
            </button>

            {/* Microsoft */}
            <button
              onClick={handleMicrosoftLogin}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/20 transition-all text-sm font-medium text-white"
            >
              <MicrosoftIcon />
              <span className="flex-1 text-center">Continuer avec Microsoft</span>
            </button>

            {/* Apple */}
            <button
              onClick={handleAppleLogin}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/20 transition-all text-sm font-medium text-white"
            >
              <AppleIcon />
              <span className="flex-1 text-center">Continuer avec Apple</span>
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-slate-500">ou</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Email button */}
          <button
            onClick={handleEmailLogin}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-600/20"
          >
            Continuer avec email
          </button>

          {/* Note */}
          <p className="text-center text-xs text-slate-600 mt-6 leading-relaxed">
            En vous connectant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
