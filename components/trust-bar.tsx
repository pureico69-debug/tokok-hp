const items = [
  { 
    title: "100% Terkurasi", 
    desc: "Lolos uji kualitas fisik & fungsi ketat",
    icon: (
      <svg className="h-5 w-5 text-yellow-400 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )
  },
  { 
    title: "Garansi Toko", 
    desc: "Kenyamanan ekstra pasca-pembelian",
    icon: (
      <svg className="h-5 w-5 text-yellow-400 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    )
  },
  { 
    title: "Transparan", 
    desc: "Info Battery Health & minus terbuka",
    icon: (
      <svg className="h-5 w-5 text-yellow-400 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    )
  },
  { 
    title: "Tukar Tambah", 
    desc: "Terima HP lama dengan proses mudah",
    icon: (
      <svg className="h-5 w-5 text-yellow-400 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    )
  },
];

export function TrustBar() {
  return (
    <section id="fitur" className="relative overflow-hidden bg-neutral-950 py-14 border-y border-neutral-800 text-white">
      {/* Background pola garis grid hitam/abu gelap */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30 pointer-events-none" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <div 
              key={item.title} 
              className="group relative rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-yellow-500/50 hover:bg-neutral-900"
            >
              <div className="absolute top-0 left-6 h-1 w-10 rounded-full bg-yellow-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-800 transition-colors group-hover:bg-neutral-700">
                {item.icon}
              </div>

              <p className="text-sm font-bold text-white tracking-tight">{item.title}</p>
              <p className="mt-1 text-xs text-neutral-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}