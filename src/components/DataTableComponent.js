// src/components/DataTableComponent.js
import React, { useEffect } from "react";
import $ from "jquery";
import "datatables.net-dt/css/dataTables.dataTables.css";
import "datatables.net-dt";
import styled from "styled-components";

// Styled components
const Card = styled.div`
  margin: 10px 0;
  width: 100%;
`;

const CardHeader = styled.div`
  background-color: #f2f2f2;
  padding: 10px;
  border-bottom: 1px solid #ddd;
`;

const CardTitle = styled.h3`
  margin: 0;
  font-size: 1.2em;
`;

const CardBody = styled.div`
  padding: 5px;
  width: 100%;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    border: 1px solid #000;
    text-align: center;
    padding: 5px;
  }

  thead th {
    background-color: #f2f2f2;
    font-weight: bold;
  }

  tbody tr:nth-child(even) {
    background-color: #f9f9f9;
  }

  tbody tr:hover {
    background-color: #f1f1f1;
  }
`;

const DataTableComponent = ({
  aggregatedData,
  energyConsumption,
  energyPrice,
  prices,
}) => {
  useEffect(() => {
    if (!aggregatedData || Object.keys(aggregatedData).length === 0) {
      return; // Exit early if there's no data
    }

    const transformedDataSets = splitData(aggregatedData, 10); // Split data into chunks of 10 dates
    transformedDataSets.forEach((transformedData, index) => {
      const tableId = `energyTable-${index}`;
      $(`#${tableId}`).DataTable({
        data: transformedData.map((row) => Object.values(row)), // Ensure data is an array of arrays
        columns: [
          { title: "" },
          ...Object.keys(transformedData[0])
            .slice(1)
            .map((date) => ({ title: date })),
        ],
        destroy: true,
        responsive: true,
        searching: false,
        paging: false,
        info: false,
        ordering: false,
      });

      const handleResize = () => {
        $(`#${tableId}`).DataTable().columns.adjust();
      };
      window.addEventListener("resize", handleResize);

      return () => {
        $(`#${tableId}`).DataTable().destroy();
        window.removeEventListener("resize", handleResize);
      };
    });
  }, [aggregatedData]);

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
        let value;
        let unit = energyConsumption ? "kWh" : "元";
        switch (state) {
          case "尖峰":
            value = data[date].peak;
            break;
          case "半尖峰":
            value = data[date].semiPeak;
            break;
          case "離峰":
            value = data[date].offPeak;
            break;
          case "總合":
            value = (
              parseFloat(data[date].peak) +
              parseFloat(data[date].semiPeak) +
              parseFloat(data[date].offPeak)
            ).toFixed(2);
            break;
          default:
            value = "";
        }

        if (energyPrice && prices) {
          const peakPrice =
            parseFloat(prices.peakPrices?.夏月.replace("NT$", "")) || 0;
          const semiPeakPrice =
            parseFloat(prices.halfPeakPrices?.夏月.replace("NT$", "")) || 0;
          const offPeakPrice =
            parseFloat(prices.offPeakPrices?.夏月.replace("NT$", "")) || 0;

          switch (state) {
            case "尖峰":
              value = (parseFloat(data[date].peak) * peakPrice).toFixed(2);
              break;
            case "半尖峰":
              value = (parseFloat(data[date].semiPeak) * semiPeakPrice).toFixed(
                2
              );
              break;
            case "離峰":
              value = (parseFloat(data[date].offPeak) * offPeakPrice).toFixed(
                2
              );
              break;
            case "總合":
              value = (
                parseFloat(data[date].peak) * peakPrice +
                parseFloat(data[date].semiPeak) * semiPeakPrice +
                parseFloat(data[date].offPeak) * offPeakPrice
              ).toFixed(2);
              break;
            default:
              value = "";
          }
        }

        row[date] = `${value} ${unit}`;
      });
      return row;
    });

    return transformed;
  };

  const transformedDataSets = splitData(aggregatedData, 10);

  if (!aggregatedData || Object.keys(aggregatedData).length === 0) {
    return <p>No data available</p>;
  }

  return (
    <div style={{ width: "100%" }}>
      <Card>
        <CardHeader>
          <CardTitle>{energyConsumption ? "能耗總表" : "電價總表"}</CardTitle>
        </CardHeader>
      </Card>
      {transformedDataSets.map((_, index) => (
        <Card key={index}>
          <CardBody>
            <StyledTable
              id={`energyTable-${index}`}
              className="display"
              width="100%"
            ></StyledTable>
          </CardBody>
        </Card>
      ))}
    </div>
  );
};

export default DataTableComponent;
