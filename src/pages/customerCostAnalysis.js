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
  const [zoomRange, setZoomRange] = useState({ start: 0, end: 5 });

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const multiBarChartRef = useRef(null);
  const costPieChartRef = useRef(null);
  const prodCostPieChartRef = useRef(null);
  const indirectCostPieChartRef = useRef(null);

  const { sidebarWidth } = useSidebarContext();
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/getCustomerCostAnalysis");
        const data = await response.json();
        setApidata(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setIsLoading(false);
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
    if (
      Object.keys(chartData).length > 0 &&
      costPieChartRef.current &&
      prodCostPieChartRef.current &&
      indirectCostPieChartRef.current
    ) {
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

      // Initialize chart instances
      const costPieChart = echarts.init(costPieChartRef.current);
      const prodCostPieChart = echarts.init(prodCostPieChartRef.current);
      const indirectCostPieChart = echarts.init(
        indirectCostPieChartRef.current
      );

      // Define options for the cost pie chart
      const costPieOptions = {
        title: {
          text: "工單直接成本,間接成本,佣金與租金",
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
          orient: "vertical",
          left: "left",
          bottom: 50,
        },
        series: [
          {
            name: selectedCustomer ? selectedCustomer : "全部客戶",
            type: "pie",
            radius: "50%",
            avoidLabelOverlap: true,
            data: [
              { value: data["產品總成本"] || 0, name: "工單直接成本" },
              {
                value:
                  data["業務成本"] +
                    data["工程成本"] +
                    data["採購成本"] +
                    data["品保成本"] || 0,
                name: "間接成本",
              },
              { value: data["佣金"] || 0, name: "佣金" },
              { value: data["租金"] || 0, name: "租金" },
            ],
          },
        ],
      };

      // Define options for the profit pie chart
      const prodCostPieOptions = {
        title: {
          text: "產品成本",
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
          orient: "vertical",
          left: "left",
          bottom: 50,
        },
        series: [
          {
            name: selectedCustomer ? selectedCustomer : "全部客戶",
            type: "pie",
            radius: "50%",
            avoidLabelOverlap: true,
            data: [
              { value: data["零件成本"] || 0, name: "零件成本" },
              {
                value: data["製造成本"] || 0,
                name: "製造成本",
              },
              { value: data["委外成本"] || 0, name: "委外成本" },
            ],
          },
        ],
      };
      const indirectCostPieOptions = {
        title: {
          text: "間接成本",
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
          orient: "vertical",
          left: "left",
          bottom: 50,
        },
        series: [
          {
            name: selectedCustomer ? selectedCustomer : "全部客戶",
            type: "pie",
            radius: "50%",
            avoidLabelOverlap: true,
            data: [
              { value: data["資材成本"] || 0, name: "資材成本" },
              {
                value: data["業務成本"] || 0,
                name: "業務成本",
              },
              { value: data["工程成本"] || 0, name: "工程成本" },
              { value: data["品保成本"] || 0, name: "品保成本" },
            ],
          },
        ],
      };

      // Set options to the charts
      costPieChart.setOption(costPieOptions);
      prodCostPieChart.setOption(prodCostPieOptions);
      indirectCostPieChart.setOption(indirectCostPieOptions);

      // Resize handling
      const resizeCharts = () => {
        costPieChart.resize();
        prodCostPieChart.resize();
        indirectCostPieChart.resize();
      };

      // Attach event listener to resize the charts on window resize
      window.addEventListener("resize", resizeCharts);

      // Return a cleanup function to remove event listener and dispose charts
      return () => {
        window.removeEventListener("resize", resizeCharts);
        costPieChart.dispose();
        prodCostPieChart.dispose();
        indirectCostPieChart.dispose();
      };
    }
  };

  const renderMultiBarChart = (chartData, selectedCustomer) => {
    const yAxisUnit = selectedCustomer ? 10000000 : 100000000;

    if (Object.keys(chartData).length > 0 && multiBarChartRef.current) {
      const myChart = echarts.init(multiBarChartRef.current);
      const selectedBarColor = [
        "#dd6b66",
        "#759aa0",
        "#e69d87",
        "#8dc1a9",
        "#ea7e53",
      ];

      // Create an array of objects to sort categories by 銷貨金額
      const sortableCategories = Object.keys(chartData).map((category) => ({
        name: category,
        salesAmount: chartData[category]["銷貨金額"],
      }));

      // Sort categories by 銷貨金額 in descending order
      sortableCategories.sort((a, b) => b.salesAmount - a.salesAmount);

      // Extract the sorted categories for the xAxis
      const sortedCategories = sortableCategories.map((item) => item.name);

      // Prepare the series data using the sorted categories
      const seriesData = {
        銷貨金額: [],
        產品總成本: [],
        訂單金額: [],
        佣金: [],
        租金: [],
      };

      sortedCategories.forEach((category) => {
        const data = chartData[category];
        seriesData["銷貨金額"].push(data["銷貨金額"]);
        seriesData["產品總成本"].push(data["產品總成本"]);
        seriesData["訂單金額"].push(data["訂單金額"]);
        seriesData["佣金"].push(data["佣金"]);
        seriesData["租金"].push(data["租金"]);
      });

      const option = {
        title: {
          text: "銷售金額,訂單金額,產品總成本,租金與佣金 依據 客戶",
          subtext: selectedCustomer || "全部客戶",
          subtextStyle: {
            color: selectedCustomer ? "#c23531" : "#333", // Change color based on selection
            fontSize: 14,
            align: "left",
          },
          left: "center",
        },
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "shadow" },
        },
        legend: {
          data: ["銷貨金額", "產品總成本", "訂單金額", "佣金", "租金"],
          top: 15,
        },
        grid: {
          left: "15%", // Adjust this value to provide more space
        },
        xAxis: {
          type: "category",
          data: sortedCategories,
          triggerEvent: true,
          axisLabel: {
            rotate: 45,
            color: function (value) {
              // Change the color of the axis label based on whether it's the selected customer
              return value === selectedCustomer ? "#c23531" : "#333";
            },
          },
          axisPointer: {
            type: "shadow", // Use a shadow pointer for highlighting the whole column
            show: true,
          },
        },
        yAxis: {
          type: "value",

          axisLabel: {
            formatter: (value) => `NT$${value / 1e8}億`,
          },
        },
        series: Object.keys(seriesData).map((key, index) => ({
          name: key,
          type: "bar",
          data: seriesData[key].map((value, i) => {
            // Check if the category corresponds to the selected customer
            const isCategorySelected = sortedCategories[i] === selectedCustomer;
            return {
              value: value,
              // Apply selected color if the current category matches the selected customer,
              // otherwise use a default color
              itemStyle: {
                color: isCategorySelected
                  ? selectedBarColor[index % selectedBarColor.length]
                  : undefined,
              },
            };
          }),
          emphasis: {
            focus: "series",
          },
          itemStyle: {
            barBorderRadius: 4, // Rounded corners for bars
          },
        })),

        dataZoom: [
          {
            type: "inside",
            xAxisIndex: [0],
            start: zoomRange.start, // use state-managed zoom start
            end: zoomRange.end, // use state-managed zoom end
          },
          {
            type: "slider",
            xAxisIndex: [0],
            start: zoomRange.start, // use state-managed zoom start
            end: zoomRange.end, // use state-managed zoom end
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
        } else if (params.componentType === "xAxis") {
          // This condition assumes a click near the x-axis labels
          // The `params.value` should match one of the categories you have under xAxis.data
          console.log("Clicked xAxis label:", params.value);
          // Toggle the selected customer if the xAxis label matches any customer name
          if (selectedCustomer === params.value) {
            setSelectedCustomer(null); // Deselect if the same customer is clicked
          } else {
            setSelectedCustomer(params.value); // Select the new customer based on label
            // }
          }
        }
      });

      // Set up zoom level listener
      myChart.on("dataZoom", function (event) {
        const { start, end } = event;
        if (start !== undefined && end !== undefined) {
          // Only update the state if the zoom range has actually changed significantly
          if (
            Math.abs(start - zoomRange.start) > 0.01 ||
            Math.abs(end - zoomRange.end) > 0.01
          ) {
            debouncedSetZoomRange({ start, end });
          }
        }
      });

      // Apply the stored zoom range
      myChart.dispatchAction({
        type: "dataZoom",
        start: zoomRange.start,
        end: zoomRange.end,
      });

      return () => {
        window.removeEventListener("resize", myChart.resize);
        myChart.dispose();
      };
    }
  };

  function debounce(func, wait, immediate) {
    let timeout;
    return function () {
      const context = this,
        args = arguments;
      const later = function () {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  }

  // Debounce setZoomRange
  const debouncedSetZoomRange = debounce(setZoomRange, 300);
  useEffect(() => {
    const myChart = echarts.getInstanceByDom(multiBarChartRef.current);
    if (myChart) {
      const currentZoom = myChart.getOption().dataZoom[0];
      if (
        Math.abs(currentZoom.start - zoomRange.start) > 0.01 ||
        Math.abs(currentZoom.end - zoomRange.end) > 0.01
      ) {
        myChart.dispatchAction({
          type: "dataZoom",
          start: zoomRange.start,
          end: zoomRange.end,
        });
      }
    }
  }, [zoomRange]);

  const updateCardValues = (customerData, selectedCustomer) => {
    const cardBody = document.getElementById("summaryCard");
    const customerLabel = selectedCustomer ? `${selectedCustomer}` : "全部客戶";

    // Initialize sums for relevant data fields
    let sums = {
      工程成本: 0,
      業務成本: 0,
      資材成本: 0,
      品保成本: 0,
    };

    // Check if there is no customer data or if the specific customer has no data
    if (
      Object.keys(customerData).length === 0 ||
      (selectedCustomer && !customerData[selectedCustomer])
    ) {
      cardBody.innerHTML = `<div class="info-box">No data available for ${customerLabel}</div>`;
      return; // Exit early since there's no data to process
    }

    // Proceed with aggregating data if it exists
    const data = selectedCustomer
      ? { [selectedCustomer]: customerData[selectedCustomer] }
      : customerData;
    Object.values(data).forEach((customer) => {
      sums["工程成本"] += parseInt(customer["工程成本"] || 0);
      sums["業務成本"] += parseInt(customer["業務成本"] || 0);
      sums["資材成本"] += parseInt(customer["資材成本"] || 0);
      sums["品保成本"] += parseInt(customer["品保成本"] || 0);
    });

    // Fields to display on the card
    const displayFields = ["工程成本", "業務成本", "資材成本", "品保成本"];

    // Construct the HTML content for the summary card
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
            <span class="info-box-number">${sums[key].toLocaleString()}</span>
          </div>
        </div>
      `
        )
        .join("")}
    `;

    // Update the HTML of the cardBody
    cardBody.innerHTML = content;
  };

  const updateDetailedCardValues = (customerData, selectedCustomer) => {
    const cardBody = document.getElementById("detailedCard");
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
      委外成本: 0,
      製造成本: 0,
      零件成本: 0,
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

    // Fields to display on the card
    const displayFields = ["委外成本", "製造成本", "零件成本"];

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
                ? sums[key].toFixed(2) + "%"
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

  const updateCombinedDetailedCard = (customerData, selectedCustomer) => {
    const cardBody = document.getElementById("combinedDetailedCard");
    const customerLabel = selectedCustomer ? `${selectedCustomer}` : "全部客戶";

    let rentSums = {
      租金: 0,
      佣金: 0,
    };

    let costSums = {
      產品總成本: 0,
      間接成本: 0,
    };

    if (
      Object.keys(customerData).length === 0 ||
      (selectedCustomer && !customerData[selectedCustomer])
    ) {
      cardBody.innerHTML = `<div class="info-box">No data available for ${customerLabel}</div>`;
      return;
    }

    const data = selectedCustomer
      ? { [selectedCustomer]: customerData[selectedCustomer] }
      : customerData;
    Object.values(data).forEach((customer) => {
      rentSums["租金"] += parseFloat(customer["租金"] || 0);
      rentSums["佣金"] += parseFloat(customer["佣金"] || 0);

      costSums["產品總成本"] += parseFloat(customer["產品總成本"] || 0);
      costSums["間接成本"] += parseFloat(
        (customer["業務成本"] || 0) +
          (customer["工程成本"] || 0) +
          (customer["採購成本"] || 0) +
          (customer["品保成本"] || 0)
      );
    });

    const rentDisplayFields = ["租金", "佣金"];
    const costDisplayFields = ["產品總成本", "間接成本"];

    const rentContent = rentDisplayFields
      .map(
        (key) => `
        <div class="info-box">
          <div class="info-box-content">
            <span class="info-box-text">${key}</span>
            <span class="info-box-number">${
              key.includes("占比") || key.includes("比")
                ? rentSums[key].toFixed(2) + "%"
                : rentSums[key].toLocaleString()
            }</span>
          </div>
        </div>
      `
      )
      .join("");

    const costContent = costDisplayFields
      .map(
        (key) => `
        <div class="info-box">
          <div class="info-box-content">
            <span class="info-box-text">${key}</span>
            <span class="info-box-number">${
              key.includes("占比") || key.includes("比")
                ? costSums[key].toFixed(2) + "%"
                : costSums[key].toLocaleString()
            }</span>
          </div>
        </div>
      `
      )
      .join("");

    cardBody.innerHTML = `
      <div class="info-box">
        <div class="info-box-content" style="font-weight: bold; font-size: 1.2em; margin-bottom: 10px;">
          ${customerLabel}
        </div>
      </div>
      ${rentContent + costContent}
    `;
  };

  // In your useEffect, replace calls to updateRentDetailedCard and updateCostDetailedCard with updateCombinedDetailedCard
  useEffect(() => {
    const multiBarCleanup = renderMultiBarChart(customerData, selectedCustomer);
    const pieChartCleanup = renderPieCharts(customerData, selectedCustomer);

    // Update card values
    updateCardValues(customerData, selectedCustomer);
    updateDetailedCardValues(customerData, selectedCustomer);
    updateCombinedDetailedCard(customerData, selectedCustomer);
    updateDetailedCardForBar(customerData, selectedCustomer);

    return () => {
      if (multiBarCleanup) multiBarCleanup();
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
        <div className="col-3">
          {" "}
          <div
            ref={prodCostPieChartRef}
            style={{ width: "100%", height: "100%" }}
          ></div>
        </div>

        <div className="col-3">
          {" "}
          <div
            ref={indirectCostPieChartRef}
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
              id="combinedDetailedCard"
              style={{ fontSize: "0.8rem", padding: "5px" }}
            ></div>
          </div>
        </div>
        <div className="col-2">
          {" "}
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
              id="detailedCard"
              style={{ padding: "5px" }}
            ></div>
          </div>
        </div>
        <div className="col-2">
          {" "}
          <div className="card card-primary card-outline">
            <div
              className="card-body"
              id="summaryCard"
              style={{
                overflowY: "auto",
                maxHeight: "calc(50vh - 40px)",
                padding: "5px",
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
