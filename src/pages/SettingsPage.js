import React, { useState, useEffect } from "react";
import styled from "styled-components";
import PriceTable from "../components/PriceTable";

const SettingsContainer = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 10px;
  box-sizing: border-box;

  @media (min-width: 576px) {
    padding: 20px;
  }
`;

const RowContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;

  @media (min-width: 576px) {
    flex-direction: row;
    justify-content: space-between;
  }
`;

const HalfWidthContainer = styled.div`
  width: 100%;
  margin-bottom: 20px;

  @media (min-width: 576px) {
    width: 48%;
  }
`;

const SectionTitle = styled.h2`
  margin-bottom: 15px;
  font-size: 1.2rem;
  text-align: center;

  @media (min-width: 576px) {
    font-size: 1.5rem;
    text-align: left;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  font-weight: bold;
  display: block;
  margin-bottom: 5px;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
  box-sizing: border-box;
`;

const Button = styled.button`
  width: 100%;
  padding: 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;

  &:hover {
    background-color: #0056b3;
  }
`;

const PriceTableSection = styled.div`
  margin-top: 20px;
`;

const SettingsPage = () => {
  const [settings, setSettings] = useState(null);
  const [co2, setCO2] = useState(0);
  const [contractCapacity, setContractCapacity] = useState(0);

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
    } catch (error) {
      console.error("設定取得錯誤:", error);
    }
  };

  const handleSave = async (type) => {
    try {
      const dataToUpdate = type === "CO2" ? { CO2: co2 } : { contractCapacity };
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToUpdate),
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
      <RowContainer>
        <HalfWidthContainer>
          <SectionTitle>CO2 排放係數設定</SectionTitle>
          <FormGroup>
            <Label>CO2 排放係數：</Label>
            <Input
              type="number"
              step="0.001"
              value={co2}
              onChange={(e) => setCO2(parseFloat(e.target.value))}
            />
          </FormGroup>
          <Button onClick={() => handleSave("CO2")}>儲存 CO2 設定</Button>
        </HalfWidthContainer>

        <HalfWidthContainer>
          <SectionTitle>契約容量設定</SectionTitle>
          <FormGroup>
            <Label>契約容量 (kW)：</Label>
            <Input
              type="number"
              value={contractCapacity}
              onChange={(e) => setContractCapacity(parseInt(e.target.value))}
            />
          </FormGroup>
          <Button onClick={() => handleSave("capacity")}>儲存容量設定</Button>
        </HalfWidthContainer>
      </RowContainer>

      <PriceTableSection>
        <PriceTable
          onPricesUpdate={handlePriceTableUpdate}
          triggerHandleSend={handlePriceTableUpdate}
        />
      </PriceTableSection>
    </SettingsContainer>
  );
};

export default SettingsPage;
