import React from "react";
import { useRouter } from "next/router";
import FifteenMinuteDemand from "../components/detailedGauge/FifteenMinuteDemand";
import DailyUsageChart from "../components/detailedGauge/DailyUsageChart";
import IntervalUsageChart from "../components/detailedGauge/IntervalUsageChart";
import EnergyTrendChart from "../components/detailedGauge/EnergyTrendChart";
import CumulativeEnergyChart from "../components/detailedGauge/CumulativeEnergyChart";
import PowerHeatmap from "../components/detailedGauge/PowerHeatmap";
import { useTranslation } from "../hooks/useTranslation";

const ElectricMeterDetails = () => {
  const router = useRouter();
  const { view } = router.query;
  const { t } = useTranslation();

  if (!router.isReady) {
    return <div>Loading...</div>;
  }

  if (!view) {
    return (
      <div>
        <h1>{t("navigation.meterDetails.title")}</h1>
        <p>{t("electricMeterDetails.selectView")}</p>
      </div>
    );
  }

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
        return <div>{t("electricMeterDetails.invalidView")}</div>;
    }
  };

  return <div>{renderComponent()}</div>;
};
export default ElectricMeterDetails;
