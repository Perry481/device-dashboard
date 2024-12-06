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
  height: 600px;
  margin-top: 20px;
`;

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = `0${date.getMonth() + 1}`.slice(-2);
  const day = `0${date.getDate()}`.slice(-2);
  return `${year}/${month}/${day}`;
};

const formatDateWithoutYear = (dateString) => {
  const [, month, day] = dateString.split("/");
  return `${month}/${day}`;
};

const PowerHeatmap = () => {
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
  const [chartData, setChartData] = useState({
    data: [],
    minKwh: 0,
    maxKwh: 0,
  });
  const [options, setOptions] = useState([]);
  const [machineGroups, setMachineGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const fetchTriggerRef = useRef({ date: null, options: null });

  const fetchData = useCallback(async () => {
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
      const promises = expandedOptions.map(({ id }) =>
        fetch(
          `http://61.216.62.8:8081/${companyName}/api/equipment/powermeter_statistics?sn=${id}&start_date=${formattedStartDate}&end_date=${formattedEndDate}&summary_type=hour`
        ).then((response) => {
          if (!response.ok)
            throw new Error(`Failed to fetch data for meter ${id}`);
          return response.json();
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

  const processData = (dataArray) => {
    const combinedData = {};
    let minKwh = Infinity;
    let maxKwh = -Infinity;

    dataArray.forEach((data) => {
      data.forEach((item) => {
        const [date, time] = item.Key.split(" ");
        const hour = parseInt(time, 10);

        if (!combinedData[date]) {
          combinedData[date] = Array(24)
            .fill()
            .map((_, index) => ({
              Time: index,
              Value: 0,
            }));
        }

        combinedData[date][hour].Value += item.Value;
        minKwh = Math.min(minKwh, combinedData[date][hour].Value);
        maxKwh = Math.max(maxKwh, combinedData[date][hour].Value);
      });
    });

    const heatmapData = Object.entries(combinedData).flatMap(
      ([date, entries]) =>
        entries.map((entry) => [entry.Time, date, entry.Value])
    );

    setChartData({ data: heatmapData, minKwh, maxKwh });
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
          `http://61.216.62.8:8081/${companyName}/api/equipment/powermeter_list`
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
    if (chartRef.current && chartData.data.length > 0) {
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

      const dates = [...new Set(chartData.data.map((item) => item[1]))]
        .sort()
        .reverse();
      const { minKwh, maxKwh } = chartData;

      const colorThreshold = (minKwh + maxKwh) / 10;
      const colorThresholds = Array.from(
        { length: 10 },
        (_, i) => i * colorThreshold
      );
      const colors = [
        "#99DA80",
        "#66B400",
        "#99B400",
        "#EBE100",
        "#FFE100",
        "#FFCC00",
        "#FF9900",
        "#FF6600",
        "#FF3300",
        "#FF0000",
      ];

      const option = {
        title: {
          text: t("charts.powerHeatmap.title"),
          left: "center",
          textStyle: {
            fontSize: 14,
            color: "black",
          },
        },
        tooltip: {
          position: "top",
          formatter: function (params) {
            // Check if params and params.value exist before accessing
            if (!params || !params.value) {
              return "";
            }

            const [hour, date, value] = params.value;

            return (
              `${t("charts.powerHeatmap.tooltip.time")}: ${hour}:00<br/>` +
              `${t("charts.powerHeatmap.tooltip.date")}: ${date}<br/>` +
              `${t("charts.powerHeatmap.tooltip.power")}: ${value.toFixed(
                2
              )} ${t("charts.powerHeatmap.unit")}`
            );
          },
        },
        visualMap: {
          type: "piecewise",
          min: minKwh,
          max: maxKwh,
          orient: "horizontal",
          left: "center",
          top: 20,
          pieces: colorThresholds.map((threshold, index) => ({
            min: threshold,
            max:
              index === colorThresholds.length - 1
                ? maxKwh
                : colorThresholds[index + 1],
            color: colors[index],
          })),
          textStyle: {
            color: "black",
          },
          formatter: function (value, value2) {
            return `${value.toFixed(2)} - ${value2.toFixed(2)}`;
          },
        },
        grid: {
          height: "70%",
          top: "15%",
          left: "10%",
        },
        xAxis: {
          type: "category",
          data: Array.from({ length: 24 }, (_, i) => i),
          name: t("charts.powerHeatmap.time"),
          nameLocation: "middle",
          nameGap: 30,
          splitArea: {
            show: true,
          },
        },
        yAxis: {
          type: "category",
          data: dates.map(formatDateWithoutYear),
          name: t("charts.powerHeatmap.date"),
          nameLocation: "start",
          nameGap: 55,
          nameTextStyle: {
            align: "right",
            verticalAlign: "top",
            padding: [0, 0, 0, -50],
          },
          splitArea: {
            show: true,
          },
        },
        series: [
          {
            name: t("charts.powerHeatmap.consumption"),
            type: "heatmap",
            data: chartData.data.map((item) => [
              item[0],
              formatDateWithoutYear(item[1]),
              item[2],
            ]),
            label: {
              show: true,
              formatter: function (params) {
                return params.value[2].toFixed(1);
              },
            },
            itemStyle: {
              borderWidth: 1.3,
              borderColor: "rgba(0, 0, 0, 0.2)",
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowColor: "rgba(0, 0, 0, 0.5)",
              },
            },
          },
        ],
        dataZoom: [
          {
            type: "inside",
            yAxisIndex: 0,
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

export default PowerHeatmap;
