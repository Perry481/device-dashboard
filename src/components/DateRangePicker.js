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

const DateRangePicker = ({ onDateChange }) => {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(lastDayOfMonth);
  const [useCustomEndDate, setUseCustomEndDate] = useState(false);
  const [selectedRange, setSelectedRange] = useState("month");

  useEffect(() => {
    onDateChange({ startDate, endDate });
  }, [startDate, endDate, onDateChange]);

  const handlePredefinedEndDate = (daysToAdd, range) => {
    if (selectedRange === range) {
      setSelectedRange(null);
      setUseCustomEndDate(true);
    } else {
      const newEndDate = new Date(startDate);
      newEndDate.setDate(newEndDate.getDate() + daysToAdd);
      setEndDate(newEndDate);
      setUseCustomEndDate(false);
      setSelectedRange(range);
      onDateChange({ startDate, endDate: newEndDate });
    }
  };

  const handleStartDateChange = (date) => {
    setStartDate(date);

    if (selectedRange) {
      let daysToAdd;
      if (selectedRange === "week") daysToAdd = 7;
      else if (selectedRange === "month") daysToAdd = 30;
      else if (selectedRange === "year") daysToAdd = 365;

      const newEndDate = new Date(date);
      newEndDate.setDate(newEndDate.getDate() + daysToAdd);
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
        <ButtonGroup>
          <CustomButton
            $active={selectedRange === "week"}
            onClick={() => handlePredefinedEndDate(7, "week")}
          >
            Week
          </CustomButton>
          <CustomButton
            $active={selectedRange === "month"}
            onClick={() => handlePredefinedEndDate(30, "month")}
          >
            Month
          </CustomButton>
          <CustomButton
            $active={selectedRange === "year"}
            onClick={() => handlePredefinedEndDate(365, "year")}
          >
            Year
          </CustomButton>
        </ButtonGroup>
      </CardBody>
    </Card>
  );
};

export default DateRangePicker;
