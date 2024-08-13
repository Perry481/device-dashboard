import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import styled from "styled-components";

const Card = styled.div`
  border: 1px solid #484848;
  border-radius: 4px;
  padding: 20px;
  margin: 20px 0;
  width: 100%;
  height: 250px; /* Fixed height */
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const CardHeader = styled.div`
  font-weight: bold;
  margin-bottom: 10px;
  text-align: center;
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
  border: 1px solid #ccc;
  border-radius: 4px;
  text-align: center;
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
  background-color: ${({ $active }) => ($active ? "#484848" : "#F4F6F9")};
  color: ${({ $active }) => ($active ? "#F4F6F9" : "#484848")};
  border: 1px solid #484848;
  border-radius: 4px;
  cursor: pointer;
`;
const DateRangePicker = ({ onDateChange, useShorterRanges = false }) => {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const [startDate, setStartDate] = useState(
    useShorterRanges ? today : firstDayOfMonth
  );
  const [endDate, setEndDate] = useState(
    useShorterRanges ? today : lastDayOfMonth
  );
  const [useCustomEndDate, setUseCustomEndDate] = useState(false);
  const [selectedRange, setSelectedRange] = useState(
    useShorterRanges ? "day" : "month"
  );

  useEffect(() => {
    onDateChange({ startDate, endDate });
  }, [startDate, endDate, onDateChange]);

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
  };
  const handleStartDateChange = (date) => {
    setStartDate(date);
    if (selectedRange) {
      const newEndDate = calculateEndDate(date, selectedRange);
      setEndDate(newEndDate);
      onDateChange({ startDate: date, endDate: newEndDate });
    } else {
      onDateChange({ startDate: date, endDate });
    }
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
    setUseCustomEndDate(true);
    setSelectedRange(null);
    onDateChange({ startDate, endDate: date });
  };
  useEffect(() => {
    if (useShorterRanges) {
      handlePredefinedRange("day");
    } else {
      handlePredefinedRange("month");
    }
  }, [useShorterRanges]);
  const renderButtons = () => {
    if (useShorterRanges) {
      return (
        <>
          <CustomButton
            $active={selectedRange === "day"}
            onClick={() => handlePredefinedRange("day")}
          >
            Day
          </CustomButton>
          <CustomButton
            $active={selectedRange === "week"}
            onClick={() => handlePredefinedRange("week")}
          >
            Week
          </CustomButton>
          <CustomButton
            $active={selectedRange === "month"}
            onClick={() => handlePredefinedRange("month")}
          >
            Month
          </CustomButton>
        </>
      );
    } else {
      return (
        <>
          <CustomButton
            $active={selectedRange === "week"}
            onClick={() => handlePredefinedRange("week")}
          >
            Week
          </CustomButton>
          <CustomButton
            $active={selectedRange === "month"}
            onClick={() => handlePredefinedRange("month")}
          >
            Month
          </CustomButton>
          <CustomButton
            $active={selectedRange === "year"}
            onClick={() => handlePredefinedRange("year")}
          >
            Year
          </CustomButton>
        </>
      );
    }
  };

  return (
    <Card>
      <CardHeader>選擇日期範圍</CardHeader>
      <CardBody>
        <DatePickersContainer>
          <DatePickerWrapper>
            <Label>開始日期</Label>
            <StyledDatePicker
              selected={startDate}
              onChange={handleStartDateChange}
            />
          </DatePickerWrapper>
          <DatePickerWrapper>
            <Label>結束日期</Label>
            <StyledDatePicker
              selected={endDate}
              onChange={handleEndDateChange}
              disabled={!useCustomEndDate}
              placeholderText="Select End Date"
            />
          </DatePickerWrapper>
        </DatePickersContainer>
        <ButtonGroup>{renderButtons()}</ButtonGroup>
      </CardBody>
    </Card>
  );
};

export default DateRangePicker;
