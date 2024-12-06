import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import styled from "styled-components";
import { useTranslation } from "../hooks/useTranslation";
const Card = styled.div`
  border: 1px solid #484848;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  width: 100%;
  height: 250px; /* Fixed height */
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const CardHeader = styled.div`
  position: relative;
  padding-bottom: 10px;
  margin-bottom: 10px;
  font-weight: bold;
  color: #2d3748;
  text-align: center;

  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 3px;
    background-color: #3ba272;
    border-radius: 2px;
  }
`;
const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const DatePickersContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  width: 100%;
`;

const DatePickerWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const StyledDatePicker = styled(DatePicker)`
  width: 150px;
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  text-align: center;
  cursor: pointer;
  font-size: 0.95rem;

  &:focus {
    outline: none;
    border-color: #3ba272;
  }
`;

const Label = styled.label`
  margin-bottom: 5px;
  font-weight: bold;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 10px;
`;

const CustomButton = styled.button`
  padding: 10px 20px;
  background-color: ${({ $active, $toggled }) =>
    $toggled ? "#a0a0a0" : $active ? "#484848" : "#F4F6F9"};
  color: ${({ $active, $toggled }) =>
    $toggled || $active ? "#F4F6F9" : "#484848"};
  border: 1px solid #484848;
  border-radius: 4px;
  cursor: pointer;
`;

const datePickerStyles = `
  .react-datepicker {
    font-family: inherit;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .react-datepicker__header {
    background-color: #fff;
    border-bottom: 1px solid #e2e8f0;
    border-top-right-radius: 8px;
    border-top-left-radius: 8px;
    padding: 8px 0;
  }

  .react-datepicker__current-month {
    font-weight: 600;
    color: #2d3748;
  }

  .react-datepicker__day-name {
    color: #718096;
  }

  .react-datepicker__day {
    color: #2d3748;
    border-radius: 4px;
    transition: all 0.2s;

    &:hover {
      background-color: rgba(59, 162, 114, 0.1);
    }
  }

  .react-datepicker__day--selected,
  .react-datepicker__day--keyboard-selected {
    background-color: #3ba272 !important;
    color: white !important;
    font-weight: 600;

    &:hover {
      background-color: #2d8659 !important;
    }
  }

  .react-datepicker__day--in-range {
    background-color: rgba(59, 162, 114, 0.1);
  }

  .react-datepicker__day--in-selecting-range {
    background-color: rgba(59, 162, 114, 0.2);
  }

  .react-datepicker__navigation {
    top: 8px;

    &:hover {
      .react-datepicker__navigation-icon::before {
        border-color: #3ba272;
      }
    }
  }

  .react-datepicker__navigation-icon::before {
    border-color: #718096;
    transition: border-color 0.2s;
  }

  .react-datepicker__day--disabled {
    color: #cbd5e0;
  }

  .react-datepicker__triangle {
    display: none;
  }
`;

const GlobalStyle = styled.div`
  ${datePickerStyles}
`;

const DateRangePicker = ({ onDateChange, useShortDateRange = false }) => {
  const { t } = useTranslation();
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const [startDate, setStartDate] = useState(
    useShortDateRange ? today : firstDayOfMonth
  );
  const [endDate, setEndDate] = useState(
    useShortDateRange ? today : lastDayOfMonth
  );
  const [useCustomEndDate, setUseCustomEndDate] = useState(false);
  const [selectedRange, setSelectedRange] = useState(
    useShortDateRange ? "day" : "month"
  );

  useEffect(() => {
    onDateChange({ startDate, endDate });
  }, []);

  const calculateEndDate = (start, range) => {
    const newEndDate = new Date(start);
    switch (range) {
      case "day":
        return newEndDate;
      case "week":
        newEndDate.setDate(start.getDate() + 6);
        return newEndDate;
      case "month":
        newEndDate.setMonth(start.getMonth() + 1);
        newEndDate.setDate(0);
        return newEndDate;
      case "year":
        newEndDate.setFullYear(start.getFullYear(), 11, 31);
        return newEndDate;
      default:
        return newEndDate;
    }
  };

  const handlePredefinedRange = (range) => {
    if (selectedRange === range && !useCustomEndDate) {
      // Toggle off the selected range
      setUseCustomEndDate(true);
      setSelectedRange(null);
      onDateChange({ startDate, endDate });
    } else {
      let newStartDate, newEndDate;
      const today = new Date();

      switch (range) {
        case "day":
          newStartDate = new Date(today);
          newEndDate = new Date(today);
          break;
        case "week":
          newStartDate = new Date(today);
          newStartDate.setDate(today.getDate() - 6);
          newEndDate = new Date(today);
          break;
        case "month":
          newStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
          newEndDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          break;
        case "year":
          newStartDate = new Date(today.getFullYear(), 0, 1);
          newEndDate = new Date(today.getFullYear(), 11, 31);
          break;
        default:
          return;
      }

      setStartDate(newStartDate);
      setEndDate(newEndDate);
      setUseCustomEndDate(false);
      setSelectedRange(range);
      onDateChange({ startDate: newStartDate, endDate: newEndDate });
    }
  };

  const handleStartDateChange = (date) => {
    setStartDate(date);
    if (selectedRange && !useCustomEndDate) {
      const newEndDate = calculateEndDate(date, selectedRange);
      setEndDate(newEndDate);
      onDateChange({ startDate: date, endDate: newEndDate });
    } else {
      onDateChange({ startDate: date, endDate });
    }
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
    onDateChange({ startDate, endDate: date });
  };

  useEffect(() => {
    if (useShortDateRange) {
      handlePredefinedRange("day");
    } else {
      handlePredefinedRange("month");
    }
  }, [useShortDateRange]);

  const renderButtons = () => {
    const buttons = useShortDateRange
      ? ["day", "week", "month"]
      : ["week", "month", "year"];

    return buttons.map((range) => (
      <CustomButton
        key={range}
        $active={selectedRange === range}
        $toggled={selectedRange === range && useCustomEndDate}
        onClick={() => handlePredefinedRange(range)}
      >
        {t(`datePicker.ranges.${range}`)}
      </CustomButton>
    ));
  };
  return (
    <GlobalStyle>
      <Card>
        <CardHeader>{t("datePicker.title")}</CardHeader>
        <CardBody>
          <DatePickersContainer>
            <DatePickerWrapper>
              <Label>{t("datePicker.startDate")}</Label>
              <StyledDatePicker
                selected={startDate}
                onChange={handleStartDateChange}
                dateFormat="MM/dd/yyyy"
              />
            </DatePickerWrapper>
            <DatePickerWrapper>
              <Label>{t("datePicker.endDate")}</Label>
              <StyledDatePicker
                selected={endDate}
                onChange={handleEndDateChange}
                disabled={!useCustomEndDate}
                placeholderText={t("datePicker.endDate")}
                dateFormat="MM/dd/yyyy"
                minDate={startDate}
              />
            </DatePickerWrapper>
          </DatePickersContainer>
          <ButtonGroup>{renderButtons()}</ButtonGroup>
        </CardBody>
      </Card>
    </GlobalStyle>
  );
};

export default DateRangePicker;
