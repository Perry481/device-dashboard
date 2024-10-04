import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useContext,
} from "react";
import { CompanyContext } from "../../contexts/CompanyContext"; // Adjust the path as needed
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

const FifteenMinuteDemand = () => {
  const { companyName } = useContext(CompanyContext);
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const fetchTriggerRef = useRef({ date: null, options: null });
  const [dateRange, setDateRange] = useState({
    startDate: firstDayOfMonth,
    endDate: lastDayOfMonth,
  });
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [options, setOptions] = useState([]);
  const [quarterData, setQuarterData] = useState([]);
  const [machineGroups, setMachineGroups] = useState([]);

  useEffect(() => {
    const fetchOptions = async () => {
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

  const handleDateChange = useCallback((newDateRange) => {
    setDateRange(newDateRange);
    fetchTriggerRef.current.date = new Date();
  }, []);

  const fetchQuarterData = useCallback(async () => {
    if (selectedOptions.length === 0) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.showLoading();
    }

    const formattedStartDate = formatDate(dateRange.startDate);
    const formattedEndDate = formatDate(dateRange.endDate);

    try {
      const results = await Promise.all(
        selectedOptions.map(async (sn) => {
          const url = `https://iot.jtmes.net/${companyName}/api/equipment/powermeter_statistics?sn=${sn}&start_date=${formattedStartDate}&end_date=${formattedEndDate}&summary_type=quarter`;
          const response = await fetch(url);
          if (!response.ok) throw new Error(`Failed to fetch data for ${sn}`);
          return await response.json();
        })
      );

      const aggregatedData = results.reduce((acc, curr) => {
        curr.forEach((item) => {
          if (acc[item.Key]) {
            acc[item.Key] += item.Value;
          } else {
            acc[item.Key] = item.Value;
          }
        });
        return acc;
      }, {});

      const processedData = Object.entries(aggregatedData).map(
        ([key, value]) => ({
          Key: key,
          Value: value,
        })
      );
      setQuarterData(processedData);
    } catch (error) {
      console.error("Error fetching quarter data:", error);
    } finally {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.hideLoading();
      }
    }
  }, [selectedOptions, dateRange, companyName]);

  const renderChart = useCallback(() => {
    if (chartRef.current) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
      }

      const chart = echarts.init(chartRef.current);
      chartInstanceRef.current = chart;

      const option = {
        title: {
          text: "每十五分鐘需量",
          left: "center",
        },
        tooltip: {
          trigger: "axis",
          formatter: function (params) {
            const date = new Date(params[0].value[0]);
            const formattedDate = `${date.getFullYear()}/${(date.getMonth() + 1)
              .toString()
              .padStart(2, "0")}/${date
              .getDate()
              .toString()
              .padStart(2, "0")} ${date
              .getHours()
              .toString()
              .padStart(2, "0")}:${date
              .getMinutes()
              .toString()
              .padStart(2, "0")}`;
            return `${formattedDate}<br />需量: ${params[0].value[1].toFixed(
              2
            )} kW`;
          },
        },
        xAxis: {
          type: "time",
          axisLabel: {
            formatter: function (value) {
              const date = new Date(value);
              return `${
                date.getMonth() + 1
              }/${date.getDate()} ${date.getHours()}:${date
                .getMinutes()
                .toString()
                .padStart(2, "0")}`;
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
          name: "需量 (kW)",
        },
        series: [
          {
            name: "Demand",
            type: "line",
            smooth: true,
            data: quarterData.map((item) => [new Date(item.Key), item.Value]),
            areaStyle: {
              opacity: 0.3,
            },
          },
        ],
        dataZoom: [
          {
            type: "inside",
            start: 0,
            end: 100,
          },
          {
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
  }, [quarterData]);

  useEffect(() => {
    renderChart();
  }, [renderChart]);

  const handleSend = useCallback(
    (newSelectedOptions) => {
      const expandedOptions = newSelectedOptions.flatMap((option) => {
        const group = machineGroups.find((g) => g.name === option);
        return group ? group.machines.map((m) => m.id) : [option];
      });
      setSelectedOptions(expandedOptions);
      fetchTriggerRef.current.options = new Date();
    },
    [machineGroups]
  );

  useEffect(() => {
    const shouldFetch =
      fetchTriggerRef.current.date || fetchTriggerRef.current.options;

    if (shouldFetch && selectedOptions.length > 0) {
      fetchQuarterData();
      fetchTriggerRef.current = { date: null, options: null };
    }
  }, [selectedOptions, dateRange, fetchQuarterData]);

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

export default FifteenMinuteDemand;
