import React, { useEffect } from "react";
import styled from "styled-components";
import { useTranslation } from "../hooks/useTranslation";

const peakTypes = ["peak", "halfPeak", "offPeak", "total"];

const TableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-radius: 12px;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 600px;

  th,
  td {
    padding: 12px 16px;
    text-align: center;
    border: none;
    border-bottom: 1px solid #e2e8f0;
    font-size: 0.95rem;
  }

  th {
    background-color: #f8fafc;
    color: #1a202c;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.85rem;
    letter-spacing: 0.05em;
    white-space: nowrap;

    &:first-child {
      border-top-left-radius: 8px;
    }

    &:last-child {
      border-top-right-radius: 8px;
    }
  }

  tr {
    transition: all 0.2s ease;

    &:nth-child(even) {
      background-color: #f8fafc;
    }

    &:hover {
      background-color: #f1f5f9;
    }

    // Style for peak rows
    &:nth-child(1) td {
      color: #e53e3e; // Red for peak
    }

    // Style for half-peak rows
    &:nth-child(2) td {
      color: #d97706; // Orange for half-peak
    }

    // Style for off-peak rows
    &:nth-child(3) td {
      color: #3ba272; // Theme green for off-peak
    }

    // Style for total rows
    &:nth-child(4) td {
      color: #1a202c;
      font-weight: 600;
      border-top: 2px solid #e2e8f0;
    }
  }

  td {
    color: #4a5568;
  }
`;

const Card = styled.div`
  margin: 20px 0;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
`;

const CardHeader = styled.div`
  background: linear-gradient(to right, #ffffff, #f8f9fa);
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const CardTitle = styled.h3`
  margin: 0;
  color: #2d3748;
  font-size: 1.25rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &::before {
    content: "";
    display: inline-block;
    width: 4px;
    height: 1em;
    background-color: #3ba272;
    border-radius: 2px;
  }
`;

const CardBody = styled.div`
  padding: 20px;
  background-color: white;
`;

// Optional: Add loading state styles
const LoadingState = styled.div`
  padding: 2rem;
  text-align: center;
  color: #718096;
`;

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
