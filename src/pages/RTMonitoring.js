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
} from "react-icons/fa";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

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
                {text}: {getSummaryValue(text)}
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
                  <RTMDetailLabel>{item.label}:</RTMDetailLabel>
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
                value: `${lastData.Total_active_power || 0}W`,
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
        { value: "all", label: "全部設備" },
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
              <RTMSearchInput
                type="text"
                placeholder="搜尋電錶..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
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
                placeholder="選擇分組"
                styles={customSelectStyles}
              />
            </RTMGroupSelect>
            <RTMControlsContainer>
              <RTMCountdownText>下次更新: {countdown}s</RTMCountdownText>
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
            <RTMPaginationButton
              className="btn btn-primary"
              onClick={handlePrevPage}
              disabled={page === 1}
            >
              Previous
            </RTMPaginationButton>
            <RTMPaginationButton
              className="btn btn-primary"
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
                  <FaCog /> Reorder Machines
                </RTMHeaderTitle>
                <RTMSaveButton onClick={handleSaveOrder}>
                  Save Order
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
                  <p>No machines to reorder. Please fetch data first.</p>
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
    box-shadow: 0 0 10px rgba(255, 0, 0, 0.1) !important;
    border: 1px solid red !important;
    background-color: #fff5f5 !important;
    transform: scale(1.02);
    transition: all 0.3s ease-in-out;
    z-index: 5;
  }
;

`;

const RTMTopNavigation = styled.div`
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  padding: 10px 0;
`;

const RTMTopNavigationContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const RTMSearchContainer = styled.div`
  position: relative;
  width: 300px;
  flex: 1;
  min-width: 200px;

  @media (max-width: 768px) {
    width: 100%;
    margin-bottom: 10px;
  }
`;

const RTMGroupSelect = styled.div`
  width: 200px;
  margin-left: 20px;
  flex: 1;
  min-width: 200px;

  @media (max-width: 768px) {
    width: 100%;
    margin-left: 0;
    margin-bottom: 10px;
  }
`;

const RTMControlsContainer = styled.div`
  display: flex;
  align-items: center;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
  }
`;

const RTMCountdownText = styled.span`
  margin-right: 10px;
`;

const RTMSettingsButton = styled.button`
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  margin-left: 10px;
  &:hover {
    color: #0056b3;
  }
`;

const customSelectStyles = {
  control: (provided) => ({
    ...provided,
    minHeight: "38px",
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 9999,
  }),
};

const RTMCardContainer = styled.div`
  position: relative;
`;

const RTMCard = styled.div`
  position: relative;
`;

const RTMCardBody = styled.div`
  position: relative;
  display: flex;
  flex-direction: row;
  height: 100%;
`;

const RTMInfoColumn = styled.div`
  position: relative;
  width: 50%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const RTMSummaryColumn = styled.div`
  position: relative;
  width: 50%;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const RTMSummaryText = styled.p`
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;

  /* Extra small devices (phones, less than 576px) */
  font-size: 0.75rem;

  /* Small devices (landscape phones, 576px and up) */
  @media (min-width: 576px) {
    font-size: 0.85rem;
  }

  /* Medium devices (tablets, 768px and up) */
  @media (min-width: 768px) {
    font-size: 0.9rem;
  }

  /* Large devices (desktops, 992px and up) */
  @media (min-width: 992px) {
    font-size: 1rem;
  }
`;

const RTMTitle = styled.h4`
  text-align: center;
`;

const RTMValue = styled.h2`
  margin-bottom: 0;
`;

const RTMDetailsButton = styled.button`
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  &:hover {
    color: #0056b3;
  }
`;

const RTMOverlay = styled.div`
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

const RTMDetailsPopup = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 400px;
  max-width: 90%;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const RTMDetailsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: #f1f3f5;
  border-bottom: 1px solid #dee2e6;
`;

const RTMDetailsTitle = styled.h3`
  margin: 0;
  font-size: 1.2rem;
`;

const RTMCloseButton = styled.button`
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0;

  &:hover {
    color: #343a40;
  }
`;

const RTMDetailsContent = styled.div`
  padding: 20px;
  overflow-y: auto;
`;

const RTMDetailItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;

  &:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }
`;

const RTMDetailLabel = styled.span`
  font-weight: bold;
`;

const RTMDetailValue = styled.span`
  text-align: right;
`;

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

const RTMSearchInput = styled.input`
  width: 100%;
  padding: 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
`;

const RTMSearchResults = styled.ul`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: white;
  border: 1px solid #ced4da;
  border-top: none;
  list-style-type: none;
  padding: 0;
  margin: 0;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
`;

const RTMSearchResultItem = styled.li`
  padding: 8px;
  cursor: pointer;
  &:hover {
    background-color: #f1f3f5;
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

const RTMDroppableArea = styled.div`
  min-height: 100px;
`;

const RTMDraggableItem = styled.div`
  padding: 10px 15px;
  margin-bottom: 8px;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  display: flex;
  align-items: center;
  transition: background-color 0.2s;
  &:hover {
    background-color: #e9ecef;
  }
`;

const RTMDragHandle = styled.div`
  cursor: grab;
  margin-right: 15px;
  color: #6c757d;
`;

const RTMPopupContainer = styled.div`
  width: 400px;
  height: 500px;
  background-color: #ffffff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
`;

const RTMPanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: #f1f3f5;
  border-bottom: 1px solid #dee2e6;
`;

const RTMHeaderTitle = styled.h3`
  margin: 0;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const RTMExitButton = styled.button`
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0;
  margin-left: auto;
  &:hover {
    color: #343a40;
  }
`;

const RTMSaveButton = styled.button`
  padding: 8px 16px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
  font-weight: bold;

  &:hover {
    background-color: #218838;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(1px);
  }
`;

const RTMContentArea = styled.div`
  flex-grow: 1;
  padding: 20px;
  overflow-y: auto;
`;
