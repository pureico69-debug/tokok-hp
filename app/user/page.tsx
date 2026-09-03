"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { 
  ShoppingBag, Heart, User, Search, ShieldCheck, 
  RefreshCw, RotateCcw, Headphones, ArrowRight, 
  Flame, Sparkles, Smartphone, LogOut, X, Trash2,
  Settings, Package, Clock, CheckSquare, Square,
  ChevronLeft, ChevronRight
} from "lucide-react";

export default function PureiUserCatalog() {
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  
  // State Top Bar Teks Promo (Settings / Announcements)
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);

  // State & Ref Carousel Banner
  const [banners, setBanners] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  // State produk & wishlist
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [loadingWishlist, setLoadingWishlist] = useState(false);
  const [selectedWishlistIds, setSelectedWishlistIds] = useState<string[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // State & Data Acuan untuk Simulasi Trade-In Interaktif yang Terhubung Supabase
  const [isTradeInModalOpen, setIsTradeInModalOpen] = useState(false);
  const [priceListData, setPriceListData] = useState<any[]>([]);
  const [simModel, setSimModel] = useState("iPhone 13");
  const [simStorage, setSimStorage] = useState("128GB");
  const [simRegion, setSimRegion] = useState("");
  const [availableRegions, setAvailableRegions] = useState<string[]>([]);
  const [simBh, setSimBh] = useState(85);
  const [simCondition, setSimCondition] = useState("Mulus (Like New)");

  const router = useRouter();
  const supabase = createClient();

  // 1. Fetch Top Bar Announcement Teks dari Supabase
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const { data: announcementsData } = await supabase
          .from("announcements")
          .select("text");

        if (announcementsData && announcementsData.length > 0) {
          setAnnouncements(announcementsData.map((item: any) => item.text));
        } else {
          const { data: settingData } = await supabase
            .from("settings")
            .select("value")
            .eq("key", "announcement_text")
            .single();

          if (settingData?.value) {
            setAnnouncements([settingData.value]);
          }
        }
      } catch (err) {
        console.error("Error fetching announcements:", err);
      }
    };

    fetchAnnouncements();
  }, [supabase]);

  // Rotasi Teks Promo Otomatis
  useEffect(() => {
    if (announcements.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentAnnouncementIndex((prev) => (prev + 1) % announcements.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [announcements]);

  // 2. Fetch Banners Gambar dari Supabase
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const { data, error } = await supabase
          .from("banners")
          .select("*")
          .order("id", { ascending: true });

        if (!error && data) {
          setBanners(data);
        }
      } catch (err) {
        console.error("Error fetching banners:", err);
      }
    };

    fetchBanners();
  }, [supabase]);

  // 3. Fetch Data Acuan Harga dari Tabel price_list Supabase untuk Kalkulator Trade-In & Dinamis Region
  useEffect(() => {
    const fetchPriceList = async () => {
      try {
        const { data, error } = await supabase
          .from("price_list")
          .select("*")
          .eq("status", "Active");

        if (!error && data && data.length > 0) {
          setPriceListData(data);

          // Ambil list region unik secara dinamis langsung dari price_list Supabase
          const uniqueRegions = Array.from(new Set(data.map((item: any) => item.region).filter(Boolean)));
          setAvailableRegions(uniqueRegions);
          
          if (uniqueRegions.length > 0 && !uniqueRegions.includes(simRegion)) {
            setSimRegion(uniqueRegions[0]);
          }
        }
      } catch (err) {
        console.error("Error fetching price list for trade-in:", err);
      }
    };

    fetchPriceList();
  }, [supabase]);

  // Logika Kalkulator Estimasi Simulasi Trade-In Berdasarkan Database price_list
  const calculateSimEstimate = () => {
    // Cari data acuan harga yang cocok dari price list berdasarkan pilihan user
    const currentPriceItem = priceListData.find(
      (item) => 
        item.model?.toLowerCase() === simModel.toLowerCase() && 
        item.storage?.toLowerCase() === simStorage.toLowerCase() && 
        item.region?.toLowerCase() === simRegion.toLowerCase()
    );

    // Gunakan harga dari database jika ada, atau fallback ke nilai default jika belum diinput staff
    let baseMin = currentPriceItem ? Number(currentPriceItem.trade_in_min) : 7000000;
    let baseMax = currentPriceItem ? Number(currentPriceItem.trade_in_max) : 7500000;

    // Penyesuaian susut nilai berdasarkan kondisi fisik & battery health
    if (simBh < 85) {
      const deduction = (85 - simBh) * 50000;
      baseMin = Math.max(0, baseMin - deduction);
      baseMax = Math.max(0, baseMax - deduction);
    }
    if (simCondition.includes("Baret")) {
      baseMin -= 400000;
      baseMax -= 400000;
    }
    if (simCondition.includes("Minus")) {
      baseMin -= 1000000;
      baseMax -= 1000000;
    }

    const min = Math.max(0, baseMin);
    const max = Math.max(0, baseMax);
    return { min, max };
  };

  const simResult = calculateSimEstimate();

  // Fungsi Navigasi Slide
  const scrollToSlide = (index: number) => {
    if (carouselRef.current) {
      const slideWidth = carouselRef.current.clientWidth;
      carouselRef.current.scrollTo({
        left: slideWidth * index,
        behavior: "smooth"
      });
      setCurrentSlide(index);
    }
  };

  const handleNextSlide = () => {
    const totalSlides = 1 + banners.length;
    const nextIndex = (currentSlide + 1) % totalSlides;
    scrollToSlide(nextIndex);
  };

  const handlePrevSlide = () => {
    const totalSlides = 1 + banners.length;
    const prevIndex = (currentSlide - 1 + totalSlides) % totalSlides;
    scrollToSlide(prevIndex);
  };

  useEffect(() => {
    const checkUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        fetchWishlist(session.user.id);
      }
      setLoadingUser(false);
    };

    checkUserSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchWishlist(session.user.id);
      } else {
        setWishlistIds([]);
        setWishlistItems([]);
        setSelectedWishlistIds([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchWishlist = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("wishlists")
        .select("product_id")
        .eq("user_id", userId);

      if (!error && data) {
        const ids = data.map((item: any) => item.product_id);
        setWishlistIds(ids);
      }
    } catch (err) {
      console.error("Error fetching wishlist:", err);
    }
  };

  const fetchWishlistDetails = async () => {
    if (!user || wishlistIds.length === 0) {
      setWishlistItems([]);
      setSelectedWishlistIds([]);
      return;
    }

    setLoadingWishlist(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .in("id", wishlistIds);

      if (!error && data) {
        setWishlistItems(data);
        setSelectedWishlistIds(data.map((item: any) => item.id));
      }
    } catch (err) {
      console.error("Error fetching wishlist details:", err);
    } finally {
      setLoadingWishlist(false);
    }
  };

  const handleOpenWishlist = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    fetchWishlistDetails();
    setIsWishlistOpen(true);
  };

  const toggleWishlist = async (productId: string) => {
    if (!user) {
      router.push("/login");
      return;
    }

    const isAlreadyLiked = wishlistIds.includes(productId);

    if (isAlreadyLiked) {
      const { error } = await supabase
        .from("wishlists")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId);

      if (!error) {
        const updatedIds = wishlistIds.filter((id) => id !== productId);
        setWishlistIds(updatedIds);
        setWishlistItems(wishlistItems.filter((item) => item.id !== productId));
        setSelectedWishlistIds(selectedWishlistIds.filter((id) => id !== productId));
      }
    } else {
      const { error } = await supabase
        .from("wishlists")
        .insert([{ user_id: user.id, product_id: productId }]);

      if (!error) {
        setWishlistIds([...wishlistIds, productId]);
        const { data } = await supabase
          .from("products")
          .select("*")
          .eq("id", productId)
          .single();
        
        if (data) {
          setWishlistItems([...wishlistItems, data]);
          setSelectedWishlistIds([...selectedWishlistIds, productId]);
        }
      }
    }
  };

  const toggleSelectWishlistItem = (productId: string) => {
    if (selectedWishlistIds.includes(productId)) {
      setSelectedWishlistIds(selectedWishlistIds.filter((id) => id !== productId));
    } else {
      setSelectedWishlistIds([...selectedWishlistIds, productId]);
    }
  };

  const handleSelectAllToggle = () => {
    if (selectedWishlistIds.length === wishlistItems.length) {
      setSelectedWishlistIds([]);
    } else {
      setSelectedWishlistIds(wishlistItems.map((item) => item.id));
    }
  };

  const handleBuyNow = (productId: string) => {
    if (!user) {
      router.push("/login");
      return;
    }
    router.push(`/user/checkout?items=${productId}`);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        let query = supabase.from("products").select("*");

        if (selectedCategory !== "Semua") {
          query = query.ilike("name", `%${selectedCategory.replace(" Series", "")}%`);
        }

        if (searchQuery.trim() !== "") {
          query = query.ilike("name", `%${searchQuery}%`);
        }

        const { data, error } = await query;

        if (!error) {
          setProducts(data || []);
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [selectedCategory, searchQuery, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setWishlistIds([]);
    setWishlistItems([]);
    setSelectedWishlistIds([]);
    setIsWishlistOpen(false);
    setIsProfileOpen(false);
    router.refresh();
  };

  const categories = [
    { name: "Semua", icon: Smartphone },
    { name: "iPhone 15 Series", icon: Sparkles },
    { name: "iPhone 14 Series", icon: Sparkles },
    { name: "iPhone 13 Series", icon: Sparkles },
    { name: "iPhone 12 Series", icon: Smartphone },
    { name: "iPhone 11 Series", icon: Smartphone },
    { name: "Accessories", icon: Flame },
  ];

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-neutral-900 font-sans selection:bg-amber-400 selection:text-neutral-950">
      
      {/* Top Bar Teks Promo Dinamis */}
      <div className="bg-neutral-900 text-white text-[11px] py-2 px-4 text-center font-medium tracking-wide flex items-center justify-center gap-2 transition-all duration-300">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="truncate">
          {announcements.length > 0 
            ? announcements[currentAnnouncementIndex] 
            : "Garansi Toko 30 Hari & 100% Original Tested • Trade-In HP Lama Anda Sekarang!"}
        </span>
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-neutral-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center focus:outline-none">
              <img 
                src="/logo-purei-hitam.png" 
                alt="PUREI Logo" 
                className="h-9 sm:h-19 w-auto object-contain"
              />
            </a>
          </div>

          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                <Search className="w-4 h-4" />
              </span>
              <input 
                type="text"
                placeholder="Cari iPhone impianmu (contoh: 13 Pro Max)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-100/80 border border-neutral-200 rounded-full pl-10 pr-4 py-2 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-neutral-400 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleOpenWishlist}
              className="p-2 rounded-full hover:bg-neutral-100 text-neutral-700 transition-colors relative cursor-pointer"
            >
              <Heart className="w-5 h-5" />
              {wishlistIds.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center">
                  {wishlistIds.length}
                </span>
              )}
            </button>
            <button className="p-2 rounded-full hover:bg-neutral-100 text-neutral-700 transition-colors relative cursor-pointer">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-4 h-4 bg-amber-500 text-neutral-950 font-bold text-[10px] rounded-full flex items-center justify-center">
                0
              </span>
            </button>

            {!loadingUser && (
              user ? (
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="w-10 h-10 rounded-full bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 flex items-center justify-center text-neutral-700 transition-all cursor-pointer"
                  >
                    <User className="w-5 h-5" />
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white border border-neutral-200 rounded-3xl shadow-2xl py-3 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-5 py-3 border-b border-neutral-100 space-y-0.5">
                        <p className="text-neutral-400 text-[11px]">Signed in as</p>
                        <p className="font-bold text-neutral-900 truncate font-mono">{user.email}</p>
                      </div>
                      <div className="py-2">
                        <a href="/user/profil" onClick={() => setIsProfileOpen(false)} className="flex items-center px-5 py-2.5 text-neutral-700 hover:bg-neutral-100 font-medium transition-colors">Profil</a>
                        <a href="/user/setting" onClick={() => setIsProfileOpen(false)} className="flex items-center px-5 py-2.5 text-neutral-700 hover:bg-neutral-100 font-medium transition-colors">Setting</a>
                        <a href="/user/riwayat" onClick={() => setIsProfileOpen(false)} className="flex items-center px-5 py-2.5 text-neutral-700 hover:bg-neutral-100 font-medium transition-colors">Riwayat</a>
                      </div>
                      <div className="pt-2 border-t border-neutral-100">
                        <button onClick={handleLogout} className="w-full text-left px-5 py-2.5 text-rose-600 hover:bg-rose-50 font-bold transition-colors cursor-pointer">Keluar</button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <a href="/login" className="hidden sm:inline-flex items-center gap-1.5 bg-neutral-900 hover:bg-amber-400 hover:text-neutral-950 text-white px-4 py-2 rounded-full text-xs font-bold transition-all shadow-xs">
                  <User className="w-3.5 h-3.5" />
                  <span>Masuk / Akun</span>
                </a>
              )
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION DENGAN CAROUSEL BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="relative w-full overflow-hidden rounded-3xl shadow-xl bg-neutral-900 group">
          
          {/* Scrollable Container */}
          <div 
            ref={carouselRef}
            className="w-full flex overflow-x-auto snap-x snap-mandatory scrollbar-none scroll-smooth"
          >
            {/* SLIDE 1: DEFAULT HERO BANNER */}
            <div className="min-w-full w-full flex-shrink-0 snap-center">
              <div className="relative bg-neutral-900 text-white p-6 sm:p-12 flex flex-col justify-between min-h-[380px] sm:min-h-[420px]">
                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>

                <div className="max-w-xl space-y-4 relative z-10">
                  <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 px-3 py-1 rounded-full text-[11px] font-semibold text-amber-300 backdrop-blur-md">
                    <Flame className="w-3.5 h-3.5" />
                    <span>Pusat iPhone Second Terbaik & Terpercaya</span>
                  </div>
                  <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                    Upgrade Gadget Tanpa Bikin Dompet Jerit.
                  </h1>
                  <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-md">
                    Semua unit di PUREI lolos 32 titik uji kualitas, baterai sehat, fisik mulus bergaransi, dan siap pakai.
                  </p>
                  
                  {/* Tombol Aksi Hero: Belanja vs Simulasi Trade-In Modal Popup */}
                  <div className="pt-2 flex items-center gap-3">
                    <a href="#katalog" className="bg-amber-400 hover:bg-amber-300 text-neutral-950 px-6 py-3 rounded-full text-xs font-extrabold transition-all shadow-lg flex items-center gap-2">
                      <span>Belanja Sekarang</span>
                      <ArrowRight className="w-4 h-4" />
                    </a>
                    <button 
                      onClick={() => setIsTradeInModalOpen(true)}
                      className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-3 rounded-full text-xs font-bold transition-all backdrop-blur-md cursor-pointer"
                    >
                      Simulasi Trade-In
                    </button>
                  </div>
                </div>

                <div className="relative z-10 mt-8 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <p className="text-neutral-400 text-[10px] uppercase font-semibold">Ready Stock</p>
                    <p className="font-bold text-white text-sm sm:text-base">50+ Unit Pilihan</p>
                  </div>
                  <div>
                    <p className="text-neutral-400 text-[10px] uppercase font-semibold">Garansi Fisik</p>
                    <p className="font-bold text-white text-sm sm:text-base">30 Hari Tukar Unit</p>
                  </div>
                  <div>
                    <p className="text-neutral-400 text-[10px] uppercase font-semibold">Originalitas</p>
                    <p className="font-bold text-white text-sm sm:text-base">100% Original Part</p>
                  </div>
                  <div>
                    <p className="text-neutral-400 text-[10px] uppercase font-semibold">Kepuasan</p>
                    <p className="font-bold text-white text-sm sm:text-base">4.9 / 5.0 Rating</p>
                  </div>
                </div>
              </div>
            </div>

            {/* SLIDE BANNER DARI SUPABASE */}
            {banners.map((banner, idx) => (
              <div key={banner.id || idx} className="min-w-full w-full flex-shrink-0 snap-center relative">
                {banner.link_url ? (
                  <a href={banner.link_url} className="block w-full h-full">
                    <img 
                      src={banner.image_url} 
                      alt={banner.title || `Banner ${idx + 1}`} 
                      className="w-full h-[380px] sm:h-[420px] object-cover"
                    />
                  </a>
                ) : (
                  <img 
                    src={banner.image_url} 
                    alt={banner.title || `Banner ${idx + 1}`} 
                    className="w-full h-[380px] sm:h-[420px] object-cover"
                  />
                )}
              </div>
            ))}

          </div>

          {/* Navigasi Panah Kiri & Kanan */}
          {banners.length > 0 && (
            <>
              <button 
                onClick={handlePrevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/70 flex items-center justify-center transition-all cursor-pointer opacity-80 group-hover:opacity-100"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button 
                onClick={handleNextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/70 flex items-center justify-center transition-all cursor-pointer opacity-80 group-hover:opacity-100"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              {/* Dots Indicator */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full">
                {[...Array(1 + banners.length)].map((_, idx) => (
                  <button 
                    key={idx}
                    onClick={() => scrollToSlide(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      currentSlide === idx ? "w-6 bg-amber-400" : "w-2 bg-white/50 hover:bg-white"
                    }`}
                  />
                ))}
              </div>
            </>
          )}

        </div>
      </section>

      {/* Features Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-900">Garansi Toko</p>
              <p className="text-[10px] text-neutral-500">Aman & Terpercaya</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-900">Trade-In Mudah</p>
              <p className="text-[10px] text-neutral-500">Tukar HP lama ke baru</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-900">32 Titik Uji</p>
              <p className="text-[10px] text-neutral-500">Lolos Quality Control</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-900">Admin Responsif</p>
              <p className="text-[10px] text-neutral-500">Konsultasi gratis</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Filter */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6" id="katalog">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-neutral-900 tracking-tight">Katalog Pilihan PUREI</h2>
            <p className="text-xs text-neutral-500">Pilih seri iPhone second berkualitas tinggi sesuai budget kamu</p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            {categories.map((cat) => {
              const IconComp = cat.icon;
              const isActive = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive 
                      ? "bg-neutral-900 text-white shadow-sm" 
                      : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100"
                  }`}
                >
                  <IconComp className={`w-3.5 h-3.5 ${isActive ? "text-amber-400" : "text-neutral-400"}`} />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Grid */}
        {loadingProducts ? (
          <div className="text-center py-16 text-xs text-neutral-400">
            Memuat katalog produk dari database...
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 bg-white border border-neutral-200/80 rounded-2xl">
            <p className="text-sm font-bold text-neutral-800">Belum ada produk yang tersedia</p>
            <p className="text-xs text-neutral-400 mt-1">Coba kata kunci lain atau ubah kategori filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {products.map((item) => {
              const isWishlisted = wishlistIds.includes(item.id);
              return (
                <div 
                  key={item.id}
                  className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="relative bg-neutral-100 aspect-square overflow-hidden">
                      <span className="absolute top-3 left-3 z-10 bg-neutral-900/80 backdrop-blur-md text-amber-300 text-[10px] font-bold px-2.5 py-1 rounded-full">
                        {item.badge || "Ready"}
                      </span>
                      <button 
                        onClick={() => toggleWishlist(item.id)}
                        className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-all shadow-xs cursor-pointer ${
                          isWishlisted 
                            ? "bg-rose-500 text-white" 
                            : "bg-white/80 text-neutral-700 hover:text-rose-500"
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isWishlisted ? "fill-white" : ""}`} />
                      </button>
                      <img 
                        src={item.images && item.images.length > 0 ? item.images[0] : "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=600"} 
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    </div>

                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {item.storage || "128GB"}
                        </span>
                        <div className="text-[10px] font-semibold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200 truncate max-w-[140px]" title={item.imei_status}>
                          {item.imei_status || "Garansi Resmi"}
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-neutral-900 group-hover:text-amber-600 transition-colors">
                        {item.name}
                      </h3>

                      <div className="bg-neutral-50 rounded-xl p-2.5 space-y-1 border border-neutral-100 text-[11px]">
                        <div className="flex items-center justify-between text-neutral-600">
                          <span>Battery Health:</span>
                          <strong className="text-neutral-900 font-mono">{item.battery_health || item.batteryHealth || "90%"}</strong>
                        </div>
                        <div className="flex items-center justify-between text-neutral-600">
                          <span>Kondisi Fisik:</span>
                          <strong className="text-neutral-900">{item.condition || "Mulus 99%"}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0 flex items-center justify-between border-t border-neutral-100 mt-2">
                    <div>
                      {item.original_price && (
                        <p className="text-[10px] text-neutral-400 line-through">Rp {Number(item.original_price).toLocaleString("id-ID")}</p>
                      )}
                      <p className="text-sm sm:text-base font-extrabold text-neutral-900 font-mono">
                        Rp {Number(item.price).toLocaleString("id-ID")}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleBuyNow(item.id)}
                      className="bg-neutral-900 hover:bg-amber-400 hover:text-neutral-950 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      Beli Unit
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Trade-In Banner Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-3xl p-6 sm:p-10 text-neutral-950 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <span className="bg-neutral-950 text-amber-300 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Program Tukar Tambah
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Punya HP Lama? Tukar ke iPhone Impian!</h2>
            <p className="text-xs sm:text-sm text-neutral-900 max-w-lg leading-relaxed font-medium">
              Cek estimasi harga HP lama kamu secara online atau langsung kunjungi store offline kami untuk penawaran terbaik.
            </p>
          </div>
          <a href="/trade-in" className="bg-neutral-900 hover:bg-neutral-800 text-white px-6 py-3.5 rounded-full text-xs font-extrabold transition-all shadow-md whitespace-nowrap">
            Mulai Trade-In Sekarang
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <div className="flex items-center gap-3">
            <img src="/logo-purei-hitam.png" alt="Logo" className="h-6 w-auto object-contain" />
            <span>&copy; {new Date().getFullYear()} Secondhand Gadget Store. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-neutral-900 transition-colors">Syarat & Ketentuan</a>
            <a href="#" className="hover:text-neutral-900 transition-colors">Kebijakan Garansi</a>
            <a href="#" className="hover:text-neutral-900 transition-colors">Kontak Kami</a>
          </div>
        </div>
      </footer>

      {/* ==================================================== */}
      {/* POPUP MODAL SIMULASI TRADE-IN INTERAKTIF             */}
      {/* ==================================================== */}
      {isTradeInModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 relative space-y-6">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 uppercase">
                  Simulasi Cepat (Update Harga Live)
                </span>
                <h3 className="text-lg font-extrabold text-neutral-900 mt-1">Cek Estimasi Harga HP Lama Kamu</h3>
              </div>
              <button 
                onClick={() => setIsTradeInModalOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Input Simulasi */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Model iPhone</label>
                  <select 
                    value={simModel} 
                    onChange={(e) => setSimModel(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-neutral-900"
                  >
                    <option>iPhone 11</option>
                    <option>iPhone 12</option>
                    <option>iPhone 13</option>
                    <option>iPhone 14 Pro</option>
                    <option>iPhone 15 Pro Max</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Storage</label>
                  <select 
                    value={simStorage} 
                    onChange={(e) => setSimStorage(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-neutral-900"
                  >
                    <option>64GB</option>
                    <option>128GB</option>
                    <option>256GB</option>
                    <option>512GB</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Garansi / Region</label>
                  <select 
                    value={simRegion} 
                    onChange={(e) => setSimRegion(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-neutral-900"
                  >
                    {availableRegions.length === 0 ? (
                      <option value="">Memuat data region...</option>
                    ) : (
                      availableRegions.map((regionKey) => {
                        let labelName = regionKey;
                        if (regionKey === 'ibox') labelName = 'iBox / Digimap (PA/A)';
                        if (regionKey === 'beacukai') labelName = 'Beacukai Official';
                        if (regionKey === 'inter') labelName = 'International (Inter)';

                        return (
                          <option key={regionKey} value={regionKey}>
                            {labelName}
                          </option>
                        );
                      })
                    )}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Battery Health (%)</label>
                  <input 
                    type="number" 
                    value={simBh} 
                    onChange={(e) => setSimBh(Number(e.target.value))}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Kondisi Fisik</label>
                <select 
                  value={simCondition} 
                  onChange={(e) => setSimCondition(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-neutral-900"
                >
                  <option>Mulus (Like New)</option>
                  <option>Baret Sedang Pemakaian</option>
                  <option>Ada Minus Fungsi</option>
                </select>
              </div>

              {/* Kotak Hasil Estimasi Real-time */}
              <div className="bg-neutral-900 text-white p-4 rounded-2xl space-y-1">
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-widest">
                  Estimasi Nilai Tukar Tambah (Acuan Price List)
                </span>
                <p className="text-base font-extrabold font-mono">
                  Rp {simResult.min.toLocaleString("id-ID")} - {simResult.max.toLocaleString("id-ID")}
                </p>
                <p className="text-[10px] text-neutral-400">
                  *Harga dihitung otomatis berdasarkan data update price list store PUREI.
                </p>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="flex items-center gap-3 pt-2">
              <button 
                onClick={() => setIsTradeInModalOpen(false)}
                className="w-1/2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 py-3 rounded-xl font-bold transition-colors cursor-pointer"
              >
                Tutup
              </button>
              <a 
                href="/trade-in"
                className="w-1/2 bg-amber-400 hover:bg-amber-300 text-neutral-950 py-3 rounded-xl font-extrabold text-center transition-all shadow-md block"
              >
                Mulai Trade-In Sekarang
              </a>
            </div>

          </div>
        </div>
      )}

      {/* Wishlist Drawer */}
      {isWishlistOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-neutral-950/50 backdrop-blur-xs transition-opacity" onClick={() => setIsWishlistOpen(false)} />
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
              <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
                    <Heart className="w-4 h-4 fill-rose-500" />
                  </div>
                  <h3 className="font-extrabold text-neutral-900 text-base">Wishlist Favorit</h3>
                  <span className="text-xs bg-neutral-100 text-neutral-600 font-bold px-2 py-0.5 rounded-full">{wishlistItems.length}</span>
                </div>
                <button onClick={() => setIsWishlistOpen(false)} className="p-2 rounded-full hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {wishlistItems.length > 0 && (
                <div className="px-6 py-2.5 bg-neutral-100/70 border-b border-neutral-200 flex items-center justify-between text-xs font-semibold text-neutral-700">
                  <button onClick={handleSelectAllToggle} className="flex items-center gap-2 hover:text-neutral-900 cursor-pointer">
                    {selectedWishlistIds.length === wishlistItems.length ? <CheckSquare className="w-4 h-4 text-neutral-900" /> : <Square className="w-4 h-4 text-neutral-400" />}
                    <span>Pilih Semua ({selectedWishlistIds.length}/{wishlistItems.length})</span>
                  </button>
                  <span className="text-[11px] text-neutral-400">Centang untuk checkout</span>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {loadingWishlist ? (
                  <div className="text-center py-20 text-xs text-neutral-400">Memuat daftar wishlist...</div>
                ) : wishlistItems.length === 0 ? (
                  <div className="text-center py-24 space-y-3">
                    <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto text-neutral-400">
                      <Heart className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-bold text-neutral-800">Wishlist kamu masih kosong</p>
                    <p className="text-xs text-neutral-400 max-w-xs mx-auto">Yuk, simpan iPhone incaranmu dengan mengklik ikon hati di katalog produk!</p>
                  </div>
                ) : (
                  wishlistItems.map((item) => {
                    const badgeText = item.badge || "Ready";
                    const isSoldOut = badgeText.toLowerCase().includes("sold") || badgeText.toLowerCase().includes("habis");
                    const isChecked = selectedWishlistIds.includes(item.id);

                    return (
                      <div key={item.id} className={`flex items-center gap-3 p-3 bg-neutral-50 border rounded-2xl relative group transition-opacity ${isSoldOut ? "opacity-75 border-rose-200 bg-rose-50/20" : "border-neutral-200/80"}`}>
                        <button onClick={() => toggleSelectWishlistItem(item.id)} className="text-neutral-400 hover:text-neutral-900 transition-colors shrink-0 cursor-pointer">
                          {isChecked ? <CheckSquare className="w-5 h-5 text-neutral-900" /> : <Square className="w-5 h-5 text-neutral-300" />}
                        </button>
                        <div className="relative shrink-0">
                          <img src={item.images && item.images.length > 0 ? item.images[0] : "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=600"} alt={item.name} className="w-14 h-14 object-cover rounded-xl bg-neutral-200" />
                          <span className={`absolute -bottom-1 -right-1 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs ${isSoldOut ? "bg-rose-600 text-white" : "bg-neutral-900 text-amber-300"}`}>{badgeText}</span>
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <span className="text-[10px] font-bold font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">{item.storage || "128GB"}</span>
                          <h4 className="text-xs font-bold text-neutral-900 truncate">{item.name}</h4>
                          <p className="text-xs font-extrabold text-neutral-900 font-mono">Rp {Number(item.price).toLocaleString("id-ID")}</p>
                        </div>
                        <button onClick={() => toggleWishlist(item.id)} title="Hapus dari wishlist" className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {wishlistItems.length > 0 && (
                <div className="p-6 border-t border-neutral-200 bg-neutral-50 space-y-2">
                  <button 
                    disabled={selectedWishlistIds.length === 0}
                    onClick={() => {
                      setIsWishlistOpen(false);
                      router.push(`/user/checkout?items=${selectedWishlistIds.join(",")}`);
                    }}
                    className={`w-full py-3 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                      selectedWishlistIds.length > 0 ? "bg-neutral-900 hover:bg-amber-400 hover:text-neutral-950 text-white" : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                    }`}
                  >
                    {selectedWishlistIds.length > 0 ? `Checkout Pilihan (${selectedWishlistIds.length} Unit)` : "Pilih minimal 1 unit untuk checkout"}
                  </button>
                  <button onClick={() => setIsWishlistOpen(false)} className="w-full bg-transparent hover:bg-neutral-200 text-neutral-600 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer">
                    Tutup & Lanjutkan Belanja
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}