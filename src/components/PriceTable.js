import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "../hooks/useTranslation";
const TableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Table = styled.table`
  width: 100%;
  min-width: 600px;
  border-collapse: collapse;
  margin: 20px 0;
  font-size: 14px;
`;

const TableHead = styled.thead`
  background-color: #e9ecef;
`;

const TableHeader = styled.th`
  padding: 12px;
  border: 1px solid #dee2e6;
  text-align: center;
  font-weight: bold;
  color: #495057;
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  &:nth-child(even) {
    background-color: #f8f9fa;
  }
`;

const TableCell = styled.td`
  padding: 12px;
  border: 1px solid #dee2e6;
  text-align: center;
`;

const HighlightedCell = styled(TableCell)`
  background-color: ${(props) => props.color || "transparent"};
  color: ${(props) => (props.color ? "#000" : "#495057")};
`;

const TimeRangeCell = styled(TableCell)`
  text-align: left;
  vertical-align: top;
  padding: 8px;
`;

const PeakStateLabel = styled.div`
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 4px;
`;

const TimeRangeText = styled.div`
  font-size: 12px;
  margin-bottom: 2px;
`;

const Button = styled.button`
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #0056b3;
  }
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  color: #333;
`;

const SelectWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Select = styled.select`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
`;

const TimeSelect = styled.select`
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
`;

const Input = styled.input`
  width: 100%;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
`;

const StandardDisplay = styled.div`
  font-size: 16px;
  font-weight: bold;
  color: #333;
`;
const PriceTable = ({
  onPricesUpdate,
  triggerHandleSend,
  disableEdit = false,
  selectedPricingStandard,
  companyName,
}) => {
  console.log("PriceTable - selectedPricingStandard:", selectedPricingStandard);
  const [isClient, setIsClient] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [pricingStandards, setPricingStandards] = useState({});
  const [selectedStandard, setSelectedStandard] = useState("");
  const [tempTimeRanges, setTempTimeRanges] = useState({});
  const [activePricingStandard, setActivePricingStandard] = useState("");
  const { t, locale } = useTranslation();
  useEffect(() => {
    setIsClient(true);
    fetchSettings();
  }, [companyName, locale]);

  useEffect(() => {
    if (selectedPricingStandard) {
      setSelectedStandard(selectedPricingStandard);
    }
  }, [selectedPricingStandard]);

  useEffect(() => {
    if (selectedStandard && pricingStandards[selectedStandard]) {
      setTempTimeRanges(pricingStandards[selectedStandard].timeRanges);
    }
  }, [selectedStandard, pricingStandards]);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`/api/settings/${companyName}`);
      if (!response.ok) {
        throw new Error("Failed to fetch settings");
      }
      const savedSettings = await response.json();
      console.log("Fetched settings:", savedSettings);
      setPricingStandards(savedSettings.pricingStandards);
      setActivePricingStandard(savedSettings.activePricingStandard);

      if (!selectedStandard) {
        setSelectedStandard(savedSettings.activePricingStandard);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const handleEditMode = async () => {
    if (editMode) {
      try {
        const updatedPricingStandards = {
          ...pricingStandards,
          [selectedStandard]: {
            ...pricingStandards[selectedStandard],
            timeRanges: tempTimeRanges,
          },
        };

        const response = await fetch(`/api/settings/${companyName}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pricingStandards: updatedPricingStandards,
          }),
        });

        if (!response.ok) throw new Error("Failed to save settings");

        console.log("Settings saved successfully");
        await fetchSettings(); // Refetch settings but keep the selected standard
        triggerHandleSend();
      } catch (error) {
        console.error("Error saving settings:", error);
      }
    } else {
      setTempTimeRanges(pricingStandards[selectedStandard].timeRanges);
    }
    setEditMode(!editMode);
  };

  const handleStandardChange = (e) => {
    const newSelectedStandard = e.target.value;
    setSelectedStandard(newSelectedStandard);
  };

  const handlePriceChange = (type, period, value) => {
    setPricingStandards((prevStandards) => ({
      ...prevStandards,
      [selectedStandard]: {
        ...prevStandards[selectedStandard],
        prices: {
          ...prevStandards[selectedStandard].prices,
          [`${type}Prices`]: {
            ...prevStandards[selectedStandard].prices[`${type}Prices`],
            [period]: value,
          },
        },
      },
    }));
  };

  const handleTimeRangeChange = (season, dayType, type, index, part, value) => {
    setTempTimeRanges((prev) => {
      const updated = JSON.parse(JSON.stringify(prev));
      if (!updated[season]) updated[season] = {};
      if (!updated[season][dayType]) updated[season][dayType] = {};
      if (!updated[season][dayType][type]) updated[season][dayType][type] = [];
      if (!updated[season][dayType][type][index])
        updated[season][dayType][type][index] = [0, 0];
      updated[season][dayType][type][index][part] = Number(value);
      return updated;
    });
  };
  const renderHeader = () => {
    return (
      <HeaderContainer>
        <Title>{t("priceTable.title")}</Title>
        <SelectWrapper>
          <Select
            value={selectedStandard}
            onChange={handleStandardChange}
            disabled={disableEdit}
          >
            {Object.keys(pricingStandards).map((key) => (
              <option key={key} value={key}>
                {pricingStandards[key].name}
                {key === activePricingStandard ? " " : ""}
              </option>
            ))}
          </Select>
          {!disableEdit && (
            <Button onClick={handleEditMode}>
              {editMode
                ? t("priceTable.actions.save")
                : t("priceTable.actions.edit")}
            </Button>
          )}
        </SelectWrapper>
      </HeaderContainer>
    );
  };

  const renderTimeRange = (periodType, timeType) => {
    const weekdayRanges =
      tempTimeRanges[periodType]?.weekdays?.[timeType.toLowerCase()] || [];
    const saturdayRanges =
      tempTimeRanges[periodType]?.saturday?.[timeType.toLowerCase()] || [];
    const sundayRanges =
      tempTimeRanges[periodType]?.sunday?.[timeType.toLowerCase()] || [];

    const renderRanges = (ranges, dayType) => (
      <div>
        <strong>
          {dayType === "weekdays"
            ? t("priceTable.dayTypes.weekday")
            : dayType === "saturday"
            ? t("priceTable.dayTypes.saturday")
            : t("priceTable.dayTypes.sunday")}
          :
        </strong>
        {ranges.map((range, index) => (
          <div key={`${periodType}-${dayType}-${timeType}-${index}`}>
            <TimeSelect
              value={range[0]}
              onChange={(e) =>
                handleTimeRangeChange(
                  periodType,
                  dayType,
                  timeType.toLowerCase(),
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
                  timeType.toLowerCase(),
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
            </TimeSelect>
          </div>
        ))}
      </div>
    );

    return (
      <div>
        {renderRanges(weekdayRanges, "weekdays")}
        {renderRanges(saturdayRanges, "saturday")}
        {renderRanges(sundayRanges, "sunday")}
      </div>
    );
  };

  const renderTimeRanges = (periodType, timeType) => {
    const weekdayRanges =
      tempTimeRanges[periodType]?.weekdays?.[timeType.toLowerCase()] || [];
    const saturdayRanges =
      tempTimeRanges[periodType]?.saturday?.[timeType.toLowerCase()] || [];
    const sundayRanges =
      tempTimeRanges[periodType]?.sunday?.[timeType.toLowerCase()] || [];

    const formatTimeRange = (ranges) => {
      if (ranges.length === 0) return "";
      if (ranges.length === 1 && ranges[0][0] === 0 && ranges[0][1] === 24) {
        return "0:00-24:00";
      }
      return ranges.map((range) => `${range[0]}:00-${range[1]}:00`).join(", ");
    };

    const weekdayString = formatTimeRange(weekdayRanges);
    const saturdayString = formatTimeRange(saturdayRanges);
    const sundayString = formatTimeRange(sundayRanges);

    const labels = {
      peak: t("priceTable.peakStates.peak"),
      halfPeak: t("priceTable.peakStates.halfPeak"),
      offPeak: t("priceTable.peakStates.offPeak"),
    };
    return (
      <>
        <PeakStateLabel>{labels[timeType]}</PeakStateLabel>
        {weekdayString && (
          <TimeRangeText>
            {t("priceTable.dayTypes.weekday")}: {weekdayString}
          </TimeRangeText>
        )}
        {saturdayString && (
          <TimeRangeText>
            {t("priceTable.dayTypes.saturday")}: {saturdayString}
          </TimeRangeText>
        )}
        {sundayString && (
          <TimeRangeText>
            {t("priceTable.dayTypes.sunday")}: {sundayString}
          </TimeRangeText>
        )}
      </>
    );
  };

  const renderPriceTable = () => {
    if (!selectedStandard || !pricingStandards[selectedStandard]) {
      console.log("No selected standard or pricing standards");
      return null;
    }

    const standard = pricingStandards[selectedStandard];
    console.log("Selected standard:", standard);

    const data = [
      {
        period: t("priceTable.periods.summer"),
        type: "夏月",
        times: ["peak", "halfPeak", "offPeak"],
      },
      {
        period: t("priceTable.periods.nonSummer"),
        type: "非夏月",
        times: ["peak", "halfPeak", "offPeak"],
      },
    ];

    const colors = {
      peak: "#ee6666",
      halfPeak: "#fac858",
      offPeak: "#91CC75",
    };

    const isTimeActive = (periodType, timeType, dayType) => {
      const ranges =
        tempTimeRanges[periodType]?.[dayType]?.[timeType.toLowerCase()] || [];
      return ranges.length > 0;
    };

    return (
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>{t("priceTable.headers.itemName")}</TableHeader>
            <TableHeader>{t("priceTable.headers.timeRange")}</TableHeader>
            {[
              t("priceTable.days.sun"),
              t("priceTable.days.mon"),
              t("priceTable.days.tue"),
              t("priceTable.days.wed"),
              t("priceTable.days.thu"),
              t("priceTable.days.fri"),
              t("priceTable.days.sat"),
            ].map((day) => (
              <TableHeader key={day}>{day}</TableHeader>
            ))}
            <TableHeader>{t("priceTable.headers.price")}</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((period) => (
            <React.Fragment key={period.period}>
              {period.times.map((timeType, index) => {
                const price =
                  standard.prices?.[`${timeType}Prices`]?.[period.type] || "";

                return (
                  <TableRow key={`${period.period}-${timeType}`}>
                    {index === 0 && (
                      <TableCell rowSpan={period.times.length}>
                        {period.period}
                      </TableCell>
                    )}
                    <TimeRangeCell>
                      {editMode
                        ? renderTimeRange(period.type, timeType)
                        : renderTimeRanges(period.type, timeType)}
                    </TimeRangeCell>
                    {[
                      t("priceTable.days.sun"),
                      t("priceTable.days.mon"),
                      t("priceTable.days.tue"),
                      t("priceTable.days.wed"),
                      t("priceTable.days.thu"),
                      t("priceTable.days.fri"),
                      t("priceTable.days.sat"),
                    ].map((day, dayIndex) => (
                      <HighlightedCell
                        key={`${period.period}-${timeType}-${day}`}
                        color={
                          (dayIndex === 0 &&
                            isTimeActive(period.type, timeType, "sunday")) ||
                          (dayIndex === 6 &&
                            isTimeActive(period.type, timeType, "saturday")) ||
                          (dayIndex > 0 &&
                            dayIndex < 6 &&
                            isTimeActive(period.type, timeType, "weekdays"))
                            ? colors[timeType]
                            : "transparent"
                        }
                      >
                        {day}
                      </HighlightedCell>
                    ))}
                    <TableCell>
                      {editMode ? (
                        <Input
                          type="text"
                          value={price}
                          onChange={(e) =>
                            handlePriceChange(
                              timeType,
                              period.type,
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
    );
  };
  return isClient ? (
    <TableWrapper>
      {renderHeader()}
      {renderPriceTable()}
    </TableWrapper>
  ) : null;
};

export default PriceTable;
