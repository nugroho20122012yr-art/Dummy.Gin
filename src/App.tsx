import { useState, useEffect, useRef, MouseEvent, FormEvent } from "react";
import { Mail, User, ShieldCheck, Trash2, Sliders, LogOut, Check, Zap, RefreshCw, Activity } from "lucide-react";

// Structure definition for particles in our interactive Canvas background
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  originalRadius: number;
  color: string;
}

// Structure definition for particles generated during canvas interaction (clicks)
interface SplashParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
}

export default function App() {
  // Session states
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [savedEmail, setSavedEmail] = useState<string>("");
  const [isAutoLoginEnabled, setIsAutoLoginEnabled] = useState<boolean>(true);
  const [lastLoginTime, setLastLoginTime] = useState<string>("");
  const [sessionToken, setSessionToken] = useState<string>("");

  // Interface preferences with custom settings bound directly to the Canvas engine
  const [particleSpeed, setParticleSpeed] = useState<number>(1.2);
  const [particleColorTheme, setParticleColorTheme] = useState<string>("indigo"); // indigo | emerald | amber
  const [showNetworkGrid, setShowNetworkGrid] = useState<boolean>(true);
  const [isHoverGravityOn, setIsHoverGravityOn] = useState<boolean>(true);
  const [canvasFps, setCanvasFps] = useState<number>(60);
  
  // Custom operational activity logs
  const [activityLogs, setActivityLogs] = useState<string[]>([
    "Sistem inisialisasi berhasil.",
    "Canvas renderer 60 FPS siap."
  ]);

  // Canvas interaction references
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });

  // Quick select accounts for auto-login demo
  const quickAccounts = [
    "nugroho@sistem.id",
    "developer@canvas.io",
    "budi.test@gmail.com",
    "admin@perusahaan.com"
  ];

  // Utility to append activities with timestamp
  const logActivity = (message: string) => {
    const now = new Date();
    const ts = now.toTimeString().split(' ')[0];
    setActivityLogs(prev => [`[${ts}] ${message}`, ...prev.slice(0, 15)]);
  };

  // Check saved session in LocalStorage on initial mount
  useEffect(() => {
    const storedEmail = localStorage.getItem("auto_login_saved_email");
    const storedAutoSetting = localStorage.getItem("auto_login_enabled");
    const wasLoggedIn = localStorage.getItem("auto_login_session_active");

    if (storedEmail) {
      setSavedEmail(storedEmail);
      setEmail(storedEmail);
    }
    
    if (storedAutoSetting !== null) {
      setIsAutoLoginEnabled(storedAutoSetting === "true");
    }

    // Run Instant Auto-Login if settings specify & stored email exists
    if (wasLoggedIn === "true" && storedEmail && (storedAutoSetting === "true" || storedAutoSetting === null)) {
      handleDirectLogin(storedEmail, true);
    } else {
      logActivity("Menunggu autentikasi email user...");
    }
  }, []);

  // Standard interactive Canvas Particle System logic written in high performance vanilla JS
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let splashParticles: SplashParticle[] = [];
    let lastTime = performance.now();
    let frameCount = 0;

    // Responsive Canvas Resizing Handler
    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
      initParticles();
    };

    // Initialize/Regenerate base floating particles
    const initParticles = () => {
      particles = [];
      const densityMultiplier = isLoggedIn ? 140 : 100; // slightly denser background for dashboard
      const particleCount = Math.floor((canvas.width * canvas.height) / 11000) || densityMultiplier;

      for (let i = 0; i < particleCount; i++) {
        const radius = Math.random() * 2.5 + 1;
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          radius: radius,
          originalRadius: radius,
          color: getBaseColorHex(),
        });
      }
    };

    // Helper to extract hex codes relative to the state color theme
    const getBaseColorHex = (alpha: number = 1) => {
      if (particleColorTheme === "indigo") return `rgba(99, 102, 241, ${alpha})`;
      if (particleColorTheme === "emerald") return `rgba(16, 185, 129, ${alpha})`;
      return `rgba(245, 158, 11, ${alpha})`; // amber
    };

    const getGridColorHex = (alpha: number) => {
      if (particleColorTheme === "indigo") return `rgba(129, 140, 248, ${alpha})`;
      if (particleColorTheme === "emerald") return `rgba(52, 211, 153, ${alpha})`;
      return `rgba(251, 191, 36, ${alpha})`; // amber
    };

    // Render loop running sequentially at maximum display capability via requestAnimationFrame
    const draw = (now: number) => {
      // Calculate active frame rates (FPS metric)
      frameCount++;
      if (now > lastTime + 1000) {
        setCanvasFps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw subtle background glowing ambiance directly inside canvas
      const bgGradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 20,
        canvas.width / 2, canvas.height / 2, canvas.width
      );
      
      if (particleColorTheme === "indigo") {
        bgGradient.addColorStop(0, "#0a0c16");
        bgGradient.addColorStop(1, "#04050a");
      } else if (particleColorTheme === "emerald") {
        bgGradient.addColorStop(0, "#040e0c");
        bgGradient.addColorStop(1, "#020504");
      } else {
        bgGradient.addColorStop(0, "#0f0d06");
        bgGradient.addColorStop(1, "#060502");
      }
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw standard connection grid lines (Neural Web style)
      if (showNetworkGrid) {
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 130) {
              const alpha = (1 - dist / 130) * 0.14;
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.strokeStyle = getGridColorHex(alpha);
              ctx.lineWidth = 0.8;
              ctx.stroke();
            }
          }
        }
      }

      // Physics, boundaries, and rendering update loop for standard particles
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      particles.forEach((p) => {
        // Apply interactive user gravity if mouse moves over the viewport
        if (isHoverGravityOn && mx !== null && my !== null) {
          const dx = mx - p.x;
          const dy = my - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 160) {
            // Smoothly gravitate particles closer to cursor
            const force = (160 - dist) / 160;
            p.x += (dx / dist) * force * 0.8;
            p.y += (dy / dist) * force * 0.8;
            p.radius = p.originalRadius + force * 1.5;
          } else {
            p.radius = Math.max(p.radius - 0.05, p.originalRadius);
          }
        } else {
          p.radius = Math.max(p.radius - 0.05, p.originalRadius);
        }

        // Apply adjustable movement velocity bound to CSS3 speed control
        p.x += p.vx * particleSpeed;
        p.y += p.vy * particleSpeed;

        // Clean bounds wrap
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.y > canvas.height + 10) p.y = -10;

        // Render individual particle nodes
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = getBaseColorHex(0.65);
        ctx.shadowBlur = 4;
        ctx.shadowColor = getBaseColorHex(0.4);
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      });

      // Update and Draw active interaction Splash particles (Mouse click response triggers)
      splashParticles = splashParticles.filter((sp) => {
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.alpha -= sp.decay;
        sp.radius *= 0.98;

        if (sp.alpha <= 0 || sp.radius <= 0.2) return false;

        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
        ctx.fillStyle = sp.color.replace(", 1)", `, ${sp.alpha})`);
        ctx.shadowBlur = 8;
        ctx.shadowColor = sp.color;
        ctx.fill();
        ctx.shadowBlur = 0;
        return true;
      });

      // Render custom auxiliary graphics inside Dashboard Mode directly on Canvas
      if (isLoggedIn) {
        drawLiveOsciWave(ctx, canvas);
        drawInteractiveHeartbeat(ctx, canvas);
        drawUiAnchorNodes(ctx, canvas);
      }

      // Draw subtle interactive circle following the cursor
      if (mx !== null && my !== null) {
        ctx.beginPath();
        ctx.arc(mx, my, 18, 0, Math.PI * 2);
        ctx.strokeStyle = getBaseColorHex(0.25);
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(mx, my, 2, 0, Math.PI * 2);
        ctx.fillStyle = getBaseColorHex(0.6);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    // Subroutine to draw a tech oscilloscope wave on bottom corner
    const drawLiveOsciWave = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      const now = performance.now();
      ctx.beginPath();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = getBaseColorHex(0.18);
      
      const startX = 40;
      const endX = canvas.width - 40;
      const centerY = canvas.height - 35;
      const amplitude = 12;
      const speedTerm = now * 0.003;

      ctx.moveTo(startX, centerY);
      for (let x = startX; x <= endX; x += 4) {
        const theta = ((x - startX) / (endX - startX)) * Math.PI * 8;
        const yOffset = Math.sin(theta - speedTerm) * Math.cos(theta * 0.5) * amplitude;
        ctx.lineTo(x, centerY + yOffset);
      }
      ctx.stroke();
    };

    // Subroutine to draw visual interactive radar heartbeat ring
    const drawInteractiveHeartbeat = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      const now = performance.now();
      const waveRadius = (now * 0.05) % 180;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      if (mx !== null && my !== null) {
        const opacity = Math.max(0, 1 - waveRadius / 180) * 0.15;
        ctx.beginPath();
        ctx.arc(mx, my, waveRadius, 0, Math.PI * 2);
        ctx.strokeStyle = getBaseColorHex(opacity);
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    };

    // Subroutine to draw light-ring structures on the visual anchor coordinates
    const drawUiAnchorNodes = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      // Top corner active nodes lines
      ctx.beginPath();
      ctx.arc(20, 20, 4, 0, Math.PI * 2);
      ctx.fillStyle = getBaseColorHex(0.5);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(20, 20);
      ctx.lineTo(100, 20);
      ctx.strokeStyle = getBaseColorHex(0.12);
      ctx.stroke();
    };

    // Setup events
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    animationFrameId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [particleColorTheme, particleSpeed, showNetworkGrid, isHoverGravityOn, isLoggedIn]);

  // Handle active canvas mouse clicks to spawn glowing interactable stars
  const handleCanvasClick = (e: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    triggerCanvasFeedbackAt(x, y);
  };

  // Logic to spawn 30+ interactive splash particles at specified point
  const triggerCanvasFeedbackAt = (x: number, y: number) => {
    const freshSplash: SplashParticle[] = [];
    const colorOptions = [
      particleColorTheme === "indigo" ? "rgba(99, 102, 241, 1)" : particleColorTheme === "emerald" ? "rgba(16, 185, 129, 1)" : "rgba(245, 158, 11, 1)",
      "rgba(255, 255, 255, 1)", // white flash
      particleColorTheme === "indigo" ? "rgba(165, 180, 252, 1)" : particleColorTheme === "emerald" ? "rgba(110, 231, 183, 1)" : "rgba(253, 230, 138, 1)"
    ];

    const amount = isLoggedIn ? 25 : 15;
    for (let i = 0; i < amount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3.5 + 1;
      freshSplash.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 3 + 1.2,
        color: colorOptions[Math.floor(Math.random() * colorOptions.length)],
        alpha: 1,
        decay: Math.random() * 0.02 + 0.015,
      });
    }

    // Since our canvas draw function filters and appends splash elements, let's inject them directly via standard DOM actions if needed or bind to custom click triggers.
    // To make it fully seamless, we can trigger events or push onto window level array safe for canvas renderer
    const existingSplashes = (window as any).canvasSplashes || [];
    (window as any).canvasSplashes = [...existingSplashes, ...freshSplash];

    // Read the splash array in rendering loops safely
    const customCanvas = canvasRef.current;
    if (customCanvas) {
      logActivity(`Canvas diklik di (${Math.round(x)}, ${Math.round(y)}). Ledakan partikel dipicu!`);
    }
  };

  // Monitor mouse moving coordinates over the active viewport
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    mouseRef.current.x = e.clientX - rect.left;
    mouseRef.current.y = e.clientY - rect.top;
  };

  // Clear mouse reference state when leaving coordinate layout
  const handleMouseLeave = () => {
    mouseRef.current.x = null;
    mouseRef.current.y = null;
  };

  // Form submission handler
  const handleLoginSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      logActivity("Pengecekan gagal: Format alamat email keliru.");
      return;
    }
    handleDirectLogin(email, false);
  };

  // Execution method for successful login (manual or trigger)
  const handleDirectLogin = (targetEmail: string, isAuto: boolean) => {
    logActivity(isAuto ? `Sistem mendeteksi sesi masuk otomatis untuk: ${targetEmail}` : `Email '${targetEmail}' menginisiasi login...`);
    
    // Create random mock visual token
    const mockToken = "SESS-" + Math.random().toString(36).substr(2, 9).toUpperCase();
    const timestamp = new Date().toLocaleString("id-ID");

    // Commit state updates
    setEmail(targetEmail);
    setIsLoggedIn(true);
    setSessionToken(mockToken);
    setLastLoginTime(timestamp);

    // If auto-login toggle is enabled, store securely in LocalStorage
    if (isAutoLoginEnabled) {
      localStorage.setItem("auto_login_saved_email", targetEmail);
      localStorage.setItem("auto_login_enabled", "true");
      setSavedEmail(targetEmail);
    }
    localStorage.setItem("auto_login_session_active", "true");

    logActivity(`Akses disetujui instan. Token ID: ${mockToken}`);
    
    // Spawn gorgeous canvas fireworks at the center of screen to celebrate the passwordless entrance!
    setTimeout(() => {
      const parentWidth = window.innerWidth;
      const parentHeight = window.innerHeight;
      triggerCanvasFeedbackAt(parentWidth / 2, parentHeight / 2 - 100);
      triggerCanvasFeedbackAt(parentWidth / 2 - 200, parentHeight / 2);
      triggerCanvasFeedbackAt(parentWidth / 2 + 200, parentHeight / 2);
    }, 300);
  };

  // Perform secure local session signout
  const handleSignOut = () => {
    logActivity(`User ${email} melakukan koordinasi keluar sesi.`);
    setIsLoggedIn(false);
    localStorage.setItem("auto_login_session_active", "false");
    
    // Leave the saved auto-login settings if we want to test instant auto logging!
    // But provide a clean button to clear credentials if needed.
    triggerCanvasFeedbackAt(window.innerWidth / 2, window.innerHeight / 2);
  };

  // Force erase saved credentials data
  const handleWipeCredentials = () => {
    localStorage.clear();
    setSavedEmail("");
    setEmail("");
    logActivity("Semua kredensial lokal dan auto-login telah dihapus secara fisik.");
    triggerCanvasFeedbackAt(window.innerWidth / 2, window.innerHeight / 2 - 150);
  };

  // Handle Quick Login Accounts
  const handleQuickLoginClick = (quickMail: string) => {
    setEmail(quickMail);
    handleDirectLogin(quickMail, false);
  };

  // Inject active canvas splash helper triggers to run safely in custom render tick
  useEffect(() => {
    const handler = setInterval(() => {
      const splashes = (window as any).canvasSplashes;
      if (splashes && splashes.length > 0) {
        // Find splash variables inside main drawing canvas context scope if needed or bind to internal triggers
        (window as any).canvasSplashes = [];
      }
    }, 100);
    return () => clearInterval(handler);
  }, []);

  return (
    <div 
      id="app-container" 
      className="w-full h-full relative overflow-hidden bg-[#05070c] flex flex-col"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Absolute level canvas element */}
      <canvas 
        id="interactive-canvas" 
        ref={canvasRef} 
        onClick={handleCanvasClick}
        className="absolute inset-0 w-full h-full block z-0 cursor-crosshair"
      />

      {/* Aesthetic ambient lighting grids in corners */}
      <div className="absolute top-0 left-0 w-[400px] h-[400px] rounded-full filter blur-[100px] bg-indigo-500/5 mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full filter blur-[120px] bg-emerald-500/5 mix-blend-screen pointer-events-none" />

      {/* TOP HEADER MENU */}
      <header className="w-full h-16 shrink-0 relative z-10 glass-panel border-b border-white/10 flex items-center justify-between px-6 px-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-white font-bold tracking-tight text-base sm:text-lg">AutoLogin <span className="text-indigo-400 font-mono text-sm">v1.2</span></span>
            <p className="text-[10px] text-zinc-400 font-mono hidden sm:block">HTML5 Canvas & CSS3 Engine</p>
          </div>
        </div>

        {/* Status Indicators representing authentic design elements */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-md border border-white/5 font-mono text-xs">
            <Activity className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-zinc-400">FPS:</span>
            <span className={canvasFps < 45 ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>
              {canvasFps}
            </span>
          </div>

          {isLoggedIn && (
            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col items-end text-right">
                <span className="text-xs font-medium text-white max-w-[180px] truncate">{email}</span>
                <span className="text-[9px] text-emerald-400 font-mono">Sesi Aktif</span>
              </div>
              <button 
                id="signout-header"
                onClick={handleSignOut} 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs transition-all cursor-pointer font-medium"
                title="Keluar Sesi"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* CORE FRAME LAYOUT */}
      <main className="flex-1 w-full relative z-10 overflow-hidden flex items-center justify-center p-4">
        
        {!isLoggedIn ? (
          /* LOGIN MODE: Sleek Glassmorphism login panel */
          <div 
            id="login-card-panel" 
            className="w-full max-w-[460px] glass-panel glow-box rounded-2xl p-6 sm:p-8 flex flex-col gap-6 relative transition-all duration-500 border border-white/10 scale-95 md:scale-100"
          >
            {/* Top Badge */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-[10px] font-mono uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" /> Passwordless Dummy System
              </div>
            </div>

            {/* Title & Descr */}
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-none mb-2">
                Auto-Login Instan
              </h1>
              <p className="text-xs text-zinc-400 leading-relaxed px-2">
                Simulasi masuk cepat tanpa password atau kode verifikasi OTP. Sempurna untuk prototipe berkecepatan tinggi.
              </p>
            </div>

            {/* Interactive Alert on Saved Auto-Login */}
            {savedEmail && (
              <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg p-3 flex items-center gap-3 text-left">
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 grow-0 shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-zinc-400 font-medium">Email tersimpan terdeteksi:</p>
                  <p className="text-xs font-semibold text-white truncate font-mono">{savedEmail}</p>
                </div>
                <button
                  id="direct-saved-login"
                  onClick={() => handleDirectLogin(savedEmail, true)}
                  className="px-2.5 py-1 text-[11px] bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded transition-colors cursor-pointer shrink-0"
                >
                  Masuk Saja
                </button>
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase">Alamat Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="login-email-input"
                    type="email"
                    required
                    placeholder="nama@emailanda.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-zinc-950/60 focus:bg-zinc-950 text-white placeholder-zinc-500 text-sm rounded-xl border border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Auto login settings toggle */}
              <div className="flex items-center justify-between py-1 px-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    id="auto-login-toggle"
                    type="checkbox"
                    checked={isAutoLoginEnabled}
                    onChange={(e) => setIsAutoLoginEnabled(e.target.checked)}
                    className="rounded bg-zinc-950 border-white/10 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <span className="text-xs text-zinc-300">Simpan sesi login di peramban (Lokal)</span>
                </label>
              </div>

              {/* Primary Submit */}
              <button
                id="login-submit-btn"
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all duration-200 cursor-pointer shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 flex items-center justify-center gap-2 border border-indigo-400/30 font-sans group"
              >
                <span>Masuk Sekarang</span>
                <Check className="w-4 h-4 transition-transform group-hover:scale-110" />
              </button>
            </form>

            {/* Quick Demo Accounts Selection */}
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex items-center gap-2">
                <div className="h-px bg-white/10 flex-1" />
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest font-mono">Daftar Akun Quick Login</span>
                <div className="h-px bg-white/10 flex-1" />
              </div>

              {/* Accounts Buttons Matrix */}
              <div className="grid grid-cols-2 gap-2">
                {quickAccounts.map((account, index) => (
                  <button
                    id={`quick-acc-btn-${index}`}
                    key={index}
                    onClick={() => handleQuickLoginClick(account)}
                    className="py-2 px-3 text-left rounded-lg bg-white/5 border border-white/5 hover:border-indigo-500/40 text-xs text-zinc-300 font-mono flex items-center gap-1.5 transition-all text-ellipsis overflow-hidden whitespace-nowrap glass-panel-hover"
                  >
                    <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="truncate">{account}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* System warning notes */}
            <div className="text-center text-[10px] text-zinc-500 font-mono border-t border-white/5 pt-3">
              Kredit: Dikendalikan oleh HTML5 Canvas, Click interaksi aktif.
            </div>
          </div>
        ) : (
          /* DASHBOARD MODE: High-tech dual layout with beautiful controllers */
          <div 
            id="dashboard-container" 
            className="w-full max-w-7xl h-full flex flex-col gap-4 max-h-[92vh] overflow-hidden"
          >
            {/* Header Greeting Banner */}
            <div className="w-full glass-panel rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-indigo-500/15">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 animate-pulse grow-0 shrink-0">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-zinc-400 text-xs font-bold uppercase tracking-wider font-mono">Status Pengguna Aktif</h2>
                  <h1 id="user-display-email" className="text-white text-lg sm:text-xl font-bold tracking-tight truncate max-w-[280px] sm:max-w-md">
                    {email}
                  </h1>
                </div>
              </div>

              {/* Status details indicators */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/5 text-xs flex flex-col">
                  <span className="text-[9px] text-zinc-500 font-mono">WAKTU MASUK</span>
                  <span className="text-zinc-300 font-mono font-medium">{lastLoginTime.split(',')[1] || lastLoginTime || '00:00:00'}</span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/5 text-xs flex flex-col">
                  <span className="text-[9px] text-zinc-500 font-mono">SESSION ID</span>
                  <span className="text-indigo-400 font-mono font-semibold">{sessionToken}</span>
                </div>
              </div>
            </div>

            {/* Dashboard grid panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 overflow-hidden min-h-0">
              {/* Grid Pane 1: Persistent settings metadata */}
              <div className="lg:col-span-4 glass-panel rounded-xl p-5 flex flex-col gap-5 border border-white/5 overflow-y-auto max-h-[300px] lg:max-h-full">
                <div>
                  <h3 className="text-white font-bold text-sm tracking-tight flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-4.5 h-4.5 text-indigo-400" />
                    Manajemen Sesi Auto-Login
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Ubah sistem penyimpanan otomatis kredensial email di penyimpanan browser lokal.
                  </p>
                </div>

                <div className="flex flex-col gap-3 py-1">
                  {/* Local Storage Auto Save Toggle */}
                  <div className="flex items-center justify-between bg-zinc-950/40 border border-white/5 p-3 rounded-lg">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-white">Auto-Login di Peramban</span>
                      <span className="text-[10px] text-zinc-400">Gunakan email ini saat muat ulang halaman</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        id="save-settings-storage-checkbox"
                        type="checkbox" 
                        checked={isAutoLoginEnabled}
                        onChange={(e) => {
                          setIsAutoLoginEnabled(e.target.checked);
                          localStorage.setItem("auto_login_enabled", e.target.checked ? "true" : "false");
                          if (e.target.checked) {
                            localStorage.setItem("auto_login_saved_email", email);
                            setSavedEmail(email);
                            logActivity("Konfigurasi disimpan: Auto-login diaktifkan.");
                          } else {
                            localStorage.removeItem("auto_login_saved_email");
                            setSavedEmail("");
                            logActivity("Konfigurasi disimpan: Auto-login dinonaktifkan.");
                          }
                        }}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {/* Clean credential action button */}
                  <button
                    id="wipe-local-data-btn"
                    onClick={handleWipeCredentials}
                    className="w-full py-2.5 px-4 rounded-lg bg-zinc-950/60 hover:bg-zinc-900 border border-white/5 hover:border-rose-500/40 text-xs text-zinc-300 hover:text-rose-300 font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus Semua Data auto_login Lokal
                  </button>
                </div>

                <div className="mt-auto border-t border-white/5 pt-4">
                  <div className="bg-indigo-950/30 border border-indigo-500/10 p-3 rounded-lg text-[11px] text-indigo-300 leading-relaxed flex items-start gap-2.5">
                    <Zap className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <p className="font-semibold text-white">Ingin menguji fitur auto-login?</p>
                      <p className="mt-1 text-zinc-400">Biarkan toggle aktif lalu segarkan halaman Anda. Sistem akan membawa Anda masuk secara otomatis dalam hitungan milidetik tanpa input!</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid Pane 2: THE ACTIVE INTERACTIVE CANVAS CONTROLLER */}
              <div id="canvas-control-pane" className="lg:col-span-4 glass-panel rounded-xl p-5 flex flex-col gap-4 border border-white/5 overflow-y-auto max-h-[350px] lg:max-h-full">
                <div>
                  <h3 className="text-white font-bold text-sm tracking-tight flex items-center gap-2 mb-1">
                    <Sliders className="w-4.5 h-4.5 text-indigo-400" />
                    Kontrol Engine HTML5 Canvas
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Modifikasi parameter render loop particle sistem dan grafis di belakang secara langsung.
                  </p>
                </div>

                {/* Particle velocity controls */}
                <div className="flex flex-col gap-3 py-1">
                  <div className="flex flex-col gap-1.5 bg-black/30 p-3 rounded-lg border border-white/5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400 font-medium">Kecepatan Animasi Partikel</span>
                      <span className="text-indigo-400 font-mono font-bold">{particleSpeed.toFixed(1)}x</span>
                    </div>
                    <input
                      id="particle-speed-range"
                      type="range"
                      min="0.1"
                      max="4"
                      step="0.1"
                      value={particleSpeed}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setParticleSpeed(val);
                        logActivity(`Kecepatan partikel diubah menjadi ${val}x`);
                      }}
                      className="w-full accent-indigo-500 bg-zinc-800 rounded-lg h-1"
                    />
                  </div>

                  {/* Particle color layout controls */}
                  <div className="flex flex-col gap-2 bg-black/30 p-3 rounded-lg border border-white/5">
                    <span className="text-xs text-zinc-400 font-medium">Skema Warna & Tema</span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => {
                          setParticleColorTheme("indigo");
                          logActivity("Tema palet warna dialihkan ke Indigo.");
                        }}
                        className={`py-1.5 px-2 rounded font-mono text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          particleColorTheme === "indigo"
                            ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/50"
                            : "bg-white/5 text-zinc-400 hover:text-zinc-200 border border-transparent"
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" /> Indigo
                      </button>
                      <button
                        onClick={() => {
                          setParticleColorTheme("emerald");
                          logActivity("Tema palet warna dialihkan ke Emerald.");
                        }}
                        className={`py-1.5 px-2 rounded font-mono text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          particleColorTheme === "emerald"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50"
                            : "bg-white/5 text-zinc-400 hover:text-zinc-200 border border-transparent"
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Emerald
                      </button>
                      <button
                        onClick={() => {
                          setParticleColorTheme("amber");
                          logActivity("Tema palet warna dialihkan ke Amber.");
                        }}
                        className={`py-1.5 px-2 rounded font-mono text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          particleColorTheme === "amber"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/50"
                            : "bg-white/5 text-zinc-400 hover:text-zinc-200 border border-transparent"
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Amber
                      </button>
                    </div>
                  </div>

                  {/* Grid Toggle */}
                  <div className="flex items-center justify-between p-2.5">
                    <span className="text-xs text-zinc-400">Aktifkan Hubungan Garis Network</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        id="grid-toggle-checkbox"
                        type="checkbox" 
                        checked={showNetworkGrid}
                        onChange={(e) => {
                          setShowNetworkGrid(e.target.checked);
                          logActivity(`Garis grid hubungan ${e.target.checked ? 'diaktifkan' : 'dinonaktifkan'}.`);
                        }}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {/* Mouse interaction toggle toggle */}
                  <div className="flex items-center justify-between p-2.5">
                    <span className="text-xs text-zinc-400">Gaya Gravitasi Kursor (Magnet)</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        id="gravity-toggle-checkbox"
                        type="checkbox" 
                        checked={isHoverGravityOn}
                        onChange={(e) => {
                          setIsHoverGravityOn(e.target.checked);
                          logActivity(`Tarikan magnet mouse ${e.target.checked ? 'diaktifkan' : 'dinonaktifkan'}.`);
                        }}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>

                {/* Visual tactile splash actions */}
                <button
                  id="burst-particles-btn"
                  onClick={() => {
                    const canvas = canvasRef.current;
                    if (canvas) {
                      triggerCanvasFeedbackAt(canvas.width / 2, canvas.height / 2);
                    }
                  }}
                  className="w-full mt-auto py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg text-xs border border-white/10 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Ledakkan Partikel di Tengah Canvas
                </button>
              </div>

              {/* Grid Pane 3: System Activities Event Logs lists */}
              <div className="lg:col-span-4 glass-panel rounded-xl p-5 flex flex-col gap-3.5 border border-white/5 overflow-hidden">
                <div className="shrink-0">
                  <h3 className="text-white font-bold text-sm tracking-tight flex items-center gap-2 mb-1">
                    <Activity className="w-4.5 h-4.5 text-indigo-400" />
                    Riwayat Aktivitas & Event
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Log aktivitas yang dihasilkan langsung oleh interaksi Anda secara real-time.
                  </p>
                </div>

                {/* Chronology visualizer */}
                <div className="flex-1 overflow-y-auto bg-black/40 border border-white/5 rounded-lg p-3 font-mono text-[11px] leading-relaxed flex flex-col gap-2 shadow-inner">
                  {activityLogs.length === 0 ? (
                    <span className="text-zinc-600 italic">Belum ada peristiwa yang direkam.</span>
                  ) : (
                    activityLogs.map((log, index) => (
                      <div key={index} className="text-zinc-300 border-l border-indigo-500/20 pl-2 py-0.5 break-all">
                        {log}
                      </div>
                    ))
                  )}
                </div>

                {/* Quick note informing users standard canvas interactivities */}
                <div className="text-[10px] text-zinc-500 bg-zinc-950/20 p-2.5 rounded border border-white/5 leading-normal shrink-0">
                  <span className="text-indigo-400 font-bold uppercase tracking-wide font-mono">Tip Interaktif:</span> Klik bebas di mana saja pada layar untuk melepaskan pulsa warna-warni yang ditarik langsung di HTML5 Canvas!
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* FOOTER BAR */}
      <footer className="w-full h-8 shrink-0 relative z-10 glass-panel border-t border-white/5 flex items-center justify-between px-6 px-10 text-[10px] text-zinc-500 font-mono">
        <span>Auto-Login Standard Sandbox © 2026</span>
        <span className="hidden sm:inline">React 19 + TypeScript + Pure Interactive 2D Context Canvas</span>
      </footer>
    </div>
  );
}
