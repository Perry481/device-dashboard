import dynamic from "next/dynamic";
import React, { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import * as echarts from "echarts";
import styled from "styled-components";
import { debounce } from "lodash";

const SpinnerCircle = styled.div`
  color: #3ba272;
`;

const LoadingText = styled.div`
  @keyframes pulse {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
    100% {
      opacity: 1;
    }
  }

  animation: pulse 1.5s infinite ease-in-out;
  color: black;
`;
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = `0${date.getMonth() + 1}`.slice(-2);
  const day = `0${date.getDate()}`.slice(-2);
  return `${year}/${month}/${day}`;
};

const aggregateFetchedData = (results) => {
  const aggregatedData = {};
  results.forEach((result) => {
    if (result) {
      result.forEach((item) => {
        if (aggregatedData[item.Key]) {
          aggregatedData[item.Key] += item.Value;
        } else {
          aggregatedData[item.Key] = item.Value;
        }
      });
    }
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
    const dateParts = item.Key.split(" ")[0].split("/");
    const month = parseInt(dateParts[0], 10);
    const isSummer = month >= 6 && month <= 9;

    const period = isSummer ? "夏月" : "非夏月";
    if (!timeRanges[period]) {
      console.error(`Time ranges not defined for period: ${period}`);
      return { ...item, peakState: "unknown", isSummer };
    }

    const dateStr = `${new Date().getFullYear()}/${item.Key.split(" ")[0]}`;
    const date = new Date(dateStr);
    const day = date.getDay();
    const hour = parseInt(item.Key.split(" ")[1]);
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
    if (ranges.peak.some((range) => hour >= range[0] && hour < range[1])) {
      peakState = "peak";
    } else if (
      ranges.halfpeak.some((range) => hour >= range[0] && hour < range[1])
    ) {
      peakState = "halfpeak";
    }
    return {
      ...item,
      peakState,
      DayOfWeek: getDayOfWeek(item.Key.split(" ")[0]),
      isSummer,
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
      isSummer: item.isSummer,
    });
    return acc;
  }, {});
};

const aggregateDataByPeakState = (groupedData) => {
  console.log(groupedData);
  const aggregatedData = {};
  Object.keys(groupedData).forEach((date) => {
    const dateParts = date.split("/");
    const month = parseInt(dateParts[0], 10);
    const isSummer = month >= 6 && month <= 9;

    aggregatedData[date] = { peak: 0, semiPeak: 0, offPeak: 0, isSummer };
    groupedData[date].forEach((item) => {
      if (item.PeakState === "peak") {
        aggregatedData[date].peak += item.Value;
      } else if (item.PeakState === "semi-peak") {
        aggregatedData[date].semiPeak += item.Value;
      } else if (item.PeakState === "offpeak") {
        aggregatedData[date].offPeak += item.Value;
      }
    });
    aggregatedData[date].peak = aggregatedData[date].peak.toFixed(2);
    aggregatedData[date].semiPeak = aggregatedData[date].semiPeak.toFixed(2);
    aggregatedData[date].offPeak = aggregatedData[date].offPeak.toFixed(2);
  });
  return aggregatedData;
};
const calculateAveragePower = (dayData) => {
  const totalEnergy = dayData.reduce((sum, hour) => sum + hour.Value, 0);
  return totalEnergy / dayData.length;
};

const parsePrice = (priceString) => {
  return parseFloat(priceString.replace("NT$", ""));
};

const getCurrentQuarterDates = () => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  let quarterStartMonth, quarterEndMonth;

  if (currentMonth < 3) {
    quarterStartMonth = 0;
    quarterEndMonth = 2;
  } else if (currentMonth < 6) {
    quarterStartMonth = 3;
    quarterEndMonth = 5;
  } else if (currentMonth < 9) {
    quarterStartMonth = 6;
    quarterEndMonth = 8;
  } else {
    quarterStartMonth = 9;
    quarterEndMonth = 11;
  }

  const startDate = new Date(currentYear, quarterStartMonth, 1);
  const endDate = new Date(currentYear, quarterEndMonth + 1, 0);

  return { startDate, endDate };
};

const HomePage = () => {
  const energyCostChartRef = useRef(null);
  const totalEnergyTrendChartRef = useRef(null);
  const pieChartRef = useRef(null);

  const updatePieChart = () => {
    if (pieChartRef.current) {
      const pieChart = echarts.init(pieChartRef.current);
      const pieOptions = {
        title: { text: "用電估比", left: "center" },
        tooltip: { trigger: "item" },
        legend: { bottom: "0", left: "center" },
        series: [
          {
            name: "用電估比",
            type: "pie",
            radius: "50%",
            data: [
              { value: 40.57, name: "研發辦公室" },
              { value: 29.54, name: "業務辦公室" },
              { value: 29.88, name: "廠務辦公室" },
              { value: 0.01, name: "(無群組)" },
            ],
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: "rgba(0, 0, 0, 0.5)",
              },
            },
          },
        ],
      };
      pieChart.setOption(pieOptions);
      return pieChart;
    }
  };
  const updateEnergyCostChart = () => {
    if (energyCostChartRef.current && !isLoading) {
      const energyCostChart = echarts.init(energyCostChartRef.current);

      // Get the current date
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth(); // 0-indexed, so July is 6

      // Calculate the number of days in the current month
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

      // Create an array representing the full month
      const xAxisData = [...Array(daysInMonth).keys()].map(
        (i) => `${currentMonth + 1}/${i + 1}`
      );

      // Initialize the data array for the chart
      const totalEnergyData = new Array(daysInMonth).fill(0);

      // Sum up all the energy values (peak, off-peak, and semi-peak) from energyConsumptionData
      Object.keys(energyConsumptionData).forEach((date) => {
        const day = parseInt(date.split("/")[1], 10) - 1; // Extract day and convert to zero-indexed
        const dayData = energyConsumptionData[date];
        totalEnergyData[day] =
          parseFloat(dayData.peak) +
          parseFloat(dayData.offPeak) +
          parseFloat(dayData.semiPeak);
      });

      const energyCostOptions = {
        // title: { text: "總能耗趨勢", left: "center" },
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "shadow",
          },
          formatter: (params) => {
            const param = params[0];
            return `${param.axisValue}<br/>${
              param.marker
            }總能耗: ${param.data.toFixed(2)} kWh`;
          },
        },
        xAxis: {
          type: "category",
          data: xAxisData,
          axisLabel: {
            interval: 0,
            rotate: 45,
          },
        },
        yAxis: {
          type: "value",
          name: "kwh",
        },
        series: [
          {
            name: "總能耗",
            data: totalEnergyData,
            type: "bar",
            itemStyle: { color: "#3ba272" },
          },
        ],
      };

      energyCostChart.setOption(energyCostOptions);
      return energyCostChart;
    }
  };
  const updateTotalEnergyTrendChart = () => {
    if (totalEnergyTrendChartRef.current && !isLoading) {
      const totalEnergyTrendChart = echarts.init(
        totalEnergyTrendChartRef.current
      );

      // Get the current date
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth(); // 0-indexed, so July is 6

      // Calculate the number of days in the current month
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

      // Create an array representing the full month
      const xAxisData = [...Array(daysInMonth).keys()].map(
        (i) => `${currentMonth + 1}/${i + 1}`
      );

      // Initialize the data array for the chart
      const averagePowerData = new Array(daysInMonth).fill(0);

      // Calculate average power for each day in groupedData
      Object.keys(groupedData).forEach((date) => {
        const day = parseInt(date.split("/")[1], 10) - 1; // Extract day and convert to zero-indexed
        const dayData = groupedData[date];
        averagePowerData[day] = calculateAveragePower(dayData);
      });

      const totalEnergyTrendOptions = {
        // title: { text: "總有效功率趨勢", left: "center" },
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "shadow",
          },
          formatter: (params) => {
            const param = params[0];
            return `${param.axisValue}<br/>${
              param.marker
            }平均功率: ${param.data.toFixed(2)} kW`;
          },
        },
        xAxis: {
          type: "category",
          data: xAxisData,
          axisLabel: {
            interval: 0,
            rotate: 45,
          },
        },
        yAxis: {
          type: "value",
          name: "kW",
        },
        series: [
          {
            name: "平均功率",
            data: averagePowerData,
            type: "bar",
            itemStyle: { color: "#3ba272" },
          },
        ],
      };

      totalEnergyTrendChart.setOption(totalEnergyTrendOptions);
      return totalEnergyTrendChart;
    }
  };

  useEffect(() => {
    const pieChart = updatePieChart();
    const energyCostChart = updateEnergyCostChart();
    const totalEnergyTrendChart = updateTotalEnergyTrendChart();

    const handleResize = () => {
      if (pieChart) pieChart.resize();
      if (energyCostChart) energyCostChart.resize();
      if (totalEnergyTrendChart) totalEnergyTrendChart.resize();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      if (pieChart) pieChart.dispose();
      if (energyCostChart) pieChart.dispose();
      if (totalEnergyTrendChart) pieChart.dispose();
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const [isLoading, setIsLoading] = useState(true);
  const { startDate, endDate } = getCurrentQuarterDates();
  const [dateRange, setDateRange] = useState({ startDate, endDate });
  const currentMonthIndex = today.getMonth() + 1; // Get current month as a 1-indexed value
  const paddedMonth = currentMonthIndex.toString().padStart(2, "0"); // Ensure two-digit month
  const [groupedData, setGroupedData] = useState({});
  const [aggregatedData, setAggregatedData] = useState({});
  const [prices, setPrices] = useState(null);
  const [timeRanges, setTimeRanges] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [priceData, setPriceData] = useState({});
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [options, setOptions] = useState([]);
  const [energyConsumptionData, setEnergyConsumptionData] = useState({});
  const [energyPriceData, setEnergyPriceData] = useState({});
  const [co2, setCO2] = useState(0);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      if (!response.ok) throw new Error("Failed to fetch settings");
      const savedSettings = await response.json();
      console.log("Fetched Prices:", savedSettings);
      setPrices(savedSettings);
      setTimeRanges(savedSettings.timeRanges);
      setCO2(savedSettings.CO2);
      setInitialized(true);
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const fetchOptions = async () => {
    try {
      const response = await fetch(
        "https://iot.jtmes.net/ebc/api/equipment/powermeter_list"
      );
      if (!response.ok) throw new Error("Failed to fetch options");
      const data = await response.json();
      const formattedOptions = data.map((item) => ({
        value: item.sn,
        label: item.name,
      }));
      setOptions(formattedOptions);
      setSelectedOptions(formattedOptions.map((option) => option.value));
    } catch (error) {
      console.error("Error fetching options:", error);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchOptions();
  }, []);

  useEffect(() => {
    if (initialized && selectedOptions.length > 0 && timeRanges) {
      fetchAllData();
    }
  }, []);

  useEffect(() => {
    if (dataReady && !isLoading) {
      const energyCostChart = updateEnergyCostChart();
      const totalEnergyTrendChart = updateTotalEnergyTrendChart();

      if (energyCostChart || totalEnergyTrendChart) {
        const handleResize = () => {
          if (energyCostChart) energyCostChart.resize();
          if (totalEnergyTrendChart) totalEnergyTrendChart.resize();
        };
        window.addEventListener("resize", handleResize);
        return () => {
          if (energyCostChart) energyCostChart.dispose();
          if (totalEnergyTrendChart) totalEnergyTrendChart.dispose();
          window.removeEventListener("resize", handleResize);
        };
      }
    }
  }, [dataReady, groupedData, isLoading]);

  const fetchAllData = async () => {
    if (selectedOptions.length === 0) {
      console.error("No options selected");
      return;
    }

    console.log("Starting data fetch for selected options:", selectedOptions);

    const fetchPromises = selectedOptions.map(async (sn) => {
      console.log(`Fetching data for ${sn}...`);
      const result = await fetchData(
        sn,
        dateRange.startDate,
        dateRange.endDate
      );
      return result;
    });

    try {
      const results = await Promise.all(fetchPromises);
      console.log("All data fetched. Aggregating data...");
      const aggregatedData = aggregateFetchedData(results);
      console.log("Data aggregated:", aggregatedData);
      processAndSetData(aggregatedData, timeRanges);
      setIsLoading(false);
      console.log("Data processing complete.");
    } catch (error) {
      console.error("Error fetching data:", error);
      setIsLoading(false);
    }
  };

  const fetchData = async (sn, startDate, endDate) => {
    const formattedStartDate = formatDate(new Date(startDate));
    const formattedEndDate = formatDate(new Date(endDate));
    const url = `https://iot.jtmes.net/ebc/api/equipment/powermeter_statistics?sn=${sn}&start_date=${formattedStartDate}&end_date=${formattedEndDate}&summary_type=hour`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch data for ${sn}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching data for ${sn}:`, error);
      return null;
    }
  };

  const handleDataFetch = debounce(
    async (selectedOptions, dateRange, timeRanges) => {
      if (!initialized) return;
      setIsLoading(true); // Set loading to true when starting fetch
      try {
        const fetchPromises = selectedOptions.map((sn) =>
          fetchData(sn, dateRange.startDate, dateRange.endDate)
        );
        const results = await Promise.all(fetchPromises);
        const aggregatedFetchedData = aggregateFetchedData(results);
        processAndSetData(aggregatedFetchedData, timeRanges);
      } catch (error) {
        console.error("Error during data fetch:", error);
      } finally {
        setIsLoading(false); // Set loading to false when fetch is complete (success or error)
      }
    },
    300
  );

  const processAndSetData = (data, timeRanges) => {
    if (!timeRanges) {
      console.error("Time ranges not initialized.");
      return;
    }

    const dataWithSummerState = data.map((item) => {
      const dateParts = item.Key.split(" ")[0].split("/");
      const month = parseInt(dateParts[0], 10);
      const isSummer = month >= 6 && month <= 9;
      return { ...item, isSummer };
    });

    const dataWithoutYear = removeYearFromDate(dataWithSummerState);
    const updatedData = dataWithoutYear.map((item) => ({
      ...item,
      DayOfWeek: getDayOfWeek(item.Key.split(" ")[0]),
    }));
    const categorizedData = categorizeData(updatedData, timeRanges);
    const groupedByDate = groupDataByDate(categorizedData);
    console.log(groupedByDate);
    const aggregatedByPeakState = aggregateDataByPeakState(groupedByDate);

    console.log("Aggregated Data by Peak State:", aggregatedByPeakState);

    const newPriceData = {};
    const newConsumptionData = {};
    Object.keys(aggregatedByPeakState).forEach((date) => {
      const { peak, semiPeak, offPeak, isSummer } = aggregatedByPeakState[date];

      const peakPrice = parsePrice(
        prices.peakPrices[isSummer ? "夏月" : "非夏月"]
      );
      const semiPeakPrice = parsePrice(
        prices.halfPeakPrices[isSummer ? "夏月" : "非夏月"]
      );
      const offPeakPrice = parsePrice(
        prices.offPeakPrices[isSummer ? "夏月" : "非夏月"]
      );

      const peakCost = parseFloat(peak) * peakPrice;
      const semiPeakCost = parseFloat(semiPeak) * semiPeakPrice;
      const offPeakCost = parseFloat(offPeak) * offPeakPrice;
      const totalCost = peakCost + semiPeakCost + offPeakCost;

      newPriceData[date] = {
        peak: peakCost.toFixed(2),
        semiPeak: semiPeakCost.toFixed(2),
        offPeak: offPeakCost.toFixed(2),
        total: totalCost.toFixed(2),
        isSummer,
      };

      newConsumptionData[date] = {
        peak,
        semiPeak,
        offPeak,
        isSummer,
      };
    });

    setGroupedData(groupedByDate);
    setAggregatedData(aggregatedByPeakState);
    setPriceData(newPriceData);
    setEnergyConsumptionData(newConsumptionData);
    setDataReady(true);
    setIsLoading(false);
  };

  useEffect(() => {
    if (initialized && selectedOptions.length > 0 && timeRanges) {
      handleDataFetch(selectedOptions, dateRange, timeRanges);
    }
  }, [initialized, selectedOptions, timeRanges, dateRange]);

  useEffect(() => {
    if (Object.keys(priceData).length > 0) {
      console.log("Price Data:", priceData);
    }
    if (Object.keys(energyConsumptionData).length > 0) {
      console.log("Energy Consumption Data:", energyConsumptionData);
    }
    console.log("CO2 value:", co2);
  }, [priceData, energyConsumptionData, co2]);

  // Calculate the total energy consumption, total price, and total CO2 emission for the info cards
  const totalEnergyConsumption = Object.values(energyConsumptionData)
    .reduce(
      (acc, data) =>
        acc +
        parseFloat(data.peak) +
        parseFloat(data.semiPeak) +
        parseFloat(data.offPeak),
      0
    )
    .toFixed(2);

  const totalPrice = Object.values(priceData)
    .reduce(
      (acc, data) =>
        acc +
        parseFloat(data.peak) +
        parseFloat(data.semiPeak) +
        parseFloat(data.offPeak),
      0
    )
    .toFixed(2);

  const totalCO2Emission = co2 ? (totalEnergyConsumption * co2).toFixed(2) : 0;

  const currentMonthEnergyConsumption = Object.keys(energyConsumptionData)
    .filter((date) => date.startsWith(`${paddedMonth}/`))
    .reduce(
      (acc, date) =>
        acc +
        parseFloat(energyConsumptionData[date].peak) +
        parseFloat(energyConsumptionData[date].semiPeak) +
        parseFloat(energyConsumptionData[date].offPeak),
      0
    )
    .toFixed(2);
  const currentMonthPrice = Object.keys(priceData)
    .filter((date) => date.startsWith(`${paddedMonth}/`))
    .reduce(
      (acc, date) =>
        acc +
        parseFloat(priceData[date].peak) +
        parseFloat(priceData[date].semiPeak) +
        parseFloat(priceData[date].offPeak),
      0
    )
    .toFixed(2);

  const currentMonthCO2Emission = co2
    ? (currentMonthEnergyConsumption * co2).toFixed(2)
    : 0;

  return (
    <div className="container-fluid min-vh-100 d-flex flex-column">
      {/* Top 50% section (charts) */}
      <div className="row flex-grow-1" style={{ minHeight: "50%" }}>
        <div className="col-12 h-100">
          <div className="row h-100">
            <ChartCard
              ref={energyCostChartRef}
              title="總能耗趨勢"
              height="250px"
              isLoading={isLoading}
            />
            <ChartCard
              ref={totalEnergyTrendChartRef}
              title="總有效功率趨勢"
              height="250px"
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Bottom 50% section (info cards and pie chart) */}
      <div className="row flex-grow-1" style={{ minHeight: "50%" }}>
        <div className="col-12">
          <div className="row h-100">
            <div className="col-lg-4 col-12 mb-4 d-flex">
              <div className="card text-center shadow-sm flex-fill">
                <div className="card-body d-flex flex-column justify-content-center">
                  <h5 className="card-title">用電估比</h5>
                  <div
                    ref={pieChartRef}
                    style={{ width: "100%", height: "250px" }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="col-lg-8 d-flex flex-column">
              <div className="row flex-grow-1">
                <InfoCard
                  title="能耗量"
                  value={`本季: ${totalEnergyConsumption} kWh`}
                  monthlyValue={`當月 ${currentMonthEnergyConsumption} kWh`}
                  isLoading={isLoading}
                />
                <InfoCard
                  title="參考電費"
                  value={`本季: ${totalPrice} NT$`}
                  monthlyValue={`當月 ${currentMonthPrice} NT$`}
                  isLoading={isLoading}
                />
                <InfoCard
                  title="碳排放量"
                  value={`本季: ${totalCO2Emission} kg`}
                  monthlyValue={`當月 ${currentMonthCO2Emission} kg`}
                  isLoading={isLoading}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoCard = ({ title, value, monthlyValue, isLoading }) => (
  <div className="col-md-4 col-12 mb-4 d-flex">
    <div className="card text-center shadow-sm flex-fill">
      <div className="card-body d-flex flex-column justify-content-center">
        <h5 className="card-title text-success">{title}</h5>
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            <h3 className="card-text">{value}</h3>
            <p className="card-text">{monthlyValue}</p>
          </>
        )}
      </div>
    </div>
  </div>
);

const ChartCard = React.forwardRef(({ title, height, isLoading }, ref) => (
  <div className="col-lg-6 col-12 mb-4 d-flex">
    <div className="card text-center shadow-sm flex-fill">
      <div className="card-body d-flex flex-column justify-content-center">
        <h5 className="card-title text-success">{title}</h5>
        {isLoading ? (
          <div
            className="d-flex justify-content-center align-items-center"
            style={{ height }}
          >
            <LoadingSpinner />
          </div>
        ) : (
          <div ref={ref} style={{ width: "100%", height }}></div>
        )}
      </div>
    </div>
  </div>
));
const LoadingSpinner = () => (
  <div className="d-flex flex-column align-items-center">
    <SpinnerCircle className="spinner-border mb-2" role="status">
      <span className="visually-hidden">Loading...</span>
    </SpinnerCircle>
    <LoadingText>Loading...</LoadingText>
  </div>
);

export default HomePage;
