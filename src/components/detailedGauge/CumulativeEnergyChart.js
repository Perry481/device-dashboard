import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useContext,
} from "react";
import { CompanyContext } from "../../contexts/CompanyContext"; // Adjust the path as needed
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

const CumulativeEnergyChart = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { locale } = router;
  const { companyName } = useContext(CompanyContext);
  const today = new Date();
  const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const [dateRange, setDateRange] = useState({
    startDate: oneWeekAgo,
    endDate: today,
  });
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [chartData, setChartData] = useState({});
  const [options, setOptions] = useState([]);
  const [machineGroups, setMachineGroups] = useState([]);
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const fetchTriggerRef = useRef({ date: null, options: null });
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (selectedOptions.length === 0) return;

    setIsLoading(true);
    if (chartInstanceRef.current) {
      chartInstanceRef.current.showLoading();
    }

    const formattedStartDate = formatDate(dateRange.startDate);
    const formattedEndDate = formatDate(dateRange.endDate);

    const expandedOptions = selectedOptions.flatMap((option) => {
      const group = machineGroups.find((g) => g.name === option);
      return group
        ? group.machines.map((m) => ({ id: m.id, name: m.name }))
        : [
            {
              id: option,
              name: options.find((o) => o.value === option)?.label,
            },
          ];
    });

    try {
      const promises = expandedOptions.map(({ id, name }) =>
        fetch(
          `https://iot.jtmes.net/${companyName}/api/equipment/powermeter_statistics?sn=${id}&start_date=${formattedStartDate}&end_date=${formattedEndDate}&summary_type=hour`
        ).then((response) => {
          if (!response.ok)
            throw new Error(`Failed to fetch data for meter ${id}`);
          return response.json().then((data) => ({ id, name, data }));
        })
      );

      const results = await Promise.all(promises);
      processData(results);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
      if (chartInstanceRef.current) {
        chartInstanceRef.current.hideLoading();
      }
    }
  }, [selectedOptions, dateRange, machineGroups, options, companyName, t]);

  const processData = (results) => {
    const processedData = {};
    results.forEach(({ name, data }) => {
      let cumulative = 0;
      processedData[name] = data.map((item) => {
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

  const handleOptionSelection = useCallback((selectedOptions) => {
    setSelectedOptions(selectedOptions);
    fetchTriggerRef.current.options = new Date();
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
          setSelectedOptions([formattedOptions[0].value]);
          fetchTriggerRef.current.options = new Date();
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

  useEffect(() => {
    const shouldFetch =
      fetchTriggerRef.current.date || fetchTriggerRef.current.options;

    if (shouldFetch && selectedOptions.length > 0) {
      fetchData();
      fetchTriggerRef.current = { date: null, options: null };
    }
  }, [selectedOptions, dateRange, fetchData]);

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
          text: t("charts.cumulativeEnergyChart.title"),
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
                " " +
                t("charts.cumulativeEnergyChart.tooltipUnit") +
                "<br/>";
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
          name: t("charts.cumulativeEnergyChart.dateTime"),
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
          name: t("charts.cumulativeEnergyChart.yAxisLabel"),
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
  }, [chartData, isLoading, t, locale]);

  useEffect(() => {
    renderChart();
  }, [renderChart]);

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
            defaultSelectedOptions={selectedOptions}
            machineGroups={machineGroups}
          />
        </HalfWidthContainer>
      </RowContainer>
      <ChartContainer ref={chartRef} />
    </div>
  );
};

export default CumulativeEnergyChart;
