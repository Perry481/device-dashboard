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
    // Disable DataTable error messages
    $.fn.dataTable.ext.errMode = "none";

    if (!aggregatedData || Object.keys(aggregatedData).length === 0) {
      console.log("No aggregated data available");
      return; // Exit early if there's no data
    }

    console.log("Aggregated Data:", aggregatedData);

    const transformedDataSets = splitData(aggregatedData, 7); // Split data into chunks of 7 dates

    transformedDataSets.forEach((transformedData, index) => {
      const tableId = `energyTable-${index}`;
      const tableElement = $(`#${tableId}`);
      if ($.fn.DataTable.isDataTable(tableElement)) {
        tableElement.DataTable().destroy();
      }

      const columns = [
        { title: "Type" },
        ...Object.keys(transformedData[0])
          .filter((key) => key !== "Type")
          .map((date) => ({ title: date })),
      ];

      console.log(`Columns for ${tableId}:`, columns);
      console.log(`Data for ${tableId}:`, transformedData);

      // Generate <thead> and <tbody> HTML strings
      const thead = `<thead><tr>${columns
        .map((col) => `<th>${col.title}</th>`)
        .join("")}</tr></thead>`;
      const tbody = `<tbody>${transformedData
        .map(
          (row) =>
            `<tr>${columns
              .map((col) => `<td>${row[col.title] || row.Type}</td>`)
              .join("")}</tr>`
        )
        .join("")}</tbody>`;

      // Set the table HTML
      tableElement.html(`${thead}${tbody}`);

      // Initialize DataTable with search and paging disabled
      const dataTableConfig = {
        destroy: true,
        responsive: true,
        searching: false,
        paging: false,
        info: false,
        ordering: false,
      };
      const dataTableInstance = tableElement.DataTable(dataTableConfig);

      const handleResize = () => {
        if (dataTableInstance) {
          dataTableInstance.columns.adjust();
        }
      };

      window.addEventListener("resize", handleResize);

      return () => {
        if (dataTableInstance) {
          dataTableInstance.destroy();
        }
        window.removeEventListener("resize", handleResize);
      };
    });
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
          // For energy price, multiply the value by the corresponding price
          const peakPrice =
            parseFloat(prices.peakPrices?.夏月.replace("NT$", "")) || 0;
          const semiPeakPrice =
            parseFloat(prices.halfPeakPrices?.夏月.replace("NT$", "")) || 0;
          const offPeakPrice =
            parseFloat(prices.offPeakPrices?.夏月.replace("NT$", "")) || 0;

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
          unit = "元";
        }
        row[date] = value !== undefined ? `${value} ${unit}` : "0";
      });
      console.log(`Transformed row for ${state}:`, row);
      return row;
    });

    return transformed;
  };

  if (!aggregatedData || Object.keys(aggregatedData).length === 0) {
    return <p>No data available</p>;
  }

  const transformedDataSets = splitData(aggregatedData, 7);

  console.log("Transformed Data Sets:", transformedDataSets);

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
