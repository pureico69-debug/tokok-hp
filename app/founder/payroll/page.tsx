"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { FounderSidebar } from "@/components/founder-sidebar";
import { HomeNavbar } from "@/components/home-navbar";
import { createClient } from "@/lib/supabase-client";

// --- TYPE DEFINITIONS ---
interface StaffProfile {
  id: string;
  full_name: string;
  role: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_holder?: string;
}

interface PayrollItem {
  id: string;
  created_at: string;
  staff_id: string;
  staff_name: string;
  period_month: string;
  period_year: string;
  base_salary: number;
  bonus: number;
  deductions: number;
  net_salary: number; // Sesuai kolom database Supabase
  status: "Dibayar" | "Pending";
  notes?: string;
}

// --- HELPER FORMATTING CURRENCY ---
const formatNumberWithDots = (val: string | number) => {
  if (!val && val !== 0) return "";
  const cleanNumber = val.toString().replace(/\D/g, "");
  if (!cleanNumber) return "";
  return new Intl.NumberFormat("id-ID").format(Number(cleanNumber));
};

const unformatNumber = (val: string) => {
  return Number(val.toString().replace(/\D/g, "")) || 0;
};

const formatRupiah = (val: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val || 0);
};

export default function PayrollPage() {
  const supabase = createClient();

  // State User & Data Supabase
  const [user, setUser] = useState<any>(null);
  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [payrolls, setPayrolls] = useState<PayrollItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // State Modal Form Slip Gaji
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPayroll, setEditingPayroll] = useState<PayrollItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // State Modal Hapus
  const [deletingPayroll, setDeletingPayroll] = useState<PayrollItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState({
    staff_id: "",
    staff_name: "",
    period_month: "Agustus",
    period_year: "2026",
    base_salary: "",
    bonus: "",
    deductions: "",
    status: "Dibayar" as "Dibayar" | "Pending",
    notes: "",
  });

  // Load Data dari Supabase
  const initData = async () => {
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (session) setUser(session.user);

    // Fetch List Staff dari Tabel Profiles
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, role, bank_name, bank_account_number, bank_account_holder")
      .order("full_name", { ascending: true });

    if (profilesError) {
      console.error("Gagal mengambil data staff:", profilesError.message);
    } else if (profilesData) {
      setStaffList(profilesData);
    }

    // Fetch Data Payroll
    const { data: payrollData, error: payrollError } = await supabase
      .from("payrolls")
      .select("*")
      .order("created_at", { ascending: false });

    if (payrollError) {
      toast.error("Gagal mengambil data penggajian: " + payrollError.message);
    } else {
      setPayrolls(payrollData || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    initData();
  }, []);

  // Cari data staff yang sedang aktif dipilih di form
  const selectedStaffDetail = staffList.find((s) => s.id === formData.staff_id);

  // Handle Pilih Staff dari Dropdown
  const handleStaffSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selectedStaff = staffList.find((s) => s.id === selectedId);

    setFormData((prev) => ({
      ...prev,
      staff_id: selectedId,
      staff_name: selectedStaff ? selectedStaff.full_name : "",
    }));
  };

  // Handle Input Nominal Formatting
  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: formatNumberWithDots(value),
    }));
  };

  // Handle Input Umum
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Modal Open Handlers
  const handleOpenCreateModal = () => {
    setEditingPayroll(null);
    const defaultStaff = staffList[0];
    setFormData({
      staff_id: defaultStaff?.id || "",
      staff_name: defaultStaff?.full_name || "",
      period_month: "Agustus",
      period_year: "2026",
      base_salary: "",
      bonus: "",
      deductions: "",
      status: "Dibayar",
      notes: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: PayrollItem) => {
    setEditingPayroll(item);
    setFormData({
      staff_id: item.staff_id || "",
      staff_name: item.staff_name || "",
      period_month: item.period_month || "Agustus",
      period_year: item.period_year || "2026",
      base_salary: formatNumberWithDots(item.base_salary),
      bonus: formatNumberWithDots(item.bonus),
      deductions: formatNumberWithDots(item.deductions),
      status: item.status || "Dibayar",
      notes: item.notes || "",
    });
    setIsModalOpen(true);
  };

  // Compute Total Preview
  const numBase = unformatNumber(formData.base_salary);
  const numBonus = unformatNumber(formData.bonus);
  const numDeductions = unformatNumber(formData.deductions);
  const calculatedTotal = numBase + numBonus - numDeductions;

  // Submit Data to Supabase
  const handleSubmitPayroll = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.staff_name || numBase <= 0) {
      toast.error("Pilih karyawan dan masukkan gaji pokok yang valid!");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      staff_id: formData.staff_id || null,
      staff_name: formData.staff_name,
      period_month: formData.period_month,
      period_year: formData.period_year,
      base_salary: numBase,
      bonus: numBonus,
      deductions: numDeductions,
      net_salary: calculatedTotal, // Diubah dari total_amount ke net_salary agar sinkron dengan database
      status: formData.status,
      notes: formData.notes,
    };

    if (editingPayroll) {
      const { error } = await supabase
        .from("payrolls")
        .update(payload)
        .eq("id", editingPayroll.id);

      if (error) {
        toast.error("Gagal memperbarui slip gaji: " + error.message);
      } else {
        toast.success("Slip gaji berhasil diperbarui!");
        setIsModalOpen(false);
        initData();
      }
    } else {
      const { error } = await supabase.from("payrolls").insert([payload]);

      if (error) {
        toast.error("Gagal membuat slip gaji: " + error.message);
      } else {
        toast.success("Slip gaji berhasil dibuat!");
        setIsModalOpen(false);
        initData();
      }
    }

    setIsSubmitting(false);
  };

  // Delete Handler
  const handleDeletePayroll = async () => {
    if (!deletingPayroll) return;
    setIsDeleting(true);

    const { error } = await supabase
      .from("payrolls")
      .delete()
      .eq("id", deletingPayroll.id);

    if (error) {
      toast.error("Gagal menghapus slip gaji: " + error.message);
    } else {
      toast.success("Slip gaji berhasil dihapus");
      setPayrolls((prev) => prev.filter((p) => p.id !== deletingPayroll.id));
    }

    setIsDeleting(false);
    setDeletingPayroll(null);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-neutral-900 font-sans">
      <FounderSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <HomeNavbar user={user} />

        <main className="p-8 space-y-6 max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200/80">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-neutral-900">
                Penggajian Karyawan (Payroll)
              </h1>
              <p className="text-xs text-neutral-500 font-mono mt-1">
                Rekap pembayaran gaji bulanan staff, insentif/bonus, dan potongan.
              </p>
            </div>
            <button
              onClick={handleOpenCreateModal}
              className="bg-neutral-900 hover:bg-neutral-800 text-amber-400 font-mono text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>+ Buat Slip Gaji Baru</span>
            </button>
          </div>

          <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
            <h2 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold">
              RIWAYAT PENGGAJIAN STAFF
            </h2>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="py-12 text-center text-xs font-mono text-neutral-400">
                  Memuat data penggajian dari database...
                </div>
              ) : payrolls.length === 0 ? (
                <div className="py-12 text-center text-xs font-mono text-neutral-400">
                  Belum ada data penggajian recorded.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 text-[10px] font-mono uppercase text-neutral-400">
                      <th className="py-3 px-2">KARYAWAN</th>
                      <th className="py-3 px-2">PERIODE</th>
                      <th className="py-3 px-2 text-right">GAJI POKOK</th>
                      <th className="py-3 px-2 text-right">BONUS</th>
                      <th className="py-3 px-2 text-right">POTONGAN</th>
                      <th className="py-3 px-2 text-right">TOTAL DITERIMA</th>
                      <th className="py-3 px-2 text-center">STATUS</th>
                      <th className="py-3 px-2 text-center">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-xs font-mono">
                    {payrolls.map((item) => (
                      <tr key={item.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="py-3.5 px-2 font-bold text-neutral-900">
                          {item.staff_name}
                        </td>
                        <td className="py-3.5 px-2 text-neutral-600">
                          {item.period_month} {item.period_year}
                        </td>
                        <td className="py-3.5 px-2 text-right text-neutral-700">
                          {formatRupiah(item.base_salary)}
                        </td>
                        <td className="py-3.5 px-2 text-right text-emerald-600">
                          +{formatRupiah(item.bonus)}
                        </td>
                        <td className="py-3.5 px-2 text-right text-rose-600">
                          -{formatRupiah(item.deductions)}
                        </td>
                        <td className="py-3.5 px-2 text-right font-black text-neutral-900">
                          {formatRupiah(item.net_salary)}
                        </td>
                        <td className="py-3.5 px-2 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === "Dibayar"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="px-2 py-1 rounded-lg bg-neutral-100 hover:bg-amber-100 text-neutral-700 hover:text-amber-800 text-[11px] font-bold transition-all cursor-pointer"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => setDeletingPayroll(item)}
                              className="px-2 py-1 rounded-lg bg-neutral-100 hover:bg-rose-100 text-neutral-700 hover:text-rose-700 text-[11px] font-bold transition-all cursor-pointer"
                            >
                              🗑️ Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* MODAL BUAT / EDIT SLIP GAJI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-neutral-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  {editingPayroll ? "Edit Slip Gaji" : "Buat Slip Gaji Baru"}
                </h3>
                <p className="text-xs text-neutral-500 font-mono mt-0.5">
                  Lengkapi nominal dan detail hak penggajian staff.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitPayroll} className="p-6 space-y-4">
              
              {/* Opsi Staff dari Database */}
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-neutral-500 mb-1">
                  Pilih Karyawan *
                </label>
                {staffList.length > 0 ? (
                  <select
                    value={formData.staff_id}
                    onChange={handleStaffSelect}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-amber-400 text-neutral-900 font-medium"
                  >
                    {staffList.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.full_name} ({staff.role || "Staff"})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    name="staff_name"
                    required
                    placeholder="Nama Karyawan"
                    value={formData.staff_name}
                    onChange={handleInputChange}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-amber-400 text-neutral-900"
                  />
                )}
              </div>

              {/* CLEAN INFO BOX: MUNCULKAN REKENING KARYAWAN JIKA ADA */}
              {selectedStaffDetail && (
                <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3 flex items-start justify-between gap-3 text-xs font-mono">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wide block">
                      Informasi Rekening Tujuan
                    </span>
                    <p className="text-neutral-800 font-medium">
                      {selectedStaffDetail.bank_name ? (
                        <>
                          <span className="font-bold text-neutral-900">{selectedStaffDetail.bank_name}</span>:{" "}
                          <span className="font-mono font-bold text-amber-900">
                            {selectedStaffDetail.bank_account_number || "Belum diisi"}
                          </span>
                        </>
                      ) : (
                        <span className="text-neutral-500 italic">Bank belum diatur di profil staff</span>
                      )}
                    </p>
                    {selectedStaffDetail.bank_account_holder && (
                      <p className="text-[11px] text-neutral-500">
                        A/n: {selectedStaffDetail.bank_account_holder}
                      </p>
                    )}
                  </div>
                  <span className="text-lg">💳</span>
                </div>
              )}

              {/* Periode Bulan & Tahun */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-neutral-500 mb-1">
                    Bulan
                  </label>
                  <select
                    name="period_month"
                    value={formData.period_month}
                    onChange={handleInputChange}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-amber-400 text-neutral-900"
                  >
                    {[
                      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
                      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
                    ].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-neutral-500 mb-1">
                    Tahun
                  </label>
                  <select
                    name="period_year"
                    value={formData.period_year}
                    onChange={handleInputChange}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-amber-400 text-neutral-900"
                  >
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                  </select>
                </div>
              </div>

              {/* Nominal Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-neutral-500 mb-1">
                    Gaji Pokok *
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-neutral-400">Rp</span>
                    <input
                      type="text"
                      name="base_salary"
                      required
                      placeholder="0"
                      value={formData.base_salary}
                      onChange={handleCurrencyChange}
                      className="w-full pl-8 pr-2 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-neutral-500 mb-1">
                    Bonus / Insentif
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-neutral-400">Rp</span>
                    <input
                      type="text"
                      name="bonus"
                      placeholder="0"
                      value={formData.bonus}
                      onChange={handleCurrencyChange}
                      className="w-full pl-8 pr-2 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-neutral-500 mb-1">
                    Potongan
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-neutral-400">Rp</span>
                    <input
                      type="text"
                      name="deductions"
                      placeholder="0"
                      value={formData.deductions}
                      onChange={handleCurrencyChange}
                      className="w-full pl-8 pr-2 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* Box Preview Total Gaji */}
              <div className="p-3 bg-neutral-900 rounded-xl flex items-center justify-between text-white font-mono">
                <span className="text-xs text-neutral-400 font-bold">TOTAL DITERIMA (NET)</span>
                <span className="text-base font-black text-amber-400">{formatRupiah(calculatedTotal)}</span>
              </div>

              {/* Status & Catatan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-neutral-500 mb-1">
                    Status Pembayaran
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-amber-400 text-neutral-900"
                  >
                    <option value="Dibayar">Dibayar</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-neutral-500 mb-1">
                    Catatan Khusus
                  </label>
                  <input
                    type="text"
                    name="notes"
                    placeholder="Contoh: Kinerja terbaik / Kasbon DP"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-amber-400 text-neutral-900"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-mono font-bold text-amber-400 bg-neutral-900 hover:bg-neutral-800 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : editingPayroll ? "Update Slip Gaji" : "Simpan & Cetak"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      {deletingPayroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-neutral-200 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-xl mx-auto">
              🗑️
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">Hapus Slip Gaji?</h3>
              <p className="text-xs text-neutral-500 font-mono mt-1">
                Apakah Anda yakin ingin menghapus record gaji untuk <span className="font-bold text-neutral-800">{deletingPayroll.staff_name}</span> ({deletingPayroll.period_month} {deletingPayroll.period_year})?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingPayroll(null)}
                className="w-full py-2.5 rounded-xl text-xs font-mono font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeletePayroll}
                disabled={isDeleting}
                className="w-full py-2.5 rounded-xl text-xs font-mono font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? "Hapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}