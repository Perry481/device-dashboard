import React, { useState, useEffect, useContext } from "react";
import styled from "styled-components";
import Select from "react-select";
import CustomValueContainer from "./CustomValueContainer";
import { CompanyContext } from "../contexts/CompanyContext";
import { useTranslation } from "../hooks/useTranslation";
const Card = styled.div`
  border: 1px solid #484848;
  border-radius: 8px;
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
  control: (provided, state) => ({
    ...provided,
    maxHeight: "100px",
    borderColor: state.isFocused ? "#3ba272" : "#e2e8f0",
    boxShadow: state.isFocused ? "0 0 0 1px #3ba272" : null,
    "&:hover": {
      borderColor: "#3ba272",
    },
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
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#3ba272"
      : state.isFocused
      ? "rgba(59, 162, 114, 0.1)"
      : "white",
    color: state.isSelected ? "white" : "#484848",
    "&:active": {
      backgroundColor: "#3ba272",
    },
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 2,
  }),
  indicatorSeparator: () => ({
    display: "none",
  }),
  dropdownIndicator: (provided, state) => ({
    ...provided,
    color: state.isFocused ? "#3ba272" : "#718096",
    "&:hover": {
      color: "#3ba272",
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
  const { t } = useTranslation();
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
          `https://iot.jtmes.net/${companyName}/api/equipment/powermeter_list`
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
        {showPricingStandard
          ? t("selectionAndSend.meterSelection.titleWithPricing")
          : t("selectionAndSend.meterSelection.title")}
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
            placeholder={t("selectionAndSend.meterSelection.selectMeters")}
          />
        </SelectWrapper>
        {showPricingStandard && (
          <SelectWrapper $showPricingStandard={showPricingStandard}>
            <Select
              options={standardOptions}
              value={selectedStandard}
              onChange={handleStandardChange}
              styles={customStyles}
              placeholder={t("selectionAndSend.meterSelection.selectPricing")}
              showPricingStandard={showPricingStandard}
            />
          </SelectWrapper>
        )}
        <SendButton
          $showPricingStandard={showPricingStandard}
          onClick={handleSend}
        >
          {t("selectionAndSend.meterSelection.send")}
        </SendButton>
      </Container>
    </Card>
  );
};

export default SelectionAndSend;
