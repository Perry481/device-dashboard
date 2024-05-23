import Head from "next/head";
import Checkbox from "../components/checkbox"; // Ensure correct import path
import React, { useState, useEffect, useRef } from "react";
import * as echarts from "echarts";
import { useSidebarContext } from "../contexts/SidebarContext"; // Adjust the path as necessary

export default function Cost({ isIframe }) {
  const [apidata, setApidata] = useState({}); // Initialize state to store fetched data
  const [selections, setSelections] = useState({});
  const [filteredData, setFilteredData] = useState({});
  const [customerData, setCustomerData] = useState({});
  const [isLoading, setIsLoading] = useState(true); // Add loading state

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const multiBarChartRef = useRef(null);
  const costPieChartRef = useRef(null);
  const paretoChartRef = useRef(null);

  const { sidebarWidth } = useSidebarContext();
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true); // Set loading state to true before fetching data
        const response = await fetch("/api/getCustomerCostAnalysis");
        const data = await response.json();
        setApidata(data);
        setIsLoading(false); // Set loading state to false after data is fetched
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setIsLoading(false); // Set loading state to false in case of error
      }
    };

    fetchData();
  }, []);

  const handleSelectionUpdate = (newSelections) => {
    console.log("Current Selections:", newSelections);
    setSelections(newSelections); // Update state with new selections
  };

  function filterDataBySelections(apidata, selections) {
    const newFilteredData = {}; // Create a new object to accumulate filtered data

    // Loop over each year in selections
    Object.keys(selections).forEach((year) => {
      if (apidata[year]) {
        newFilteredData[year] = {}; // Initialize year if it exists in apidata

        // Loop over each quarter in the selected year
        Object.keys(selections[year]).forEach((quarter) => {
          if (apidata[year][quarter]) {
            newFilteredData[year][quarter] = {}; // Initialize quarter if it exists in apidata

            // Loop over each month in the selected quarter
            Object.keys(selections[year][quarter]).forEach((month) => {
              if (
                selections[year][quarter][month] &&
                apidata[year][quarter][`Month ${month}`]
              ) {
                // Check if the month is selected and exists in apidata
                newFilteredData[year][quarter][`Month ${month}`] =
                  apidata[year][quarter][`Month ${month}`];
              }
            });
          }
        });
      }
    });

    setFilteredData(newFilteredData); // Update the state with the new filtered data
    // console.log("Filtered Data:", newFilteredData);
    aggregateDataByCustomer(newFilteredData); // Assuming aggregateDataByCustomer is correctly implemented elsewhere
    return newFilteredData;
  }

  useEffect(() => {
    if (Object.keys(apidata).length > 0 && Object.keys(selections).length > 0) {
      filterDataBySelections(apidata, selections);
    }
  }, [apidata, selections]);

  function aggregateDataByCustomer(filteredData) {
    const newCustomerData = {};

    // Traverse through the filtered data structure
    Object.keys(filteredData).forEach((year) => {
      Object.keys(filteredData[year]).forEach((quarter) => {
        Object.keys(filteredData[year][quarter]).forEach((month) => {
          filteredData[year][quarter][month].forEach((entry) => {
            const customerName = entry.客戶名稱;

            // Initialize the customer entry if it doesn't exist in newCustomerData
            if (!newCustomerData[customerName]) {
              newCustomerData[customerName] = {
                製造成本: 0,
                零件成本: 0,
                委外成本: 0,
                產品總成本: 0,
                佣金: 0,
                業務成本: 0,
                工程成本: 0,
                採購成本: 0,
                品保成本: 0,
                損失金額: 0,
                買進賣出進貨金額: 0,
                銷貨金額: 0,
                租金: 0,
                訂單金額: 0,
              };
            }

            // Aggregate the data for this customer in newCustomerData
            newCustomerData[customerName].製造成本 += parseFloat(
              entry.製造成本 || 0
            );
            newCustomerData[customerName].零件成本 += parseFloat(
              entry.零件成本 || 0
            );
            newCustomerData[customerName].委外成本 += parseFloat(
              entry.委外成本 || 0
            );
            newCustomerData[customerName].產品總成本 += parseFloat(
              entry.產品總成本 || 0
            );
            newCustomerData[customerName].佣金 += parseFloat(entry.佣金 || 0);
            newCustomerData[customerName].業務成本 += parseFloat(
              entry.業務成本 || 0
            );
            newCustomerData[customerName].工程成本 += parseFloat(
              entry.工程成本 || 0
            );
            newCustomerData[customerName].採購成本 += parseFloat(
              entry.採購成本 || 0
            );
            newCustomerData[customerName].品保成本 += parseFloat(
              entry.品保成本 || 0
            );

            newCustomerData[customerName].損失金額 += parseFloat(
              entry.損失金額 || 0
            );
            newCustomerData[customerName].買進賣出進貨金額 += parseFloat(
              entry.買進賣出進貨金額 || 0
            );

            newCustomerData[customerName].銷貨金額 += parseFloat(
              entry.銷貨金額 || 0
            );
            newCustomerData[customerName].租金 += parseFloat(entry.租金 || 0);
            newCustomerData[customerName].訂單金額 += parseFloat(
              entry.訂單金額 || 0
            );
          });
        });
      });
    });

    // Update the state once with the new aggregated data
    setCustomerData(newCustomerData);
    console.log("Aggregated Customer Data:", newCustomerData);
    if (Object.keys(newCustomerData).length === 0) {
      setSelectedCustomer(null);
      console.log("No customer data available, resetting selected customer.");
    }
  }

  const renderPieCharts = (chartData, selectedCustomer) => {
    if (Object.keys(chartData).length > 0 && costPieChartRef.current) {
      // Handling no specific customer selected: aggregate data
      let data;
      if (selectedCustomer && chartData[selectedCustomer]) {
        data = chartData[selectedCustomer];
      } else {
        // Aggregate all customer data if no specific customer is selected
        data = Object.keys(chartData).reduce((acc, key) => {
          Object.keys(chartData[key]).forEach((field) => {
            acc[field] = (acc[field] || 0) + (chartData[key][field] || 0);
          });
          return acc;
        }, {});
      }

      // Create data array for the pie chart and sort it in descending order
      const pieData = [
        { value: data["零件成本"] || 0, name: "零件成本" },
        { value: data["製造成本"] || 0, name: "製造成本" },
        { value: data["委外成本"] || 0, name: "委外成本" },
        { value: data["買進賣出進貨金額"] || 0, name: "買進賣出進貨金額" },
        { value: data["不良成本"] || 0, name: "不良成本" },
        { value: data["佣金"] || 0, name: "佣金" },
        { value: data["租金"] || 0, name: "租金" },
        {
          value:
            data["業務成本"] +
              data["工程成本"] +
              data["採購成本"] +
              data["品保成本"] || 0,
          name: "間接成本",
        },
      ].sort((a, b) => b.value - a.value); // Sort data in descending order

      // Initialize chart instances
      const costPieChart = echarts.init(costPieChartRef.current);

      // Define options for the cost pie chart
      const costPieOptions = {
        title: {
          text: "客戶成本分析",
          subtext: selectedCustomer || "全部客戶",
          left: "center",
        },
        tooltip: {
          trigger: "item",
          formatter: (params) => {
            return `${params.seriesName} <br/>${
              params.name
            }: ${params.value.toLocaleString()} (${params.percent}%)`;
          },
        },
        legend: {
          type: "scroll",
          orient: "vertical",
          left: "left",
          bottom: 20,
          pageIconSize: 10,
          height: 110, // Adjust this height to control the number of visible legend items
        },
        series: [
          {
            name: selectedCustomer ? selectedCustomer : "全部客戶",
            type: "pie",
            radius: "55%",
            center: ["50%", "50%"],
            data: pieData, // Use the sorted pieData array
          },
        ],
      };

      // Set options to the charts
      costPieChart.setOption(costPieOptions);

      // Resize handling
      const resizeCharts = () => {
        costPieChart.resize();
      };

      // Attach event listener to resize the charts on window resize
      window.addEventListener("resize", resizeCharts);

      // Return a cleanup function to remove event listener and dispose charts
      return () => {
        window.removeEventListener("resize", resizeCharts);
        costPieChart.dispose();
      };
    }
  };

  const renderCustomerSalesPieChart = (chartData, selectedCustomer) => {
    if (Object.keys(chartData).length > 0 && multiBarChartRef.current) {
      const myChart = echarts.init(multiBarChartRef.current);

      // Prepare the data for the pie chart and sort it in descending order
      const pieData = Object.keys(chartData)
        .map((customer) => {
          const totalCost =
            chartData[customer]["佣金"] +
            chartData[customer]["品保成本"] +
            chartData[customer]["工程成本"] +
            chartData[customer]["採購成本"] +
            chartData[customer]["損失金額"] +
            chartData[customer]["業務成本"] +
            chartData[customer]["產品總成本"] +
            chartData[customer]["租金"] +
            chartData[customer]["買進賣出進貨金額"];

          return {
            name: customer,
            value: totalCost,
          };
        })
        .sort((a, b) => b.value - a.value); // Sort data in descending order

      // Get the top 10 data for the labels
      const top10Data = pieData.slice(0, 10);

      const option = {
        title: {
          text: "客戶總成本分布",
          // subtext: selectedCustomer || "全部客戶",
          subtextStyle: {
            color: selectedCustomer ? "#c23531" : "#333", // Change color based on selection
            fontSize: 14,
            align: "left",
          },
          left: "center",
        },
        tooltip: {
          trigger: "item",
          formatter: "{a} <br/>{b} : {c} ({d}%)",
          formatter: function (params) {
            return `${params.seriesName} <br/>${
              params.name
            } : ${params.value.toLocaleString()} (${params.percent}%)`;
          },
        },
        legend: {
          type: "scroll",
          orient: "vertical",
          left: "left",
          top: 20,
          bottom: 20,
          data: pieData.map((item) => item.name),
          height: 110, // Adjust this height to control the number of visible legend items
          pageIconSize: 10,
        },
        series: [
          {
            name: "總成本",
            type: "pie",
            radius: "55%",
            center: ["50%", "50%"],
            data: pieData.map((item) => ({
              name: item.name,
              value: item.value,
              itemStyle: {
                color: selectedCustomer === item.name ? "#c23531" : undefined,
              },
              labelLine: {
                show: top10Data.some((topItem) => topItem.name === item.name),
                emphasis: {
                  show: false,
                },
              },
            })),
            label: {
              show: true,
              formatter: function (params) {
                return top10Data.some((item) => item.name === params.name)
                  ? params.name
                  : "";
              },
            },
            labelLine: {
              show: true,
              length: 30,
              lineStyle: {
                color: "rgba(0, 0, 0, 0.5)",
              },
            },
          },
        ],
      };

      myChart.setOption(option);
      window.addEventListener("resize", myChart.resize);

      myChart.on("click", function (params) {
        console.log("Event parameters:", params);
        if (params.componentType === "series") {
          console.log("Clicked series:", params);
          // Toggle the selected customer: if already selected, deselect; otherwise, select the new one
          if (selectedCustomer === params.name) {
            setSelectedCustomer(null); // Deselect and show data for all customers
          } else {
            setSelectedCustomer(params.name); // Set the clicked customer name
          }
        }
      });

      return () => {
        window.removeEventListener("resize", myChart.resize);
        myChart.dispose();
      };
    }
  };

  const renderParetoChart = (chartData, selectedCustomer) => {
    if (Object.keys(chartData).length > 0 && paretoChartRef.current) {
      const myChart = echarts.init(paretoChartRef.current);

      // Prepare the data for the Pareto chart
      let data = selectedCustomer
        ? chartData[selectedCustomer]
        : Object.keys(chartData).reduce((acc, customer) => {
            Object.keys(chartData[customer]).forEach((key) => {
              acc[key] = (acc[key] || 0) + chartData[customer][key];
            });
            return acc;
          }, {});

      const costComponents = [
        { name: "製造成本", value: data["製造成本"] || 0 },
        { name: "零件成本", value: data["零件成本"] || 0 },
        { name: "委外成本", value: data["委外成本"] || 0 },
        {
          name: "間接成本",
          value:
            (data["工程成本"] || 0) +
            (data["採購成本"] || 0) +
            (data["品保成本"] || 0) +
            (data["業務成本"] || 0),
        },
        { name: "損失金額", value: data["損失金額"] || 0 },
        { name: "買進賣出進貨金額", value: data["買進賣出進貨金額"] || 0 },
        { name: "佣金", value: data["佣金"] || 0 },
        { name: "租金", value: data["租金"] || 0 },
      ];

      // Sort cost components by value in descending order
      costComponents.sort((a, b) => b.value - a.value);

      // Calculate cumulative percentages
      const totalCost = costComponents.reduce(
        (sum, item) => sum + item.value,
        0
      );
      let cumulative = 0;
      const cumulativePercentages = costComponents.map((item) => {
        cumulative += item.value;
        return ((cumulative / totalCost) * 100).toFixed(2);
      });

      // Adjust the unit for y-axis based on selectedCustomer
      const yAxisUnit = selectedCustomer ? 10000000 : 100000000;
      const yAxisName = selectedCustomer ? "成本 (千萬)" : "成本 (億)";

      const option = {
        title: {
          text: "柏拉圖成本分析",
          subtext: selectedCustomer || "全部客戶",
          left: "center",
        },
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "shadow",
          },
        },
        legend: {
          data: ["成本", "累計百分比"],
          left: "25%",
          top: 20,
        },
        xAxis: {
          type: "category",
          data: costComponents.map((item) => item.name),
          axisLabel: {
            rotate: 30,
          },
        },
        yAxis: [
          {
            type: "value",
            name: yAxisName,
            min: 0,
            axisLabel: {
              formatter: function (value) {
                return value / yAxisUnit;
              },
            },
          },
          {
            type: "value",
            name: "累計百分比",
            min: 0,
            max: 100,
            axisLabel: {
              formatter: "{value} %",
            },
          },
        ],
        series: [
          {
            name: "成本",
            type: "bar",
            data: costComponents.map((item) => item.value),
          },
          {
            name: "累計百分比",
            type: "line",
            yAxisIndex: 1,
            data: cumulativePercentages,
          },
        ],
      };

      myChart.setOption(option);
      window.addEventListener("resize", myChart.resize);

      return () => {
        window.removeEventListener("resize", myChart.resize);
        myChart.dispose();
      };
    }
  };

  const updateDetailedCardForBar = (customerData, selectedCustomer) => {
    const cardBody = document.getElementById("detailedCardForBarChart");
    const customerLabel = selectedCustomer ? `${selectedCustomer}` : "全部客戶";

    // Check if there is no customer data or if the specific customer has no data
    if (
      Object.keys(customerData).length === 0 ||
      (selectedCustomer && !customerData[selectedCustomer])
    ) {
      cardBody.innerHTML = `<div class="info-box">No data available for ${customerLabel}</div>`;
      return; // Exit early since there's no data to process
    }

    // Initialize sums for all relevant data fields
    let sums = {
      工單直接成本: 0,
      間接成本: 0,
      佣金: 0,
      租金: 0,
      買進賣出進貨金額: 0,
      不良成本: 0,
      損失金額: 0,
      訂單金額: 0,
      銷貨金額: 0,
      // Adding necessary fields to correctly calculate derived metrics
      業務成本: 0,
      工程成本: 0,
      採購成本: 0,
      品保成本: 0,
      產品總成本: 0,
    };

    // Proceed with aggregating data if it exists
    const data = selectedCustomer
      ? { [selectedCustomer]: customerData[selectedCustomer] }
      : customerData;
    Object.values(data).forEach((customer) => {
      Object.keys(sums).forEach((key) => {
        sums[key] += parseFloat(customer[key] || 0);
      });
    });

    // Calculate derived metrics
    sums["工單直接成本"] = sums["產品總成本"];
    sums["不良成本"] = sums["損失金額"];
    sums["間接成本"] =
      sums["業務成本"] + sums["工程成本"] + sums["採購成本"] + sums["品保成本"];

    // Fields to display on the card
    const displayFields = [
      "工單直接成本",
      "間接成本",
      "佣金",
      "租金",
      "買進賣出進貨金額",
      "不良成本",
      "訂單金額",
      "銷貨金額",
    ];

    // Construct the HTML content for the detailed card
    const content = `
      <div class="info-box">
        <div class="info-box-content" style="font-weight: bold; font-size: 1.2em; margin-bottom: 10px;">
          ${customerLabel}
        </div>
      </div>
      ${displayFields
        .map(
          (key) => `
        <div class="info-box">
          <div class="info-box-content">
            <span class="info-box-text">${key}</span>
            <span class="info-box-number">${
              key.includes("占比") || key.includes("比")
                ? sums[key].toLocaleString() + "%"
                : sums[key].toLocaleString()
            }</span>
          </div>
        </div>
      `
        )
        .join("")}
    `;

    // Update the HTML of the cardBody
    cardBody.innerHTML = content;
  };

  useEffect(() => {
    const multiBarCleanup = renderCustomerSalesPieChart(
      customerData,
      selectedCustomer
    );
    const paretoCleanup = renderParetoChart(customerData, selectedCustomer);
    const pieChartCleanup = renderPieCharts(customerData, selectedCustomer);

    updateDetailedCardForBar(customerData, selectedCustomer);

    return () => {
      if (multiBarCleanup) multiBarCleanup();
      if (paretoCleanup) paretoCleanup();
      if (pieChartCleanup) pieChartCleanup();
    };
  }, [customerData, sidebarWidth, selectedCustomer]);

  return (
    <div className="container-fluid">
      <Head>
        <title>Cost Analysis</title>
      </Head>
      <div className="row " style={{ width: "100%", height: "50vh" }}>
        <div className="col-4">
          <div
            ref={multiBarChartRef}
            style={{ width: "100%", height: "100%" }}
          ></div>
        </div>
        <div className="col-2">
          <div
            className="card card-primary card-outline"
            style={{
              overflowY: "auto",
              maxHeight: "calc(50vh - 40px)",
              padding: "5px",
            }}
          >
            <div
              className="card-body"
              id="detailedCardForBarChart"
              style={{
                fontSize: "0.7rem",
                overflowY: "auto",
                maxHeight: "calc(50vh - 40px)",
                padding: "5px",
              }}
            ></div>
          </div>
        </div>
        <div className="col-4">
          {" "}
          <div
            ref={costPieChartRef}
            style={{ width: "100%", height: "100%" }}
          ></div>
        </div>
        <div className="col-2 ">
          <Checkbox onUpdate={handleSelectionUpdate} isLoading={isLoading} />
        </div>
      </div>
      <div className="row" style={{ width: "100%", height: "50vh" }}>
        <div
          ref={paretoChartRef}
          style={{ width: "100%", height: "100%" }}
        ></div>
      </div>
    </div>
  );
}
