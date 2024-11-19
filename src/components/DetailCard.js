import React from "react";
import styled from "styled-components";
import { useTranslation } from "../hooks/useTranslation";

const Card = styled.div`
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 20px;
  margin: 20px 0;

  height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: center;

  @media (min-width: 992px) {
    margin-right: 80px;
  }

  @media (max-width: 991px) {
    margin-right: 0;
  }
`;

const CardHeader = styled.div`
  font-weight: bold;
  margin-bottom: 10px;
  text-align: center;
  font-weight: bolder;
  font-size: 20px;
`;

const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 50px;
  padding: 0 60px;
  font-size: 18px;
`;

const DetailItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  border-bottom: 1px solid #eee;
  width: 100%;
`;

const ColorBlock = styled.span`
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-right: 8px;
  background-color: ${(props) => props.color};
`;

const DetailCard = ({
  aggregatedData,
  energyConsumption,
  energyPrice,
  prices,
}) => {
  const { t } = useTranslation();
  const totalPeak = Object.values(aggregatedData).reduce(
    (acc, curr) => acc + parseFloat(curr.peak),
    0
  );
  const totalHalfpeak = Object.values(aggregatedData).reduce(
    (acc, curr) => acc + parseFloat(curr.halfpeak),
    0
  );
  const totalOffpeak = Object.values(aggregatedData).reduce(
    (acc, curr) => acc + parseFloat(curr.offpeak),
    0
  );
  const total = totalPeak + totalHalfpeak + totalOffpeak;

  let totalCostPeak = 0;
  let totalCostHalfpeak = 0;
  let totalCostOffpeak = 0;

  if (prices) {
    Object.keys(aggregatedData).forEach((date) => {
      const { peak, halfpeak, offpeak, isSummer } = aggregatedData[date];
      const period = isSummer ? "夏月" : "非夏月";

      const peakPrice =
        parseFloat(prices.peakPrices?.[period]?.replace("NT$", "")) || 0;
      const halfpeakPrice =
        parseFloat(prices.halfPeakPrices?.[period]?.replace("NT$", "")) || 0;
      const offpeakPrice =
        parseFloat(prices.offPeakPrices?.[period]?.replace("NT$", "")) || 0;

      totalCostPeak += parseFloat(peak) * peakPrice;
      totalCostHalfpeak += parseFloat(halfpeak) * halfpeakPrice;
      totalCostOffpeak += parseFloat(offpeak) * offpeakPrice;
    });
  }

  const totalCost = totalCostPeak + totalCostHalfpeak + totalCostOffpeak;

  return (
    <Card>
      <CardHeader>
        {energyConsumption
          ? t("detailCard.headers.energyDistribution")
          : t("detailCard.headers.priceDistribution")}
      </CardHeader>
      <CardBody>
        {energyConsumption && (
          <>
            <DetailItem>
              <div>
                <ColorBlock color="#ee6666" />
                <span>{t("detailCard.peakTypes.peak")}</span>
              </div>
              <span>
                {totalPeak.toFixed(1)} {t("common.units.kwh")} (
                {((totalPeak / total) * 100).toFixed(1)}%)
              </span>
            </DetailItem>
            <DetailItem>
              <div>
                <ColorBlock color="#fac858" />
                <span>{t("detailCard.peakTypes.halfPeak")}</span>
              </div>
              <span>
                {totalHalfpeak.toFixed(1)} {t("common.units.kwh")} (
                {((totalHalfpeak / total) * 100).toFixed(1)}%)
              </span>
            </DetailItem>
            <DetailItem>
              <div>
                <ColorBlock color="#91CC75" />
                <span>{t("detailCard.peakTypes.offPeak")}</span>
              </div>
              <span>
                {totalOffpeak.toFixed(1)} {t("common.units.kwh")} (
                {((totalOffpeak / total) * 100).toFixed(1)}%)
              </span>
            </DetailItem>
          </>
        )}
        {energyPrice && prices && (
          <>
            <DetailItem>
              <div>
                <ColorBlock color="#ee6666" />
                <span>{t("detailCard.peakTypes.peak")}</span>
              </div>
              <span>
                {t("common.currency")}
                {totalCostPeak.toFixed(1)} (
                {((totalCostPeak / totalCost) * 100).toFixed(1)}%)
              </span>
            </DetailItem>
            <DetailItem>
              <div>
                <ColorBlock color="#fac858" />
                <span>{t("detailCard.peakTypes.halfPeak")}</span>
              </div>
              <span>
                {t("common.currency")}
                {totalCostHalfpeak.toFixed(1)} (
                {((totalCostHalfpeak / totalCost) * 100).toFixed(1)}%)
              </span>
            </DetailItem>
            <DetailItem>
              <div>
                <ColorBlock color="#91CC75" />
                <span>{t("detailCard.peakTypes.offPeak")}</span>
              </div>
              <span>
                {t("common.currency")}
                {totalCostOffpeak.toFixed(1)} (
                {((totalCostOffpeak / totalCost) * 100).toFixed(1)}%)
              </span>
            </DetailItem>
          </>
        )}
        <DetailItem>
          <span>{t("detailCard.total")}</span>
          <span>
            {energyConsumption
              ? `${total.toFixed(1)} ${t("common.units.kwh")}`
              : `${t("common.currency")}${totalCost.toFixed(1)}`}
          </span>
        </DetailItem>
      </CardBody>
    </Card>
  );
};
export default DetailCard;
