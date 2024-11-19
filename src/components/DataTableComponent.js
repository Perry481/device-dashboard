import React, { useEffect } from "react";
import styled from "styled-components";
import { useTranslation } from "../hooks/useTranslation";

const TableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;

  th,
  td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: center;
  }

  th {
    background-color: #f2f2f2;
    font-weight: bold;
  }

  tr:nth-child(even) {
    background-color: #f9f9f9;
  }
`;

const Card = styled.div`
  margin: 20px 0;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
`;

const CardHeader = styled.div`
  background-color: #f8f9fa;
  padding: 15px;
  border-bottom: 1px solid #e9ecef;
`;

const CardTitle = styled.h3`
  margin: 0;
  color: #333;
`;

const CardBody = styled.div`
  padding: 15px;
`;

const peakTypes = ["peak", "halfPeak", "offPeak", "total"];

const DataTableComponent = ({
  aggregatedData,
  energyConsumption,
  energyPrice,
  prices,
}) => {
  const { t } = useTranslation();

  const splitData = (data, chunkSize) => {
    const dates = Object.keys(data);
    const chunks = [];
    for (let i = 0; i < dates.length; i += chunkSize) {
      const chunk = dates.slice(i, i + chunkSize);
      const chunkData = transformData(data, chunk);
      chunks.push(chunkData);
    }
    return chunks;
  };

  const transformData = (data, dateChunk) => {
    const transformed = peakTypes.map((type) => {
      const row = { Type: t(`dataTable.peakTypes.${type}`) };
      dateChunk.forEach((date) => {
        let value = "0";
        let unit = t("common.units.kwh");

        if (energyConsumption) {
          switch (type) {
            case "peak":
              value = data[date]?.peak || "0";
              break;
            case "halfPeak":
              value = data[date]?.halfpeak || "0";
              break;
            case "offPeak":
              value = data[date]?.offpeak || "0";
              break;
            case "total":
              if (data[date]) {
                value = (
                  parseFloat(data[date].peak || 0) +
                  parseFloat(data[date].halfpeak || 0) +
                  parseFloat(data[date].offpeak || 0)
                ).toFixed(2);
              }
              break;
          }
        } else if (energyPrice && prices) {
          const period = data[date].isSummer ? "夏月" : "非夏月";
          const peakPrice = parseFloat(
            prices.peakPrices?.[period]?.replace("NT$", "") || "0"
          );
          const halfpeakPrice = parseFloat(
            prices.halfPeakPrices?.[period]?.replace("NT$", "") || "0"
          );
          const offpeakPrice = parseFloat(
            prices.offPeakPrices?.[period]?.replace("NT$", "") || "0"
          );

          switch (type) {
            case "peak":
              value = data[date]?.peak
                ? (parseFloat(data[date].peak) * peakPrice).toFixed(2)
                : "0";
              break;
            case "halfPeak":
              value = data[date]?.halfpeak
                ? (parseFloat(data[date].halfpeak) * halfpeakPrice).toFixed(2)
                : "0";
              break;
            case "offPeak":
              value = data[date]?.offpeak
                ? (parseFloat(data[date].offpeak) * offpeakPrice).toFixed(2)
                : "0";
              break;
            case "total":
              value = (
                parseFloat(data[date]?.peak || 0) * peakPrice +
                parseFloat(data[date]?.halfpeak || 0) * halfpeakPrice +
                parseFloat(data[date]?.offpeak || 0) * offpeakPrice
              ).toFixed(2);
              break;
          }
          unit = t("common.currency");
        }
        row[date] = `${value} ${unit}`;
      });
      return row;
    });

    return transformed;
  };

  if (!aggregatedData || Object.keys(aggregatedData).length === 0) {
    return <p>{t("dataTable.noData")}</p>;
  }

  const transformedDataSets = splitData(aggregatedData, 7);

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>
            {energyConsumption
              ? t("dataTable.headers.energyTable")
              : t("dataTable.headers.priceTable")}
          </CardTitle>
        </CardHeader>
      </Card>
      {transformedDataSets.map((transformedData, index) => {
        const columns = [
          { title: "" },
          ...Object.keys(transformedData[0])
            .filter((key) => key !== "Type")
            .map((date) => ({ title: date })),
        ];

        return (
          <Card key={index}>
            <CardBody>
              <TableWrapper>
                <StyledTable>
                  <thead>
                    <tr>
                      {columns.map((col) => (
                        <th key={col.title}>{col.title}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transformedData.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {columns.map((col) => (
                          <td key={col.title}>{row[col.title] || row.Type}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </StyledTable>
              </TableWrapper>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
};

export default DataTableComponent;
