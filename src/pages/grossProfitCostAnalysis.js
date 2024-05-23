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
  const [zoomRange, setZoomRange] = useState({ start: 0, end: 10 });
  const [singleBarZoomRange, setSingleBarZoomRange] = useState({
    start: 0,
    end: 50,
  });

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const multiBarChartRef = useRef(null);
  const singleBarChartRef = useRef(null);

  const { sidebarWidth } = useSidebarContext();
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/getGrossProfitCostAnalysis");
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
                產品總成本: 0,
                佣金: 0,

                間接成本: 0,
                損失金額: 0,
                買進賣出進貨金額: 0,
                銷貨金額: 0,
                租金: 0,
              };
            }

            newCustomerData[customerName].產品總成本 += parseFloat(
              entry.產品總成本 || 0
            );
            newCustomerData[customerName].佣金 += parseFloat(entry.佣金 || 0);

            newCustomerData[customerName].間接成本 += parseFloat(
              entry.間接成本 || 0
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
        毛利: [],
        毛利比: [],
      };

      sortedCategories.forEach((category) => {
        const data = chartData[category];
        const 毛利 =
          data["銷貨金額"] -
          data["產品總成本"] -
          data["間接成本"] -
          data["買進賣出進貨金額"] -
          data["佣金"] -
          data["租金"] -
          data["損失金額"];

        seriesData["銷貨金額"].push(data["銷貨金額"]);
        seriesData["毛利"].push(毛利);
      });

      const option = {
        title: {
          text: "銷售金額與毛利 依據 客戶",
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
          data: ["銷貨金額", "毛利"],
          top: 15,
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

  const renderSingleBarChart = (chartData, selectedCustomer) => {
    if (Object.keys(chartData).length > 0 && singleBarChartRef.current) {
      const myChart = echarts.init(singleBarChartRef.current);

      const selectedBarColor = [
        "#dd6b66",
        "#759aa0",
        "#e69d87",
        "#8dc1a9",
        "#ea7e53",
      ];

      // Create an array of objects to sort categories by 毛利比
      const sortableCategories = Object.keys(chartData).map((category) => {
        const data = chartData[category];
        const 毛利 =
          data["銷貨金額"] -
          data["產品總成本"] -
          data["間接成本"] -
          data["買進賣出進貨金額"] -
          data["佣金"] -
          data["租金"] -
          data["損失金額"];
        const 毛利比 =
          data["銷貨金額"] !== 0 ? (毛利 / data["銷貨金額"]) * 100 : 0; // Handle division by zero and convert to percentage

        return {
          name: category,
          毛利比: 毛利比.toFixed(2), // Format to two decimal places
        };
      });

      console.log("Sortable Categories (Before Sorting):", sortableCategories);

      // Sort categories by 毛利比 in descending order
      sortableCategories.sort((a, b) => b.毛利比 - a.毛利比);

      console.log("Sortable Categories (After Sorting):", sortableCategories);

      // Extract the sorted categories for the xAxis
      const sortedCategories = sortableCategories.map((item) => item.name);

      console.log("Sorted Categories:", sortedCategories);

      // Prepare the series data using the sorted categories
      const seriesData = {
        毛利比: [],
      };

      sortableCategories.forEach((category) => {
        const value = parseFloat(category.毛利比); // Convert back to float
        seriesData["毛利比"].push(value);
      });

      console.log("Series Data:", seriesData);

      const option = {
        title: {
          text: "毛利比 依據 客戶",
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
          formatter: function (params) {
            let result = params[0].name + "<br/>";
            params.forEach(function (item) {
              result +=
                item.marker +
                " " +
                item.seriesName +
                ": " +
                item.data.value.toFixed(2) +
                "%<br/>";
            });
            return result;
          },
        },
        legend: {
          data: ["毛利比"],
          top: 15,
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
            formatter: "{value} %",
          },
        },
        series: [
          {
            name: "毛利比",
            type: "bar",
            data: seriesData["毛利比"].map((value, i) => {
              // Check if the category corresponds to the selected customer
              const isCategorySelected =
                sortedCategories[i] === selectedCustomer;
              return {
                value: value,
                // Apply selected color if the current category matches the selected customer,
                // otherwise use a default color
                itemStyle: {
                  color: isCategorySelected ? selectedBarColor[0] : undefined,
                },
              };
            }),
            emphasis: {
              focus: "series",
            },
            itemStyle: {
              barBorderRadius: 4, // Rounded corners for bars
            },
          },
        ],
        dataZoom: [
          {
            type: "inside",
            xAxisIndex: [0],
            start: singleBarZoomRange.start, // use state-managed zoom start
            end: singleBarZoomRange.end, // use state-managed zoom end
          },
          {
            type: "slider",
            xAxisIndex: [0],
            start: singleBarZoomRange.start, // use state-managed zoom start
            end: singleBarZoomRange.end, // use state-managed zoom end
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
          }
        }
      });

      // Set up zoom level listener
      myChart.on("dataZoom", function (event) {
        const { start, end } = event;
        if (start !== undefined && end !== undefined) {
          // Only update the state if the zoom range has actually changed significantly
          if (
            Math.abs(start - singleBarZoomRange.start) > 0.01 ||
            Math.abs(end - singleBarZoomRange.end) > 0.01
          ) {
            debouncedSetSingleBarZoomRange({ start, end });
          }
        }
      });

      // Apply the stored zoom range
      myChart.dispatchAction({
        type: "dataZoom",
        start: singleBarZoomRange.start,
        end: singleBarZoomRange.end,
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
  const debouncedSetSingleBarZoomRange = debounce(setSingleBarZoomRange, 300);

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

  useEffect(() => {
    const myChart = echarts.getInstanceByDom(singleBarChartRef.current);
    if (myChart) {
      const currentZoom = myChart.getOption().dataZoom[0];
      if (
        Math.abs(currentZoom.start - singleBarZoomRange.start) > 0.01 ||
        Math.abs(currentZoom.end - singleBarZoomRange.end) > 0.01
      ) {
        myChart.dispatchAction({
          type: "dataZoom",
          start: singleBarZoomRange.start,
          end: singleBarZoomRange.end,
        });
      }
    }
  }, [singleBarZoomRange]);

  useEffect(() => {
    const multiBarCleanup = renderMultiBarChart(customerData, selectedCustomer);
    const singleBarCleanup = renderSingleBarChart(
      customerData,
      selectedCustomer
    );

    return () => {
      if (multiBarCleanup) multiBarCleanup();
      if (singleBarCleanup) singleBarCleanup();
    };
  }, [customerData, sidebarWidth, selectedCustomer]);

  return (
    <div className="container-fluid">
      <Head>
        <title>Cost Analysis</title>
      </Head>
      <div className="row " style={{ width: "100%", height: "50vh" }}>
        <div className="col-10">
          <div
            ref={multiBarChartRef}
            style={{ width: "100%", height: "100%" }}
          ></div>
        </div>
        <div className="col-2 ">
          <Checkbox onUpdate={handleSelectionUpdate} isLoading={isLoading} />
        </div>
      </div>
      <div className="row" style={{ width: "100%", height: "50vh" }}>
        <div className="col-12">
          <div
            ref={singleBarChartRef}
            style={{ width: "100%", height: "100%" }}
          ></div>
        </div>
      </div>
    </div>
  );
}
