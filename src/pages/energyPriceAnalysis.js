import dynamic from "next/dynamic";
import React, { useState, useEffect, useRef, useCallback } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import * as echarts from "echarts";
import DataTableComponent from "../components/DataTableComponent";
import DetailCard from "../components/DetailCard";
import PriceTable from "../components/PriceTable";
import DateRangePicker from "../components/DateRangePicker";
import styled from "styled-components";
import { debounce } from "lodash";
import isEqual from "lodash/isEqual";

const SelectionAndSend = dynamic(
  () => import("../components/SelectionAndSend"),
  { ssr: false }
);

const RowContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  @media (max-width: 575px) {
    flex-direction: column;
  }

  @media (min-width: 992px) {
    padding: 0 80px;
  }

  @media (max-width: 991px) {
    padding: 0;
  }
`;
const HalfWidthContainer = styled.div`
  width: 48%;

  @media (max-width: 575px) {
    width: 100%;
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }
  }
`;
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = `0${date.getMonth() + 1}`.slice(-2);
  const day = `0${date.getDate()}`.slice(-2);
  return `${year}/${month}/${day}`;
};

const aggregateFetchedData = (fetchedData) => {
  const aggregatedData = {};
  fetchedData.forEach((dataArray) => {
    dataArray.forEach((item) => {
      if (aggregatedData[item.Key]) {
        aggregatedData[item.Key] += item.Value;
      } else {
        aggregatedData[item.Key] = item.Value;
      }
    });
  });
  return Object.keys(aggregatedData).map((key) => ({
    Key: key,
    Value: aggregatedData[key],
  }));
};

const removeYearFromDate = (data) => {
  return data.map((item) => {
    const dateWithoutYear = item.Key.split(" ")[0].slice(5);
    return {
      ...item,
      Key: dateWithoutYear + " " + item.Key.split(" ")[1],
    };
  });
};

const getDayOfWeek = (dateStr) => {
  const daysOfWeek = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];
  const date = new Date(`2024/${dateStr}`);
  return daysOfWeek[date.getDay()];
};
const categorizeData = (data, timeRanges) => {
  if (!timeRanges) {
    console.error("Time ranges not provided.");
    return data.map((item) => ({
      ...item,
      peakState: "unknown",
      isSummer: false,
    }));
  }

  return data.map((item) => {
    const currentYear = new Date().getFullYear();
    const dateStr = `${currentYear}/${item.Key.split(" ")[0]}`;
    const date = new Date(dateStr);
    const day = date.getDay();
    const hour = parseInt(item.Key.split(" ")[1]);
    const month = date.getMonth() + 1;
    const isSummer = month >= 6 && month <= 9;

    const period = isSummer ? "夏月" : "非夏月";
    if (!timeRanges[period]) {
      console.error(`Time ranges not defined for period: ${period}`);
      return { ...item, peakState: "unknown", isSummer };
    }

    const dayType =
      day >= 1 && day <= 5 ? "weekdays" : day === 6 ? "saturday" : "sunday";
    if (!timeRanges[period][dayType]) {
      console.error(
        `Time ranges not defined for day type: ${dayType} in period: ${period}`
      );
      return { ...item, peakState: "unknown", isSummer };
    }

    let peakState = "offpeak";
    const ranges = timeRanges[period][dayType];

    // Check if the property exists before using .some()
    if (
      ranges.peak &&
      ranges.peak.some((range) => hour >= range[0] && hour < range[1])
    ) {
      peakState = "peak";
    } else if (
      ranges.halfpeak &&
      ranges.halfpeak.some((range) => hour >= range[0] && hour < range[1])
    ) {
      peakState = "halfpeak";
    }

    return {
      ...item,
      peakState,
      isSummer,
      DayOfWeek: getDayOfWeek(item.Key.split(" ")[0]),
    };
  });
};
const groupDataByDate = (data) => {
  return data.reduce((acc, item) => {
    const date = item.Key.split(" ")[0];
    const time = item.Key.split(" ")[1];
    if (!acc[date]) {
      acc[date] = { items: [], isSummer: item.isSummer };
    }
    acc[date].items.push({
      Time: time,
      Value: item.Value,
      DayOfWeek: item.DayOfWeek,
      PeakState: item.peakState,
    });
    return acc;
  }, {});
};

const aggregateDataByPeakState = (groupedData) => {
  const aggregatedData = {};
  Object.keys(groupedData).forEach((date) => {
    const { items, isSummer } = groupedData[date];
    aggregatedData[date] = { peak: 0, halfpeak: 0, offpeak: 0, isSummer };
    items.forEach((item) => {
      if (item.PeakState === "peak") {
        aggregatedData[date].peak += item.Value;
      } else if (item.PeakState === "halfpeak") {
        aggregatedData[date].halfpeak += item.Value;
      } else if (item.PeakState === "offpeak") {
        aggregatedData[date].offpeak += item.Value;
      }
    });
    aggregatedData[date].peak = aggregatedData[date].peak.toFixed(2);
    aggregatedData[date].halfpeak = aggregatedData[date].halfpeak.toFixed(2);
    aggregatedData[date].offpeak = aggregatedData[date].offpeak.toFixed(2);
  });
  return aggregatedData;
};

const EnergyPriceAnalysis = () => {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const [groupedData, setGroupedData] = useState({});
  const [aggregatedData, setAggregatedData] = useState({});
  const [prices, setPrices] = useState({});
  const [timeRanges, setTimeRanges] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const barChartRef = useRef(null);
  const pieChartRef = useRef(null);
  const [dateRange, setDateRange] = useState({
    startDate: firstDayOfMonth,
    endDate: lastDayOfMonth,
  });
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [options, setOptions] = useState([]);
  const [lastBarChartData, setLastBarChartData] = useState(null);
  const [lastPieChartData, setLastPieChartData] = useState(null);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch("/api/settings");
      if (!response.ok) {
        throw new Error("Failed to fetch settings");
      }
      const savedSettings = await response.json();
      console.log("Settings fetched successfully:", savedSettings);
      setPrices(savedSettings.prices);
      setTimeRanges(savedSettings.timeRanges);
      setInitialized(true);
    } catch (error) {
      console.error("Error fetching settings:", error);
      setPrices({}); // Set to an empty object in case of error
      setTimeRanges({}); // Set to an empty object in case of error
    }
  }, []);
  const fetchOptions = useCallback(async () => {
    try {
      const response = await fetch(
        "https://iot.jtmes.net/ebc/api/equipment/powermeter_list"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch options");
      }
      const data = await response.json();
      const formattedOptions = data.map((item) => ({
        value: item.sn,
        label: item.name,
      }));
      setOptions(formattedOptions);
      if (formattedOptions.length > 0) {
        const defaultOption = formattedOptions[0].value;
        setSelectedOptions([defaultOption]);
      }
    } catch (error) {
      console.error("Error fetching options:", error);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchOptions();
  }, [fetchOptions, fetchSettings]);

  const fetchData = async (sn, startDate, endDate) => {
    const formattedStartDate = formatDate(new Date(startDate));
    const formattedEndDate = formatDate(new Date(endDate));
    const url = `https://iot.jtmes.net/ebc/api/equipment/powermeter_statistics?sn=${sn}&start_date=${formattedStartDate}&end_date=${formattedEndDate}&summary_type=hour`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching data for ${sn}:`, error);
      return null;
    }
  };

  const handleDataFetch = useCallback(
    debounce(async (selectedOptions, dateRange, timeRanges) => {
      if (!initialized) {
        return;
      }
      // Show loading
      const barChartInstance = echarts.getInstanceByDom(barChartRef.current);
      const pieChartInstance = echarts.getInstanceByDom(pieChartRef.current);
      if (barChartInstance) barChartInstance.showLoading();
      if (pieChartInstance) pieChartInstance.showLoading();

      const { startDate, endDate } = dateRange;
      const fetchPromises = selectedOptions.map((sn) =>
        fetchData(sn, startDate, endDate)
      );
      try {
        const results = await Promise.all(fetchPromises);
        const aggregatedFetchedData = aggregateFetchedData(results);
        processAndSetData(aggregatedFetchedData, timeRanges);
      } catch (error) {
        console.error("Error during data fetch:", error);
      }
    }),
    [initialized]
  );

  const processAndSetData = (data, timeRanges) => {
    console.log("Data before categorization:");
    console.log(
      data.map((item) => ({ ...item, peakState: "to be determined" }))
    );

    if (!timeRanges) {
      console.error("Time ranges not initialized.");
      return;
    }

    const dataWithoutYear = removeYearFromDate(data);
    const updatedData = dataWithoutYear.map((item) => ({
      ...item,
      DayOfWeek: getDayOfWeek(item.Key.split(" ")[0]),
    }));

    const categorizedData = categorizeData(updatedData, timeRanges);
    console.log("Data after categorization:");
    console.log(categorizedData);

    const groupedByDate = groupDataByDate(categorizedData);
    console.log("Grouped Data by Date:", groupedByDate);

    const aggregatedByPeakState = aggregateDataByPeakState(groupedByDate);
    console.log("Aggregated Data by Peak State:", aggregatedByPeakState);

    setGroupedData(groupedByDate);
    setAggregatedData(aggregatedByPeakState);
    setDataReady(true);

    // Hide loading
    const barChartInstance = echarts.getInstanceByDom(barChartRef.current);
    const pieChartInstance = echarts.getInstanceByDom(pieChartRef.current);
    if (barChartInstance) barChartInstance.hideLoading();
    if (pieChartInstance) pieChartInstance.hideLoading();
  };

  const handleDateChange = useCallback((newDateRange) => {
    setDateRange(newDateRange);
  }, []);

  const handleSend = useCallback(
    (newSelectedOptions, currentRange = timeRanges) => {
      setSelectedOptions(newSelectedOptions);
      handleDataFetch(newSelectedOptions, dateRange, currentRange);
    },
    [selectedOptions, timeRanges, dateRange, handleDataFetch]
  );

  const handleExitEditMode = useCallback(async () => {
    await fetchSettings();
    handleSend(selectedOptions, timeRanges);
  }, [fetchSettings, handleSend, selectedOptions, timeRanges]);

  useEffect(() => {
    if (initialized && selectedOptions.length > 0 && timeRanges) {
      handleDataFetch(selectedOptions, dateRange, timeRanges);
    }
  }, [initialized, selectedOptions, timeRanges, handleDataFetch, dateRange]);

  const renderBarChart = () => {
    if (
      dataReady &&
      barChartRef.current &&
      prices &&
      Object.keys(aggregatedData).length > 0
    ) {
      const dates = Object.keys(aggregatedData);

      const newBarChartData = {
        dates,
        peak: [],
        halfpeak: [],
        offpeak: [],
      };

      dates.forEach((date) => {
        const { peak, halfpeak, offpeak, isSummer } = aggregatedData[date];
        const period = isSummer ? "夏月" : "非夏月";
        const peakPrice = parseFloat(
          prices?.prices?.peakPrices?.[period]?.replace("NT$", "") ||
            prices?.peakPrices?.[period]?.replace("NT$", "") ||
            "0"
        );
        const halfpeakPrice = parseFloat(
          prices?.prices?.halfPeakPrices?.[period]?.replace("NT$", "") ||
            prices?.halfPeakPrices?.[period]?.replace("NT$", "") ||
            "0"
        );
        const offpeakPrice = parseFloat(
          prices?.prices?.offPeakPrices?.[period]?.replace("NT$", "") ||
            prices?.offPeakPrices?.[period]?.replace("NT$", "") ||
            "0"
        );

        newBarChartData.peak.push((parseFloat(peak) * peakPrice).toFixed(2));
        newBarChartData.halfpeak.push(
          (parseFloat(halfpeak) * halfpeakPrice).toFixed(2)
        );
        newBarChartData.offpeak.push(
          (parseFloat(offpeak) * offpeakPrice).toFixed(2)
        );
      });

      if (isEqual(newBarChartData, lastBarChartData)) {
        console.log("Bar chart data is the same, skipping update.");
        return;
      }

      if (echarts.getInstanceByDom(barChartRef.current)) {
        echarts.getInstanceByDom(barChartRef.current).dispose();
      }

      const barChart = echarts.init(barChartRef.current);
      const barChartOptions = {
        color: ["#ee6666", "#fac858", "#91CC75"],
        title: {
          text: "尖離峰費用分析",
          left: "center",
          top: 0,
          textStyle: {
            fontSize: 16,
          },
        },
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "shadow" },
          formatter: (params) => {
            const date = params[0].axisValue;
            let tooltipText = `${date}<br/>`;
            params.forEach((param) => {
              const value = parseFloat(param.value);
              tooltipText += `${param.marker} ${
                param.seriesName
              }: NT$${value.toFixed(2)}<br/>`;
            });
            return tooltipText;
          },
        },
        xAxis: {
          type: "category",
          data: dates,
          axisLabel: {
            rotate: dates.length > 30 ? 45 : 0,
            interval: dates.length > 30 ? "auto" : 0,
            fontSize: 10,
          },
        },
        yAxis: { type: "value", name: "NT$" },
        series: [
          {
            name: "尖峰",
            type: "bar",
            stack: "total",
            data: newBarChartData.peak,
          },
          {
            name: "半尖峰",
            type: "bar",
            stack: "total",
            data: newBarChartData.halfpeak,
          },
          {
            name: "離峰",
            type: "bar",
            stack: "total",
            data: newBarChartData.offpeak,
          },
        ],
      };
      if (dates.length > 30) {
        barChartOptions.dataZoom = [
          {
            type: "slider",
            show: true,
            xAxisIndex: [0],
            start: 0,
            end: 100,
            bottom: 0, // Position at the very bottom
            handleSize: "110%", // Slightly larger handle for easier interaction
            borderColor: "transparent", // Makes the border invisible
            fillerColor: "rgba(59, 162, 114, 0.2)", // Light green fill
            backgroundColor: "rgba(0, 0, 0, 0.05)", // Very light gray background
            textStyle: {
              color: "#3ba272", // Matching text color
            },
            moveHandleSize: 5, // Smaller move handle for a sleeker look
          },
          {
            type: "inside",
            xAxisIndex: [0],
            start: 0,
            end: 100,
          },
        ];
      }

      barChart.setOption(barChartOptions);
      const handleResize = () => {
        barChart.resize();
      };
      window.addEventListener("resize", handleResize);
      setLastBarChartData(newBarChartData);
      return () => {
        barChart.dispose();
        window.removeEventListener("resize", handleResize);
      };
    }
  };

  const renderPieChart = () => {
    if (
      dataReady &&
      pieChartRef.current &&
      prices &&
      Object.keys(aggregatedData).length > 0
    ) {
      let totalPeak = 0;
      let totalHalfpeak = 0;
      let totalOffpeak = 0;

      Object.values(aggregatedData).forEach(
        ({ peak, halfpeak, offpeak, isSummer }) => {
          const period = isSummer ? "夏月" : "非夏月";

          const peakPrice = parseFloat(
            prices?.prices?.peakPrices?.[period]?.replace("NT$", "") ||
              prices?.peakPrices?.[period]?.replace("NT$", "") ||
              "0"
          );
          const halfpeakPrice = parseFloat(
            prices?.prices?.halfPeakPrices?.[period]?.replace("NT$", "") ||
              prices?.halfPeakPrices?.[period]?.replace("NT$", "") ||
              "0"
          );
          const offpeakPrice = parseFloat(
            prices?.prices?.offPeakPrices?.[period]?.replace("NT$", "") ||
              prices?.offPeakPrices?.[period]?.replace("NT$", "") ||
              "0"
          );

          totalPeak += parseFloat(peak) * peakPrice;
          totalHalfpeak += parseFloat(halfpeak) * halfpeakPrice;
          totalOffpeak += parseFloat(offpeak) * offpeakPrice;
        }
      );

      const newPieChartData = {
        totalPeak: totalPeak.toFixed(2),
        totalHalfpeak: totalHalfpeak.toFixed(2),
        totalOffpeak: totalOffpeak.toFixed(2),
      };

      if (isEqual(newPieChartData, lastPieChartData)) {
        console.log("Pie chart data is the same, skipping update.");
        return;
      }

      if (echarts.getInstanceByDom(pieChartRef.current)) {
        echarts.getInstanceByDom(pieChartRef.current).dispose();
      }

      const pieChart = echarts.init(pieChartRef.current);
      const pieChartOptions = {
        color: ["#ee6666", "#fac858", "#91CC75"],
        title: { text: "尖離峰費用分佈", left: "center" },
        tooltip: { trigger: "item", formatter: "{a} <br/>{b}: NT${c} ({d}%)" },
        series: [
          {
            name: "費用分佈",
            type: "pie",
            radius: ["50%", "70%"],
            avoidLabelOverlap: false,
            label: { show: false, position: "center" },
            emphasis: {
              label: { show: true, fontSize: "30", fontWeight: "bold" },
            },
            labelLine: { show: false },
            data: [
              { value: newPieChartData.totalPeak, name: "尖峰" },
              { value: newPieChartData.totalHalfpeak, name: "半尖峰" },
              { value: newPieChartData.totalOffpeak, name: "離峰" },
            ],
          },
        ],
      };
      pieChart.setOption(pieChartOptions);
      const handleResize = () => {
        pieChart.resize();
      };
      window.addEventListener("resize", handleResize);
      setLastPieChartData(newPieChartData);
      return () => {
        pieChart.dispose();
        window.removeEventListener("resize", handleResize);
      };
    }
  };
  useEffect(() => {
    if (
      dataReady &&
      prices &&
      Object.keys(prices).length > 0 &&
      Object.keys(aggregatedData).length > 0
    ) {
      renderBarChart();
      renderPieChart();
    }
  }, [dataReady, aggregatedData, prices]);
  return (
    <div className="container-fluid">
      <RowContainer>
        <HalfWidthContainer>
          <DateRangePicker onDateChange={handleDateChange} />
        </HalfWidthContainer>
        <HalfWidthContainer>
          <SelectionAndSend
            options={options}
            onSend={handleSend}
            defaultSelectedOptions={selectedOptions}
          />
        </HalfWidthContainer>
      </RowContainer>
      <div className="row mb-4">
        <div className="col-12">
          <div ref={barChartRef} style={{ height: "400px" }}></div>
        </div>
      </div>
      <div className="row mb-4">
        <div className="col-md-7 col-sm-12">
          <div ref={pieChartRef} style={{ height: "400px" }}></div>
        </div>
        <div className="col-md-5 col-sm-12">
          <DetailCard
            aggregatedData={aggregatedData}
            energyPrice
            prices={prices?.prices || prices || {}}
          />
        </div>
      </div>
      <div className="row mb-4">
        <div className="col-12">
          <PriceTable
            onPricesUpdate={fetchSettings}
            triggerHandleSend={handleExitEditMode}
            prices={prices?.prices || prices || {}}
          />
        </div>
      </div>
      <div className="row">
        <div className="col-12">
          <DataTableComponent
            aggregatedData={aggregatedData}
            energyPrice
            prices={prices?.prices || prices || {}}
          />
        </div>
      </div>
    </div>
  );
};

export default EnergyPriceAnalysis;
