import Head from "next/head";
import Checkbox from "../components/checkbox"; // Ensure correct import path
import React, { useState, useEffect, useRef } from "react";
import * as echarts from "echarts";
// import { useSidebarContext } from "../contexts/SidebarContext"; // Adjust the path as necessary

export default function Cost({ isIframe }) {
  const [apidata, setApidata] = useState({}); // Initialize state to store fetched data
  const [selections, setSelections] = useState({});
  const [filteredData, setFilteredData] = useState({});
  const [customerData, setCustomerData] = useState({});
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [zoomRange, setZoomRange] = useState({ start: 0, end: 10 });

  const lineAndBarChartRef = useRef(null);
  const pieChartRef = useRef(null);

  // const { sidebarWidth } = useSidebarContext();
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const response = await fetch("/api/getCost");
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
                WorkHour: 0,
              };
            }

            // Aggregate the data for this customer in newCustomerData
            newCustomerData[customerName].製造成本 += entry.製造成本 || 0;
            newCustomerData[customerName].零件成本 += entry.零件成本 || 0;
            newCustomerData[customerName].委外成本 += entry.委外成本 || 0;
            newCustomerData[customerName].產品總成本 += entry.產品總成本 || 0;
            newCustomerData[customerName].佣金 += entry.佣金 || 0;
            newCustomerData[customerName].WorkHour += entry.TotalWorkHours || 0;
          });
        });
      });
    });

    // Update the state once with the new aggregated data
    setCustomerData(newCustomerData);
    console.log("Aggregated Customer Data:", newCustomerData);
  }

  const renderPieChart = (customerData, selectedCustomer) => {
    if (Object.keys(customerData).length > 0 && pieChartRef.current) {
      const pieChart = echarts.init(pieChartRef.current);
      const data = selectedCustomer
        ? { [selectedCustomer]: customerData[selectedCustomer] }
        : customerData;

      // Aggregate data for the pie chart
      const aggregatedData = {
        製造成本: 0,
        零件成本: 0,
        委外成本: 0,
        WorkHour: 0,
      };

      Object.values(data).forEach((data) => {
        aggregatedData.製造成本 += data.製造成本;
        aggregatedData.零件成本 += data.零件成本;
        aggregatedData.委外成本 += data.委外成本;
        aggregatedData.WorkHour += data.WorkHour * 400; // Applying multiplication factor
      });

      const pieOption = {
        title: {
          text: "間接,零件,製造與委外成本",
          subtext: selectedCustomer
            ? `Data for: ${selectedCustomer}`
            : "Data for: 全部客戶", // Dynamic subtitle based on selection
          left: "center",
        },

        tooltip: {
          trigger: "item",
          formatter: function (params) {
            // Convert the value to fixed, then parse it back to a number for locale formatting
            const formattedValue = parseFloat(
              params.value.toFixed(0)
            ).toLocaleString();
            return `${params.name}: ${formattedValue} (${params.percent.toFixed(
              0
            )}%)`;
          },
        },
        legend: {
          orient: "vertical",
          left: "20",
          data: ["製造成本", "零件成本", "委外成本", "間接成本"],
        },
        series: [
          {
            name: "Cost Breakdown",
            type: "pie",
            radius: ["45%", "65%"],
            avoidLabelOverlap: true,
            itemStyle: {
              borderRadius: 4,
              borderWidth: 2,
            },
            label: {
              show: true, // Ensure labels are always visible
              position: "outside", // Position labels outside the pie slices
              formatter: "{b}", // Custom formatter for label text
            },
            labelLine: {
              show: true, // Ensure label lines are visible
              length: 10, // Length of the first segment of the label line
              length2: 20, // Length of the second segment of the label line
            },
            emphasis: {
              label: {
                show: true,
              },
            },
            data: [
              { value: aggregatedData.製造成本, name: "製造成本" },
              { value: aggregatedData.零件成本, name: "零件成本" },
              { value: aggregatedData.委外成本, name: "委外成本" },
              { value: aggregatedData.WorkHour, name: "間接成本" },
            ],
          },
        ],
      };

      pieChart.setOption(pieOption);

      const resizeChart = () => {
        pieChart.resize();
      };

      window.addEventListener("resize", resizeChart);

      return () => {
        window.removeEventListener("resize", resizeChart);
        pieChart.dispose();
      };
    }
  };

  const renderLineAndBarChart = (chartData, selectedCustomer) => {
    if (Object.keys(chartData).length > 0 && lineAndBarChartRef.current) {
      const myChart = echarts.init(lineAndBarChartRef.current);
      lineAndBarChartRef.current.echartsInstance = myChart;

      // Prepare and sort the chart data
      const sortedChartData = Object.entries(chartData)
        .map(([key, value]) => ({
          name: key,
          totalProductCost: value.產品總成本,
          workHour: value.WorkHour * 400, // Multiply work hours by 400 to represent indirect costs
        }))
        .sort((a, b) => b.totalProductCost - a.totalProductCost) // Sort based on 工單總成本
        .map((item) => ({
          ...item,
          totalProductCost: item.totalProductCost.toFixed(0), // Format to zero decimal places
          workHour: item.workHour.toFixed(0),
        }));

      const option = {
        grid: {
          bottom: "25%", // Adjust this value to ensure there is enough space for labels
        },
        title: {
          text: "工單總成本 與 間接成本",
          left: "center",
          subtext: selectedCustomer ? selectedCustomer : "全部客戶", // Acts as the subtitle
          subtextStyle: {
            color: selectedCustomer ? "#c23531" : "#333", // Change color based on selection
            fontSize: 14,
            align: "left",
          },
          itemGap: 20, // Increases the gap between title and subtext
        },
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "shadow",
          },
        },
        legend: {
          data: ["工單總成本", "間接成本"],
          top: 20,
        },
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
        xAxis: {
          type: "category",
          data: sortedChartData.map((item) => item.name),
          triggerEvent: true,
          axisLabel: {
            rotate: 45,
            color: function (value) {
              // Change the color of the axis label based on whether it's the selected customer
              return value === selectedCustomer ? "#c23531" : "#333";
            },
          },
        },
        yAxis: [
          {
            type: "value",
            name: "工單總成本",
            axisLabel: {
              formatter: (value) => `NT$${value / 1e8}億`,
            },
          },
          {
            type: "value",
            name: "間接成本",
          },
        ],
        series: [
          {
            name: "工單總成本",
            data: sortedChartData.map((item) => ({
              value: item.totalProductCost,
              itemStyle: {
                color: item.name === selectedCustomer ? "#c23531" : "#5470c6", // Change color if selected
                borderColor:
                  item.name === selectedCustomer ? "#c23531" : "none",
                borderWidth: item.name === selectedCustomer ? 2 : 0,
              },
            })),
            type: "line",
            smooth: true,
            symbolSize: 7,
          },
          {
            name: "間接成本",
            data: sortedChartData.map((item) => ({
              value: item.workHour,
              itemStyle: {
                color: item.name === selectedCustomer ? "#FFDC60" : "#6fbe44", // Different color for emphasis
                borderColor:
                  item.name === selectedCustomer ? "#FFDC60" : "none",
                borderWidth: item.name === selectedCustomer ? 2 : 0,
              },
            })),
            type: "bar",
            yAxisIndex: 1,
          },
        ],
      };

      myChart.setOption(option);

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

      return () => {
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
    const myChart = echarts.getInstanceByDom(lineAndBarChartRef.current);
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

    // Check if there is no customer data or if the specific customer has no data
    if (
      Object.keys(customerData).length === 0 ||
      (selectedCustomer && !customerData[selectedCustomer])
    ) {
      cardBody.innerHTML = `<div class="info-box">No data available for ${customerLabel}</div>`;
      return; // Exit early since there's no data to process
    }

    // Initialize sums for relevant data fields
    let sums = {
      工單直接成本: 0, // Direct work order costs
      間接成本: 0, // Indirect costs
      工單總成本: 0, // Total work order costs
      佣金: 0, // Commission, calculated but not displayed
    };

    // Proceed with aggregating data if it exists
    const data = selectedCustomer
      ? { [selectedCustomer]: customerData[selectedCustomer] }
      : customerData;
    Object.values(data).forEach((customer) => {
      sums["工單直接成本"] += parseFloat(customer["產品總成本"] || 0); // Assuming direct costs are from 產品總成本
      sums["間接成本"] += parseFloat(customer["WorkHour"] * 400 || 0); // Assuming indirect costs are from WorkHour
      sums["佣金"] += parseFloat(customer["佣金"] || 0); // Summing 佣金 for total cost calculation

      sums["工單總成本"] +=
        parseFloat(customer["產品總成本"] || 0) +
        parseFloat(customer["WorkHour"] || 0) +
        parseFloat(customer["佣金"] || 0);
    });

    // Fields to display on the card
    const displayFields = ["工單直接成本", "間接成本", "工單總成本"];

    // Construct the HTML content for the summary card
    const content = `
      <div class="info-box" style="padding: 0;">
        <div class="info-box-content" style="font-weight: bold; font-size: 0.9em; margin-bottom: 2px; padding: 5px;">
          ${customerLabel}
        </div>
      </div>
      ${displayFields
        .map(
          (key) => `
        <div class="info-box" style="padding: 5px 0;">
          <div class="info-box-content" style="font-size: 0.8em; padding: 5px;">
            <span class="info-box-text" style="margin-bottom: 2px;">${key}</span>
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

  useEffect(() => {
    const lineBarCleanup = renderLineAndBarChart(
      customerData,
      selectedCustomer
    );
    const pieChartCleanup = renderPieChart(customerData, selectedCustomer);

    // Update card values
    updateCardValues(customerData, selectedCustomer);

    return () => {
      if (lineBarCleanup) lineBarCleanup();
      if (pieChartCleanup) pieChartCleanup();
    };
  }, [customerData, selectedCustomer]);

  return (
    <div className="container-fluid">
      <Head>
        <title>Cost Analysis</title>
      </Head>
      <div className="row " style={{ width: "100%", height: "50vh" }}>
        <div className="col-6">
          <div
            ref={pieChartRef}
            style={{ width: "100%", height: "100%" }}
          ></div>
        </div>
        <div className="col-4">
          <div className="card card-primary card-outline">
            <div
              className="card-body"
              id="summaryCard"
              style={{ maxHeight: "350px", overflowY: "auto" }}
            ></div>
          </div>
        </div>

        <div className="col-2 ">
          <Checkbox onUpdate={handleSelectionUpdate} isLoading={isLoading} />
        </div>
      </div>
      <div className="row" style={{ width: "100%", height: "50vh" }}>
        <div className="col-12">
          <div
            ref={lineAndBarChartRef}
            style={{ width: "100%", height: "100%" }}
          ></div>
        </div>
      </div>
    </div>
  );
}
