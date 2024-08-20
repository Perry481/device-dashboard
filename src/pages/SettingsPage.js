import React, { useState, useEffect } from "react";
import styled from "styled-components";
import Select from "react-select";
import PriceTable from "../components/PriceTable";

const SettingsContainer = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  box-sizing: border-box;
`;

const SettingsForm = styled.form`
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const FormTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 20px;
  color: #333;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #555;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
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

const customSelectStyles = {
  control: (provided) => ({
    ...provided,
    border: "1px solid #ddd",
    borderRadius: "4px",
    minHeight: "38px",
    boxShadow: "none",
    "&:hover": {
      border: "1px solid #007bff",
    },
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? "#007bff" : "white",
    color: state.isSelected ? "white" : "#333",
    "&:hover": {
      backgroundColor: state.isSelected ? "#007bff" : "#f0f0f0",
    },
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "#333",
  }),
};

const SettingsPage = () => {
  const [settings, setSettings] = useState(null);
  const [co2, setCO2] = useState(0);
  const [contractCapacity, setContractCapacity] = useState(0);
  const [selectedStandard, setSelectedStandard] = useState(null);
  const [standardOptions, setStandardOptions] = useState([]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      if (!response.ok) throw new Error("設定取得失敗");
      const data = await response.json();
      setSettings(data);
      setCO2(data.CO2);
      setContractCapacity(data.contractCapacity);

      const options = Object.keys(data.pricingStandards).map((key) => ({
        value: key,
        label: data.pricingStandards[key].name,
      }));
      setStandardOptions(options);

      const activeStandard = options.find(
        (option) => option.value === data.activePricingStandard
      );
      setSelectedStandard(activeStandard);
    } catch (error) {
      console.error("設定取得錯誤:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updates = {
        CO2: parseFloat(co2),
        contractCapacity: parseFloat(contractCapacity),
        activePricingStandard: selectedStandard.value,
      };

      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error("設定更新失敗");

      alert("設定更新成功");
      fetchSettings();
    } catch (error) {
      console.error("設定更新錯誤:", error);
      alert("設定更新失敗");
    }
  };

  const handlePriceTableUpdate = () => {
    fetchSettings();
  };

  if (!settings) return <div>載入中...</div>;

  return (
    <SettingsContainer>
      <SettingsForm onSubmit={handleSubmit}>
        <FormTitle>基本設定</FormTitle>
        <FormGroup>
          <Label htmlFor="co2">CO2 排放係數：</Label>
          <Input
            id="co2"
            type="number"
            step="0.001"
            value={co2}
            onChange={(e) => setCO2(e.target.value)}
          />
        </FormGroup>
        <FormGroup>
          <Label htmlFor="contractCapacity">契約容量 (kW)：</Label>
          <Input
            id="contractCapacity"
            type="number"
            step="0.1"
            value={contractCapacity}
            onChange={(e) => setContractCapacity(e.target.value)}
          />
        </FormGroup>
        <FormGroup>
          <Label htmlFor="activePricingStandard">全局預設電價標準：</Label>
          <Select
            id="activePricingStandard"
            options={standardOptions}
            value={selectedStandard}
            onChange={setSelectedStandard}
            styles={customSelectStyles}
          />
        </FormGroup>
        <Button type="submit">儲存設定</Button>
      </SettingsForm>

      <PriceTable
        onPricesUpdate={handlePriceTableUpdate}
        triggerHandleSend={handlePriceTableUpdate}
      />
    </SettingsContainer>
  );
};

export default SettingsPage;
