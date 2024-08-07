import React, { useEffect, useState } from "react";
import styled from "styled-components";

const TableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
`;

const Table = styled.table`
  width: 100%;
  min-width: 600px; // Ensures table doesn't shrink below this width
  border-collapse: collapse;
  margin: 20px 0;
  font-size: 14px;
`;

const TableHead = styled.thead`
  background-color: #f2f2f2;
`;

const TableHeader = styled.th`
  padding: 12px;
  border: 1px solid #ddd;
  text-align: center;
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  &:nth-child(even) {
    background-color: #f9f9f9;
  }
`;

const TableCell = styled.td`
  padding: 12px;
  border: 1px solid #ddd;
  text-align: center;
`;

const HighlightedCell = styled(TableCell)`
  background-color: ${(props) => props.color || "transparent"};
  color: ${(props) => (props.color ? "#000" : "#000")};
`;

const Button = styled.button`
  padding: 10px 20px;
  background-color: #484848;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
`;

const ButtonWrapper = styled.div`
  margin-top: 20px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 24px;
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const TimeSelect = styled.select`
  padding: 8px;
  font-size: 14px;
`;

const PriceTable = ({ onPricesUpdate, triggerHandleSend }) => {
  const [isClient, setIsClient] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [offPeakPrices, setOffPeakPrices] = useState({});
  const [peakPrices, setPeakPrices] = useState({});
  const [halfPeakPrices, setHalfPeakPrices] = useState({});
  const [timeRanges, setTimeRanges] = useState({});
  const [tempTimeRanges, setTempTimeRanges] = useState({});

  useEffect(() => {
    setIsClient(true);
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings");
        if (!response.ok) {
          throw new Error("Failed to fetch settings");
        }
        const savedSettings = await response.json();

        // Check if the new prices structure exists
        if (savedSettings.prices) {
          setOffPeakPrices(savedSettings.prices.offPeakPrices);
          setPeakPrices(savedSettings.prices.peakPrices);
          setHalfPeakPrices(savedSettings.prices.halfPeakPrices);
        } else {
          // Fallback to old structure if new one is not present
          setOffPeakPrices(savedSettings.offPeakPrices);
          setPeakPrices(savedSettings.peakPrices);
          setHalfPeakPrices(savedSettings.halfPeakPrices);
        }

        setTimeRanges(savedSettings.timeRanges);
        setTempTimeRanges(savedSettings.timeRanges); // Initialize tempTimeRanges correctly
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    fetchSettings();
  }, []);

  const handlePriceChange = (type, period, value) => {
    const updatePrices = (setter) =>
      setter((prevPrices) => ({
        ...prevPrices,
        [period]: value,
      }));

    if (type === "offpeak") {
      updatePrices(setOffPeakPrices);
    } else if (type === "peak") {
      updatePrices(setPeakPrices);
    } else if (type === "halfpeak") {
      updatePrices(setHalfPeakPrices);
    }
  };

  const handleTimeRangeChange = (season, dayType, type, index, part, value) => {
    const updatedRanges = JSON.parse(JSON.stringify(tempTimeRanges));
    if (!updatedRanges[season]) {
      updatedRanges[season] = {};
    }
    if (!updatedRanges[season][dayType]) {
      updatedRanges[season][dayType] = {};
    }
    if (!updatedRanges[season][dayType][type]) {
      updatedRanges[season][dayType][type] = [];
    }
    updatedRanges[season][dayType][type][index] = [
      part === 0
        ? Number(value)
        : updatedRanges[season][dayType][type][index][0],
      part === 1
        ? Number(value)
        : updatedRanges[season][dayType][type][index][1],
    ];

    setTempTimeRanges(updatedRanges);
  };
  const handleEditMode = async () => {
    if (editMode) {
      try {
        const updates = {
          prices: {
            offPeakPrices,
            peakPrices,
            halfPeakPrices,
          },
          timeRanges: tempTimeRanges,
        };

        const saveResponse = await fetch("/api/settings", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updates),
        });

        if (!saveResponse.ok) {
          throw new Error("Failed to save settings");
        }
        console.log("Settings saved successfully");

        setTimeRanges(tempTimeRanges);
        triggerHandleSend();
      } catch (error) {
        console.error("Error saving settings:", error);
      }
    } else {
      setTempTimeRanges(timeRanges);
    }
    setEditMode(!editMode);
  };
  const renderTimeRange = (range, periodType, dayType, type, index) => (
    <div key={`${periodType}-${dayType}-${type}-${index}`}>
      <TimeSelect
        value={range[0]}
        onChange={(e) =>
          handleTimeRangeChange(
            periodType,
            dayType,
            type,
            index,
            0,
            e.target.value
          )
        }
      >
        {Array.from({ length: 25 }, (_, i) => (
          <option key={i} value={i}>
            {i}:00
          </option>
        ))}
      </TimeSelect>
      {" - "}
      <TimeSelect
        value={range[1]}
        onChange={(e) =>
          handleTimeRangeChange(
            periodType,
            dayType,
            type,
            index,
            1,
            e.target.value
          )
        }
      >
        {Array.from({ length: 25 }, (_, i) => (
          <option key={i} value={i}>
            {i}:00
          </option>
        ))}
      </TimeSelect>{" "}
      {type === "peak" ? "尖峰" : type === "halfpeak" ? "半尖峰" : "離峰"}
    </div>
  );

  const data = [
    {
      period: "06/01 - 09/30 夏月",
      times: [
        {
          time: tempTimeRanges["夏月"]?.weekdays?.peak || [[16, 22]],
          fullWeekDays: ["日", "一", "二", "三", "四", "五", "六"],
          days: ["一", "二", "三", "四", "五"],
          type: "peak",
        },
        {
          time: tempTimeRanges["夏月"]?.weekdays?.halfpeak || [
            [9, 16],
            [22, 24],
          ],
          fullWeekDays: ["日", "一", "二", "三", "四", "五", "六"],
          days: ["一", "二", "三", "四", "五"],
          type: "halfpeak",
        },
        {
          time: tempTimeRanges["夏月"]?.weekdays?.offpeak || [[0, 9]],
          fullWeekDays: ["日", "一", "二", "三", "四", "五", "六"],
          days: ["一", "二", "三", "四", "五"],
          type: "offpeak",
        },
        {
          time: tempTimeRanges["夏月"]?.saturday?.offpeak || [[0, 24]],
          fullWeekDays: ["日", "一", "二", "三", "四", "五", "六"],
          days: ["六"],
          type: "offpeak",
        },
        {
          time: tempTimeRanges["夏月"]?.sunday?.offpeak || [[0, 24]],
          fullWeekDays: ["日", "一", "二", "三", "四", "五", "六"],
          days: ["日"],
          type: "offpeak",
        },
      ],
    },
    {
      period: "10/01 - 05/31 非夏月",
      times: [
        {
          time: tempTimeRanges["非夏月"]?.weekdays?.halfpeak || [
            [6, 11],
            [14, 24],
          ],
          fullWeekDays: ["日", "一", "二", "三", "四", "五", "六"],
          days: ["一", "二", "三", "四", "五"],
          type: "halfpeak",
        },
        {
          time: tempTimeRanges["非夏月"]?.weekdays?.offpeak || [
            [0, 6],
            [11, 14],
          ],
          fullWeekDays: ["日", "一", "二", "三", "四", "五", "六"],
          days: ["一", "二", "三", "四", "五"],
          type: "offpeak",
        },
        {
          time: tempTimeRanges["非夏月"]?.saturday?.halfpeak || [
            [6, 11],
            [14, 24],
          ],
          fullWeekDays: ["日", "一", "二", "三", "四", "五", "六"],
          days: ["六"],
          type: "halfpeak",
        },
        {
          time: tempTimeRanges["非夏月"]?.saturday?.offpeak || [
            [0, 6],
            [11, 14],
          ],
          fullWeekDays: ["日", "一", "二", "三", "四", "五", "六"],
          days: ["六"],
          type: "offpeak",
        },
        {
          time: tempTimeRanges["非夏月"]?.sunday?.offpeak || [[0, 24]],
          fullWeekDays: ["日", "一", "二", "三", "四", "五", "六"],
          days: ["日"],
          type: "offpeak",
        },
      ],
    },
  ];
  const colors = {
    peak: "#ee6666",
    halfpeak: "#fac858",
    offpeak: "#91CC75",
  };

  return isClient ? (
    <>
      <HeaderContainer>
        <Title>電價一覽表</Title>
        <ButtonWrapper>
          <Button onClick={handleEditMode}>
            {editMode ? "保存電價" : "更改電價"}
          </Button>
        </ButtonWrapper>
      </HeaderContainer>
      <TableWrapper>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>項目名稱</TableHeader>
              <TableHeader>時段</TableHeader>
              {["日", "一", "二", "三", "四", "五", "六"].map((day) => (
                <TableHeader key={day}>{day}</TableHeader>
              ))}
              <TableHeader>電價NT$/kWh</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((period, periodIndex) => (
              <React.Fragment key={period.period}>
                {period.times.map((time, timeIndex) => {
                  const key = `${period.period}-${time.time}-${timeIndex}`;
                  const periodType = period.period.includes("夏月")
                    ? "夏月"
                    : "非夏月";
                  const price =
                    time.type === "offpeak"
                      ? offPeakPrices[periodType]
                      : time.type === "peak"
                      ? peakPrices[periodType]
                      : halfPeakPrices[periodType];
                  const dayType =
                    time.days[0] === "六"
                      ? "saturday"
                      : time.days[0] === "日"
                      ? "sunday"
                      : "weekdays";
                  return (
                    <TableRow key={key}>
                      {timeIndex === 0 && (
                        <TableCell rowSpan={period.times.length}>
                          {`${period.period}`}
                        </TableCell>
                      )}
                      <TableCell>
                        {editMode
                          ? Array.isArray(time.time)
                            ? time.time.map((range, index) => (
                                <div key={index}>
                                  {renderTimeRange(
                                    range,
                                    periodType,
                                    dayType,
                                    time.type,
                                    index
                                  )}{" "}
                                </div>
                              ))
                            : `${time.time} ${
                                time.type === "peak"
                                  ? "尖峰"
                                  : time.type === "halfpeak"
                                  ? "半尖峰"
                                  : "離峰"
                              }`
                          : `${
                              Array.isArray(time.time)
                                ? time.time
                                    .map((r) => {
                                      return `${r[0]}:00 - ${r[1]}:00`;
                                    })
                                    .join(", ")
                                : time.time
                            } ${
                              time.type === "peak"
                                ? "尖峰"
                                : time.type === "halfpeak"
                                ? "半尖峰"
                                : "離峰"
                            }`}
                      </TableCell>
                      {time.fullWeekDays.map((day) => (
                        <HighlightedCell
                          key={`${key}-${day}`}
                          color={
                            time.days.includes(day)
                              ? colors[time.type]
                              : "transparent"
                          }
                        >
                          {day}
                        </HighlightedCell>
                      ))}
                      <TableCell>
                        {editMode ? (
                          <input
                            type="text"
                            value={price}
                            onChange={(e) =>
                              handlePriceChange(
                                time.type,
                                periodType,
                                e.target.value
                              )
                            }
                          />
                        ) : (
                          price
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableWrapper>
    </>
  ) : null;
};

export default PriceTable;
