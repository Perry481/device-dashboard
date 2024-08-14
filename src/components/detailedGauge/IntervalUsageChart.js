import React, { useState, useEffect, useRef, useCallback } from "react";
import * as echarts from "echarts";
import styled from "styled-components";
import DateRangePicker from "../DateRangePicker";
import SelectionAndSend from "../SelectionAndSend";

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

const ChartContainer = styled.div`
  width: 100%;
  height: 400px;
  margin-top: 20px;
`;

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = `0${date.getMonth() + 1}`.slice(-2);
  const day = `0${date.getDate()}`.slice(-2);
  return `${year}/${month}/${day}`;
};

const IntervalUsageChart = () => {
  const today = new Date();
  const [dateRange, setDateRange] = useState({
    startDate: today,
    endDate: today,
  });
  const [selectedMeter, setSelectedMeter] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [options, setOptions] = useState([]);
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const fetchTriggerRef = useRef({ date: null, meter: null });

  const fetchData = useCallback(async () => {
    if (!selectedMeter) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.showLoading();
    }

    const formattedStartDate = formatDate(dateRange.startDate);
    const formattedEndDate = formatDate(dateRange.endDate);
    const url = `https://iot.jtmes.net/ebc/api/equipment/powermeter_statistics?sn=${selectedMeter}&start_date=${formattedStartDate}&end_date=${formattedEndDate}&summary_type=hour`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch data");
      const data = await response.json();
      processData(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.hideLoading();
      }
    }
  }, [selectedMeter, dateRange]);

  const processData = (data) => {
    const processedData = {};
    data.forEach((item) => {
      const [date, time] = item.Key.split(" ");
      if (!processedData[date]) {
        processedData[date] = [];
      }
      processedData[date].push({ time, value: item.Value });
    });
    setChartData(processedData);
  };

  const handleDateChange = useCallback((newDateRange) => {
    setDateRange(newDateRange);
    fetchTriggerRef.current.date = new Date();
  }, []);

  const handleMeterSelection = useCallback((selectedMeter) => {
    setSelectedMeter(selectedMeter);
    fetchTriggerRef.current.meter = new Date();
  }, []);

  useEffect(() => {
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
        if (formattedOptions.length > 0) {
          setSelectedMeter(formattedOptions[0].value);
          fetchTriggerRef.current.meter = new Date();
        }
      } catch (error) {
        console.error("Error fetching options:", error);
      }
    };

    fetchOptions();
  }, []);

  useEffect(() => {
    const shouldFetch =
      fetchTriggerRef.current.date || fetchTriggerRef.current.meter;

    if (shouldFetch && selectedMeter) {
      fetchData();
      fetchTriggerRef.current = { date: null, meter: null };
    }
  }, [selectedMeter, dateRange, fetchData]);

  useEffect(() => {
    if (chartRef.current && Object.keys(chartData).length > 0) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
      }

      const chart = echarts.init(chartRef.current);
      chartInstanceRef.current = chart;

      const series = Object.entries(chartData).map(([date, values]) => ({
        name: date,
        type: "line",
        data: values.map((v) => [v.time, v.value]),
      }));

      const allTimes = [
        ...new Set(series.flatMap((s) => s.data.map((d) => d[0]))),
      ].sort();

      const option = {
        title: {
          text: "區間用電圖",
          left: "center",
        },
        tooltip: {
          trigger: "axis",
        },
        legend: {
          type: "scroll",
          data: Object.keys(chartData),
          top: 30,
          left: "center",
          right: "center",
        },
        grid: {
          top: 80,
          bottom: 30,
        },
        xAxis: {
          type: "category",
          name: "時間",
          data: allTimes,
        },
        yAxis: {
          type: "value",
          name: "kWh",
        },
        series: series,
      };

      chart.setOption(option);

      const handleResize = () => {
        chart.resize();
      };

      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        chart.dispose();
      };
    }
  }, [chartData]);

  return (
    <div className="container-fluid">
      <RowContainer>
        <HalfWidthContainer>
          <DateRangePicker
            onDateChange={handleDateChange}
            useShortDateRange={true}
          />
        </HalfWidthContainer>
        <HalfWidthContainer>
          <SelectionAndSend
            options={options}
            onSend={handleMeterSelection}
            defaultSelectedOptions={[selectedMeter]}
          />
        </HalfWidthContainer>
      </RowContainer>
      <ChartContainer ref={chartRef} />
    </div>
  );
};

export default IntervalUsageChart;
