import React, { useState, useEffect, useContext } from "react";
import Select from "react-select";
import styled, { createGlobalStyle } from "styled-components";
import { CompanyContext } from "../contexts/CompanyContext";
import GaugeSettingsPopup from "../components/GaugeSettingsPopup";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  FaCog,
  FaArrowLeft,
  FaPlus,
  FaTimes,
  FaBars,
  FaList,
  FaInfoCircle,
  FaSearch,
} from "react-icons/fa";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useTranslation } from "../hooks/useTranslation";
const CombinedCard = ({
  id,
  title,
  value,
  unit,
  details,
  isHighlighted,
  cardSettings,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const { t } = useTranslation();
  const handleToggleDetails = () => {
    setShowDetails((prev) => !prev);
  };
  const summaryTexts = cardSettings?.gaugeSettings?.[title]?.summaryTexts ||
    cardSettings?.defaultSettings?.summaryTexts || [
      "總累計電耗",
      "總有功功率",
      "總無功功率",
      "總視在功率",
      "總功率因數",
    ];

  const getSummaryValue = (text) => {
    switch (text) {
      case "總累計電耗":
        return `${details.value} ${details.unit}`;
      case "總有功功率":
        return `${details.totalActivePower} W`;
      case "總無功功率":
        return `${details.totalReactivePower} var`;
      case "總視在功率":
        return `${details.totalApparentPower} VA`;
      case "總功率因數":
        return details.totalPowerFactor;
      default:
        const item = details.items.find((item) => item.label === text);
        if (item) {
          return item.value;
        }
        return details[text] || "N/A";
    }
  };

  return (
    <RTMCardContainer
      className={`col-md-3 col-sm-6 mb-4 ${isHighlighted ? "highlighted" : ""}`}
      id={id}
    >
      <RTMCard
        className={`card shadow-sm h-100 position-relative ${
          isHighlighted ? "highlighted-card" : ""
        }`}
      >
        <RTMCardBody className="card-body d-flex flex-row align-items-stretch">
          <RTMInfoColumn className="col-6 d-flex flex-column justify-content-center align-items-center">
            <RTMTitle className="card-title mb-3 text-center">{title}</RTMTitle>
            <RTMValue className="card-text mb-0">
              {value} {unit}
            </RTMValue>
          </RTMInfoColumn>
          <RTMSummaryColumn className="col-6">
            {summaryTexts.map((text, index) => (
              <RTMSummaryText key={index} className="card-text">
                {t(`rtMonitoring.meterDetails.labels.${text}`)}:{" "}
                {getSummaryValue(text)}
              </RTMSummaryText>
            ))}
          </RTMSummaryColumn>
        </RTMCardBody>
        <RTMDetailsButton onClick={handleToggleDetails}>
          <FaInfoCircle size={20} />
        </RTMDetailsButton>
      </RTMCard>
      {showDetails && (
        <RTMOverlay onClick={handleToggleDetails}>
          <RTMDetailsPopup onClick={(e) => e.stopPropagation()}>
            <RTMDetailsHeader>
              <RTMDetailsTitle>{title} Details</RTMDetailsTitle>
              <RTMCloseButton onClick={handleToggleDetails}>
                <FaTimes />
              </RTMCloseButton>
            </RTMDetailsHeader>
            <RTMDetailsContent>
              {filterPhaseItems(details.items).map((item, index) => (
                <RTMDetailItem key={index}>
                  <RTMDetailLabel>
                    {t(`rtMonitoring.meterDetails.labels.${item.label}`)}:
                  </RTMDetailLabel>
                  <RTMDetailValue>{item.value}</RTMDetailValue>
                </RTMDetailItem>
              ))}
            </RTMDetailsContent>
          </RTMDetailsPopup>
        </RTMOverlay>
      )}
    </RTMCardContainer>
  );
};

const filterPhaseItems = (items) => {
  const is3P = items.some(
    (item) => item.label.includes("B") || item.label.includes("C")
  );
  return items.filter((item) => {
    if (is3P) {
      return true;
    } else {
      return !item.label.includes("B") && !item.label.includes("C");
    }
  });
};

const MonitorPage = () => {
  const [page, setPage] = useState(1);
  const [meterData, setMeterData] = useState([]);
  const [order, setOrder] = useState([]);
  const [orderedMeters, setOrderedMeters] = useState([]);
  const [countdown, setCountdown] = useState(5);
  const [showSettings, setShowSettings] = useState(false);
  const [draggableOrder, setDraggableOrder] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [highlightedGauge, setHighlightedGauge] = useState(null);
  const [highlightTimer, setHighlightTimer] = useState(null);
  const [showCardSettings, setShowCardSettings] = useState(false);
  const [cardSettings, setCardSettings] = useState(null);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [filteredMeters, setFilteredMeters] = useState([]);
  const metersPerPage = 8;
  const { companyName } = useContext(CompanyContext);
  const { t } = useTranslation();
  const fetchDataAndOrder = async () => {
    try {
      // Fetch meter data
      const meterResponse = await fetch(
        `https://iot.jtmes.net/${companyName}/api/equipment/powermeter_list`
      );
      const meterData = await meterResponse.json();

      // Format meter data
      const formattedMeterData = meterData.map((item) => {
        const lastData = JSON.parse(item.last_data);
        return {
          title: item.name,
          value: lastData.Total_active_power || 0,
          unit: "W",
          details: {
            value: lastData.Total_accumulation_power || 0,
            unit: "kWh",
            totalActivePower: lastData.Total_active_power || 0,
            totalReactivePower: lastData.total_reactive_power || 0,
            totalApparentPower: lastData.total_apparent_power || 0,
            totalPowerFactor: lastData.total_power_factor || 0,
            brandModel: lastData.Brand_model || "Unknown",
            items: [
              { label: "機器名稱", value: item.name },
              {
                label: "總累計電耗",
                value: `${lastData.Total_accumulation_power || 0}W`,
              },
              { label: "Brand", value: lastData.Brand || "Unknown" },
              { label: "Model", value: lastData.Brand_model || "Unknown" },
              { label: "ID", value: lastData.MeterMachineID || "Unknown" },
              { label: "Machine", value: lastData.Name_Machine || "Unknown" },
              { label: "線電壓A", value: `${lastData.A_phase_voltage || 0} V` },
              { label: "線電壓B", value: `${lastData.B_phase_voltage || 0} V` },
              { label: "線電壓C", value: `${lastData.C_phase_voltage || 0} V` },
              { label: "電流A", value: `${lastData.A_phase_current || 0} A` },
              { label: "電流B", value: `${lastData.B_phase_current || 0} A` },
              { label: "電流C", value: `${lastData.C_phase_current || 0} A` },
              {
                label: "頻率A",
                value: `${lastData.A_phase_frequence || 0} Hz`,
              },
              {
                label: "頻率B",
                value: `${lastData.B_phase_frequence || 0} Hz`,
              },
              {
                label: "頻率C",
                value: `${lastData.C_phase_frequence || 0} Hz`,
              },
              {
                label: "總有功功率",
                value: `${lastData.Total_active_power || 0} W`,
              },
              {
                label: "總無功功率",
                value: `${lastData.total_reactive_power || 0} var`,
              },
              {
                label: "總視在功率",
                value: `${lastData.total_apparent_power || 0} VA`,
              },
              {
                label: "總功率因數",
                value: `${lastData.total_power_factor || 0}`,
              },
            ],
          },
        };
      });

      // Fetch machine order
      const orderResponse = await fetch(`/api/machineOrder/${companyName}`);
      let orderData = await orderResponse.json();

      let isOrderChanged = false;

      // If orderData is empty, use the order from formattedMeterData
      if (orderData.length === 0) {
        orderData = formattedMeterData.map((meter) => meter.title);
        isOrderChanged = true;
      } else {
        const currentMachines = new Set(
          formattedMeterData.map((meter) => meter.title)
        );
        const oldOrderSet = new Set(orderData);

        // Add new machines
        const newMachines = formattedMeterData.filter(
          (meter) => !oldOrderSet.has(meter.title)
        );
        if (newMachines.length > 0) {
          orderData = [
            ...orderData,
            ...newMachines.map((meter) => meter.title),
          ];
          isOrderChanged = true;
        }

        // Remove non-existent machines
        const initialLength = orderData.length;
        orderData = orderData.filter((name) => currentMachines.has(name));
        if (orderData.length !== initialLength) {
          isOrderChanged = true;
        }
      }

      // Update the machine order on the server only if there's a change
      if (isOrderChanged) {
        await fetch(`/api/machineOrder/${companyName}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(orderData),
        });
      }

      // Set state
      setMeterData(formattedMeterData);
      setOrder(orderData);

      const orderedMeters = orderData
        .map((machineName) =>
          formattedMeterData.find((meter) => meter.title === machineName)
        )
        .filter((meter) => meter !== undefined);

      setOrderedMeters(orderedMeters);
      setDraggableOrder(orderData);

      // Fetch groups
      const groupsResponse = await fetch(`/api/settings/${companyName}`);
      const groupsData = await groupsResponse.json();
      const machineGroups = groupsData.machineGroups || [];
      setGroups([
        { value: "all", label: t("rtMonitoring.groups.allDevices") },
        ...machineGroups.map((group) => ({
          value: group.name,
          label: group.name,
          machines: group.machines,
        })),
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchDataAndOrder();

    const interval = setInterval(() => {
      fetchDataAndOrder();
      setCountdown(5);
    }, 5000);

    const countdownInterval = setInterval(() => {
      setCountdown((prevCountdown) =>
        prevCountdown > 0 ? prevCountdown - 1 : 5
      );
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(countdownInterval);
    };
  }, []);

  useEffect(() => {
    const fetchCardSettings = async () => {
      try {
        const response = await fetch(`/api/cardSettings/${companyName}`);
        if (!response.ok) throw new Error("Failed to fetch card settings");
        const data = await response.json();
        setCardSettings(data);
      } catch (error) {
        console.error("Error fetching card settings:", error);
        setCardSettings({
          defaultSettings: {
            summaryTexts: [
              "總累計電耗",
              "總有功功率",
              "總無功功率",
              "總視在功率",
              "總功率因數",
            ],
          },
          gaugeSettings: {},
        });
      }
    };

    fetchCardSettings();
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (
        highlightedGauge &&
        !e.target.closest(`#gauge-${highlightedGauge}`) &&
        !e.target.closest(".search-container")
      ) {
        console.log("Click outside highlighted gauge detected");
        if (highlightTimer) {
          clearTimeout(highlightTimer);
        }
        setHighlightedGauge(null);
      }
    };

    if (highlightedGauge) {
      document.addEventListener("click", handleClick);
    }

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [highlightedGauge, highlightTimer]);

  useEffect(() => {
    return () => {
      if (highlightTimer) {
        clearTimeout(highlightTimer);
      }
    };
  }, [highlightTimer]);

  useEffect(() => {
    if (selectedGroup && selectedGroup.value !== "all") {
      const group = groups.find((g) => g.value === selectedGroup.value);
      if (group) {
        const groupMachines = group.machines.map((machine) => machine.name);
        setFilteredMeters(
          orderedMeters.filter((meter) => groupMachines.includes(meter.title))
        );
      }
    } else {
      setFilteredMeters(orderedMeters);
    }
  }, [selectedGroup, orderedMeters, groups]);

  // const handleSaveSettings = async () => {
  //   try {
  //     await fetch("/api/machineorder", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(draggableOrder),
  //     });

  //     await fetch("/api/cardSettings", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(cardSettings),
  //     });

  //     setShowSettings(false);
  //     setShowCardSettings(false);
  //     fetchDataAndOrder();
  //   } catch (error) {
  //     console.error("Error saving settings:", error);
  //   }
  // };

  const handleSearch = (value) => {
    setSearchTerm(value);
    if (value.length > 0) {
      const filteredResults = orderedMeters.filter((meter) =>
        meter.title.toLowerCase().includes(value.toLowerCase())
      );
      setSearchResults(filteredResults.slice(0, 5));
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectGauge = (gauge) => {
    console.log("Selecting gauge:", gauge.title);
    const gaugeIndex = orderedMeters.findIndex(
      (meter) => meter.title === gauge.title
    );
    if (gaugeIndex === -1) {
      console.log("Gauge not found in orderedMeters");
      return;
    }

    const pageNumber = Math.floor(gaugeIndex / metersPerPage) + 1;
    console.log("Navigating to page:", pageNumber);
    setPage(pageNumber);
    setHighlightedGauge(gauge.title);
    console.log("Highlighted gauge set to:", gauge.title);
    setSearchTerm("");
    setSearchResults([]);

    if (highlightTimer) {
      clearTimeout(highlightTimer);
    }

    const timer = setTimeout(() => {
      const gaugeElement = document.getElementById(`gauge-${gauge.title}`);
      if (gaugeElement) {
        gaugeElement.scrollIntoView({ behavior: "smooth", block: "center" });
        console.log("Scrolled to gauge:", gauge.title);
      } else {
        console.log("Gauge element not found in DOM");
      }

      setTimeout(() => {
        console.log("Removing highlight from:", gauge.title);
        setHighlightedGauge(null);
      }, 3000);
    }, 100);

    setHighlightTimer(timer);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(draggableOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setDraggableOrder(items);
  };

  const handleSaveOrder = async () => {
    try {
      await fetch(`/api/machineOrder/${companyName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draggableOrder),
      });
      setShowSettings(false);
      fetchDataAndOrder();
    } catch (error) {
      console.error("Error saving machine order:", error);
    }
  };

  const handleSaveCardSettings = async (newSettings) => {
    try {
      await fetch(`/api/cardSettings/${companyName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });
      setCardSettings(newSettings);
      setShowCardSettings(false);
    } catch (error) {
      console.error("Error saving card settings:", error);
    }
  };

  const handleNextPage = () => {
    setPage((prev) =>
      Math.min(prev + 1, Math.ceil(filteredMeters.length / metersPerPage))
    );
  };

  const handlePrevPage = () => {
    setPage((prev) => Math.max(prev - 1, 1));
  };

  const currentMeters = filteredMeters.slice(
    (page - 1) * metersPerPage,
    page * metersPerPage
  );

  return (
    <>
      <ComponentGlobalStyle />
      <div className="container-fluid min-vh-100 d-flex flex-column">
        <RTMTopNavigation>
          <RTMTopNavigationContent>
            <RTMSearchContainer className="search-container">
              <RTMSearchInputWrapper>
                <SearchIcon />
                <RTMSearchInput
                  type="text"
                  placeholder={t("rtMonitoring.search.placeholder")}
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </RTMSearchInputWrapper>
              {searchResults.length > 0 && (
                <RTMSearchResults>
                  {searchResults.map((result, index) => (
                    <RTMSearchResultItem
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectGauge(result);
                      }}
                    >
                      {result.title}
                    </RTMSearchResultItem>
                  ))}
                </RTMSearchResults>
              )}
            </RTMSearchContainer>
            <RTMGroupSelect>
              <Select
                options={groups}
                value={selectedGroup}
                onChange={setSelectedGroup}
                placeholder={t("rtMonitoring.groups.selectGroup")}
                styles={customSelectStyles}
              />
            </RTMGroupSelect>
            <RTMControlsContainer>
              <RTMCountdownText>
                {t("rtMonitoring.nextUpdate", { seconds: countdown })}
              </RTMCountdownText>
              <RTMSettingsButton onClick={() => setShowSettings(true)}>
                <FaCog size={20} />
              </RTMSettingsButton>
              <RTMSettingsButton onClick={() => setShowCardSettings(true)}>
                <FaList size={20} />
              </RTMSettingsButton>
            </RTMControlsContainer>
          </RTMTopNavigationContent>
        </RTMTopNavigation>
        <div className="row flex-grow-1">
          {currentMeters.map((meter, index) => {
            const isHighlighted = meter.title === highlightedGauge;
            return (
              <CombinedCard
                key={index}
                {...meter}
                id={`gauge-${meter.title}`}
                isHighlighted={isHighlighted}
                cardSettings={cardSettings}
              />
            );
          })}
        </div>
        <RTMPaginationContainer>
          <RTMPaginationContent>
            <RTMPaginationButton onClick={handlePrevPage} disabled={page === 1}>
              Previous
            </RTMPaginationButton>
            <RTMPaginationButton
              onClick={handleNextPage}
              disabled={
                page === Math.ceil(filteredMeters.length / metersPerPage)
              }
            >
              Next
            </RTMPaginationButton>
          </RTMPaginationContent>
        </RTMPaginationContainer>
        {showSettings && (
          <RTMPopupOverlay onClick={() => setShowSettings(false)}>
            <RTMPopupContainer onClick={(e) => e.stopPropagation()}>
              <RTMPanelHeader>
                <RTMHeaderTitle>
                  <FaCog /> {t("rtMonitoring.settings.reorderMachines")}
                </RTMHeaderTitle>
                <RTMSaveButton onClick={handleSaveOrder}>
                  {t("rtMonitoring.settings.saveOrder")}
                </RTMSaveButton>
                <RTMExitButton onClick={() => setShowSettings(false)}>
                  <FaTimes />
                </RTMExitButton>
              </RTMPanelHeader>
              <RTMContentArea>
                {draggableOrder.length > 0 ? (
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="machines">
                      {(provided) => (
                        <RTMDroppableArea
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                        >
                          {draggableOrder.map((machineName, index) => (
                            <Draggable
                              key={machineName}
                              draggableId={machineName}
                              index={index}
                            >
                              {(provided) => (
                                <RTMDraggableItem
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                >
                                  <RTMDragHandle {...provided.dragHandleProps}>
                                    <FaBars />
                                  </RTMDragHandle>
                                  {machineName}
                                </RTMDraggableItem>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </RTMDroppableArea>
                      )}
                    </Droppable>
                  </DragDropContext>
                ) : (
                  <p>{t("rtMonitoring.settings.noMachines")}</p>
                )}
              </RTMContentArea>
            </RTMPopupContainer>
          </RTMPopupOverlay>
        )}
        {showCardSettings && (
          <RTMPopupOverlay onClick={() => setShowCardSettings(false)}>
            <RTMPopupContent onClick={(e) => e.stopPropagation()}>
              {cardSettings && orderedMeters ? (
                <GaugeSettingsPopup
                  cardSettings={cardSettings}
                  gauges={orderedMeters}
                  onSave={(newSettings) => {
                    handleSaveCardSettings(newSettings);
                    setShowCardSettings(false);
                  }}
                />
              ) : (
                <p>Loading settings...</p>
              )}
            </RTMPopupContent>
          </RTMPopupOverlay>
        )}
      </div>
    </>
  );
};

export default MonitorPage;

const ComponentGlobalStyle = createGlobalStyle`
  html {
    scroll-behavior: smooth;
  }

  .highlighted-card {
    box-shadow: 0 8px 16px rgba(59, 162, 114, 0.1) !important;
    border: 2px solid #3ba272 !important;
    background-color: white !important;
    transform: translateY(-2px) scale(1.01);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 5;
  }
`;

const RTMTopNavigation = styled.div`
  background: linear-gradient(to right, #ffffff, #f8f9fa);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  padding: 1rem 0;
  box-shadow: 0 4px 12px -5px rgba(0, 0, 0, 0.05); // Softer shadow
  margin-bottom: 1.5rem; // Add space between header and content
`;

const RTMTopNavigationContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  gap: 1.5rem;

  @media (max-width: 768px) {
    flex-direction: column;
    padding: 0 1rem;
    gap: 1rem;
  }
`;

const RTMSearchContainer = styled.div`
  position: relative;
  flex: 1;
  min-width: 280px;
  max-width: 400px;
  height: 38px; // Match Select's height

  @media (max-width: 768px) {
    width: 100%;
    max-width: none;
  }
`;

const RTMSearchInputWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 38px;
`;
const SearchIcon = styled(FaSearch)`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #a0aec0;
  font-size: 14px;
  pointer-events: none;
`;

const RTMSearchInput = styled.input`
  width: 100%;
  padding: 0.75rem 0.5rem 0.75rem 2.75rem; // Increased left padding to accommodate icon
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  background-color: white;
  height: 38px;

  &:focus {
    outline: none;
    border-color: #3ba272;
    box-shadow: 0 0 0 1px #3ba272;
  }

  &::placeholder {
    color: #a0aec0;
  }
`;

const SearchIconWrapper = styled.div`
  position: absolute;
  left: 1rem;
  color: #a0aec0;
  pointer-events: none;
`;

const RTMSearchResults = styled.ul`
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  padding: 0.5rem;
  margin: 0;
  list-style: none;
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
`;

const RTMSearchResultItem = styled.li`
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background-color: #f7fafc;
    color: #3ba272;
  }
`;

const RTMGroupSelect = styled.div`
  width: 250px;
  margin-left: 20px;

  @media (max-width: 768px) {
    width: 100%;
    margin-left: 0;
  }
`;

const RTMControlsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const RTMCountdownText = styled.span`
  color: #4a5568;
  font-size: 0.95rem;
`;

const RTMSettingsButton = styled.button`
  background: none;
  border: none;
  color: #3ba272;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(59, 162, 114, 0.1);
    transform: scale(1.1);
  }
`;

// Card Components
const RTMCardContainer = styled.div`
  position: relative;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
`;

const RTMCard = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: 100%;
  overflow: hidden;
  border: 1px solid #e2e8f0;

  &:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;

const RTMCardBody = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: row;
`;

const RTMInfoColumn = styled.div`
  width: 50%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0 1rem;
`;

const RTMSummaryColumn = styled.div`
  width: 50%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 1rem;
  border-left: 1px solid #e2e8f0;
`;

const RTMTitle = styled.h4`
  color: #2d3748;
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  text-align: center;
`;

const RTMValue = styled.h2`
  color: #3ba272;
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 0;
`;

const RTMSummaryText = styled.p`
  margin: 0;
  padding: 0.25rem 0;
  font-size: 0.9rem;
  color: #4a5568;
  border-bottom: 1px dashed #e2e8f0;

  &:last-child {
    border-bottom: none;
  }
`;

// Details Components
const RTMDetailsButton = styled.button`
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  background: none;
  border: none;
  color: #3ba272;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(59, 162, 114, 0.1);
    transform: translateX(-50%) scale(1.1);
  }
`;

const RTMOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const RTMDetailsPopup = styled.div`
  background: white;
  border-radius: 16px;
  width: 95%;
  max-width: 500px;
  max-height: 80vh;
  overflow: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
`;

const RTMDetailsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
`;

const RTMDetailsTitle = styled.h3`
  margin: 0;
  color: #2d3748;
  font-size: 1.25rem;
  font-weight: 600;
`;

const RTMCloseButton = styled.button`
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s ease;

  &:hover {
    background-color: #f1f5f9;
    color: #334155;
  }
`;

const RTMDetailsContent = styled.div`
  padding: 1.5rem;
  overflow-y: auto;
`;

const RTMDetailItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e2e8f0;

  &:last-child {
    border-bottom: none;
  }
`;

const RTMDetailLabel = styled.span`
  font-weight: 500;
  color: #4a5568;
`;

const RTMDetailValue = styled.span`
  color: #2d3748;
`;

// Settings Popup Components
const RTMPopupContainer = styled.div`
  background: white;
  border-radius: 16px;
  width: 95%;
  max-width: 500px;
  height: 90vh;
  max-height: 600px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
`;

const RTMPanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
`;

const RTMHeaderTitle = styled.h3`
  margin: 0;
  color: #2d3748;
  font-size: 1.25rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const RTMSaveButton = styled.button`
  background-color: #3ba272;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
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
`;

const RTMExitButton = styled.button`
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  margin-left: 1rem;
  transition: all 0.2s ease;

  &:hover {
    background-color: #f1f5f9;
    color: #334155;
  }
`;

const RTMContentArea = styled.div`
  flex-grow: 1;
  padding: 1.5rem;
  overflow-y: auto;
`;

const RTMDroppableArea = styled.div`
  min-height: 100px;
`;

const RTMDraggableItem = styled.div`
  padding: 1rem;
  margin-bottom: 0.75rem;
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;

  &:hover {
    background-color: #f7fafc;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const RTMDragHandle = styled.div`
  cursor: grab;
  margin-right: 1rem;
  color: #64748b;
  display: flex;
  align-items: center;
`;

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    minHeight: "38px",
    borderColor: state.isFocused ? "#3ba272" : "#e2e8f0",
    boxShadow: state.isFocused ? "0 0 0 1px #3ba272" : "none", // Match input's focus outline
    "&:hover": {
      borderColor: "#3ba272",
    },
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 9999,
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#3ba272"
      : state.isFocused
      ? "rgba(59, 162, 114, 0.1)"
      : "white",
    color: state.isSelected ? "white" : "#2d3748",
    "&:hover": {
      backgroundColor: state.isSelected ? "#3ba272" : "rgba(59, 162, 114, 0.1)",
    },
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "#2d3748",
  }),
};
const RTMPaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 1rem;
  margin-bottom: 1rem;
`;

const RTMPaginationContent = styled.div`
  display: flex;
  align-items: center;
`;

const RTMPaginationButton = styled.button`
  margin-right: 0.5rem;
  background-color: #3ba272;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  /* Remove default browser focus styles */
  &:focus {
    outline: none;
  }

  /* Remove default active/visited state colors */
  &:active,
  &:visited {
    background-color: #3ba272;
    color: white;
  }

  &:hover {
    background-color: #2d8659;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(1px);
    background-color: #2d8659;
  }

  &:disabled {
    background-color: #a0aec0;
    cursor: not-allowed;
    transform: none;

    &:hover,
    &:active,
    &:focus {
      background-color: #a0aec0;
      transform: none;
    }
  }
`;

const RTMPopupContent = styled.div`
  background: white;
  border-radius: 8px;
  overflow: hidden;
  width: 100%;
  max-width: 700px;
  height: auto;
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
`;
const RTMSettingsContainer = styled.div`
  width: 100%;
`;

const RTMSettingsContent = styled.div`
  max-height: 60vh;
  overflow-y: auto;
`;

const RTMSettingInput = styled.input`
  width: 100%;
  margin-bottom: 10px;
  padding: 5px;
`;

const RTMHeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h2 {
    margin: 0;
  }
`;

const RTMPopupOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;
