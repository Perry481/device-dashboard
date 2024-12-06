import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "../hooks/useTranslation";

const TableBody = styled.tbody``;

const TableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
`;

const Table = styled.table`
  width: 100%;
  min-width: 600px;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.95rem;
`;

const TableHead = styled.thead`
  background-color: #f8fafc;
`;

const TableHeader = styled.th`
  padding: 16px;
  text-align: center;
  font-weight: 600;
  color: #1a202c;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const TableRow = styled.tr`
  &:hover td:not([rowspan]) {
    // Only apply hover effect to cells that aren't rowspan
    background-color: #f8fafc;
  }
`;

const TableCell = styled.td`
  padding: 16px;
  text-align: center;
  border-bottom: 1px solid #e2e8f0;
  border-right: 1px solid #e2e8f0; // Add right border for cell separation
  color: #4a5568;
  transition: background-color 0.2s;

  &:last-child {
    border-right: none; // Remove right border for last cell
  }

  // Special styling for period cells (with rowspan)
  ${(props) =>
    props.rowSpan &&
    `
    background-color: #f8fafc;
    font-weight: 500;
    color: #2d3748;
    border-right: 2px solid #e2e8f0;  // Stronger border for period separation
    &:hover {
      background-color: #f8fafc;  // Keep the same background on hover
    }
  `}
`;

const HighlightedCell = styled(TableCell)`
  background-color: ${(props) =>
    props.color === "#ee6666"
      ? "rgba(238, 102, 102, 0.1)"
      : props.color === "#fac858"
      ? "rgba(250, 200, 88, 0.1)"
      : props.color === "#91CC75"
      ? "rgba(145, 204, 117, 0.1)"
      : "transparent"};
  color: ${(props) =>
    props.color === "#ee6666"
      ? "#e53e3e"
      : props.color === "#fac858"
      ? "#d97706"
      : props.color === "#91CC75"
      ? "#3ba272"
      : "#4a5568"};
  font-weight: ${(props) => (props.color ? "500" : "normal")};
  border-right: 1px solid #e2e8f0; // Consistent with TableCell

  &:last-child {
    border-right: none;
  }
`;

const TimeRangeCell = styled(TableCell)`
  text-align: left;
  vertical-align: top;
  padding: 16px;
  min-width: 180px;
  border-right: 2px solid #e2e8f0; // Stronger border for better separation
`;

const PeakStateLabel = styled.div`
  font-size: 0.95rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 8px;
`;

const TimeRangeText = styled.div`
  font-size: 0.9rem;
  margin-bottom: 4px;
  color: #4a5568;
  line-height: 1.5;
`;

const Button = styled.button`
  padding: 8px 16px;
  background-color: #3ba272;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background-color: #2d8659;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(1px);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px white, 0 0 0 4px #3ba272;
  }
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  color: #2d3748;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &::before {
    content: "";
    display: inline-block;
    width: 4px;
    height: 1em;
    background-color: #3ba272;
    border-radius: 2px;
  }
`;

const SelectWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.95rem;
  color: #2d3748;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3ba272;
    box-shadow: 0 0 0 1px #3ba272;
  }

  &:disabled {
    background-color: #f8fafc;
    cursor: not-allowed;
  }
`;

const TimeSelect = styled(Select)`
  padding: 6px 10px;
  font-size: 0.9rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3ba272;
    box-shadow: 0 0 0 1px #3ba272;
  }
`;

const StandardDisplay = styled.div`
  font-size: 0.95rem;
  font-weight: 500;
  color: #2d3748;
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
