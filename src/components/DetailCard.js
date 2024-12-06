import React from "react";
import styled from "styled-components";
import { useTranslation } from "../hooks/useTranslation";

const Card = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  margin: 20px 0;
  height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  @media (min-width: 992px) {
    margin-right: 80px;
  }

  @media (max-width: 991px) {
    margin-right: 0;
  }

  &:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06);
    transform: translateY(-2px);
  }
`;

const CardHeader = styled.div`
  position: relative;
  text-align: center;
  padding-bottom: 16px;
  margin-bottom: 24px;
  font-size: 1.25rem;
  font-weight: 600;
  color: #2d3748;

  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 3px;
    background-color: #3ba272;
    border-radius: 2px;
  }
`;

const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0 24px;
  font-size: 1rem;
`;

const DetailItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-radius: 8px;
  background-color: #f8fafc;
  transition: all 0.2s ease;

  &:hover {
    background-color: #f1f5f9;
    transform: translateX(4px);
  }

  &:last-child {
    background-color: #edf2f7;
    font-weight: 600;
    color: #2d3748;
    margin-top: 8px;

    &:hover {
      background-color: #e2e8f0;
    }
  }
`;

const PeakTypeWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #4a5568;
`;

const ColorBlock = styled.span`
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 3px;
  background-color: ${(props) => props.color};
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;

const ValueText = styled.span`
  font-family: "SF Mono", "Monaco", monospace;
  color: #2d3748;
  font-weight: 500;

  ${({ isTotal }) =>
    isTotal &&
    `
    font-weight: 600;
    color: #3ba272;
  `}
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
              <PeakTypeWrapper>
                <ColorBlock color="#ee6666" />
                <span>{t("detailCard.peakTypes.peak")}</span>
              </PeakTypeWrapper>
              <ValueText>
                {totalPeak.toFixed(1)} {t("common.units.kwh")}{" "}
                <span>({((totalPeak / total) * 100).toFixed(1)}%)</span>
              </ValueText>
            </DetailItem>
            <DetailItem>
              <PeakTypeWrapper>
                <ColorBlock color="#fac858" />
                <span>{t("detailCard.peakTypes.halfPeak")}</span>
              </PeakTypeWrapper>
              <ValueText>
                {totalHalfpeak.toFixed(1)} {t("common.units.kwh")}{" "}
                <span>({((totalHalfpeak / total) * 100).toFixed(1)}%)</span>
              </ValueText>
            </DetailItem>
            <DetailItem>
              <PeakTypeWrapper>
                <ColorBlock color="#91CC75" />
                <span>{t("detailCard.peakTypes.offPeak")}</span>
              </PeakTypeWrapper>
              <ValueText>
                {totalOffpeak.toFixed(1)} {t("common.units.kwh")}{" "}
                <span>({((totalOffpeak / total) * 100).toFixed(1)}%)</span>
              </ValueText>
            </DetailItem>
          </>
        )}
        {energyPrice && prices && (
          <>
            <DetailItem>
              <PeakTypeWrapper>
                <ColorBlock color="#ee6666" />
                <span>{t("detailCard.peakTypes.peak")}</span>
              </PeakTypeWrapper>
              <ValueText>
                {t("common.currency")}
                {totalCostPeak.toFixed(1)}{" "}
                <span>({((totalCostPeak / totalCost) * 100).toFixed(1)}%)</span>
              </ValueText>
            </DetailItem>
            <DetailItem>
              <PeakTypeWrapper>
                <ColorBlock color="#fac858" />
                <span>{t("detailCard.peakTypes.halfPeak")}</span>
              </PeakTypeWrapper>
              <ValueText>
                {t("common.currency")}
                {totalCostHalfpeak.toFixed(1)}{" "}
                <span>
                  ({((totalCostHalfpeak / totalCost) * 100).toFixed(1)}%)
                </span>
              </ValueText>
            </DetailItem>
            <DetailItem>
              <PeakTypeWrapper>
                <ColorBlock color="#91CC75" />
                <span>{t("detailCard.peakTypes.offPeak")}</span>
              </PeakTypeWrapper>
              <ValueText>
                {t("common.currency")}
                {totalCostOffpeak.toFixed(1)}{" "}
                <span>
                  ({((totalCostOffpeak / totalCost) * 100).toFixed(1)}%)
                </span>
              </ValueText>
            </DetailItem>
          </>
        )}
        <DetailItem>
          <PeakTypeWrapper>{t("detailCard.total")}</PeakTypeWrapper>
          <ValueText isTotal>
            {energyConsumption
              ? `${total.toFixed(1)} ${t("common.units.kwh")}`
              : `${t("common.currency")}${totalCost.toFixed(1)}`}
          </ValueText>
        </DetailItem>
      </CardBody>
    </Card>
  );
};
export default DetailCard;
