"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FounderSidebar } from "@/components/founder-sidebar";
import { HomeNavbar } from "@/components/home-navbar";
import { Users, Target, Save, Shield, Calendar, Crown, UserCheck, Edit3, Check, X, Layers } from "lucide-react";

export default function FounderStaffPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);

  // State untuk form setting target
  const currentYear = new Date().getFullYear().toString();
  const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const [targetMonth, setTargetMonth] = useState<string>(currentMonth);
  const [targetYear, setTargetYear] = useState<string>(currentYear);
  const [targetAmountRaw, setTargetAmountRaw] = useState<string>("50000000");
  const [targetAmountDisplay, setTargetAmountDisplay] = useState<string>("50.000.000");
  
  // State untuk unit target penjualan
  const [unitTarget, setUnitTarget] = useState<string>("10");

  const [isSavingTarget, setIsSavingTarget] = useState(false);

  // State untuk melacak baris mana yang sedang mode edit role
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [tempRole, setTempRole] = useState<string>("");

  const router = useRouter();
  const supabase = createClient();

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }
    setUser(session.user);

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!profile || profile.role?.toLowerCase() !== "founder") {
      toast.error("Akses khusus founder!");
      router.push("/");
      return;
    }

    const { data: staffData } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (staffData) setStaffList(staffData);

    // Ambil data target nominal dan unit target dari store_targets secara parallel
    await Promise.all([
      fetchTarget(targetMonth, targetYear),
      fetchUnitTarget(targetMonth, targetYear)
    ]);

    setLoading(false);
  };

  const fetchTarget = async (m: string, y: string) => {
    const { data } = await supabase
      .from("store_targets")
      .select("target_amount")
      .eq("month", m)
      .eq("year", y)
      .single();

    if (data) {
      const raw = data.target_amount.toString();
      setTargetAmountRaw(raw);
      setTargetAmountDisplay(formatRupiah(raw));
    } else {
      setTargetAmountRaw("50000000");
      setTargetAmountDisplay("50.000.000");
    }
  };

  const fetchUnitTarget = async (m: string, y: string) => {
    const { data } = await supabase
      .from("store_targets")
      .select("unit_target")
      .eq("month", m)
      .eq("year", y)
      .single();

    if (data && data.unit_target !== null && data.unit_target !== undefined) {
      setUnitTarget(data.unit_target.toString());
    } else {
      setUnitTarget("10");
    }
  };

  useEffect(() => {
    loadData();
  }, [router, supabase]);

  const formatRupiah = (value: string) => {
    const numberString = value.replace(/[^,\d]/g, "");
    const split = numberString.split(",");
    let sisa = split[0].length % 3;
    let rupiah = split[0].substr(0, sisa);
    let ribuan = split[0].substr(sisa).match(/\d{3}/gi);

    if (ribuan) {
      let separator = sisa ? "." : "";
      rupiah += separator + ribuan.join(".");
    }
    return split[1] !== undefined ? rupiah + "," + split[1] : rupiah;
  };

  const handleTargetInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\./g, "");
    if (!isNaN(Number(rawVal))) {
      setTargetAmountRaw(rawVal);
      setTargetAmountDisplay(formatRupiah(rawVal));
    }
  };

  const handleMonthYearChange = (m: string, y: string) => {
    setTargetMonth(m);
    setTargetYear(y);
    fetchTarget(m, y);
    fetchUnitTarget(m, y);
  };

  const handleSaveTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingTarget(true);

    const { data: existing } = await supabase
      .from("store_targets")
      .select("id")
      .eq("month", targetMonth)
      .eq("year", targetYear)
      .single();

    let error;
    if (existing) {
      const res = await supabase
        .from("store_targets")
        .update({ 
          target_amount: Number(targetAmountRaw), 
          unit_target: Number(unitTarget),
          updated_at: new Date().toISOString() 
        })
        .eq("month", targetMonth)
        .eq("year", targetYear);
      error = res.error;
    } else {
      const res = await supabase
        .from("store_targets")
        .insert([{ 
          month: targetMonth, 
          year: targetYear, 
          target_amount: Number(targetAmountRaw),
          unit_target: Number(unitTarget)
        }]);
      error = res.error;
    }

    setIsSavingTarget(false);

    if (error) {
      toast.error("Gagal menyimpan target: " + error.message);
    } else {
      toast.success(`Target bulan ${targetMonth}/${targetYear} berhasil disimpan ke Supabase!`);
    }
  };

  const handleSaveRole = async (userId: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ role: tempRole })
      .eq("id", userId);

    if (error) {
      toast.error("Gagal mengubah role: " + error.message);
    } else {
      toast.success("Role berhasil diperbarui!");
      setStaffList(staffList.map(item => item.id === userId ? { ...item, role: tempRole } : item));
      setEditingUserId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-mono text-xs">
        Memuat Manajemen Pengguna...
      </div>
    );
  }

  // Pisahkan dan urutkan Tim Internal: Founder diletakkan paling atas
  const internalTeamRaw = staffList.filter(item => ["founder", "admin", "staff"].includes((item.role || "").toLowerCase()));
  const internalTeam = internalTeamRaw.sort((a, b) => {
    if (a.role === "founder") return -1;
    if (b.role === "founder") return 1;
    return 0;
  });

  const generalMembers = staffList.filter(item => !["founder", "admin", "staff"].includes((item.role || "").toLowerCase()));

  return (
    <div className="min-h-screen bg-[#f8fafc] text-neutral-900 flex max-w-full overflow-x-hidden">
      <FounderSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden">
        <HomeNavbar user={user} onOpenMobileSidebar={() => setMobileOpen(true)} />

        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">Manajemen Staff & Target Toko</h1>
            <p className="text-xs text-neutral-500 mt-0.5">Kelola akses tim internal, pelanggan, dan tentukan target penjualan bulanan toko.</p>
          </div>

          {/* FORM SETTING TARGET PENJUALAN & UNIT TARGET */}
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-neutral-100">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-neutral-900">Pengaturan Target Penjualan Bulanan & Unit</h2>
                <p className="text-xs text-neutral-500">Target ini akan otomatis tersimpan ke database Supabase dan tampil secara real-time.</p>
              </div>
            </div>

            <form onSubmit={handleSaveTarget} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 mb-1.5">Pilih Bulan</label>
                  <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5">
                    <Calendar className="w-4 h-4 text-neutral-400" />
                    <select 
                      value={targetMonth} 
                      onChange={(e) => handleMonthYearChange(e.target.value, targetYear)}
                      className="bg-transparent text-xs font-semibold text-neutral-800 outline-none w-full cursor-pointer"
                    >
                      <option value="01">Januari</option>
                      <option value="02">Februari</option>
                      <option value="03">Maret</option>
                      <option value="04">April</option>
                      <option value="05">Mei</option>
                      <option value="06">Juni</option>
                      <option value="07">Juli</option>
                      <option value="08">Agustus</option>
                      <option value="09">September</option>
                      <option value="10">Oktober</option>
                      <option value="11">November</option>
                      <option value="12">Desember</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 mb-1.5">Pilih Tahun</label>
                  <select 
                    value={targetYear} 
                    onChange={(e) => handleMonthYearChange(targetMonth, e.target.value)}
                    className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-neutral-800 outline-none w-full cursor-pointer"
                  >
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 mb-1.5">Nominal Target (IDR)</label>
                  <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5">
                    <span className="text-xs font-bold text-neutral-400">Rp</span>
                    <input 
                      type="text"
                      value={targetAmountDisplay}
                      onChange={handleTargetInputChange}
                      placeholder="Contoh: 50.000.000"
                      className="bg-transparent text-xs font-mono font-bold text-neutral-900 outline-none w-full"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 mb-1.5">Target Unit Penjualan</label>
                  <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5">
                    <Layers className="w-4 h-4 text-neutral-400" />
                    <input 
                      type="number"
                      value={unitTarget}
                      onChange={(e) => setUnitTarget(e.target.value)}
                      placeholder="Contoh: 10"
                      className="bg-transparent text-xs font-mono font-bold text-neutral-900 outline-none w-full"
                      required
                    />
                    <span className="text-xs font-mono text-neutral-400 font-bold">Unit</span>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isSavingTarget}
                    className="w-full inline-flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs py-3 px-4 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Save className={`w-4 h-4 ${isSavingTarget ? "animate-spin" : ""}`} />
                    <span>{isSavingTarget ? "Menyimpan..." : "Simpan Target & Unit"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* SECTION 1: TIM INTERNAL (FOUNDER / ADMIN / STAFF) */}
          <div className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden shadow-2xs">
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                  <Crown className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-neutral-900">Tim Internal Toko (Founder, Admin & Staff)</h2>
                  <p className="text-[10px] text-neutral-500">Daftar akun yang memiliki akses operasional ke dashboard toko.</p>
                </div>
              </div>
              <span className="text-xs font-mono bg-amber-50 text-amber-700 font-bold px-2.5 py-1 rounded-lg border border-amber-200">
                Total: {internalTeam.length} Akun
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-neutral-200/80 text-[11px] font-semibold text-neutral-500 bg-neutral-50/30">
                    <th className="px-5 py-3 font-medium">Nama Lengkap</th>
                    <th className="px-5 py-3 font-medium">Email</th>
                    <th className="px-5 py-3 font-medium">No. Telepon</th>
                    <th className="px-5 py-3 font-medium">Hak Akses (Role)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200/60 text-xs">
                  {internalTeam.map((st) => {
                    const isFounder = st.role === "founder";
                    const isEditing = editingUserId === st.id;

                    return (
                      <tr key={st.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-neutral-900">{st.full_name || "-"}</td>
                        <td className="px-5 py-3.5 text-neutral-600 font-mono">{st.email}</td>
                        <td className="px-5 py-3.5 text-neutral-600 font-mono">{st.phone || "-"}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            {/* BADGE WARNA ROLE */}
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              st.role === "founder" ? "bg-amber-50 text-amber-700 border-amber-200" :
                              st.role === "admin" ? "bg-purple-50 text-purple-700 border-purple-200" :
                              "bg-blue-50 text-blue-700 border-blue-200"
                            }`}>
                              <Shield className="w-3 h-3" />
                              {st.role}
                            </span>

                            {/* JIKA BUKAN FOUNDER, BERIKAN ICON EDIT */}
                            {!isFounder && (
                              <>
                                {isEditing ? (
                                  <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 rounded-xl px-2 py-1">
                                    <select
                                      value={tempRole}
                                      onChange={(e) => setTempRole(e.target.value)}
                                      className="bg-transparent text-[11px] font-bold text-neutral-800 outline-none cursor-pointer uppercase"
                                    >
                                      <option value="staff">Staff</option>
                                      <option value="admin">Admin</option>
                                      <option value="user">User</option>
                                    </select>
                                    <button 
                                      onClick={() => handleSaveRole(st.id)}
                                      className="p-1 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors cursor-pointer"
                                      title="Simpan"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button 
                                      onClick={() => setEditingUserId(null)}
                                      className="p-1 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                                      title="Batal"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setEditingUserId(st.id);
                                      setTempRole(st.role || "staff");
                                    }}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-500 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 px-2.5 py-1 rounded-lg transition-all cursor-pointer border border-neutral-200"
                                    title="Edit Role"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>Edit</span>
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 2: MEMBER / PELANGGAN */}
          <div className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden shadow-2xs">
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-neutral-900">Daftar Member & Pelanggan Baru</h2>
                  <p className="text-[10px] text-neutral-500">Akun pelanggan yang terdaftar di aplikasi. Anda dapat menaikkan rolenya menjadi staff di sini.</p>
                </div>
              </div>
              <span className="text-xs font-mono bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-lg border border-blue-200">
                Total: {generalMembers.length} Akun
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-neutral-200/80 text-[11px] font-semibold text-neutral-500 bg-neutral-50/30">
                    <th className="px-5 py-3 font-medium">Nama Lengkap</th>
                    <th className="px-5 py-3 font-medium">Email</th>
                    <th className="px-5 py-3 font-medium">No. Telepon</th>
                    <th className="px-5 py-3 font-medium">Ubah Role / Promosi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200/60 text-xs">
                  {generalMembers.length > 0 ? (
                    generalMembers.map((st) => {
                      const isEditing = editingUserId === st.id;

                      return (
                        <tr key={st.id} className="hover:bg-neutral-50/50 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-neutral-900">{st.full_name || "-"}</td>
                          <td className="px-5 py-3.5 text-neutral-600 font-mono">{st.email}</td>
                          <td className="px-5 py-3.5 text-neutral-600 font-mono">{st.phone || "-"}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-700 border border-neutral-200">
                                <Users className="w-3 h-3" />
                                {st.role || "user"}
                              </span>

                              {isEditing ? (
                                <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 rounded-xl px-2 py-1">
                                  <select
                                    value={tempRole}
                                    onChange={(e) => setTempRole(e.target.value)}
                                    className="bg-transparent text-[11px] font-bold text-neutral-800 outline-none cursor-pointer uppercase"
                                  >
                                    <option value="user">User</option>
                                    <option value="staff">Staff</option>
                                    <option value="admin">Admin</option>
                                  </select>
                                  <button 
                                    onClick={() => handleSaveRole(st.id)}
                                    className="p-1 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors cursor-pointer"
                                    title="Simpan"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button 
                                    onClick={() => setEditingUserId(null)}
                                    className="p-1 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                                    title="Batal"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingUserId(st.id);
                                    setTempRole("staff");
                                  }}
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-500 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 px-2.5 py-1 rounded-lg transition-all cursor-pointer border border-neutral-200"
                                  title="Edit Role / Promosi"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>Ubah Role</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-xs text-neutral-400">Tidak ada akun member baru.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}