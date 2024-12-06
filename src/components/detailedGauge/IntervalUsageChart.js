import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useContext,
} from "react";
import { CompanyContext } from "../../contexts/CompanyContext";
import { useTranslation } from "../../hooks/useTranslation";
import { useRouter } from "next/router";
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
  const { t } = useTranslation();
  const router = useRouter();
  const { locale } = router;
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
  const [isLoading, setIsLoading] = useState(false);
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const fetchTriggerRef = useRef({ date: null, option: null });

  const fetchData = useCallback(async () => {
    if (!selectedOption) return;

    setIsLoading(true);
    if (chartInstanceRef.current) {
      chartInstanceRef.current.showLoading({
        text: "Loading...",
        color: "#3ba272",
        textColor: "#000",
        maskColor: "rgba(255, 255, 255)",
        zlevel: 0,
      });
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
          const url = `https://iot.jtmes.net/${companyName}/api/equipment/powermeter_statistics?sn=${meter.id}&start_date=${formattedStartDate}&end_date=${formattedEndDate}&summary_type=hour`;
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
      setChartData({});
    } finally {
      setIsLoading(false);
      if (chartInstanceRef.current) {
        chartInstanceRef.current.hideLoading();
      }
    }
  }, [selectedOption, dateRange, machineGroups, options, companyName, t]);

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
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://iot.jtmes.net/${companyName}/api/equipment/powermeter_list`
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
      } finally {
        setIsLoading(false);
      }
    };

    const fetchMachineGroups = async () => {
      try {
        const response = await fetch(`/api/settings/${companyName}`);
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

  const renderChart = useCallback(() => {
    if (chartRef.current && Object.keys(chartData).length > 0) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
      }

      const chart = echarts.init(chartRef.current);
      chartInstanceRef.current = chart;

      if (isLoading) {
        chart.showLoading({
          text: "Loading...",
          color: "#3ba272",
          textColor: "#000",
          maskColor: "rgba(255, 255, 255)",
          zlevel: 0,
        });
        return chart;
      }

      chart.hideLoading();

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
          text: t("charts.intervalUsageChart.title"),
          left: "center",
        },
        tooltip: {
          trigger: "axis",
          formatter: function (params) {
            return `${t("charts.intervalUsageChart.tooltip.time")}: ${
              params[0].axisValue
            }<br/>${params
              .map(
                (param) =>
                  `${param.marker} ${
                    param.seriesName
                  }: ${param.value[1].toFixed(2)} ${t(
                    "charts.intervalUsageChart.yAxisLabel"
                  )}`
              )
              .join("<br/>")}`;
          },
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
          name: t("charts.intervalUsageChart.time"),
          data: allTimes,
        },
        yAxis: {
          type: "value",
          name: t("charts.intervalUsageChart.yAxisLabel"),
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
  }, [chartData, isLoading, t, locale]);

  useEffect(() => {
    renderChart();
  }, [renderChart]);

  useEffect(() => {
    const shouldFetch =
      fetchTriggerRef.current.date || fetchTriggerRef.current.option;

    if (shouldFetch && selectedOption) {
      fetchData();
      fetchTriggerRef.current = { date: null, option: null };
    }
  }, [selectedOption, dateRange, fetchData]);

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
