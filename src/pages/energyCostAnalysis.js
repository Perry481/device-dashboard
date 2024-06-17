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

  // Apply padding only for lg and above
  @media (min-width: 992px) {
    padding: 0 80px;
  }

  // Remove padding for md and below
  @media (max-width: 991px) {
    padding: 0;
  }
`;

const HalfWidthContainer = styled.div`
  width: 48%;
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

const categorizeData = (data) => {
  return data.map((item) => {
    const currentYear = new Date().getFullYear();
    const dateStr = `${currentYear}/${item.Key.split(" ")[0]}`;
    const date = new Date(dateStr);
    const day = date.getDay();
    const hour = parseInt(item.Key.split(" ")[1]);
    const month = date.getMonth() + 1; // getMonth() returns 0-11, so add 1 to get 1-12

    const isSummer = month >= 6 && month <= 9;
    let peakState = "";

    if (day >= 1 && day <= 5) {
      // Weekdays
      if (isSummer) {
        // Summer
        if (hour >= 9 && hour < 24) {
          peakState = "peak";
        } else {
          peakState = "offpeak";
        }
      } else {
        // Non-summer
        if ((hour >= 6 && hour < 11) || (hour >= 14 && hour < 24)) {
          peakState = "peak";
        } else {
          peakState = "offpeak";
        }
      }
    } else if (day === 6) {
      // Saturday
      if (isSummer) {
        // Summer
        if (hour >= 9 && hour < 24) {
          peakState = "semi-peak";
        } else {
          peakState = "offpeak";
        }
      } else {
        // Non-summer
        if ((hour >= 6 && hour < 11) || (hour >= 14 && hour < 24)) {
          peakState = "semi-peak";
        } else {
          peakState = "offpeak";
        }
      }
    } else {
      // Sunday and Holidays
      peakState = "offpeak";
    }

    return {
      ...item,
      peakState,
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
      semiPeak: 0,
      offPeak: 0,
    };

    groupedData[date].forEach((item) => {
      if (item.PeakState === "peak") {
        aggregatedData[date].peak += item.Value;
      } else if (item.PeakState === "semi-peak") {
        aggregatedData[date].semiPeak += item.Value;
      } else if (item.PeakState === "offpeak") {
        aggregatedData[date].offPeak += item.Value;
      }
    });

    // Format aggregated values to 2 decimal places
    aggregatedData[date].peak = aggregatedData[date].peak.toFixed(2);
    aggregatedData[date].semiPeak = aggregatedData[date].semiPeak.toFixed(2);
    aggregatedData[date].offPeak = aggregatedData[date].offPeak.toFixed(2);
  });

  return aggregatedData;
};

const EnergyCostAnalysis = () => {
  // Set default date range to the current month
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const [groupedData, setGroupedData] = useState({});
  const [aggregatedData, setAggregatedData] = useState({});
  const [prices, setPrices] = useState(null);
  const barChartRef = useRef(null);
  const pieChartRef = useRef(null);
  const [dateRange, setDateRange] = useState({
    startDate: firstDayOfMonth,
    endDate: lastDayOfMonth,
  });
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [options, setOptions] = useState([]);

  const fetchPrices = async () => {
    try {
      const response = await fetch("/api/prices");
      if (!response.ok) {
        throw new Error("Failed to fetch prices");
      }
      const savedPrices = await response.json();
      setPrices(savedPrices);
    } catch (error) {
      console.error("Error fetching prices:", error);
    }
  };

  const fetchOptions = async () => {
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

      // Set default selection to the first option and fetch data
      if (formattedOptions.length > 0) {
        const defaultOption = formattedOptions[0].value;
        setSelectedOptions([defaultOption]);
        handleDataFetch([defaultOption], {
          startDate: firstDayOfMonth,
          endDate: lastDayOfMonth,
        });
      }
    } catch (error) {
      console.error("Error fetching options:", error);
    }
  };

  useEffect(() => {
    fetchPrices();
    fetchOptions();
  }, []);

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

  const handleDataFetch = async (selectedOptions, dateRange) => {
    const { startDate, endDate } = dateRange;
    const fetchPromises = selectedOptions.map((sn) =>
      fetchData(sn, startDate, endDate)
    );

    try {
      const results = await Promise.all(fetchPromises);
      const aggregatedFetchedData = aggregateFetchedData(results);
      processAndSetData(aggregatedFetchedData);
      console.log("Fetched results:", results);
    } catch (error) {
      console.error("Error during data fetch:", error);
    }
  };

  const processAndSetData = (data) => {
    const dataWithoutYear = removeYearFromDate(data);
    const updatedData = dataWithoutYear.map((item) => ({
      ...item,
      DayOfWeek: getDayOfWeek(item.Key.split(" ")[0]),
    }));
    const categorizedData = categorizeData(updatedData);
    const groupedByDate = groupDataByDate(categorizedData);
    const aggregatedByPeakState = aggregateDataByPeakState(groupedByDate);
    setGroupedData(groupedByDate);
    setAggregatedData(aggregatedByPeakState);
  };

  const handleDateChange = useCallback((newDateRange) => {
    setDateRange(newDateRange);
    console.log("Selected date range:", newDateRange);
  }, []);

  const handleSend = useCallback(
    (newSelectedOptions) => {
      setSelectedOptions(newSelectedOptions);
      console.log("Selected options:", newSelectedOptions);
      handleDataFetch(newSelectedOptions, dateRange);
    },
    [dateRange]
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
        },
        yAxis: {
          type: "value",
          name: "kWh",
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
              parseFloat(aggregatedData[date].semiPeak)
            ),
          },
          {
            name: "離峰",
            type: "bar",
            stack: "total",
            data: dates.map((date) => parseFloat(aggregatedData[date].offPeak)),
          },
        ],
      };
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
      const totalSemiPeak = Object.values(aggregatedData).reduce(
        (acc, curr) => acc + parseFloat(curr.semiPeak),
        0
      );
      const totalOffPeak = Object.values(aggregatedData).reduce(
        (acc, curr) => acc + parseFloat(curr.offPeak),
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
              { value: totalSemiPeak, name: "半尖峰" },
              { value: totalOffPeak, name: "離峰" },
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
          <SelectionAndSend options={options} onSend={handleSend} />
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
