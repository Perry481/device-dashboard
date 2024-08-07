// pages/SettingsPage.js
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import styled from "styled-components";

const SettingsContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const FormRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const FormGroup = styled.div`
  width: 48%;
`;

const Label = styled.label`
  font-weight: bold;
  margin-bottom: 5px;
  display: block;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const Button = styled.button`
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background-color: #0056b3;
  }
`;

const SettingsPage = () => {
  const [settings, setSettings] = useState(null);
  const [changes, setChanges] = useState({});
  const router = useRouter();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      if (!response.ok) throw new Error("設定取得失敗");
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error("設定取得錯誤:", error);
    }
  };

  const handleInputChange = (path, value) => {
    setSettings((prevSettings) => {
      const newSettings = JSON.parse(JSON.stringify(prevSettings));
      let current = newSettings;
      const keys = path.split(".");
      keys.forEach((key, index) => {
        if (index === keys.length - 1) {
          current[key] = value;
        } else {
          if (!current[key]) current[key] = {};
          current = current[key];
        }
      });
      return newSettings;
    });

    setChanges((prevChanges) => {
      const newChanges = { ...prevChanges };
      let current = newChanges;
      const keys = path.split(".");
      keys.forEach((key, index) => {
        if (index === keys.length - 1) {
          current[key] = value;
        } else {
          if (!current[key]) current[key] = {};
          current = current[key];
        }
      });
      return newChanges;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      if (!response.ok) throw new Error("設定更新失敗");
      alert("設定更新成功");
      setChanges({});
      fetchSettings();
    } catch (error) {
      console.error("設定更新錯誤:", error);
      alert("設定更新失敗");
    }
  };

  if (!settings) return <div>載入中...</div>;

  const renderFormGroups = () => {
    const formGroups = [];

    // CO2 排放係數
    formGroups.push(
      <FormGroup key="CO2">
        <Label>CO2 排放係數：</Label>
        <Input
          type="number"
          step="0.001"
          value={settings.CO2}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            if (!isNaN(value)) {
              handleInputChange("CO2", value);
            }
          }}
          style={{ appearance: "textfield" }}
        />
      </FormGroup>
    );

    // Prices
    if (settings.prices) {
      Object.entries(settings.prices).forEach(([priceType, priceObj]) => {
        Object.entries(priceObj).forEach(([season, price]) => {
          formGroups.push(
            <FormGroup key={`${priceType}-${season}`}>
              <Label>{`${priceType} - ${season}:`}</Label>
              <Input
                type="text"
                value={price}
                onChange={(e) =>
                  handleInputChange(
                    `prices.${priceType}.${season}`,
                    e.target.value
                  )
                }
              />
            </FormGroup>
          );
        });
      });
    }

    // Time Ranges
    if (settings.timeRanges) {
      Object.entries(settings.timeRanges).forEach(([season, dayTypes]) =>
        Object.entries(dayTypes).forEach(([dayType, peakTypes]) =>
          Object.entries(peakTypes).forEach(([peakType, timeRanges]) =>
            timeRanges.forEach((range, index) => {
              formGroups.push(
                <FormGroup key={`${season}-${dayType}-${peakType}-${index}`}>
                  <Label>{`${season} - ${dayType} - ${peakType} (Range ${
                    index + 1
                  }):`}</Label>
                  <Input
                    type="text"
                    value={`${range[0]}-${range[1]}`}
                    onChange={(e) => {
                      const [start, end] = e.target.value
                        .split("-")
                        .map(Number);
                      handleInputChange(
                        `timeRanges.${season}.${dayType}.${peakType}.${index}`,
                        [start, end]
                      );
                    }}
                  />
                </FormGroup>
              );
            })
          )
        )
      );
    }

    // Arrange form groups into rows
    const rows = [];
    for (let i = 0; i < formGroups.length; i += 2) {
      rows.push(
        <FormRow key={i}>
          {formGroups[i]}
          {formGroups[i + 1] ? formGroups[i + 1] : <FormGroup />}
        </FormRow>
      );
    }

    return rows;
  };

  return (
    <SettingsContainer>
      <h1>設定</h1>
      <Form onSubmit={handleSubmit}>
        {renderFormGroups()}
        <Button type="submit">儲存設定</Button>
      </Form>
    </SettingsContainer>
  );
};

export default SettingsPage;
