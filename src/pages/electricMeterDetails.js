import React from "react";
import { useRouter } from "next/router";
import FifteenMinuteDemand from "../components/detailedGauge/FifteenMinuteDemand";
import DailyUsageChart from "../components/detailedGauge/DailyUsageChart";
import IntervalUsageChart from "../components/detailedGauge/IntervalUsageChart";
import EnergyTrendChart from "../components/detailedGauge/EnergyTrendChart";
import CumulativeEnergyChart from "../components/detailedGauge/CumulativeEnergyChart";
import PowerHeatmap from "../components/detailedGauge/PowerHeatmap";

const ElectricMeterDetails = () => {
  const router = useRouter();
  const { view } = router.query;

  const renderComponent = () => {
    switch (view) {
      case "fifteenMinuteDemand":
        return <FifteenMinuteDemand />;
      case "dailyUsage":
        return <DailyUsageChart />;
      case "intervalUsage":
        return <IntervalUsageChart />;
      case "energyTrend":
        return <EnergyTrendChart />;
      case "cumulativeEnergy":
        return <CumulativeEnergyChart />;
      case "powerHeatmap":
        return <PowerHeatmap />;
      default:
        return <div>Please select a view from the dropdown menu.</div>;
    }
  };

  return (
    <div>
      <h1>電表詳細資訊</h1>
      {renderComponent()}
    </div>
  );
};

export default ElectricMeterDetails;
