import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import {
  Heart, ArrowRight, Shield, HeartPulse, Users, Activity, Utensils,
  BookOpen, Bell, ChevronDown, Mail, Phone, MapPin, Menu, X,
  Sparkles, TrendingUp, Clock, CheckCircle2, FileText, Play, BookMarked,
  ChevronLeft, ChevronRight, User2
} from "lucide-react";
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink,
  PaginationNext, PaginationPrevious, PaginationEllipsis
} from "@/components/ui/pagination";
import educationService, { EducationContent } from "@/services/educationService";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0, 0, 0.2, 1] as const } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.section>
  );
}

const POSTS_PER_PAGE = 6;

const typeIcons: Record<string, typeof FileText> = {
  article: FileText,
  video: Play,
  guide: BookMarked,
};

const Index = () => {
  const { isAuthenticated } = useAuth();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Parallax
  const { scrollY } = useScroll();
  const blobY = useTransform(scrollY, [0, 600], [0, -80]);
  const heroTextY = useTransform(scrollY, [0, 600], [0, -180]);
  const statsOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const statsY = useTransform(scrollY, [0, 400], [0, 60]);
  const gridY = useTransform(scrollY, [0, 600], [0, -30]);

  // Posts state
  const [posts, setPosts] = useState<EducationContent[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const totalPages = Math.max(1, Math.ceil(totalPosts / POSTS_PER_PAGE));

  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = "/dashboard";
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fetch posts
  useEffect(() => {
    let cancelled = false;
    const fetchPosts = async () => {
      setPostsLoading(true);
      try {
        const res = await educationService.getAll({ page: currentPage, per_page: POSTS_PER_PAGE, status: 'published' });
        if (!cancelled && res.success) {
          const data = res.data as any;
          if (Array.isArray(data)) {
            setPosts(data);
            setTotalPosts(res.meta?.total ?? data.length);
          } else if (data?.content) {
            setPosts(data.content);
            setTotalPosts(data.total ?? res.meta?.total ?? data.content.length);
          } else {
            setPosts([]);
            setTotalPosts(0);
          }
        }
      } catch {
        if (!cancelled) {
          setPosts([]);
          setTotalPosts(0);
        }
      } finally {
        if (!cancelled) setPostsLoading(false);
      }
    };
    fetchPosts();
    return () => { cancelled = true; };
  }, [currentPage]);

  if (isAuthenticated) return null;

  const navLinks = [
    { label: "Home", href: "#home" },
    { label: "Services", href: "#services" },
    { label: "Posts", href: "#posts" },
    { label: "About", href: "#about" },
    { label: "Contact", href: "#contact" },
  ];

  const services = [
    { icon: HeartPulse, title: "Patient Monitoring", desc: "Track glucose levels, medication adherence, and health metrics in real-time with smart alerts.", color: "text-primary" },
    { icon: Shield, title: "Prevention Education", desc: "Evidence-based learning modules to help prevent diabetes through lifestyle modifications.", color: "text-blue-400" },
    { icon: Utensils, title: "Diet & Nutrition", desc: "Personalized meal plans and healthy recipes designed for glycemic control and wellness.", color: "text-amber-400" },
    { icon: Activity, title: "Exercise Tracking", desc: "Log activities, set fitness goals, and monitor how exercise impacts your blood sugar.", color: "text-emerald-400" },
    { icon: Bell, title: "Smart Reminders", desc: "Automated medication reminders and glucose check notifications sent directly to your email.", color: "text-purple-400" },
    { icon: BookOpen, title: "Health Library", desc: "Curated educational content covering diabetes management, prevention, and healthy living.", color: "text-rose-400" },
  ];

  const stats = [
    { value: "10K+", label: "Active Users", icon: Users },
    { value: "95%", label: "Adherence Rate", icon: TrendingUp },
    { value: "24/7", label: "Health Monitoring", icon: Clock },
    { value: "500+", label: "Education Resources", icon: BookOpen },
  ];

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      prevention: "bg-blue-500/15 text-blue-400 border-blue-500/20",
      management: "bg-primary/15 text-primary border-primary/20",
      nutrition: "bg-amber-500/15 text-amber-400 border-amber-500/20",
      exercise: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
      lifestyle: "bg-purple-500/15 text-purple-400 border-purple-500/20",
    };
    return colors[category?.toLowerCase()] || "bg-muted text-muted-foreground border-border/40";
  };

  const paginationRange = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('ellipsis');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden scroll-smooth">
      {/* ── Navbar ── */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/80 backdrop-blur-xl border-b border-border/40 shadow-lg shadow-black/10"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 group-hover:bg-primary/25 transition-colors">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              Diabetes<span className="text-primary">Care</span>
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary/60">
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild size="sm" className="gap-1.5 shadow-lg shadow-primary/25">
              <Link to="/register">
                Get Started <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          <button className="md:hidden rounded-lg p-2 text-muted-foreground hover:bg-secondary/60" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenu && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="border-t border-border/40 bg-background/95 backdrop-blur-xl px-6 pb-6 pt-4 md:hidden">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setMobileMenu(false)} className="block rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60">
                {l.label}
              </a>
            ))}
            <div className="mt-4 flex flex-col gap-2">
              <Button asChild variant="outline" className="w-full"><Link to="/login">Sign In</Link></Button>
              <Button asChild className="w-full gap-1.5"><Link to="/register">Get Started <ArrowRight className="h-3.5 w-3.5" /></Link></Button>
            </div>
          </motion.div>
        )}
      </nav>

      {/* ── Hero with Parallax ── */}
      <section id="home" className="relative flex min-h-screen items-center justify-center px-6 pt-20 overflow-hidden">
        {/* Parallax ambient blobs */}
        <motion.div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ y: blobY }}>
          <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-primary/8 blur-[120px]" />
          <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-blue-500/6 blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[800px] w-[800px] rounded-full bg-primary/4 blur-[150px]" />
        </motion.div>

        {/* Parallax grid pattern */}
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            y: gridY,
          }}
        />

        <motion.div className="relative z-10 mx-auto max-w-5xl text-center" style={{ y: heroTextY }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm text-primary"
          >
            <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
              <Sparkles className="h-3.5 w-3.5" />
            </motion.span>
            Diabetes Prevention & Control Platform
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl"
          >
            Take Control of Your{" "}
            <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
              Health Journey
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
          >
            A comprehensive platform for diabetes education, prevention, and patient care.
            Track your health, manage medications, and access expert resources — all in one place.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            <Button asChild size="lg" className="gap-2 px-8 text-base shadow-xl shadow-primary/30 hover:shadow-primary/40 transition-shadow">
              <Link to="/register">Create Free Account <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2 px-8 text-base border-border/60 hover:bg-secondary/60">
              <a href="#services">Explore Features <ChevronDown className="h-4 w-4" /></a>
            </Button>
          </motion.div>

          {/* Stats bar with fade-on-scroll */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            style={{ opacity: statsOpacity, y: statsY }}
            className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4"
          >
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm p-4">
                <s.icon className="mx-auto mb-2 h-5 w-5 text-primary/70" />
                <div className="text-2xl font-bold text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── Services ── */}
      <AnimatedSection className="px-6 py-24">
        <div id="services" className="mx-auto max-w-7xl scroll-mt-24">
          <motion.div variants={fadeUp} className="mb-16 text-center">
            <span className="mb-3 inline-block rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-primary">Services</span>
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Everything You Need</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">Comprehensive tools for diabetes management, prevention education, and overall wellness.</p>
          </motion.div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <motion.div key={s.title} variants={fadeUp}>
                <Card className="group relative overflow-hidden border-border/40 bg-card/60 backdrop-blur-sm p-6 transition-all duration-300 hover:border-primary/30 hover:bg-card/80 hover:shadow-xl hover:shadow-primary/5 h-full">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/80 group-hover:bg-primary/15 transition-colors">
                      <s.icon className={`h-6 w-6 ${s.color}`} />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">{s.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ── Latest Posts ── */}
      <AnimatedSection className="px-6 py-24">
        <div id="posts" className="mx-auto max-w-7xl scroll-mt-24">
          <motion.div variants={fadeUp} className="mb-16 text-center">
            <span className="mb-3 inline-block rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-primary">Education</span>
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Latest Posts</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Stay informed with our latest articles, videos, and guides on diabetes management and prevention.
            </p>
          </motion.div>

          {postsLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border/40 bg-card/40 p-6 animate-pulse">
                  <div className="h-40 rounded-lg bg-muted/50 mb-4" />
                  <div className="h-4 w-2/3 rounded bg-muted/50 mb-2" />
                  <div className="h-3 w-full rounded bg-muted/30 mb-1" />
                  <div className="h-3 w-4/5 rounded bg-muted/30" />
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <motion.div variants={fadeUp} className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 mb-4">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No posts yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm">Educational content will appear here once published by our team.</p>
            </motion.div>
          ) : (
            <>
              {/* Featured Post — first post on page 1 */}
              {currentPage === 1 && posts.length > 0 && (() => {
                const featured = posts[0];
                const FeaturedIcon = typeIcons[featured.type || (featured as any).content_type] || FileText;
                return (
                  <motion.div variants={fadeUp} className="mb-8">
                    <Card className="group relative overflow-hidden border-primary/20 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-primary/4 opacity-60 group-hover:opacity-100 transition-opacity" />
                      <div className="relative grid md:grid-cols-2 gap-0">
                        {/* Featured thumbnail */}
                        <div className="relative h-56 md:h-full min-h-[240px] bg-gradient-to-br from-primary/15 via-muted/40 to-muted/20 flex items-center justify-center overflow-hidden">
                          <FeaturedIcon className="h-20 w-20 text-primary/20 group-hover:text-primary/30 transition-colors" />
                          <div className="absolute top-4 left-4 flex items-center gap-2">
                            <Badge className="bg-primary text-primary-foreground border-0 shadow-lg shadow-primary/30 text-xs font-semibold gap-1">
                              <Sparkles className="h-3 w-3" /> Featured
                            </Badge>
                            <Badge variant="outline" className={`text-xs border ${getCategoryColor(featured.category)}`}>
                              {featured.category}
                            </Badge>
                          </div>
                          {(featured.type || (featured as any).content_type) && (
                            <div className="absolute bottom-4 left-4">
                              <Badge variant="outline" className="text-xs border-border/40 bg-background/60 backdrop-blur-sm text-muted-foreground capitalize">
                                {featured.type || (featured as any).content_type}
                              </Badge>
                            </div>
                          )}
                        </div>
                        {/* Featured content */}
                        <div className="relative flex flex-col justify-center p-8">
                          <h3 className="mb-3 text-xl font-bold leading-snug group-hover:text-primary transition-colors sm:text-2xl">
                            {featured.title}
                          </h3>
                          <p className="text-sm text-muted-foreground leading-relaxed mb-6 line-clamp-3">
                            {featured.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <User2 className="h-3.5 w-3.5" /> {featured.author || "DiabetesCare"}
                            </span>
                            {featured.read_time && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {featured.read_time} min read
                              </span>
                            )}
                            {featured.published_at && (
                              <span>
                                {new Date(featured.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </span>
                            )}
                          </div>
                          <div className="mt-6">
                            <Button asChild size="sm" variant="outline" className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10">
                              <Link to="/login">
                                Read More <ArrowRight className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })()}

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {(currentPage === 1 ? posts.slice(1) : posts).map((post) => {
                  const TypeIcon = typeIcons[post.type || (post as any).content_type] || FileText;
                  return (
                    <motion.div key={post.id} variants={fadeUp}>
                      <Card className="group relative overflow-hidden border-border/40 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:bg-card/80 hover:shadow-xl hover:shadow-primary/5 h-full flex flex-col">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        {/* Thumbnail area */}
                        <div className="relative h-44 bg-gradient-to-br from-muted/60 to-muted/30 flex items-center justify-center overflow-hidden">
                          <TypeIcon className="h-12 w-12 text-muted-foreground/40 group-hover:text-primary/40 transition-colors" />
                          <div className="absolute top-3 left-3">
                            <Badge variant="outline" className={`text-xs border ${getCategoryColor(post.category)}`}>
                              {post.category}
                            </Badge>
                          </div>
                          {(post.type || (post as any).content_type) && (
                            <div className="absolute top-3 right-3">
                              <Badge variant="outline" className="text-xs border-border/40 bg-background/60 backdrop-blur-sm text-muted-foreground capitalize">
                                {post.type || (post as any).content_type}
                              </Badge>
                            </div>
                          )}
                        </div>
                        {/* Content */}
                        <div className="relative flex flex-col flex-1 p-5">
                          <h3 className="mb-2 text-base font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                            {post.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                            {post.description}
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <User2 className="h-3.5 w-3.5" />
                              <span>{post.author || "DiabetesCare"}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              {post.read_time && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> {post.read_time} min
                                </span>
                              )}
                              {post.published_at && (
                                <span>
                                  {new Date(post.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-10 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      {paginationRange().map((page, i) =>
                        page === 'ellipsis' ? (
                          <PaginationItem key={`e-${i}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        ) : (
                          <PaginationItem key={page}>
                            <PaginationLink
                              isActive={currentPage === page}
                              onClick={() => setCurrentPage(page as number)}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      )}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>
      </AnimatedSection>

      {/* ── About ── */}
      <AnimatedSection className="px-6 py-24">
        <div id="about" className="mx-auto max-w-7xl scroll-mt-24">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <motion.div variants={fadeUp}>
              <span className="mb-3 inline-block rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-primary">About Us</span>
              <h2 className="mb-6 text-3xl font-bold sm:text-4xl">
                Empowering Health Through <span className="text-primary">Education</span>
              </h2>
              <p className="mb-6 leading-relaxed text-muted-foreground">
                DiabetesCare is an education platform built to support both diabetes patients and at-risk individuals.
                Our mission is to provide accessible, evidence-based tools that help users understand, prevent, and manage diabetes effectively.
              </p>
              <ul className="space-y-4">
                {[
                  "Real-time glucose tracking with smart alerts",
                  "Automated medication reminders via email",
                  "Role-based dashboards for patients & prevention users",
                  "Verified accounts with secure email authentication",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div variants={fadeUp} className="relative">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "For Patients", desc: "Manage medications, track glucose, and stay on top of your health.", icon: HeartPulse, bg: "from-primary/20 to-primary/5" },
                  { label: "For Prevention", desc: "Learn about diabetes prevention through education and lifestyle changes.", icon: Shield, bg: "from-blue-500/20 to-blue-500/5" },
                  { label: "For Admins", desc: "Manage users, content, and monitor platform analytics.", icon: Users, bg: "from-purple-500/20 to-purple-500/5" },
                  { label: "Email Verified", desc: "Secure account creation with email verification flow.", icon: Mail, bg: "from-amber-500/20 to-amber-500/5" },
                ].map((c) => (
                  <Card key={c.label} className={`border-border/40 bg-gradient-to-br ${c.bg} p-5`}>
                    <c.icon className="mb-3 h-6 w-6 text-foreground/80" />
                    <h4 className="mb-1 text-sm font-semibold">{c.label}</h4>
                    <p className="text-xs leading-relaxed text-muted-foreground">{c.desc}</p>
                  </Card>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {/* ── Contact ── */}
      <AnimatedSection className="px-6 py-24">
        <div id="contact" className="mx-auto max-w-7xl scroll-mt-24">
          <motion.div variants={fadeUp} className="mb-16 text-center">
            <span className="mb-3 inline-block rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-primary">Contact</span>
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Get In Touch</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">Have questions about the platform? We'd love to hear from you.</p>
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-2">
            <motion.div variants={fadeUp}>
              <Card className="border-border/40 bg-card/60 backdrop-blur-sm p-8">
                <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Name</label>
                      <input className="w-full rounded-lg border border-border/60 bg-secondary/40 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" placeholder="Your name" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Email</label>
                      <input type="email" className="w-full rounded-lg border border-border/60 bg-secondary/40 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" placeholder="you@example.com" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Message</label>
                    <textarea rows={4} className="w-full rounded-lg border border-border/60 bg-secondary/40 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none" placeholder="How can we help?" />
                  </div>
                  <Button className="w-full gap-2 shadow-lg shadow-primary/25">Send Message <ArrowRight className="h-4 w-4" /></Button>
                </form>
              </Card>
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-col justify-center space-y-8">
              {[
                { icon: Mail, label: "Email", value: "support@diabetescare.edu", href: "mailto:support@diabetescare.edu" },
                { icon: Phone, label: "Phone", value: "+1 (555) 123-4567", href: "tel:+15551234567" },
                { icon: MapPin, label: "Location", value: "University Health Center, Campus Drive", href: "#" },
              ].map((c) => (
                <a key={c.label} href={c.href} className="group flex items-start gap-4 rounded-xl border border-border/40 bg-card/40 p-5 transition-all hover:border-primary/30 hover:bg-card/60">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <c.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">{c.label}</div>
                    <div className="text-sm text-muted-foreground">{c.value}</div>
                  </div>
                </a>
              ))}
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {/* ── CTA ── */}
      <AnimatedSection className="px-6 py-24">
        <motion.div variants={fadeUp} className="mx-auto max-w-4xl rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card/80 to-card/60 p-12 text-center backdrop-blur-sm">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Ready to Get Started?</h2>
          <p className="mx-auto mb-8 max-w-xl text-muted-foreground">Create your free account today and take the first step towards better diabetes management and prevention.</p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="gap-2 px-8 shadow-xl shadow-primary/30">
              <Link to="/register">Create Free Account <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="px-8 border-border/60">
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </motion.div>
      </AnimatedSection>

      {/* ── Footer ── */}
      <footer className="border-t border-border/40 px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
                <Heart className="h-4 w-4 text-primary" />
              </div>
              <span className="font-bold">Diabetes<span className="text-primary">Care</span></span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              {navLinks.map((l) => (
                <a key={l.href} href={l.href} className="hover:text-foreground transition-colors">{l.label}</a>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} DiabetesCare. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
