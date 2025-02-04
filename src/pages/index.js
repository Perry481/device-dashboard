import dynamic from "next/dynamic";
import React, { useState, useEffect, useRef, useContext } from "react";
import Select from "react-select";
import "bootstrap/dist/css/bootstrap.min.css";
import * as echarts from "echarts";
import styled from "styled-components";
import { debounce } from "lodash";
import { CompanyContext } from "../contexts/CompanyContext";
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = `0${date.getMonth() + 1}`.slice(-2);
  const day = `0${date.getDate()}`.slice(-2);
  return `${year}/${month}/${day}`;
};

const aggregateFetchedData = (results) => {
  const aggregatedData = {};
  results.forEach((result) => {
    if (result) {
      result.forEach((item) => {
        if (aggregatedData[item.Key]) {
          aggregatedData[item.Key] += item.Value;
        } else {
          aggregatedData[item.Key] = item.Value;
        }
      });
    }
  });
  return Object.keys(aggregatedData).map((key) => ({
    Key: key,
    Value: aggregatedData[key],
  }));
};

const aggregateQuarterData = (results) => {
  const aggregatedData = {};
  results.forEach((dataArray) => {
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
const categorizeQuarterData = (data, timeRanges) => {
  if (!timeRanges) {
    console.error("Time ranges not provided.");
    return data.map((item) => ({
      ...item,
      peakState: "unknown",
      isSummer: false,
    }));
  }

  return data.map((item) => {
    const [datePart, timePart] = item.Key.split(" ");
    const [year, month, day] = datePart.split("/");
    const [hour, minute] = timePart.split(":");

    const date = new Date(year, month - 1, day, hour, minute);
    const dayOfWeek = date.getDay();
    const isSummer = parseInt(month) >= 6 && parseInt(month) <= 9;

    const period = isSummer ? "夏月" : "非夏月";
    if (!timeRanges[period]) {
      console.error(`Time ranges not defined for period: ${period}`);
      return { ...item, peakState: "unknown", isSummer };
    }

    const dayType =
      dayOfWeek >= 1 && dayOfWeek <= 5
        ? "weekdays"
        : dayOfWeek === 6
        ? "saturday"
        : "sunday";
    if (!timeRanges[period][dayType]) {
      console.error(
        `Time ranges not defined for day type: ${dayType} in period: ${period}`
      );
      return { ...item, peakState: "unknown", isSummer };
    }

    let peakState = "offpeak";
    const ranges = timeRanges[period][dayType];
    const timeInHours = parseInt(hour) + parseInt(minute) / 60;

    // Check if the property exists before using .some()
    if (
      ranges.peak &&
      ranges.peak.some(
        (range) => timeInHours >= range[0] && timeInHours < range[1]
      )
    ) {
      peakState = "peak";
    } else if (
      ranges.halfpeak &&
      ranges.halfpeak.some(
        (range) => timeInHours >= range[0] && timeInHours < range[1]
      )
    ) {
      peakState = "halfpeak";
    }

    return {
      ...item,
      peakState,
      DayOfWeek: ["週日", "週一", "週二", "週三", "週四", "週五", "週六"][
        dayOfWeek
      ],
      isSummer,
    };
  });
};

const processQuarterData = (results, timeRanges) => {
  const aggregatedQuarterData = aggregateQuarterData(results);
  const categorizedQuarterData = categorizeQuarterData(
    aggregatedQuarterData,
    timeRanges
  );

  // Group the data by date while maintaining quarter-hour intervals
  const groupedQuarterData = categorizedQuarterData.reduce((acc, item) => {
    const [date, time] = item.Key.split(" ");
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push({
      Time: time,
      Value: item.Value,
      DayOfWeek: item.DayOfWeek,
      PeakState: item.peakState,
      isSummer: item.isSummer,
    });
    return acc;
  }, {});

  return {
    categorizedData: categorizedQuarterData,
    groupedData: groupedQuarterData,
  };
};
const removeYearFromDate = (data) => {
  return data.map((item) => {
    const dateWithoutYear = item.Key.split(" ")[0].slice(5);
    return {
      ...item,
      Key: dateWithoutYear + " " + item.Key.split(" ")[1],
    };
  });
};

const getDayOfWeek = (dateStr) => {
  const daysOfWeek = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];
  const date = new Date(`2024/${dateStr}`);
  return daysOfWeek[date.getDay()];
};

const getCurrentQuarter = () => {
  const month = new Date().getMonth();
  return Math.floor(month / 3) + 1;
};

const categorizeData = (data, timeRanges) => {
  if (!timeRanges) {
    console.error("Time ranges not provided.");
    return data.map((item) => ({
      ...item,
      peakState: "unknown",
      isSummer: false,
    }));
  }
  return data.map((item) => {
    const dateParts = item.Key.split(" ")[0].split("/");
    const month = parseInt(dateParts[0], 10);
    const isSummer = month >= 6 && month <= 9;

    const period = isSummer ? "夏月" : "非夏月";
    if (!timeRanges[period]) {
      console.error(`Time ranges not defined for period: ${period}`);
      return { ...item, peakState: "unknown", isSummer };
    }

    const dateStr = `${new Date().getFullYear()}/${item.Key.split(" ")[0]}`;
    const date = new Date(dateStr);
    const day = date.getDay();
    const hour = parseInt(item.Key.split(" ")[1]);
    const dayType =
      day >= 1 && day <= 5 ? "weekdays" : day === 6 ? "saturday" : "sunday";

    if (!timeRanges[period][dayType]) {
      console.error(
        `Time ranges not defined for day type: ${dayType} in period: ${period}`
      );
      return { ...item, peakState: "unknown", isSummer };
    }

    let peakState = "offpeak";
    const ranges = timeRanges[period][dayType];
    if (
      ranges.peak &&
      ranges.peak.some((range) => hour >= range[0] && hour < range[1])
    ) {
      peakState = "peak";
    } else if (
      ranges.halfpeak &&
      ranges.halfpeak.some((range) => hour >= range[0] && hour < range[1])
    ) {
      peakState = "halfpeak";
    }
    return {
      ...item,
      peakState,
      DayOfWeek: getDayOfWeek(item.Key.split(" ")[0]),
      isSummer,
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
      isSummer: item.isSummer,
    });
    return acc;
  }, {});
};

const aggregateDataByPeakState = (groupedData) => {
  const aggregatedData = {};
  Object.keys(groupedData).forEach((date) => {
    const dateParts = date.split("/");
    const month = parseInt(dateParts[0], 10);
    const isSummer = month >= 6 && month <= 9;

    aggregatedData[date] = { peak: 0, halfPeak: 0, offPeak: 0, isSummer };
    groupedData[date].forEach((item) => {
      if (item.PeakState === "peak") {
        aggregatedData[date].peak += item.Value;
      } else if (item.PeakState === "halfpeak") {
        aggregatedData[date].halfPeak += item.Value;
      } else if (item.PeakState === "offpeak") {
        aggregatedData[date].offPeak += item.Value;
      }
    });
    aggregatedData[date].peak = aggregatedData[date].peak.toFixed(2);
    aggregatedData[date].halfPeak = aggregatedData[date].halfPeak.toFixed(2);
    aggregatedData[date].offPeak = aggregatedData[date].offPeak.toFixed(2);
  });
  return aggregatedData;
};
const calculateAveragePower = (dayData) => {
  const totalEnergy = dayData.reduce((sum, hour) => sum + hour.Value, 0);
  return totalEnergy / dayData.length;
};

const parsePrice = (priceString) => {
  return parseFloat((priceString || "").replace("NT$", "") || "0");
};

const getCurrentQuarterDates = () => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  let quarterStartMonth, quarterEndMonth;

  if (currentMonth < 3) {
    quarterStartMonth = 0;
    quarterEndMonth = 2;
  } else if (currentMonth < 6) {
    quarterStartMonth = 3;
    quarterEndMonth = 5;
  } else if (currentMonth < 9) {
    quarterStartMonth = 6;
    quarterEndMonth = 8;
  } else {
    quarterStartMonth = 9;
    quarterEndMonth = 11;
  }

  const startDate = new Date(currentYear, quarterStartMonth, 1);
  const endDate = new Date(currentYear, quarterEndMonth + 1, 0);

  return { startDate, endDate };
};
const getGroupDetails = (groupName, quarterData, machineGroups) => {
  const group = machineGroups.find((g) => g.name === groupName);
  if (!group) {
    return {
      groupName: groupName,
      machines: [],
      totalEnergy: 0,
    };
  }

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;

  const machineDetails = group.machines.map((machine) => {
    const machineData = quarterData[machine.id];
    const currentMonthData = machineData?.[currentMonth];
    const totalEnergy = currentMonthData ? currentMonthData.totalEnergy : 0;

    return {
      id: machine.id,
      name: machine.name,
      totalEnergy: Number(totalEnergy.toFixed(2)),
    };
  });

  const groupTotalEnergy = machineDetails.reduce(
    (sum, machine) => sum + machine.totalEnergy,
    0
  );

  return {
    groupName: groupName,
    machines: machineDetails,
    totalEnergy: Number(groupTotalEnergy.toFixed(2)),
  };
};
const logQuarterData = (results, selectedOptions, machineGroups) => {
  const quarterData = {};
  const settingsGroupedData = {};
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  // Create a map of machine IDs to their group names
  const machineGroupMap = {};
  machineGroups.forEach((group) => {
    group.machines.forEach((machine) => {
      machineGroupMap[machine.id] = group.name;
    });
  });

  results.forEach((result, index) => {
    const machineSN = selectedOptions[index];
    const groupName = machineGroupMap[machineSN] || "Ungrouped";
    const monthlyData = {};

    if (Array.isArray(result)) {
      result.forEach((item) => {
        const { Key, Value } = item;
        const [datePart, timePart] = Key.split(" ");
        const [year, month, day] = datePart.split("/").map(Number);

        if (!monthlyData[month]) {
          monthlyData[month] = { totalEnergy: 0, quarterHourData: {} };
        }

        monthlyData[month].quarterHourData[`${day} ${timePart}`] = Value;
        monthlyData[month].totalEnergy += Value;
      });
    }

    quarterData[machineSN] = monthlyData;

    if (!settingsGroupedData[groupName]) {
      settingsGroupedData[groupName] = {};
    }
    Object.entries(monthlyData).forEach(([month, data]) => {
      if (!settingsGroupedData[groupName][month]) {
        settingsGroupedData[groupName][month] = { totalEnergy: 0 };
      }
      settingsGroupedData[groupName][month].totalEnergy += data.totalEnergy;
    });
  });

  // console.log(`Current Month: ${currentMonth}`);
  // console.log("Quarter Data by Month and Group:");

  // Use the helper function to get detailed group information
  const groupDetails = machineGroups.map((group) =>
    getGroupDetails(group.name, quarterData, machineGroups)
  );

  // Log the detailed group information
  groupDetails.forEach((group) => {
    console.log(`Group: ${group.groupName}`);
    console.log(`Total Energy: ${group.totalEnergy} kWh`);
    console.log("Machines:");
    group.machines.forEach((machine) => {
      console.log(
        `  ${machine.name} (${machine.id}): ${machine.totalEnergy} kWh`
      );
    });
    console.log("---");
  });

  // Also log the ungrouped machines
  const ungroupedMachines = selectedOptions.filter(
    (sn) => !machineGroupMap[sn]
  );
  if (ungroupedMachines.length > 0) {
    console.log("Ungrouped Machines:");
    ungroupedMachines.forEach((machineSN) => {
      const machineData = quarterData[machineSN];
      const currentMonthData = machineData?.[currentMonth];
      const totalEnergy = currentMonthData ? currentMonthData.totalEnergy : 0;
      console.log(`  ${machineSN}: ${totalEnergy.toFixed(2)} kWh`);
    });
  }

  return { quarterData, settingsGroupedData };
};

const HomePage = () => {
  const combinedEnergyChartRef = useRef(null);
  const dailyPeakDemandChartRef = useRef(null);
  const pieChartRef = useRef(null);

  const updatePieChart = () => {
    console.log("Updating Pie Chart");
    console.log("settingsGroupedData:", settingsGroupedData);
    console.log("quarterData:", quarterData);
    console.log("selectedGroup:", selectedGroup);
    console.log("machineGroups:", machineGroups);

    if (pieChartRef.current && Object.keys(settingsGroupedData).length > 0) {
      const pieChart = echarts.init(pieChartRef.current);

      if (isLoading || isSwitchingGroup) {
        pieChart.showLoading({
          text: "Loading...",
          color: "#3ba272",
          textColor: "#000",
          maskColor: "rgba(255, 255, 255, 0.8)",
          zlevel: 0,
        });
        return pieChart;
      }

      pieChart.hideLoading();

      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      console.log("Current Month:", currentMonth);

      let pieData;
      if (selectedGroup === "all") {
        // For "all" selection, show data for each group
        pieData = Object.entries(settingsGroupedData).map(
          ([groupName, monthlyData]) => {
            const currentMonthData = monthlyData[currentMonth];
            return {
              name: groupName === "Ungrouped" ? "未分組" : groupName,
              value: currentMonthData
                ? Number(currentMonthData.totalEnergy.toFixed(2))
                : 0,
            };
          }
        );
      } else {
        // For a specific group, use the settingsGroupedData
        const groupData = settingsGroupedData[selectedGroup];
        if (groupData && groupData[currentMonth]) {
          const selectedGroupMachines =
            machineGroups.find((g) => g.name === selectedGroup)?.machines || [];
          pieData = selectedGroupMachines.map((machine) => {
            const machineData = quarterData[machine.id];
            const currentMonthData = machineData?.[currentMonth];
            return {
              name: machine.name,
              value: currentMonthData
                ? Number(currentMonthData.totalEnergy.toFixed(2))
                : 0,
            };
          });
        } else {
          pieData = [{ name: selectedGroup, value: 0 }];
        }
      }

      console.log("Final Pie Data:", pieData);

      const pieOptions = {
        title: {
          text:
            selectedGroup === "all"
              ? "用電估比 (全部)"
              : `用電估比 (${selectedGroup})`,
          left: "center",
          textStyle: {
            color: "#3ba272",
            fontSize: 18,
            fontWeight: "300",
          },
        },
        tooltip: {
          trigger: "item",
          formatter: "{a} <br/>{b}: {c} kWh ({d}%)",
        },
        series: [
          {
            name: "用電估比",
            type: "pie",
            radius: "50%",
            data: pieData,
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: "rgba(0, 0, 0, 0.5)",
              },
            },
          },
        ],
      };

      pieChart.setOption(pieOptions);
      return pieChart;
    } else {
      console.log("Conditions not met for updating pie chart");
      console.log("pieChartRef.current:", pieChartRef.current);
      console.log(
        "settingsGroupedData keys:",
        Object.keys(settingsGroupedData)
      );
      return null;
    }
  };
  const updateCombinedEnergyChart = () => {
    if (combinedEnergyChartRef.current && !isLoading) {
      const combinedEnergyChart = echarts.init(combinedEnergyChartRef.current);

      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;

      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

      const xAxisData = [...Array(daysInMonth).keys()].map(
        (i) => `${currentMonth}/${i + 1}`
      );

      const totalEnergyConsumptionData = new Array(daysInMonth).fill(0);
      const averagePowerData = new Array(daysInMonth).fill(0);

      // console.log("Energy Consumption Data:", energyConsumptionData);

      Object.keys(energyConsumptionData).forEach((date) => {
        const [month, day] = date.split("/").map(Number);
        if (month === currentMonth) {
          const dayIndex = day - 1;
          const dayData = energyConsumptionData[date];
          // console.log(`Processing date: ${date}, Data:`, dayData);

          const peakValue = parseFloat(dayData.peak) || 0;
          const offPeakValue = parseFloat(dayData.offPeak) || 0;
          const halfPeakValue = parseFloat(dayData.halfPeak) || 0;

          totalEnergyConsumptionData[dayIndex] =
            peakValue + offPeakValue + halfPeakValue;

          // console.log(
          //   `Date: ${date}, Total Energy: ${totalEnergyConsumptionData[dayIndex]}`
          // );
        }
      });

      // console.log("Grouped Data:", groupedData);

      Object.keys(groupedData).forEach((date) => {
        const [month, day] = date.split("/").map(Number);
        if (month === currentMonth) {
          const dayIndex = day - 1;
          const dayData = groupedData[date];
          averagePowerData[dayIndex] = calculateAveragePower(dayData);
          // console.log(
          //   `Date: ${date}, Average Power: ${averagePowerData[dayIndex]}`
          // );
        }
      });

      // console.log(
      //   "Final Total Energy Consumption Data:",
      //   totalEnergyConsumptionData
      // );
      // console.log("Final Average Power Data:", averagePowerData);

      const combinedEnergyOptions = {
        title: {
          text: "總能耗與平均功率趨勢",
          left: "center",
          top: 10,
          textStyle: {
            color: "#3ba272",
            fontSize: 18,
            fontWeight: "300",
          },
        },
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "shadow",
          },
          formatter: (params) => {
            const totalEnergyParam = params[0];
            const averagePowerParam = params[1];
            return `${totalEnergyParam.axisValue}<br/>
                    ${
                      totalEnergyParam.marker
                    }總能耗: ${totalEnergyParam.data.toFixed(2)} kWh<br/>
                    ${
                      averagePowerParam.marker
                    }平均功率: ${averagePowerParam.data.toFixed(2)} kW`;
          },
        },
        xAxis: {
          type: "category",
          data: xAxisData,
          axisLabel: {
            interval: 0,
            rotate: 45,
          },
        },
        yAxis: [
          {
            type: "value",
            name: "kWh / kW",
          },
        ],
        series: [
          {
            name: "總能耗",
            type: "bar",
            stack: "total",
            itemStyle: { color: "#3ba272" }, // Main color
            data: totalEnergyConsumptionData,
          },
          {
            name: "平均功率",
            type: "bar",
            stack: "total",
            itemStyle: { color: "#264653" }, // Darker shade for contrast
            data: averagePowerData,
          },
        ],
      };

      combinedEnergyChart.setOption(combinedEnergyOptions);
      return combinedEnergyChart;
    }
  };

  const updateDailyPeakDemandChart = () => {
    if (dailyPeakDemandChartRef.current && !isLoading) {
      const dailyPeakDemandChart = echarts.init(
        dailyPeakDemandChartRef.current
      );

      // console.log("quarterGroupedData:", quarterGroupedData);
      // console.log("quarterGroupedData keys:", Object.keys(quarterGroupedData));

      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
      const xAxisData = [...Array(daysInMonth).keys()].map(
        (i) => `${currentMonth}/${i + 1}`
      );

      const peakDemandData = new Array(daysInMonth).fill(0);

      Object.entries(quarterGroupedData).forEach(([date, dayData]) => {
        // console.log(`Processing date: ${date}, dayData:`, dayData);
        const [year, month, day] = date.split("/").map(Number);
        // console.log(
        //   `Parsed year: ${year}, month: ${month}, day: ${day}, currentMonth: ${currentMonth}`
        // );
        if (month === currentMonth) {
          const dayIndex = day - 1;

          if (
            Array.isArray(dayData) &&
            dayData.length > 0 &&
            "Value" in dayData[0]
          ) {
            const maxValue = Math.max(...dayData.map((item) => item.Value));
            peakDemandData[dayIndex] = maxValue;
            // console.log(`Max value for ${date}: ${maxValue}`);
          }
        }
      });

      // console.log("Final peakDemandData:", peakDemandData);
      // Use contractCapacity instead of hardcoded value
      const markLineValue = contractCapacity;
      const dailyPeakDemandOptions = {
        title: {
          text: "每日最高十五分鐘需量",
          left: "center",
          top: 10,
          textStyle: {
            color: "#3ba272",
            fontSize: 18,
            fontWeight: "300",
          },
        },
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "shadow",
          },
          formatter: (params) => {
            const param = params[0];
            return `${param.axisValue}<br/>${param.marker}最高需量: ${
              param.data !== undefined ? param.data.toFixed(2) : "N/A"
            } kW`;
          },
        },
        xAxis: {
          type: "category",
          data: xAxisData,
          axisLabel: {
            interval: 0,
            rotate: 45,
          },
        },
        yAxis: {
          type: "value",
          name: "kW",
        },
        series: [
          {
            name: "Peak Demand",
            data: peakDemandData,
            type: "bar",
            itemStyle: {
              color: (params) => {
                return params.data > markLineValue ? "#ff0000" : "#3ba272";
              },
            },
            markLine: {
              silent: true,
              lineStyle: {
                color: "#ff0000",
              },
              label: {
                position: "insideEndTop",
                formatter: "契約容量: {c}kW",
                fontSize: 12,
                padding: [0, 0, 0, 10],
              },
              data: [
                {
                  yAxis: markLineValue,
                  label: {
                    show: true,
                  },
                },
              ],
            },
          },
        ],
      };

      dailyPeakDemandChart.setOption(dailyPeakDemandOptions);
      return dailyPeakDemandChart;
    }
  };

  const today = new Date();
  const currentQuarter = getCurrentQuarter();
  const [isLoading, setIsLoading] = useState(true);
  const { startDate, endDate } = getCurrentQuarterDates();
  const [dateRange, setDateRange] = useState({ startDate, endDate });
  const currentMonthIndex = today.getMonth() + 1; // Get current month as a 1-indexed value
  const paddedMonth = currentMonthIndex.toString().padStart(2, "0"); // Ensure two-digit month|
  const [quarterData, setQuarterData] = useState({
    categorizedData: [],
    groupedData: {},
  });
  const [groupedData, setGroupedData] = useState({});
  const [quarterGroupedData, setQuarterGroupedData] = useState({});
  const [aggregatedData, setAggregatedData] = useState({});
  const [prices, setPrices] = useState(null);
  const [timeRanges, setTimeRanges] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [priceData, setPriceData] = useState({});
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [options, setOptions] = useState([]);
  const [energyConsumptionData, setEnergyConsumptionData] = useState({});
  const [activePricingStandard, setActivePricingStandard] = useState(null);
  const [co2, setCO2] = useState(0);
  const [contractCapacity, setContractCapacity] = useState(0); // Default to 10 as a fallback
  const [machineGroups, setMachineGroups] = useState([]);
  const [settingsGroupedData, setSettingsGroupedData] = useState({});
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [isSwitchingGroup, setIsSwitchingGroup] = useState(false);
  const { companyName } = useContext(CompanyContext);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`/api/settings/${companyName}`);
      if (!response.ok) throw new Error("Failed to fetch settings");
      const savedSettings = await response.json();
      const activeStandard =
        savedSettings.pricingStandards[savedSettings.activePricingStandard];
      setPrices(activeStandard.prices);
      setTimeRanges(activeStandard.timeRanges);
      setCO2(savedSettings.CO2);
      setContractCapacity(savedSettings.contractCapacity);
      setActivePricingStandard(savedSettings.activePricingStandard);
      setMachineGroups(savedSettings.machineGroups || []); // Add this line
      setInitialized(true);
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

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
      setSelectedOptions(formattedOptions.map((option) => option.value));
    } catch (error) {
      console.error("Error fetching options:", error);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchOptions();
  }, []);

  useEffect(() => {
    if (dataReady && !isLoading) {
      const pieChart = updatePieChart();
      const dailyPeakDemandChart = updateDailyPeakDemandChart();
      const combinedEnergyChart = updateCombinedEnergyChart();

      const handleResize = () => {
        if (pieChart) pieChart.resize();
        if (dailyPeakDemandChart) dailyPeakDemandChart.resize();
        if (combinedEnergyChart) combinedEnergyChart.resize();
      };

      window.addEventListener("resize", handleResize);

      return () => {
        if (pieChart) pieChart.dispose();
        if (dailyPeakDemandChart) dailyPeakDemandChart.dispose();
        if (combinedEnergyChart) combinedEnergyChart.dispose();
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [
    dataReady,
    isLoading,
    isSwitchingGroup,
    energyConsumptionData,
    priceData,
    co2,
    settingsGroupedData,
    selectedGroup,
  ]);
  const fetchAllData = async () => {
    if (selectedOptions.length === 0) {
      console.error("No options selected");
      return;
    }

    setIsLoading(true);
    setIsSwitchingGroup(true);

    let filteredOptions = selectedOptions;
    if (selectedGroup !== "all") {
      const group = machineGroups.find((g) => g.name === selectedGroup);
      if (group) {
        filteredOptions = group.machines.map((machine) => machine.id);
      }
    }

    const fetchPromises = filteredOptions.map(async (sn) => {
      const result = await fetchQuarterData(
        sn,
        dateRange.startDate,
        dateRange.endDate
      );
      return { sn, data: result };
    });

    try {
      const results = await Promise.all(fetchPromises);
      const { quarterData, settingsGroupedData } = logQuarterData(
        results.map((r) => r.data),
        results.map((r) => r.sn),
        machineGroups
      );

      setSettingsGroupedData(settingsGroupedData);
      setQuarterData(quarterData);

      console.log("Processing data...");

      // Process the quarter data
      const { categorizedData, groupedData } = processQuarterData(
        results.map((r) => r.data),
        timeRanges
      );

      // Continue with your existing data processing for hourly data
      const processedHourlyData = results.map((r) =>
        processQuarterDataToHourly(r.data)
      );
      const aggregatedHourlyData = aggregateFetchedData(processedHourlyData);
      processAndSetData(aggregatedHourlyData, timeRanges);

      setQuarterGroupedData(groupedData);
      setIsSwitchingGroup(false);
      setIsLoading(false);
      setDataReady(true);
      console.log("Data processing complete.");
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  const fetchQuarterData = async (sn, startDate, endDate) => {
    const formattedStartDate = formatDate(new Date(startDate));
    const formattedEndDate = formatDate(new Date(endDate));
    const url = `http://61.216.62.9:8081/${companyName}/api/powermeter_statistics?sn=${sn}&start_date=${formattedStartDate}&end_date=${formattedEndDate}&summary_type=quarter`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch data for ${sn}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching data for ${sn}:`, error);
      return null;
    }
  };

  const processQuarterDataToHourly = (quarterData) => {
    const hourlyData = {};
    quarterData.forEach((item) => {
      const [date, time] = item.Key.split(" ");
      const hour = time.split(":")[0];
      const hourKey = `${date} ${hour}`;

      if (!hourlyData[hourKey]) {
        hourlyData[hourKey] = 0;
      }
      hourlyData[hourKey] += item.Value;
    });

    return Object.entries(hourlyData).map(([key, value]) => ({
      Key: key,
      Value: parseFloat(value.toFixed(2)), // Round to 2 decimal places
    }));
  };

  const processAndSetData = (data, timeRanges) => {
    if (!timeRanges) {
      console.error("Time ranges not initialized.");
      return;
    }

    const dataWithSummerState = data.map((item) => {
      const dateParts = item.Key.split(" ")[0].split("/");
      const month = parseInt(dateParts[0], 10);
      const isSummer = month >= 6 && month <= 9;
      return { ...item, isSummer };
    });

    const dataWithoutYear = removeYearFromDate(dataWithSummerState);
    const updatedData = dataWithoutYear.map((item) => ({
      ...item,
      DayOfWeek: getDayOfWeek(item.Key.split(" ")[0]),
    }));
    const categorizedData = categorizeData(updatedData, timeRanges);
    const groupedByDate = groupDataByDate(categorizedData);

    const aggregatedByPeakState = aggregateDataByPeakState(groupedByDate);

    const newPriceData = {};
    const newConsumptionData = {};
    Object.keys(aggregatedByPeakState).forEach((date) => {
      const { peak, halfPeak, offPeak, isSummer } = aggregatedByPeakState[date];

      const period = isSummer ? "夏月" : "非夏月";

      const peakPrice = parsePrice(prices.peakPrices[period]);
      const halfPeakPrice = parsePrice(prices.halfPeakPrices[period]);
      const offPeakPrice = parsePrice(prices.offPeakPrices[period]);

      const peakCost = parseFloat(peak) * peakPrice;
      const halfPeakCost = parseFloat(halfPeak) * halfPeakPrice;
      const offPeakCost = parseFloat(offPeak) * offPeakPrice;
      const totalCost = peakCost + halfPeakCost + offPeakCost;

      newPriceData[date] = {
        peak: peakCost.toFixed(2),
        halfPeak: halfPeakCost.toFixed(2),
        offPeak: offPeakCost.toFixed(2),
        total: totalCost.toFixed(2),
        isSummer,
      };

      newConsumptionData[date] = {
        peak,
        halfPeak,
        offPeak,
        isSummer,
      };
    });

    setGroupedData(groupedByDate);
    setAggregatedData(aggregatedByPeakState);
    setPriceData(newPriceData);
    setEnergyConsumptionData(newConsumptionData);
    setDataReady(true);
    setIsLoading(false);
  };

  const handleGroupChange = (newGroup) => {
    setIsSwitchingGroup(true);
    setSelectedGroup(newGroup);
  };

  useEffect(() => {
    if (initialized && selectedOptions.length > 0 && timeRanges) {
      setIsLoading(true);
      setIsSwitchingGroup(true);
      fetchAllData().finally(() => {
        setIsLoading(false);
        setIsSwitchingGroup(false);
      });
    }
  }, [initialized, selectedOptions, timeRanges, dateRange, selectedGroup]);

  // Calculate the total energy consumption, total price, and total CO2 emission for the info cards
  const totalEnergyConsumption = Object.values(energyConsumptionData)
    .reduce(
      (acc, data) =>
        acc +
        parseFloat(data.peak) +
        parseFloat(data.halfPeak) +
        parseFloat(data.offPeak),
      0
    )
    .toFixed(2);

  const totalPrice = Object.values(priceData)
    .reduce(
      (acc, data) =>
        acc +
        parseFloat(data.peak) +
        parseFloat(data.halfPeak) +
        parseFloat(data.offPeak),
      0
    )
    .toFixed(2);

  // Add this calculation for total CO2 emission
  const totalCO2Emission = (parseFloat(totalEnergyConsumption) * co2).toFixed(
    2
  );

  const currentMonthEnergyConsumption = Object.keys(energyConsumptionData)
    .filter((date) => date.startsWith(`${paddedMonth}/`))
    .reduce(
      (acc, date) =>
        acc +
        parseFloat(energyConsumptionData[date].peak) +
        parseFloat(energyConsumptionData[date].halfPeak) +
        parseFloat(energyConsumptionData[date].offPeak),
      0
    )
    .toFixed(2);

  const currentMonthPrice = Object.keys(priceData)
    .filter((date) => date.startsWith(`${paddedMonth}/`))
    .reduce(
      (acc, date) =>
        acc +
        parseFloat(priceData[date].peak) +
        parseFloat(priceData[date].halfPeak) +
        parseFloat(priceData[date].offPeak),
      0
    )
    .toFixed(2);

  // Add this calculation for current month CO2 emission
  const currentMonthCO2Emission = (
    parseFloat(currentMonthEnergyConsumption) * co2
  ).toFixed(2);

  // console.log("Total Energy Consumption:", totalEnergyConsumption, "kWh");
  // console.log("Total Price:", totalPrice, "NT$");
  // console.log("Total CO2 Emission:", totalCO2Emission, "kg");
  // console.log(
  //   "Current Month Energy Consumption:",
  //   currentMonthEnergyConsumption,
  //   "kWh"
  // );
  // console.log("Current Month Price:", currentMonthPrice, "NT$");
  // console.log("Current Month CO2 Emission:", currentMonthCO2Emission, "kg");
  return (
    <div className="container-fluid min-vh-100 d-flex flex-column">
      <div className="row mb-3">
        <div className="col-12">
          <GroupSelector
            groups={machineGroups}
            selectedGroup={selectedGroup}
            onGroupChange={handleGroupChange}
          />
        </div>
      </div>
      {/* Top 50% section (charts) */}
      <div className="row flex-grow-1" style={{ minHeight: "50%" }}>
        <div className="col-12">
          <div className="row h-100">
            <ChartCard
              ref={combinedEnergyChartRef}
              height="100%"
              isLoading={isLoading}
              isSwitchingGroup={isSwitchingGroup}
            />
            <ChartCard
              ref={dailyPeakDemandChartRef}
              height="100%"
              isLoading={isLoading}
              isSwitchingGroup={isSwitchingGroup}
            />
          </div>
        </div>
      </div>
      <div className="row flex-grow-1" style={{ minHeight: "50%" }}>
        <div className="col-12">
          <div className="row h-100">
            <div className="col-lg-4 col-12 mb-4 d-flex">
              <div className="card text-center shadow-sm flex-fill">
                <div className="card-body d-flex flex-column justify-content-center">
                  {isLoading || isSwitchingGroup ? (
                    <LoadingSpinner />
                  ) : (
                    <div
                      ref={pieChartRef}
                      style={{ width: "100%", height: "250px" }}
                    ></div>
                  )}
                </div>
              </div>
            </div>
            <div className="col-lg-8 d-flex flex-column">
              <div className="row flex-grow-1">
                <InfoCard
                  title="能耗量"
                  value={`${totalEnergyConsumption} kWh`}
                  monthlyValue={`當月 ${currentMonthEnergyConsumption} kWh`}
                  isLoading={isLoading}
                  isSwitchingGroup={isSwitchingGroup}
                  quarter={currentQuarter}
                />
                <InfoCard
                  title="參考電費"
                  value={`NT$${totalPrice}`}
                  monthlyValue={`當月 NT$${currentMonthPrice}`}
                  isLoading={isLoading}
                  isSwitchingGroup={isSwitchingGroup}
                  quarter={currentQuarter}
                />
                <InfoCard
                  title="碳排放量"
                  value={`${totalCO2Emission} kg`}
                  monthlyValue={`當月 ${currentMonthCO2Emission} kg`}
                  isLoading={isLoading}
                  isSwitchingGroup={isSwitchingGroup}
                  quarter={currentQuarter}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CardTitle = styled.h5`
  color: #3ba272;
`;

const CardValue = styled.h3`
  margin-bottom: 0.5rem;

  @media (min-width: 992px) {
    .col-lg-4 & {
      display: flex;
      flex-direction: column;

      span {
        margin-top: 0.5rem;
      }
    }
  }
`;

const MonthlyValue = styled.p`
  margin-bottom: 0;
`;
const ChartCard = React.forwardRef(({ isLoading, isSwitchingGroup }, ref) => (
  <div className="col-lg-6 col-12 mb-4 d-flex">
    <div className="card shadow-sm flex-fill">
      <div
        className="card-body d-flex flex-column justify-content-center p-0"
        style={{ height: "300px" }}
      >
        {isLoading || isSwitchingGroup ? (
          <LoadingSpinner />
        ) : (
          <div ref={ref} style={{ width: "100%", height: "100%" }}></div>
        )}
      </div>
    </div>
  </div>
));
const InfoCard = ({
  title,
  value,
  monthlyValue,
  isLoading,
  isSwitchingGroup,
  quarter,
}) => (
  <div className="col-lg-4 col-md-6 col-12 mb-4">
    <div className="card text-center shadow-sm h-100">
      <div className="card-body d-flex flex-column justify-content-center">
        <CardTitle>{title}</CardTitle>
        {isLoading || isSwitchingGroup ? (
          <div style={{ height: "100px" }}>
            {" "}
            {/* Adjust this height as needed */}
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <CardValue>
              本季(Q{quarter}) <span>{value}</span>
            </CardValue>
            <MonthlyValue>{monthlyValue}</MonthlyValue>
          </>
        )}
      </div>
    </div>
  </div>
);

const SpinnerContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
`;

const SpinnerCircle = styled.div`
  color: #3ba272;
`;

const LoadingText = styled.div`
  @keyframes pulse {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
    100% {
      opacity: 1;
    }
  }

  animation: pulse 1.5s infinite ease-in-out;
  color: black;
  margin-top: 10px;
`;

const LoadingSpinner = () => (
  <SpinnerContainer>
    <SpinnerCircle className="spinner-border" role="status">
      <span className="visually-hidden">Loading...</span>
    </SpinnerCircle>
    <LoadingText>Loading...</LoadingText>
  </SpinnerContainer>
);
const SelectWrapper = styled.div`
  width: 100%;
  max-width: 300px;
  margin: 20px auto 10px;
`;

const customStyles = {
  control: (provided, state) => ({
    ...provided,
    borderColor: state.isFocused ? "#2a7d54" : "#3ba272",
    boxShadow: state.isFocused ? "0 0 0 1px #2a7d54" : null,
    "&:hover": {
      borderColor: "#2a7d54",
    },
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#3ba272"
      : state.isFocused
      ? "#e6f3ed"
      : "white",
    color: state.isSelected ? "white" : "#333",
    "&:active": {
      backgroundColor: "#3ba272",
    },
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "#333",
  }),
  menu: (provided) => ({
    ...provided,
    borderColor: "#3ba272",
  }),
};

const GroupSelector = ({ groups, selectedGroup, onGroupChange }) => {
  const options = [
    { value: "all", label: "全部設備" },
    ...groups.map((group) => ({ value: group.name, label: group.name })),
  ];

  const selectedOption = options.find(
    (option) => option.value === selectedGroup
  );

  return (
    <SelectWrapper>
      <Select
        value={selectedOption}
        onChange={(option) => onGroupChange(option.value)}
        options={options}
        styles={customStyles}
        isSearchable={false}
        placeholder="選擇設備組"
      />
    </SelectWrapper>
  );
};

export default HomePage;
