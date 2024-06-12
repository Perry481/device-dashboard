// components/PriceTable.js
import React, { useEffect, useState } from "react";
import styled from "styled-components";

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
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
`;

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  margin: 20px 0;
`;

const Title = styled.h2`
  margin: 0;
  display: flex;
  align-items: center;
`;

const PriceTable = ({ onPricesUpdate }) => {
  const [isClient, setIsClient] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [offPeakPrices, setOffPeakPrices] = useState({
    夏月: "NT$1.66",
    非夏月: "NT$1.58",
  });
  const [peakPrices, setPeakPrices] = useState({
    夏月: "NT$4.02",
    非夏月: "NT$3.92",
  });
  const [halfPeakPrices, setHalfPeakPrices] = useState({
    夏月: "NT$2.14",
    非夏月: "NT$2.06",
  });

  useEffect(() => {
    setIsClient(true);
    const fetchPrices = async () => {
      try {
        const response = await fetch("/api/prices");
        if (!response.ok) {
          throw new Error("Failed to fetch prices");
        }
        const savedPrices = await response.json();
        setOffPeakPrices(savedPrices.offPeakPrices);
        setPeakPrices(savedPrices.peakPrices);
        setHalfPeakPrices(savedPrices.halfPeakPrices);
      } catch (error) {
        console.error("Error fetching prices:", error);
      }
    };
    fetchPrices();
  }, []);

  const handlePriceChange = (type, period, value) => {
    const updatePrices = (setter) =>
      setter((prevPrices) => ({
        ...prevPrices,
        [period]: value,
      }));

    if (type === "off-peak") {
      updatePrices(setOffPeakPrices);
    } else if (type === "peak") {
      updatePrices(setPeakPrices);
    } else if (type === "half-peak") {
      updatePrices(setHalfPeakPrices);
    }
  };

  const handleEditMode = async () => {
    if (editMode) {
      const updatedPrices = {
        offPeakPrices,
        peakPrices,
        halfPeakPrices,
      };
      try {
        const response = await fetch("/api/prices", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedPrices),
        });
        if (!response.ok) {
          throw new Error("Failed to save prices");
        }
        console.log("Prices saved successfully");
        // Trigger a refresh of the parent component
        onPricesUpdate(updatedPrices);
      } catch (error) {
        console.error("Error saving prices:", error);
      }
    }
    setEditMode(!editMode);
  };

  const data = [
    {
      period: "06/01 - 09/30 夏月", // Summer
      times: [
        {
          time: "09:00 - 24:00 尖峰",
          fullWeekDays: ["日", "一", "二", "三", "四", "五", "六"],
          days: ["一", "二", "三", "四", "五"],
          type: "peak",
        },
        {
          time: "00:00 - 09:00 離峰",
          fullWeekDays: ["日", "一", "二", "三", "四", "五", "六"],
          days: ["一", "二", "三", "四", "五"],
          type: "off-peak",
        },
        {
          time: "06:00 - 11:00, 14:00 - 24:00 半尖峰",
          fullWeekDays: ["日", "一", "二", "三", "四", "五", "六"],
          days: ["六"],
          type: "half-peak",
        },
        {
          time: "00:00 - 06:00, 11:00 - 14:00 離峰",
          fullWeekDays: ["日", "一", "二", "三", "四", "五", "六"],
          days: ["六"],
          type: "off-peak",
        },
        {
          time: "全日 離峰",
          fullWeekDays: ["日", "一", "二", "三", "四", "五", "六"],
          days: ["日"],
          type: "off-peak",
        },
      ],
    },
    {
      period: "10/01 - 05/31 非夏月", // Non-Summer
      times: [
        {
          time: "06:00 - 11:00, 14:00 - 24:00 尖峰",
          fullWeekDays: ["日", "一", "二", "三", "四", "五", "六"],
          days: ["一", "二", "三", "四", "五"],
          type: "peak",
        },
        {
          time: "00:00 - 06:00, 11:00 - 14:00 離峰",
          fullWeekDays: ["日", "一", "二", "三", "四", "五", "六"],
          days: ["一", "二", "三", "四", "五"],
          type: "off-peak",
        },
        {
          time: "06:00 - 11:00, 14:00 - 24:00 半尖峰",
          fullWeekDays: ["日", "一", "二", "三", "四", "五", "六"],
          days: ["六"],
          type: "half-peak",
        },
        {
          time: "00:00 - 06:00, 11:00 - 14:00 離峰",
          fullWeekDays: ["日", "一", "二", "三", "四", "五", "六"],
          days: ["六"],
          type: "off-peak",
        },
        {
          time: "全日 離峰",
          fullWeekDays: ["日", "一", "二", "三", "四", "五", "六"],
          days: ["日"],
          type: "off-peak",
        },
      ],
    },
  ];

  const colors = {
    peak: "#ee6666",
    "half-peak": "#fac858",
    "off-peak": "#91CC75",
  };

  return isClient ? (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Title>電價一覽表</Title>
        <ButtonWrapper>
          <Button onClick={handleEditMode}>
            {editMode ? "保存電價" : "更改電價"}
          </Button>
        </ButtonWrapper>
      </div>
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
                  time.type === "off-peak"
                    ? offPeakPrices[periodType]
                    : time.type === "peak"
                    ? peakPrices[periodType]
                    : halfPeakPrices[periodType];
                return (
                  <TableRow key={key}>
                    {timeIndex === 0 && (
                      <TableCell rowSpan={period.times.length}>
                        {`${period.period}`}
                      </TableCell>
                    )}
                    <TableCell>{time.time}</TableCell>
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
    </>
  ) : null;
};

export default PriceTable;
