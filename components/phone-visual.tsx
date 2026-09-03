type PhoneVisualProps = {
  accent: string;
  name: string;
  variant?: "hero" | "card";
};

export function PhoneVisual({ accent, name, variant = "card" }: PhoneVisualProps) {
  const isHero = variant === "hero";

  return (
    <div
      className={
        isHero
          ? "relative flex h-[420px] w-full items-center justify-center sm:h-[520px]"
          : "relative flex h-56 w-full items-center justify-center"
      }
      aria-hidden
    >
      <div
        className={`relative overflow-hidden rounded-[2.2rem] border-[3px] border-neutral-900 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.35)] ${
          isHero ? "h-[340px] w-[168px] sm:h-[420px] sm:w-[206px]" : "h-44 w-[92px]"
        }`}
        style={{ background: `linear-gradient(160deg, ${accent} 0%, #111 140%)` }}
      >
        <div
          className={`absolute left-1/2 z-10 -translate-x-1/2 rounded-full bg-black ${
            isHero ? "top-3 h-5 w-20" : "top-2 h-2.5 w-10"
          }`}
        />
        <div
          className={`absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-black/40 ${
            isHero ? "m-2 rounded-[1.85rem]" : "m-1.5 rounded-[1.6rem]"
          }`}
        />
        <div className="absolute inset-x-0 bottom-[18%] flex flex-col items-center px-2 text-center">
          <span
            className={`font-medium tracking-tight text-white/90 ${
              isHero ? "text-xs" : "text-[9px] leading-tight"
            }`}
          >
            {name}
          </span>
        </div>
      </div>
    </div>
  );
}
