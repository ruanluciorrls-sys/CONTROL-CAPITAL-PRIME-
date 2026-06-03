import Calendario from "./Calendario";
import { CalendarDays } from "lucide-react";

export default function EditarDados() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d4a017]/25 text-[#d4a017]"
            style={{ background: "rgba(212,160,23,0.08)" }}
          >
            <CalendarDays size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground">Plataformas</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Calendario de plataformas e prazos da operacao
            </p>
          </div>
        </div>
      </div>

      <Calendario />
    </div>
  );
}
