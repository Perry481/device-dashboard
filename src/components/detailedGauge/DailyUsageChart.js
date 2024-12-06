import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useContext,
} from "react";
import { CompanyContext } from "../../contexts/CompanyContext"; // Adjust the path as needed
import { useTranslation } from "../../hooks/useTranslation";
import { useRouter } from "next/router";
import DateRangePicker from "../DateRangePicker";
import SelectionAndSend from "../SelectionAndSend";
import styled from "styled-components";
import * as echarts from "echarts";

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

const DailyUsageChart = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { locale } = router;
  const { companyName } = useContext(CompanyContext);
  const today = new Date();
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const fetchTriggerRef = useRef({ date: null, options: null });
  const [dateRange, setDateRange] = useState({
    startDate: today,
    endDate: today,
  });
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [options, setOptions] = useState([]);
  const [machineGroups, setMachineGroups] = useState([]);
  const [hourlyData, setHourlyData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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
          setSelectedOptions([formattedOptions[0].value]);
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

  const handleDateChange = useCallback((newDateRange) => {
    setDateRange(newDateRange);
    fetchTriggerRef.current.date = new Date();
  }, []);

  const fetchHourlyData = useCallback(async () => {
    if (selectedOptions.length === 0) return;

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

    const expandedOptions = selectedOptions.flatMap((option) => {
      const group = machineGroups.find((g) => g.name === option);
      return group ? group.machines.map((m) => m.id) : [option];
    });

    try {
      const results = await Promise.all(
        expandedOptions.map(async (sn) => {
          const url = `https://iot.jtmes.net/${companyName}/api/equipment/powermeter_statistics?sn=${sn}&start_date=${formattedStartDate}&end_date=${formattedEndDate}&summary_type=hour`;
          const response = await fetch(url);
          if (!response.ok) throw new Error(`Failed to fetch data for ${sn}`);
          return await response.json();
        })
      );
      const aggregatedData = results.reduce((acc, curr) => {
        curr.forEach((item) => {
          const existingItem = acc.find((x) => x.Key === item.Key);
          if (existingItem) {
            existingItem.Value += item.Value;
          } else {
            acc.push({ ...item });
          }
        });
        return acc;
      }, []);

      setHourlyData(
        aggregatedData.sort((a, b) => new Date(a.Key) - new Date(b.Key))
      );
    } catch (error) {
      console.error("Error fetching hourly data:", error);
    } finally {
      setIsLoading(false);
      if (chartInstanceRef.current) {
        chartInstanceRef.current.hideLoading();
      }
    }
  }, [selectedOptions, dateRange, machineGroups, companyName, t]);

  const renderChart = useCallback(() => {
    if (chartRef.current && hourlyData.length > 0) {
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

      const option = {
        title: {
          text: t("charts.dailyUsageChart.title"),
          left: "center",
        },
        tooltip: {
          trigger: "axis",
          formatter: function (params) {
            const [date, hour] = params[0].name.split(" ");
            return `${date} ${hour}:00<br />${t(
              "charts.dailyUsageChart.tooltip.usage"
            )}: ${params[0].value.toFixed(2)} kWh`;
          },
        },
        xAxis: {
          type: "category",
          data: hourlyData.map((item) => item.Key),
          axisLabel: {
            formatter: function (value) {
              const [date, hour] = value.split(" ");
              const [, month, day] = date.split("/");
              return `${month}/${day}\n${hour}:00`;
            },
            interval: "auto",
            rotate: 45,
            textStyle: {
              fontSize: 10,
            },
            hideOverlap: true,
          },
          axisTick: {
            alignWithLabel: true,
          },
        },
        yAxis: {
          type: "value",
          name: t("charts.dailyUsageChart.yAxisLabel"),
        },
        series: [
          {
            name: "Hourly Usage",
            type: "bar",
            data: hourlyData.map((item) => item.Value),
            itemStyle: {
              color: "#3ba272",
            },
          },
        ],
        dataZoom: [
          {
            type: "slider",
            show: true,
            xAxisIndex: [0],
            start: 0,
            end: 100,
          },
          {
            type: "inside",
            xAxisIndex: [0],
            start: 0,
            end: 100,
          },
        ],
        grid: {
          bottom: 100,
        },
      };

      chart.setOption(option);

      const handleResize = () => {
        chart.resize();
      };

      window.addEventListener("resize", handleResize);

      return () => {
        chart.dispose();
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [hourlyData, isLoading, t, locale]);

  useEffect(() => {
    renderChart();
  }, [renderChart]);

  const handleSend = useCallback((newSelectedOptions) => {
    setSelectedOptions(newSelectedOptions);
    fetchTriggerRef.current.options = new Date();
  }, []);

  useEffect(() => {
    const shouldFetch =
      fetchTriggerRef.current.date || fetchTriggerRef.current.options;

    if (shouldFetch && selectedOptions.length > 0) {
      fetchHourlyData();
      fetchTriggerRef.current = { date: null, options: null };
    }
  }, [selectedOptions, dateRange, fetchHourlyData]);

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
            onSend={handleSend}
            defaultSelectedOptions={selectedOptions}
            machineGroups={machineGroups}
          />
        </HalfWidthContainer>
      </RowContainer>
      <ChartContainer ref={chartRef} />
    </div>
  );
};

export default DailyUsageChart;
