import React, { useState, useEffect } from "react";
import styled from "styled-components";
import Select from "react-select";
import PriceTable from "../components/PriceTable";
import GroupManagement from "../components/GroupManagement";

const SettingsContainer = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  box-sizing: border-box;
`;

const Section = styled.div`
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
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
  const [allMachines, setAllMachines] = useState([]);
  const [groups, setGroups] = useState([]);
  const [ungroupedMachines, setUngroupedMachines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      if (!response.ok) throw new Error("Failed to fetch settings");
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

      return data.machineGroups || [];
    } catch (error) {
      console.error("Error fetching settings:", error);
      return [];
    }
  };

  const fetchMachines = async () => {
    setIsLoading(true);
    try {
      const [machinesResponse, fetchedGroups] = await Promise.all([
        fetch("https://iot.jtmes.net/ebc/api/equipment/powermeter_list"),
        fetchSettings(),
      ]);

      if (!machinesResponse.ok) throw new Error("Failed to fetch machines");
      const machinesData = await machinesResponse.json();
      const formattedMachines = machinesData.map((machine) => ({
        id: machine.sn,
        name: machine.name,
      }));
      setAllMachines(formattedMachines);

      updateMachineDistribution(formattedMachines, fetchedGroups);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching machines:", error);
      setIsLoading(false);
    }
  };

  const updateMachineDistribution = (machines, fetchedGroups) => {
    const groupedMachineIds = new Set(
      fetchedGroups.flatMap((group) =>
        group.machines.map((machine) => machine.id)
      )
    );

    const ungrouped = machines.filter(
      (machine) => !groupedMachineIds.has(machine.id)
    );
    setUngroupedMachines(ungrouped);

    const updatedGroups = fetchedGroups.map((group) => ({
      ...group,
      machines: group.machines.filter((machine) =>
        machines.some((m) => m.id === machine.id)
      ),
    }));
    setGroups(updatedGroups);
  };

  const handleBasicSettingsSubmit = async (e) => {
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

      if (!response.ok) throw new Error("Failed to update settings");

      alert("Basic settings updated successfully");
      fetchSettings();
    } catch (error) {
      console.error("Error updating basic settings:", error);
      alert("Failed to update basic settings");
    }
  };

  const handleGroupSettingsSubmit = async (newGroups, newUngroupedMachines) => {
    try {
      const updates = {
        machineGroups: newGroups,
      };

      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error("Failed to update group settings");

      alert("Group settings updated successfully");
      setGroups(newGroups);
      setUngroupedMachines(newUngroupedMachines);
      fetchSettings();
    } catch (error) {
      console.error("Error updating group settings:", error);
      alert("Failed to update group settings");
    }
  };

  const handlePriceTableUpdate = () => {
    fetchSettings();
  };

  if (!settings) return <div>Loading...</div>;

  return (
    <SettingsContainer>
      <Section>
        <SectionTitle>基本設定</SectionTitle>
        <form onSubmit={handleBasicSettingsSubmit}>
          <FormGroup>
            <Label htmlFor="co2">碳排係數:</Label>
            <Input
              id="co2"
              type="number"
              step="0.001"
              value={co2}
              onChange={(e) => setCO2(e.target.value)}
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="contractCapacity">契約容量 (kW):</Label>
            <Input
              id="contractCapacity"
              type="number"
              step="0.1"
              value={contractCapacity}
              onChange={(e) => setContractCapacity(e.target.value)}
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="activePricingStandard">全局預設電價標準:</Label>
            <Select
              id="activePricingStandard"
              options={standardOptions}
              value={selectedStandard}
              onChange={setSelectedStandard}
              styles={customSelectStyles}
            />
          </FormGroup>
          <Button type="submit">保存基本設定</Button>
        </form>
      </Section>
      <Section>
        <SectionTitle>電表組設定</SectionTitle>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <GroupManagement
            initialGroups={groups}
            initialUngroupedMachines={ungroupedMachines}
            onSave={handleGroupSettingsSubmit}
          />
        )}
      </Section>
      <Section>
        <SectionTitle>電價設定</SectionTitle>
        <PriceTable
          onPricesUpdate={handlePriceTableUpdate}
          triggerHandleSend={handlePriceTableUpdate}
        />
      </Section>
    </SettingsContainer>
  );
};

export default SettingsPage;
