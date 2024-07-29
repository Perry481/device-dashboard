import React, { useEffect } from "react";
import $ from "jquery";
import "datatables.net-dt/css/dataTables.dataTables.css";
import "datatables.net-dt";
import styled from "styled-components";

// Styled componentsimport styled from "styled-components";

const TableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 600px; // Ensure the table doesn't shrink too much

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
const DataTableComponent = ({
  aggregatedData,
  energyConsumption,
  energyPrice,
  prices,
}) => {
  useEffect(() => {
    if (!aggregatedData || Object.keys(aggregatedData).length === 0) {
      console.log("No aggregated data available");
      return;
    }
    console.log("Aggregated Data:", aggregatedData);
  }, [aggregatedData, energyConsumption, energyPrice, prices]);

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
    const peakStates = ["尖峰", "半尖峰", "離峰", "總合"];
    const transformed = peakStates.map((state) => {
      const row = { Type: state };
      dateChunk.forEach((date) => {
        let value = "0";
        let unit = "kWh";

        if (energyConsumption) {
          switch (state) {
            case "尖峰":
              value =
                data[date] && data[date].peak !== undefined
                  ? data[date].peak
                  : "0";
              break;
            case "半尖峰":
              value =
                data[date] && data[date].semiPeak !== undefined
                  ? data[date].semiPeak
                  : "0";
              break;
            case "離峰":
              value =
                data[date] && data[date].offPeak !== undefined
                  ? data[date].offPeak
                  : "0";
              break;
            case "總合":
              if (data[date]) {
                value = (
                  (data[date].peak !== undefined
                    ? parseFloat(data[date].peak)
                    : 0) +
                  (data[date].semiPeak !== undefined
                    ? parseFloat(data[date].semiPeak)
                    : 0) +
                  (data[date].offPeak !== undefined
                    ? parseFloat(data[date].offPeak)
                    : 0)
                ).toFixed(2);
              } else {
                value = "0";
              }
              break;
            default:
              value = "0";
          }
        } else if (energyPrice && prices) {
          const period = data[date].isSummer ? "夏月" : "非夏月";
          const peakPrice =
            parseFloat(prices.peakPrices?.[period]?.replace("NT$", "")) || 0;
          const semiPeakPrice =
            parseFloat(prices.halfPeakPrices?.[period]?.replace("NT$", "")) ||
            0;
          const offPeakPrice =
            parseFloat(prices.offPeakPrices?.[period]?.replace("NT$", "")) || 0;

          switch (state) {
            case "尖峰":
              value =
                data[date] && data[date].peak !== undefined
                  ? (parseFloat(data[date].peak) * peakPrice).toFixed(2)
                  : "0";
              break;
            case "半尖峰":
              value =
                data[date] && data[date].semiPeak !== undefined
                  ? (parseFloat(data[date].semiPeak) * semiPeakPrice).toFixed(2)
                  : "0";
              break;
            case "離峰":
              value =
                data[date] && data[date].offPeak !== undefined
                  ? (parseFloat(data[date].offPeak) * offPeakPrice).toFixed(2)
                  : "0";
              break;
            case "總合":
              if (data[date]) {
                value = (
                  (data[date].peak !== undefined
                    ? parseFloat(data[date].peak) * peakPrice
                    : 0) +
                  (data[date].semiPeak !== undefined
                    ? parseFloat(data[date].semiPeak) * semiPeakPrice
                    : 0) +
                  (data[date].offPeak !== undefined
                    ? parseFloat(data[date].offPeak) * offPeakPrice
                    : 0)
                ).toFixed(2);
              } else {
                value = "0";
              }
              break;
            default:
              value = "0";
          }
          unit = "NT$";
        }
        row[date] = value !== undefined ? `${value} ${unit}` : "0";
      });
      return row;
    });

    return transformed;
  };

  if (!aggregatedData || Object.keys(aggregatedData).length === 0) {
    return <p>No data available</p>;
  }

  const transformedDataSets = splitData(aggregatedData, 7);

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>{energyConsumption ? "能耗總表" : "電價總表"}</CardTitle>
        </CardHeader>
      </Card>
      {transformedDataSets.map((transformedData, index) => {
        const columns = [
          { title: "Type" },
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
