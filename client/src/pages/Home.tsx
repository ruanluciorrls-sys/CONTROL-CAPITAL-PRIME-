import { useAuth } from "@/_core/hooks/useAuth";
import MetricCard from "@/components/MetricCard";
import ReportTable from "@/components/ReportTable";
import Sidebar from "@/components/Sidebar";
import TotalProfitsCard from "@/components/TotalProfitsCard";
import { calculateTotalProfits, reportData } from "@/lib/reportData";
import { BarChart3, TrendingUp } from "lucide-react";
import { useState } from "react";

export default function Home() {
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  const [activeReport, setActiveReport] = useState<string>(
    Object.keys(reportData)[0]
  );

  const reportNames = Object.keys(reportData);
  const currentData = reportData[activeReport] || [];
  const totalProfits = calculateTotalProfits(reportData);

  const calculateMetrics = () => {
    if (!currentData || currentData.length === 0) {
      return { total: 0, average: 0, max: 0 };
    }

    const deposits = currentData
      .map((row) => row["Depósito"] || 0)
      .filter((val) => typeof val === "number" && val > 0);

    const total = deposits.reduce((a, b) => a + b, 0);
    const average = deposits.length > 0 ? total / deposits.length : 0;
    const max = Math.max(...deposits, 0);

    return { total, average, max };
  };

  const metrics = calculateMetrics();

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        reports={reportNames}
        activeReport={activeReport}
        onReportChange={setActiveReport}
      />

      <main className="flex-1 overflow-auto">
        <div className="bg-white border-b border-border sticky top-0 z-10">
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="text-primary" size={28} />
              <h1 className="text-3xl font-bold text-foreground">
                Relatório CPA
              </h1>
            </div>
            <p className="text-muted-foreground">
              Dashboard de análise de custos por aquisição
            </p>
          </div>
        </div>

        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          {/* Total Profits Card */}
          <div className="mb-8">
            <TotalProfitsCard value={totalProfits} />
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <MetricCard
              label="Total de Depósitos"
              value={metrics.total.toFixed(2)}
              icon={<BarChart3 size={24} />}
            />
            <MetricCard
              label="Média de Depósitos"
              value={metrics.average.toFixed(2)}
              icon={<TrendingUp size={24} />}
            />
            <MetricCard
              label="Máximo de Depósitos"
              value={metrics.max.toFixed(2)}
              icon={<BarChart3 size={24} />}
            />
          </div>

          {/* Report Section */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              {activeReport}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {currentData.length} registros
            </p>
          </div>

          {/* Report Table */}
          <ReportTable data={currentData} />
        </div>
      </main>
    </div>
  );
}
