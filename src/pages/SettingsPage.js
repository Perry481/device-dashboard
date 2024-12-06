import React, { useState, useEffect, useContext } from "react";
import styled from "styled-components";
import Select from "react-select";
import PriceTable from "../components/PriceTable";
import GroupManagement from "../components/GroupManagement";
import { CompanyContext } from "../contexts/CompanyContext";
import { useTranslation } from "../hooks/useTranslation";

const SettingsContainer = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  box-sizing: border-box;
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  margin-bottom: 20px;
  padding: 10px;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
  font-size: 24px;
`;

const colors = {
  primary: {
    main: "#3ba272",
    light: "rgba(59, 162, 114, 0.1)",
    border: "#e2e8f0",
    text: "#2d3748",
  },
};

const Section = styled.div`
  background-color: #fff;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 30px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid ${colors.primary.border};

  @media (max-width: 768px) {
    padding: 16px;
    margin-bottom: 20px;
  }
`;

const SectionTitle = styled.h2`
  position: relative;
  font-size: 1.5rem;
  padding-bottom: 16px;
  margin-bottom: 24px;
  color: ${colors.primary.text};
  font-weight: 600;

  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    width: 60px;
    height: 3px;
    background-color: ${colors.primary.main};
    border-radius: 2px;
  }

  @media (max-width: 768px) {
    font-size: 1.25rem;
    padding-bottom: 12px;
    margin-bottom: 20px;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }

  @media (max-width: 768px) {
    margin-bottom: 16px;
  }
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: ${colors.primary.text};
  font-size: 0.95rem;

  @media (max-width: 768px) {
    font-size: 0.9rem;
    margin-bottom: 6px;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${colors.primary.border};
  border-radius: 6px;
  font-size: 0.95rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${colors.primary.main};
    box-shadow: 0 0 0 2px ${colors.primary.light};
  }

  &:hover {
    border-color: ${colors.primary.main};
  }

  &:disabled {
    background-color: #f7fafc;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    padding: 8px 10px;
    font-size: 0.9rem;
  }
`;

const Button = styled.button`
  padding: 10px 24px;
  background-color: ${colors.primary.main};
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: #2d8659;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(1px);
  }

  &:disabled {
    background-color: #94a3b8;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: 768px) {
    padding: 8px 20px;
    font-size: 0.9rem;
    width: 100%;
  }
`;

// Updated Select styles to match theme
const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    border: `1px solid ${
      state.isFocused ? colors.primary.main : colors.primary.border
    }`,
    borderRadius: "6px",
    minHeight: "38px",
    boxShadow: state.isFocused ? `0 0 0 2px ${colors.primary.light}` : "none",
    "&:hover": {
      border: `1px solid ${colors.primary.main}`,
    },
    "@media (max-width: 768px)": {
      minHeight: "36px",
    },
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? colors.primary.main
      : state.isFocused
      ? colors.primary.light
      : "white",
    color: state.isSelected ? "white" : colors.primary.text,
    "&:hover": {
      backgroundColor: state.isSelected
        ? colors.primary.main
        : colors.primary.light,
    },
    padding: "8px 12px",
    fontSize: "0.95rem",
    "@media (max-width: 768px)": {
      padding: "6px 10px",
      fontSize: "0.9rem",
    },
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: "6px",
    border: `1px solid ${colors.primary.border}`,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  }),
  singleValue: (provided) => ({
    ...provided,
    color: colors.primary.text,
    fontSize: "0.95rem",
    "@media (max-width: 768px)": {
      fontSize: "0.9rem",
    },
  }),
  input: (provided) => ({
    ...provided,
    fontSize: "0.95rem",
    "@media (max-width: 768px)": {
      fontSize: "0.9rem",
    },
  }),
  placeholder: (provided) => ({
    ...provided,
    fontSize: "0.95rem",
    "@media (max-width: 768px)": {
      fontSize: "0.9rem",
    },
  }),
  indicatorSeparator: () => ({
    display: "none",
  }),
};

const SettingsPage = () => {
  const { companyName } = useContext(CompanyContext);
  const { t } = useTranslation();
  const [settings, setSettings] = useState(null);
  const [co2, setCO2] = useState(0);
  const [contractCapacity, setContractCapacity] = useState(0);
  const [selectedStandard, setSelectedStandard] = useState(null);
  const [standardOptions, setStandardOptions] = useState([]);
  const [allMachines, setAllMachines] = useState([]);
  const [groups, setGroups] = useState([]);
  const [ungroupedMachines, setUngroupedMachines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMachines();
  }, [companyName]);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`/api/settings/${companyName}`);
      if (!response.ok) {
        if (response.status === 404) {
          console.log(
            `Settings for company ${companyName} not found. Using defaults.`
          );
          return {}; // Return empty object to use defaults
        }
        throw new Error("Failed to fetch settings");
      }
      const data = await response.json();
      setSettings(data);
      setCO2(data.CO2 || 0);
      setContractCapacity(data.contractCapacity || 0);

      const options = Object.keys(data.pricingStandards || {}).map((key) => ({
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
      setError("Failed to load settings. Please try again later.");
      return [];
    }
  };

  const fetchMachines = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [machinesResponse, fetchedGroups] = await Promise.all([
        fetch(
          `http://61.216.62.8:8081/${companyName}/api/equipment/powermeter_list`
        ),
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
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load data. Please try again later.");
    } finally {
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

      const response = await fetch(`/api/settings/${companyName}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error("Failed to update settings");

      alert(t("groupSettings.updateSuccess"));
      fetchSettings();
    } catch (error) {
      console.error("Error updating basic settings:", error);
      alert(t("groupSettings.updateError"));
    }
  };

  const handleGroupSettingsSubmit = async (newGroups, newUngroupedMachines) => {
    try {
      const updates = {
        machineGroups: newGroups,
      };

      const response = await fetch(`/api/settings/${companyName}`, {
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
      alert("Failed to update group settings. Please try again.");
    }
  };

  const handlePriceTableUpdate = () => {
    fetchSettings();
  };

  if (isLoading)
    return <LoadingSpinner>{t("groupSettings.loadingText")}</LoadingSpinner>;
  if (error) return <ErrorMessage>{error}</ErrorMessage>;
  if (!settings)
    return <ErrorMessage>{t("groupSettings.noSettingsFound")}</ErrorMessage>;

  return (
    <SettingsContainer>
      <Section>
        <SectionTitle>{t("basicSettings.title")}</SectionTitle>
        <form onSubmit={handleBasicSettingsSubmit}>
          <FormGroup>
            <Label htmlFor="co2">{t("basicSettings.co2Factor")}</Label>
            <Input
              id="co2"
              type="number"
              step="0.001"
              value={co2}
              onChange={(e) => setCO2(e.target.value)}
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="contractCapacity">
              {t("basicSettings.contractCapacity")}
            </Label>
            <Input
              id="contractCapacity"
              type="number"
              step="0.1"
              value={contractCapacity}
              onChange={(e) => setContractCapacity(e.target.value)}
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="activePricingStandard">
              {t("basicSettings.defaultPricing")}
            </Label>
            <Select
              id="activePricingStandard"
              options={standardOptions}
              value={selectedStandard}
              onChange={setSelectedStandard}
              styles={customSelectStyles}
            />
          </FormGroup>
          <Button type="submit">{t("basicSettings.saveButton")}</Button>
        </form>
      </Section>
      <Section>
        <SectionTitle>{t("groupSettings.title")}</SectionTitle>
        <GroupManagement
          initialGroups={groups}
          initialUngroupedMachines={ungroupedMachines}
          onSave={handleGroupSettingsSubmit}
          companyName={companyName}
        />
      </Section>
      <Section>
        <SectionTitle>{t("priceSettings.title")}</SectionTitle>
        <PriceTable
          onPricesUpdate={handlePriceTableUpdate}
          triggerHandleSend={handlePriceTableUpdate}
          companyName={companyName}
        />
      </Section>
    </SettingsContainer>
  );
};

export default SettingsPage;
