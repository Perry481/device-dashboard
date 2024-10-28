import React, { useState, useEffect, useContext } from "react";
import styled from "styled-components";
import Select from "react-select";
import CustomValueContainer from "./CustomValueContainer";
import { CompanyContext } from "../contexts/CompanyContext";

const Card = styled.div`
  border: 1px solid #484848;
  border-radius: 4px;
  padding: 20px;
  margin: 20px 0;
  width: 100%;
  height: 250px;
  display: flex;
  flex-direction: column;
  justify-content: ${(props) =>
    props.$showPricingStandard ? "space-between" : "center"};
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
  height: ${(props) => (props.$showPricingStandard ? "100%" : "auto")};
  justify-content: ${(props) =>
    props.$showPricingStandard ? "space-between" : "center"};
`;

const SelectWrapper = styled.div`
  width: 100%;
  margin-bottom: ${(props) => (props.$showPricingStandard ? "0" : "10px")};
  height: ${(props) => (props.$showPricingStandard ? "auto" : "100%")};
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const SendButton = styled.button`
  padding: 10px 20px;
  background-color: #484848;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: ${(props) => (props.$showPricingStandard ? "10px" : "0")};

  &:hover {
    background-color: #3a3a3a;
  }
`;

const customStyles = {
  control: (provided) => ({
    ...provided,
    maxHeight: "100px",
  }),
  valueContainer: (provided, state) => ({
    ...provided,
    height: state.selectProps.showPricingStandard ? "auto" : "90px",
    maxHeight: state.selectProps.showPricingStandard ? "80px" : "90px",
    overflowY: "auto",
    display: "flex",
    flexWrap: "wrap",
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

const SelectionAndSend = ({
  onSend,
  singleSelection = false,
  showPricingStandard = false,
  pricingStandards = {},
  activePricingStandard = "",
  machineGroups = [],
}) => {
  const [options, setOptions] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState(
    singleSelection ? null : []
  );
  const [selectedStandard, setSelectedStandard] = useState(null);
  const [standardOptions, setStandardOptions] = useState([]);
  const { companyName } = useContext(CompanyContext);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `http://61.216.62.9:8081/${companyName}/api/powermeter_list`
        );
        const data = await response.json();
        const formattedOptions = data.map((item) => ({
          value: item.sn,
          label: item.name,
          isIndividualMachine: true,
        }));

        // Add group options
        const groupOptions = machineGroups.map((group) => ({
          value: group.name,
          label: group.name,
          isGroup: true,
          machines: group.machines,
        }));

        setOptions([...groupOptions, ...formattedOptions]);

        if (formattedOptions.length > 0) {
          setSelectedOptions(
            singleSelection ? formattedOptions[0] : [formattedOptions[0]]
          );
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [singleSelection, machineGroups]);

  useEffect(() => {
    if (showPricingStandard && Object.keys(pricingStandards).length > 0) {
      const newStandardOptions = Object.entries(pricingStandards).map(
        ([key, value]) => ({
          value: key,
          label: value.name,
        })
      );
      setStandardOptions(newStandardOptions);

      if (activePricingStandard) {
        setSelectedStandard({
          value: activePricingStandard,
          label: pricingStandards[activePricingStandard].name,
        });
      }
    }
  }, [showPricingStandard, pricingStandards, activePricingStandard]);

  const handleSelectChange = (selected) => {
    setSelectedOptions(selected);
  };

  const handleStandardChange = (selected) => {
    setSelectedStandard(selected);
  };

  const handleSend = () => {
    let selectedSn = singleSelection
      ? [selectedOptions.value]
      : selectedOptions.flatMap((option) =>
          option.isGroup
            ? option.machines.map((machine) => machine.id)
            : [option.value]
        );

    // Remove duplicates
    selectedSn = [...new Set(selectedSn)];

    console.log("Selected options:", selectedSn);
    if (showPricingStandard && selectedStandard) {
      console.log("Selected standard:", selectedStandard.value);
      onSend(selectedSn, selectedStandard.value);
    } else {
      onSend(selectedSn);
    }
  };

  return (
    <Card $showPricingStandard={showPricingStandard}>
      <CardHeader>
        {showPricingStandard ? "選擇電錶和電價標準" : "選擇電錶"}
      </CardHeader>
      <Container $showPricingStandard={showPricingStandard}>
        <SelectWrapper $showPricingStandard={showPricingStandard}>
          <Select
            isMulti={!singleSelection}
            closeMenuOnSelect={singleSelection}
            options={options}
            value={selectedOptions}
            onChange={handleSelectChange}
            styles={customStyles}
            components={
              singleSelection ? {} : { ValueContainer: CustomValueContainer }
            }
            showPricingStandard={showPricingStandard}
          />
        </SelectWrapper>
        {showPricingStandard && (
          <SelectWrapper $showPricingStandard={showPricingStandard}>
            <Select
              options={standardOptions}
              value={selectedStandard}
              onChange={handleStandardChange}
              styles={customStyles}
              placeholder="選擇電價標準..."
              showPricingStandard={showPricingStandard}
            />
          </SelectWrapper>
        )}
        <SendButton
          $showPricingStandard={showPricingStandard}
          onClick={handleSend}
        >
          Send
        </SendButton>
      </Container>
    </Card>
  );
};

export default SelectionAndSend;
