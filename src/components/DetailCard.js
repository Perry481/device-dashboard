// src/components/DetailCard.js
import React from "react";
import styled from "styled-components";

const Card = styled.div`
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 20px;
  margin: 20px 0;
  margin-right: 20px;
  height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const CardHeader = styled.div`
  font-weight: bold;
  margin-bottom: 10px;
  text-align: center;
`;

const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
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
  width: 12px;
  height: 12px;
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

  let peakPrice = 0;
  let semiPeakPrice = 0;
  let offPeakPrice = 0;

  if (prices) {
    peakPrice = parseFloat(prices.peakPrices?.夏月.replace("NT$", "")) || 0;
    semiPeakPrice =
      parseFloat(prices.halfPeakPrices?.夏月.replace("NT$", "")) || 0;
    offPeakPrice =
      parseFloat(prices.offPeakPrices?.夏月.replace("NT$", "")) || 0;
  }

  const totalCostPeak = totalPeak * peakPrice;
  const totalCostSemiPeak = totalSemiPeak * semiPeakPrice;
  const totalCostOffPeak = totalOffPeak * offPeakPrice;
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
