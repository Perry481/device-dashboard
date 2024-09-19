import dynamic from "next/dynamic";
import React, { useState, useEffect, useRef, useCallback } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import * as echarts from "echarts";
import DataTableComponent from "../components/DataTableComponent";
import DetailCard from "../components/DetailCard";
import DateRangePicker from "../components/DateRangePicker";
import styled from "styled-components";

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
  const month = `0${date.getMonth() + 1}`.slice(-2); // Adding leading zero
  const day = `0${date.getDate()}`.slice(-2); // Adding leading zero
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
    const dateWithoutYear = item.Key.split(" ")[0].slice(5); // Remove the year from the date
    return {
      ...item,
      Key: dateWithoutYear + " " + item.Key.split(" ")[1], // Reassemble the key without the year
    };
  });
};

const getDayOfWeek = (dateStr) => {
  const daysOfWeek = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];
  const date = new Date(`2024/${dateStr}`); // Re-add a year for date parsing
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

    // Check if the peak property exists and has a some method
    if (
      ranges.peak &&
      Array.isArray(ranges.peak) &&
      ranges.peak.some((range) => hour >= range[0] && hour < range[1])
    ) {
      peakState = "peak";
    }
    // Check if the halfpeak property exists and has a some method
    else if (
      ranges.halfpeak &&
      Array.isArray(ranges.halfpeak) &&
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
      acc[date] = [];
    }
    acc[date].push({
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
    aggregatedData[date] = {
      peak: 0,
      halfpeak: 0,
      offpeak: 0,
      isSummer: groupedData[date][0].isSummer,
    };
    groupedData[date].forEach((item) => {
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

const EnergyCostAnalysis = () => {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const [timeRanges, setTimeRanges] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [groupedData, setGroupedData] = useState({});
  const [aggregatedData, setAggregatedData] = useState({});
  const fetchTriggerRef = useRef({ date: null, options: null, standard: null });
  const barChartRef = useRef(null);
  const pieChartRef = useRef(null);
  const [dateRange, setDateRange] = useState({
    startDate: firstDayOfMonth,
    endDate: lastDayOfMonth,
  });
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [options, setOptions] = useState([]);
  const [pricingStandards, setPricingStandards] = useState({});
  const [machineGroups, setMachineGroups] = useState([]);
  const [selectedPricingStandard, setSelectedPricingStandard] = useState("");
  const [activePricingStandard, setActivePricingStandard] = useState("");

  const fetchSettingsAndOptions = async () => {
    setIsLoading(true);
    try {
      const [settingsResponse, optionsResponse] = await Promise.all([
        fetch("/api/settings"),
        fetch("https://iot.jtmes.net/ebc/api/equipment/powermeter_list"),
      ]);

      if (!settingsResponse.ok || !optionsResponse.ok) {
        throw new Error("Failed to fetch settings or options");
      }

      const savedSettings = await settingsResponse.json();
      setPricingStandards(savedSettings.pricingStandards);
      setActivePricingStandard(savedSettings.activePricingStandard);
      setSelectedPricingStandard(savedSettings.activePricingStandard);
      const activePricingStandardData =
        savedSettings.pricingStandards[savedSettings.activePricingStandard];
      setTimeRanges(activePricingStandardData.timeRanges);
      setMachineGroups(savedSettings.machineGroups || []);
      const optionsData = await optionsResponse.json();
      const formattedOptions = optionsData.map((item) => ({
        value: item.sn,
        label: item.name,
      }));
      setOptions(formattedOptions);

      if (formattedOptions.length > 0) {
        setSelectedOptions([formattedOptions[0].value]);
      }
    } catch (error) {
      console.error("Error fetching settings or options:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndOptions();
  }, []);
  const handleDataFetch = useCallback(
    async (selectedOptions, dateRange, timeRanges) => {
      if (!timeRanges) return;

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
      } finally {
        if (barChartInstance) barChartInstance.hideLoading();
        if (pieChartInstance) pieChartInstance.hideLoading();
      }
    },
    []
  );
  useEffect(() => {
    if (!isLoading && timeRanges && selectedOptions.length > 0) {
      handleDataFetch(selectedOptions, dateRange);
    }
  }, [isLoading, timeRanges, dateRange]);

  const fetchData = async (sn, startDate, endDate) => {
    console.log("fetchData called");
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

  useEffect(() => {
    const shouldFetch =
      fetchTriggerRef.current.date ||
      fetchTriggerRef.current.options ||
      fetchTriggerRef.current.standard;

    if (shouldFetch && selectedOptions.length > 0 && timeRanges) {
      handleDataFetch(selectedOptions, dateRange, timeRanges);
      fetchTriggerRef.current = { date: null, options: null, standard: null };
    }
  }, [selectedOptions, dateRange, timeRanges, handleDataFetch]);
  const processAndSetData = (data, timeRanges) => {
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
    const groupedByDate = groupDataByDate(categorizedData);
    const aggregatedByPeakState = aggregateDataByPeakState(groupedByDate);

    setGroupedData(groupedByDate);
    setAggregatedData(aggregatedByPeakState);
  };

  const handleDateChange = useCallback((newDateRange) => {
    setDateRange(newDateRange);
    fetchTriggerRef.current.date = new Date();
  }, []);
  const handleSend = useCallback(
    (selectedMeters, selectedStandard) => {
      setSelectedOptions(selectedMeters);
      setSelectedPricingStandard(selectedStandard);
      const standardData = pricingStandards[selectedStandard];
      setTimeRanges(standardData.timeRanges);
      fetchTriggerRef.current.options = new Date();
      fetchTriggerRef.current.standard = new Date();
    },
    [pricingStandards]
  );

  useEffect(() => {
    if (barChartRef.current && Object.keys(aggregatedData).length > 0) {
      const dates = Object.keys(aggregatedData);
      const barChart = echarts.init(barChartRef.current);
      const barChartOptions = {
        color: ["#ee6666", "#fac858", "#91CC75"],
        title: {
          text: "能耗尖離峰分析",
          left: "center",
          top: 0,
          textStyle: {
            fontSize: 16,
          },
        },
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "shadow",
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
        yAxis: {
          type: "value",
          name: "kWh",
          nameTextStyle: {
            fontSize: 10,
          },
          axisLabel: {
            fontSize: 10,
          },
        },
        series: [
          {
            name: "尖峰",
            type: "bar",
            stack: "total",
            data: dates.map((date) => parseFloat(aggregatedData[date].peak)),
          },
          {
            name: "半尖峰",
            type: "bar",
            stack: "total",
            data: dates.map((date) =>
              parseFloat(aggregatedData[date].halfpeak)
            ),
          },
          {
            name: "離峰",
            type: "bar",
            stack: "total",
            data: dates.map((date) => parseFloat(aggregatedData[date].offpeak)),
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

      return () => {
        barChart.dispose();
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [aggregatedData]);

  useEffect(() => {
    if (pieChartRef.current && Object.keys(aggregatedData).length > 0) {
      const totalPeak = Object.values(aggregatedData).reduce(
        (acc, curr) => acc + parseFloat(curr.peak),
        0
      );
      const totalHalfpeak = Object.values(aggregatedData).reduce(
        (acc, curr) => acc + parseFloat(curr.halfpeak),
        0
      );
      const totalOffpeak = Object.values(aggregatedData).reduce(
        (acc, curr) => acc + parseFloat(curr.offpeak),
        0
      );

      const pieChart = echarts.init(pieChartRef.current);
      const pieChartOptions = {
        color: ["#ee6666", "#fac858", "#91CC75"],
        title: {
          text: "尖離峰能耗分布",
          left: "center",
        },
        tooltip: {
          trigger: "item",
          formatter: function (params) {
            return `${params.seriesName} <br/>${
              params.name
            }: ${params.value.toFixed(2)} kWh (${params.percent.toFixed(2)}%)`;
          },
        },
        series: [
          {
            name: "能耗分布",
            type: "pie",
            radius: ["50%", "70%"],
            avoidLabelOverlap: false,
            label: {
              show: false,
              position: "center",
            },
            emphasis: {
              label: {
                show: true,
                fontSize: "30",
                fontWeight: "bold",
              },
            },
            labelLine: {
              show: false,
            },
            data: [
              { value: totalPeak, name: "尖峰" },
              { value: totalHalfpeak, name: "半尖峰" },
              { value: totalOffpeak, name: "離峰" },
            ],
          },
        ],
      };
      pieChart.setOption(pieChartOptions);

      const handleResize = () => {
        pieChart.resize();
      };
      window.addEventListener("resize", handleResize);

      return () => {
        pieChart.dispose();
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [aggregatedData]);
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
            showPricingStandard={true}
            pricingStandards={pricingStandards}
            activePricingStandard={activePricingStandard}
            machineGroups={machineGroups}
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
          <DetailCard aggregatedData={aggregatedData} energyConsumption />
        </div>
      </div>
      <div className="row">
        <div className="col-12">
          <DataTableComponent
            aggregatedData={aggregatedData}
            energyConsumption
          />
        </div>
      </div>
    </div>
  );
};

export default EnergyCostAnalysis;
