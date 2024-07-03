// src/components/DetailCard.js
import React from "react";
import styled from "styled-components";

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
  const totalPeak = Object.values(aggregatedData).reduce(
    (acc, curr) => acc + parseFloat(curr.peak),
    0
  );
  const totalSemiPeak = Object.values(aggregatedData).reduce(
    (acc, curr) => acc + parseFloat(curr.semiPeak),
    0
  );
  const totalOffPeak = Object.values(aggregatedData).reduce(
    (acc, curr) => acc + parseFloat(curr.offPeak),
    0
  );
  const total = totalPeak + totalSemiPeak + totalOffPeak;

  let totalCostPeak = 0;
  let totalCostSemiPeak = 0;
  let totalCostOffPeak = 0;

  if (prices) {
    Object.keys(aggregatedData).forEach((date) => {
      const { peak, semiPeak, offPeak, isSummer } = aggregatedData[date];
      const period = isSummer ? "夏月" : "非夏月";

      const peakPrice =
        parseFloat(prices.peakPrices?.[period]?.replace("NT$", "")) || 0;
      const semiPeakPrice =
        parseFloat(prices.halfPeakPrices?.[period]?.replace("NT$", "")) || 0;
      const offPeakPrice =
        parseFloat(prices.offPeakPrices?.[period]?.replace("NT$", "")) || 0;

      totalCostPeak += parseFloat(peak) * peakPrice;
      totalCostSemiPeak += parseFloat(semiPeak) * semiPeakPrice;
      totalCostOffPeak += parseFloat(offPeak) * offPeakPrice;
    });
  }

  const totalCost = totalCostPeak + totalCostSemiPeak + totalCostOffPeak;

  return (
    <Card>
      <CardHeader>
        {energyConsumption ? "能耗分布細項" : "電價分布細項"}
      </CardHeader>
      <CardBody>
        {energyConsumption && (
          <>
            <DetailItem>
              <div>
                <ColorBlock color="#ee6666" />
                <span>尖峰</span>
              </div>
              <span>
                {totalPeak.toFixed(1)} kWh (
                {((totalPeak / total) * 100).toFixed(1)}%)
              </span>
            </DetailItem>
            <DetailItem>
              <div>
                <ColorBlock color="#fac858" />
                <span>半尖峰</span>
              </div>
              <span>
                {totalSemiPeak.toFixed(1)} kWh (
                {((totalSemiPeak / total) * 100).toFixed(1)}%)
              </span>
            </DetailItem>
            <DetailItem>
              <div>
                <ColorBlock color="#91CC75" />
                <span>離峰</span>
              </div>
              <span>
                {totalOffPeak.toFixed(1)} kWh (
                {((totalOffPeak / total) * 100).toFixed(1)}%)
              </span>
            </DetailItem>
          </>
        )}
        {energyPrice && prices && (
          <>
            <DetailItem>
              <div>
                <ColorBlock color="#ee6666" />
                <span>尖峰</span>
              </div>
              <span>
                {totalCostPeak.toFixed(1)} NT$ (
                {((totalCostPeak / totalCost) * 100).toFixed(1)}%)
              </span>
            </DetailItem>
            <DetailItem>
              <div>
                <ColorBlock color="#fac858" />
                <span>半尖峰</span>
              </div>
              <span>
                {totalCostSemiPeak.toFixed(1)} NT$ (
                {((totalCostSemiPeak / totalCost) * 100).toFixed(1)}%)
              </span>
            </DetailItem>
            <DetailItem>
              <div>
                <ColorBlock color="#91CC75" />
                <span>離峰</span>
              </div>
              <span>
                {totalCostOffPeak.toFixed(1)} NT$ (
                {((totalCostOffPeak / totalCost) * 100).toFixed(1)}%)
              </span>
            </DetailItem>
          </>
        )}
        <DetailItem>
          <span>總合</span>
          <span>
            {energyConsumption
              ? total.toFixed(1) + " kWh"
              : totalCost.toFixed(1) + " NT$"}
          </span>
        </DetailItem>
      </CardBody>
    </Card>
  );
};

export default DetailCard;
