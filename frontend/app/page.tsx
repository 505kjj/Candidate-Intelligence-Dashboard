import { ShieldCheck, Sparkles } from "lucide-react";
import { HeroProfessionalReveal } from "@/components/HeroProfessionalReveal";
import { LandingActions } from "@/components/LandingActions";
import { KineticText } from "@/components/KineticText";

export default function Home() {
  return (
    <section className="relative h-screen min-h-screen overflow-hidden bg-black">
      <HeroProfessionalReveal />
      <div className="relative z-10 mx-auto flex h-full max-w-7xl items-center px-4 pb-10 pt-28 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-4 py-2 text-sm text-white/80 backdrop-blur-md">
            <Sparkles size={16} />
            Explainable AI ranking for high-signal recruiting
          </div>
          <h1 className="max-w-4xl text-5xl font-semibold leading-tight text-white sm:text-6xl lg:text-7xl">
            Candidate Intelligence Dashboard
          </h1>
          <KineticText
            text="Discover the best-fit candidates beyond keywords."
            className="mt-6 max-w-2xl text-2xl text-white/90 sm:text-3xl"
          />
          <p className="mt-5 max-w-2xl text-base leading-8 text-white/60 sm:text-lg">
            An explainable AI ranking engine that understands job context, career evidence, and behavioral hiring signals.
          </p>
          <LandingActions />
          <div className="mt-10 flex flex-wrap gap-3">
            {["Semantic Matching", "Career Evidence", "Behavioral Signals"].map((title) => (
              <div key={title} className="rounded-full border border-white/15 bg-black/30 px-4 py-2 text-sm text-white/80 backdrop-blur-md">
                <ShieldCheck className="mr-2 inline text-white/70" size={15} />
                {title}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
