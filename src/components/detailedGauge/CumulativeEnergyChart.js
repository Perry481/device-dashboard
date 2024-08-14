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

const CumulativeEnergyChart = () => {
  const today = new Date();
  const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const [dateRange, setDateRange] = useState({
    startDate: oneWeekAgo,
    endDate: today,
  });
  const [selectedMeters, setSelectedMeters] = useState([]);
  const [chartData, setChartData] = useState({});
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
      processData(results, selectedMeters);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.hideLoading();
      }
    }
  }, [selectedMeters, dateRange]);

  const processData = (data, meters) => {
    const processedData = {};
    data.forEach((meterData, index) => {
      const meterName =
        options.find((option) => option.value === meters[index])?.label ||
        meters[index];
      let cumulative = 0;
      processedData[meterName] = meterData.map((item) => {
        const [date, time] = item.Key.split(" ");
        cumulative += item.Value;
        return { date, time, value: cumulative };
      });
    });
    setChartData(processedData);
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
        if (formattedOptions.length >= 2) {
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
    if (chartRef.current && Object.keys(chartData).length > 0) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
      }

      const chart = echarts.init(chartRef.current);
      chartInstanceRef.current = chart;

      const series = Object.entries(chartData).map(([meterName, values]) => ({
        name: meterName,
        type: "line",
        data: values.map((v) => [v.date + " " + v.time, v.value]),
        smooth: true,
        areaStyle: {},
      }));

      const allDates = [
        ...new Set(
          Object.values(chartData).flatMap((values) =>
            values.map((v) => v.date + " " + v.time)
          )
        ),
      ].sort();

      const option = {
        title: {
          text: "累積能耗圖",
          left: "center",
        },
        tooltip: {
          trigger: "axis",
          formatter: function (params) {
            const date = params[0].axisValue;
            let result = date + "<br/>";
            params.forEach((param) => {
              result +=
                param.marker +
                " " +
                param.seriesName +
                ": " +
                param.value[1].toFixed(2) +
                " kWh<br/>";
            });
            return result;
          },
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
          bottom: 100,
        },
        xAxis: {
          type: "category",
          name: "日期時間",
          data: allDates,
          axisLabel: {
            formatter: (value) => {
              const [date, time] = value.split(" ");
              const [, month, day] = date.split("/");
              return `${month}/${day}\n${time}`;
            },
            interval: "auto",
            rotate: 45,
            textStyle: {
              fontSize: 10,
            },
            hideOverlap: true,
          },
        },
        yAxis: {
          type: "value",
          name: "累積 kWh",
        },
        series: series,
        dataZoom: [
          {
            type: "inside",
            start: 0,
            end: 100,
          },
          {
            type: "slider",
            start: 0,
            end: 100,
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

export default CumulativeEnergyChart;
