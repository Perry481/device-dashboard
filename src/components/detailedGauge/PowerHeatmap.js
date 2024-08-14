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
  height: 500px;
  margin-top: 20px;
`;

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = `0${date.getMonth() + 1}`.slice(-2);
  const day = `0${date.getDate()}`.slice(-2);
  return `${year}/${month}/${day}`;
};

const PowerHeatmap = () => {
  const today = new Date();
  const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const [dateRange, setDateRange] = useState({
    startDate: oneWeekAgo,
    endDate: today,
  });
  const [selectedMeters, setSelectedMeters] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [options, setOptions] = useState([]);
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const fetchTriggerRef = useRef({ date: null, meters: null });

  const fetchData = useCallback(async () => {
    if (selectedMeters.length === 0) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.showLoading();
    }

    const formattedStartDate = formatDate(dateRange.startDate);
    const formattedEndDate = formatDate(dateRange.endDate);

    try {
      const promises = selectedMeters.map((meter) =>
        fetch(
          `https://iot.jtmes.net/ebc/api/equipment/powermeter_statistics?sn=${meter}&start_date=${formattedStartDate}&end_date=${formattedEndDate}&summary_type=hour`
        ).then((response) => {
          if (!response.ok)
            throw new Error(`Failed to fetch data for meter ${meter}`);
          return response.json();
        })
      );

      const results = await Promise.all(promises);
      processData(results);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.hideLoading();
      }
    }
  }, [selectedMeters, dateRange]);

  const processData = (dataArray) => {
    const aggregatedData = {};
    let minKwh = Infinity;
    let maxKwh = -Infinity;

    // Create a complete grid of dates and hours
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = formatDate(d);
      aggregatedData[dateStr] = Array(24).fill(0);
    }

    // Aggregate data from all meters
    dataArray.forEach((data) => {
      data.forEach((item) => {
        const [date, timeStr] = item.Key.split(" ");
        const hour = parseInt(timeStr, 10);

        if (aggregatedData[date]) {
          aggregatedData[date][hour] += item.Value;
          minKwh = Math.min(minKwh, aggregatedData[date][hour]);
          maxKwh = Math.max(maxKwh, aggregatedData[date][hour]);
        }
      });
    });

    // Convert aggregated data to the format expected by ECharts
    const processedData = Object.entries(aggregatedData).flatMap(
      ([date, hours]) => hours.map((value, hour) => [date, hour, value])
    );

    setChartData({ data: processedData, minKwh, maxKwh });
  };

  const handleDateChange = useCallback((newDateRange) => {
    setDateRange(newDateRange);
    fetchTriggerRef.current.date = new Date();
  }, []);

  const handleMeterSelection = useCallback((selectedMeters) => {
    setSelectedMeters(selectedMeters);
    fetchTriggerRef.current.meters = new Date();
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
          setSelectedMeters([formattedOptions[0].value]);
          fetchTriggerRef.current.meters = new Date();
        }
      } catch (error) {
        console.error("Error fetching options:", error);
      }
    };

    fetchOptions();
  }, []);

  useEffect(() => {
    const shouldFetch =
      fetchTriggerRef.current.date || fetchTriggerRef.current.meters;

    if (shouldFetch && selectedMeters.length > 0) {
      fetchData();
      fetchTriggerRef.current = { date: null, meters: null };
    }
  }, [selectedMeters, dateRange, fetchData]);

  useEffect(() => {
    if (chartRef.current && chartData.data && chartData.data.length > 0) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
      }

      const chart = echarts.init(chartRef.current);
      chartInstanceRef.current = chart;

      const dates = [...new Set(chartData.data.map((item) => item[0]))].sort();

      const option = {
        title: {
          text: "電力熱點圖",
          left: "center",
        },
        tooltip: {
          position: "top",
          formatter: function (params) {
            return `${params.data[0]}, ${
              params.data[1]
            }:00<br>Power: ${params.data[2].toFixed(2)} kWh`;
          },
        },
        grid: {
          height: "70%",
          top: "10%",
        },
        xAxis: {
          type: "category",
          data: Array.from({ length: 24 }, (_, i) => i),
          splitArea: {
            show: true,
          },
          name: "小時",
          nameLocation: "middle",
          nameGap: 30,
        },
        yAxis: {
          type: "category",
          data: dates,
          splitArea: {
            show: true,
          },
          name: "日期",
          nameLocation: "middle",
          nameGap: 50,
        },
        visualMap: {
          min: chartData.minKwh,
          max: chartData.maxKwh,
          calculable: true,
          orient: "horizontal",
          left: "center",
          bottom: "5%",
          color: ["#d94e5d", "#eac736", "#50a3ba"],
        },
        series: [
          {
            name: "Power Consumption",
            type: "heatmap",
            data: chartData.data,
            label: {
              show: false,
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowColor: "rgba(0, 0, 0, 0.5)",
              },
            },
          },
        ],
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
            defaultSelectedOptions={selectedMeters}
          />
        </HalfWidthContainer>
      </RowContainer>
      <ChartContainer ref={chartRef} />
    </div>
  );
};

export default PowerHeatmap;
