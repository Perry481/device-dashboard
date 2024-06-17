import React, { useState, useEffect } from "react";
import styled from "styled-components";
import Select from "react-select";
import CustomValueContainer from "./CustomValueContainer";

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

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const SelectWrapper = styled.div`
  width: 100%;
  margin-bottom: 10px;
`;

const SendButton = styled.button`
  padding: 10px 20px;
  background-color: #484848;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #3a3a3a;
  }
`;

const customStyles = {
  control: (provided) => ({
    ...provided,
    maxHeight: "100px",
  }),
  valueContainer: (provided) => ({
    ...provided,
    height: "90px",
    overflowY: "hidden",
    display: "flex",
    flexWrap: "nowrap",
    width: "100%",
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: "#F4F6F9",
    color: "#484848",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: "#484848",
    marginRight: "4px",
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: "#484848",
    marginLeft: "auto",
    ":hover": {
      backgroundColor: "#EE6666",
      color: "#F4F6F9",
    },
  }),
};

const SelectionAndSend = ({ onSend }) => {
  const [options, setOptions] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          "https://iot.jtmes.net/ebc/api/equipment/powermeter_list"
        );
        const data = await response.json();
        const formattedOptions = data.map((item) => ({
          value: item.sn,
          label: item.name,
        }));
        setOptions(formattedOptions);

        if (formattedOptions.length > 0) {
          setSelectedOptions([formattedOptions[0]]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const handleSelectChange = (selected) => {
    setSelectedOptions(selected);
  };

  const handleSend = () => {
    const selectedSn = selectedOptions.map((option) => option.value);
    console.log("Selected options:", selectedSn);
    onSend(selectedSn);
  };

  return (
    <Card>
      <CardHeader>Selection and Send</CardHeader>
      <Container>
        <SelectWrapper>
          <Select
            isMulti
            closeMenuOnSelect={false}
            options={options}
            value={selectedOptions}
            onChange={handleSelectChange}
            styles={customStyles}
            components={{ ValueContainer: CustomValueContainer }}
          />
        </SelectWrapper>
        <SendButton onClick={handleSend}>Send</SendButton>
      </Container>
    </Card>
  );
};

export default SelectionAndSend;
