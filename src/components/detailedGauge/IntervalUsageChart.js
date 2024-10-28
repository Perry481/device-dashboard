import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useContext,
} from "react";
import { CompanyContext } from "../../contexts/CompanyContext"; // Adjust the path as needed
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
  const { companyName } = useContext(CompanyContext);
  const today = new Date();
  const [dateRange, setDateRange] = useState({
    startDate: today,
    endDate: today,
  });
  const [selectedOption, setSelectedOption] = useState(null);
  const [chartData, setChartData] = useState({});
  const [options, setOptions] = useState([]);
  const [machineGroups, setMachineGroups] = useState([]);
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const fetchTriggerRef = useRef({ date: null, option: null });

  const fetchData = useCallback(async () => {
    if (!selectedOption) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.showLoading();
    }

    const formattedStartDate = formatDate(dateRange.startDate);
    const formattedEndDate = formatDate(dateRange.endDate);

    const group = machineGroups.find((g) => g.name === selectedOption);
    const metersToFetch = group
      ? group.machines
      : [
          {
            id: selectedOption,
            name: options.find((o) => o.value === selectedOption)?.label,
          },
        ];

    try {
      const results = await Promise.all(
        metersToFetch.map(async (meter) => {
          const url = `http://61.216.62.9:8081/${companyName}/api/powermeter_statistics?sn=${meter.id}&start_date=${formattedStartDate}&end_date=${formattedEndDate}&summary_type=hour`;
          const response = await fetch(url);
          if (!response.ok)
            throw new Error(`Failed to fetch data for ${meter.id}`);
          const data = await response.json();
          return { meter: meter.id, name: meter.name, data };
        })
      );

      const processedData = results.reduce((acc, { meter, name, data }) => {
        const processedMeterData = processData(data);
        if (Object.keys(processedMeterData).length > 0) {
          acc[meter] = { name, data: processedMeterData };
        }
        return acc;
      }, {});

      setChartData(processedData);
    } catch (error) {
      console.error("Error fetching data:", error);
      setChartData({}); // Set empty object in case of error
    } finally {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.hideLoading();
      }
    }
  }, [selectedOption, dateRange, machineGroups, options, companyName]);

  const processData = (data) => {
    const processedData = {};
    data.forEach((item) => {
      const [date, time] = item.Key.split(" ");
      if (!processedData[date]) {
        processedData[date] = [];
      }
      processedData[date].push({ time, value: item.Value });
    });
    return processedData;
  };

  const handleDateChange = useCallback((newDateRange) => {
    setDateRange(newDateRange);
    fetchTriggerRef.current.date = new Date();
  }, []);

  const handleOptionSelection = useCallback((selectedOptions) => {
    setSelectedOption(selectedOptions[0]);
    fetchTriggerRef.current.option = new Date();
  }, []);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await fetch(
          `http://61.216.62.9:8081/${companyName}/api/powermeter_list`
        );
        if (!response.ok) throw new Error("Failed to fetch options");
        const data = await response.json();
        const formattedOptions = data.map((item) => ({
          value: item.sn,
          label: item.name,
        }));
        setOptions(formattedOptions);
        if (formattedOptions.length > 0) {
          setSelectedOption(formattedOptions[0].value);
          fetchTriggerRef.current.option = new Date();
        }
      } catch (error) {
        console.error("Error fetching options:", error);
      }
    };

    const fetchMachineGroups = async () => {
      try {
        const response = await fetch("/api/settings");
        if (!response.ok) throw new Error("Failed to fetch settings");
        const data = await response.json();
        setMachineGroups(data.machineGroups || []);
      } catch (error) {
        console.error("Error fetching machine groups:", error);
      }
    };

    fetchOptions();
    fetchMachineGroups();
  }, [companyName]);

  useEffect(() => {
    const shouldFetch =
      fetchTriggerRef.current.date || fetchTriggerRef.current.option;

    if (shouldFetch && selectedOption) {
      fetchData();
      fetchTriggerRef.current = { date: null, option: null };
    }
  }, [selectedOption, dateRange, fetchData]);

  useEffect(() => {
    if (chartRef.current && Object.keys(chartData).length > 0) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
      }

      const chart = echarts.init(chartRef.current);
      chartInstanceRef.current = chart;

      const series = Object.entries(chartData)
        .flatMap(([meter, { name, data }]) => {
          if (!data || typeof data !== "object") {
            console.warn(`Invalid data for meter ${meter}:`, data);
            return [];
          }
          return Object.entries(data).map(([date, values]) => ({
            name: `${name} - ${date}`,
            type: "line",
            data: values.map((v) => [v.time, v.value]),
          }));
        })
        .filter((series) => series.data && series.data.length > 0);

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
          data: series.map((s) => s.name),
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
            onSend={handleOptionSelection}
            defaultSelectedOptions={[selectedOption]}
            singleSelection={true}
            machineGroups={machineGroups}
          />
        </HalfWidthContainer>
      </RowContainer>
      <ChartContainer ref={chartRef} />
    </div>
  );
};

export default IntervalUsageChart;
