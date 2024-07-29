import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { FaCog, FaArrowLeft, FaPlus, FaTimes, FaBars } from "react-icons/fa";

const GaugeSettingsPopup = ({ cardSettings, gauges, onSave }) => {
  const [selectedGauge, setSelectedGauge] = useState(null);
  const [localSettings, setLocalSettings] = useState(cardSettings);

  useEffect(() => {
    if (gauges.length > 0 && !selectedGauge) {
      handleGaugeSelect(gauges[0]);
    }
  }, [gauges]);

  const handleGaugeSelect = (gauge) => {
    setSelectedGauge(gauge);
    if (!localSettings.gaugeSettings[gauge.title]) {
      setLocalSettings((prevSettings) => ({
        ...prevSettings,
        gaugeSettings: {
          ...prevSettings.gaugeSettings,
          [gauge.title]: {
            summaryTexts: [...prevSettings.defaultSettings.summaryTexts],
            is3P: gauge.details.brandModel === "3P",
          },
        },
      }));
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(
      localSettings.gaugeSettings[selectedGauge.title].summaryTexts
    );
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setLocalSettings((prevSettings) => ({
      ...prevSettings,
      gaugeSettings: {
        ...prevSettings.gaugeSettings,
        [selectedGauge.title]: {
          ...prevSettings.gaugeSettings[selectedGauge.title],
          summaryTexts: items,
        },
      },
    }));
  };

  const handleRemoveItem = (index) => {
    const newItems = localSettings.gaugeSettings[
      selectedGauge.title
    ].summaryTexts.filter((_, i) => i !== index);
    setLocalSettings((prevSettings) => ({
      ...prevSettings,
      gaugeSettings: {
        ...prevSettings.gaugeSettings,
        [selectedGauge.title]: {
          ...prevSettings.gaugeSettings[selectedGauge.title],
          summaryTexts: newItems,
        },
      },
    }));
  };

  const handleAddItem = (item) => {
    const newItems = [
      ...localSettings.gaugeSettings[selectedGauge.title].summaryTexts,
      item,
    ];
    setLocalSettings((prevSettings) => ({
      ...prevSettings,
      gaugeSettings: {
        ...prevSettings.gaugeSettings,
        [selectedGauge.title]: {
          ...prevSettings.gaugeSettings[selectedGauge.title],
          summaryTexts: newItems,
        },
      },
    }));
  };

  const handleSave = () => {
    onSave(localSettings);
  };

  return (
    <GSPopupContainer>
      <GSPanelHeader>
        <GSHeaderTitle>
          <FaCog /> Gauge Settings
        </GSHeaderTitle>
        <GSButtonGroup>
          <GSSaveButton onClick={handleSave}>Save</GSSaveButton>
          <GSExitButton onClick={() => onSave(cardSettings)}>
            <FaTimes />
          </GSExitButton>
        </GSButtonGroup>
      </GSPanelHeader>
      <GSContentWrapper>
        <GSSidePanel>
          <GSGaugeList>
            {gauges.map((gauge) => (
              <GSGaugeItem
                key={gauge.title}
                onClick={() => handleGaugeSelect(gauge)}
                selected={selectedGauge?.title === gauge.title}
              >
                <FaCog /> {gauge.title}
              </GSGaugeItem>
            ))}
          </GSGaugeList>
        </GSSidePanel>
        <GSMainPanel>
          {selectedGauge && (
            <>
              <GSSubHeader>
                <GSBackButton onClick={() => setSelectedGauge(null)}>
                  <FaArrowLeft />
                </GSBackButton>
                {selectedGauge.title} Summary Texts
              </GSSubHeader>
              <GSSummaryTextConfig>
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="summary-texts">
                    {(provided) => (
                      <GSDroppableArea
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                      >
                        {localSettings.gaugeSettings[
                          selectedGauge.title
                        ].summaryTexts.map((text, index) => (
                          <Draggable
                            key={text}
                            draggableId={text}
                            index={index}
                          >
                            {(provided) => (
                              <GSDraggableItem
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <GSDragHandle {...provided.dragHandleProps}>
                                  <FaBars />
                                </GSDragHandle>
                                {text}
                                <GSRemoveButton
                                  onClick={() => handleRemoveItem(index)}
                                >
                                  <FaTimes />
                                </GSRemoveButton>
                              </GSDraggableItem>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </GSDroppableArea>
                    )}
                  </Droppable>
                </DragDropContext>
                <AddItemDropdown
                  gauge={selectedGauge}
                  currentItems={
                    localSettings.gaugeSettings[selectedGauge.title]
                      .summaryTexts
                  }
                  onAdd={handleAddItem}
                />
              </GSSummaryTextConfig>
            </>
          )}
        </GSMainPanel>
      </GSContentWrapper>
    </GSPopupContainer>
  );
};

const AddItemDropdown = ({ gauge, currentItems, onAdd }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const availableItems =
    gauge.details && gauge.details.items
      ? filterPhaseItems(
          gauge.details.items,
          gauge.details.brandModel === "3P"
        ).filter((item) => !currentItems.includes(item.label))
      : [];

  return (
    <GSAddItemContainer>
      <GSAddButton onClick={() => setShowDropdown(!showDropdown)}>
        <FaPlus /> Add Item
      </GSAddButton>
      {showDropdown && (
        <GSDropdown>
          {availableItems.map((item, index) => (
            <GSDropdownItem
              key={index}
              onClick={() => {
                onAdd(item.label);
                setShowDropdown(false);
              }}
            >
              {item.label}
            </GSDropdownItem>
          ))}
        </GSDropdown>
      )}
    </GSAddItemContainer>
  );
};

const filterPhaseItems = (items, is3P) => {
  return items.filter((item) => {
    if (is3P) {
      return true; // Show all items for 3P
    } else {
      // For 1P, only show 'A' phase items and non-phase items
      return !item.label.includes("B") && !item.label.includes("C");
    }
  });
};

// Updated Styled components
const GSPopupContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 700px;
  height: 500px;
  background-color: #f8f9fa;
  border-radius: 8px;

  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  @media (max-width: 700px) {
    width: 90%;
    max-width: 700px;
  }

  @media (max-width: 768px) {
    height: 90vh;
    max-height: 500px;
  }

  @media (max-width: 480px) {
    width: 100%;
    height: 85vh;
    max-height: none;
  }
`;
const GSPanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: #f1f3f5;
  border-bottom: 1px solid #dee2e6;

  @media (max-width: 480px) {
    padding: 10px 15px;
  }
`;

const GSHeaderTitle = styled.h3`
  margin: 0;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-grow: 1;

  @media (max-width: 480px) {
    font-size: 1rem;
  }
`;

const GSButtonGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const GSSaveButton = styled.button`
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

  @media (max-width: 480px) {
    padding: 6px 12px;
    font-size: 0.9rem;
  }
`;

const GSExitButton = styled.button`
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;

  &:hover {
    color: #343a40;
  }
`;

const GSContentWrapper = styled.div`
  display: flex;
  flex-grow: 1;
  overflow: hidden;

  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const GSSidePanel = styled.div`
  width: 250px;
  height: 100%;
  background-color: #ffffff;
  border-right: 1px solid #dee2e6;
  overflow-y: auto;

  @media (max-width: 480px) {
    width: 100%;
    height: auto;
    max-height: 30vh;
    border-right: none;
    border-bottom: 1px solid #dee2e6;
  }
`;

const GSMainPanel = styled.div`
  flex-grow: 1;
  height: 100%;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  overflow-y: auto;

  @media (max-width: 480px) {
    height: auto;
  }
`;

const GSGaugeList = styled.div`
  padding: 10px;
`;

const GSGaugeItem = styled.div`
  padding: 10px 15px;
  cursor: pointer;
  background-color: ${(props) => (props.selected ? "#e9ecef" : "transparent")};
  border-radius: 4px;
  margin-bottom: 5px;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: background-color 0.2s;
  &:hover {
    background-color: #e9ecef;
  }

  @media (max-width: 768px) {
    padding: 8px 12px;
  }
`;

const GSSubHeader = styled.h4`
  margin: 0;
  padding: 15px 20px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  align-items: center;
  gap: 10px;

  @media (max-width: 768px) {
    padding: 10px 15px;
    font-size: 1rem;
  }
`;

const GSBackButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  color: #495057;
  padding: 0;
  &:hover {
    color: #212529;
  }
`;

const GSSummaryTextConfig = styled.div`
  padding: 20px;

  @media (max-width: 768px) {
    padding: 15px;
  }
`;

const GSDroppableArea = styled.div`
  min-height: 100px;
`;

const GSDraggableItem = styled.div`
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

  @media (max-width: 480px) {
    padding: 8px 12px;
    font-size: 0.9rem;
  }
`;

const GSDragHandle = styled.div`
  cursor: grab;
  margin-right: 15px;
  color: #6c757d;
`;

const GSRemoveButton = styled.button`
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  font-size: 1rem;
  padding: 0;
  margin-left: auto;
  &:hover {
    color: #c82333;
  }
`;

const GSAddItemContainer = styled.div`
  margin-top: 20px;
`;

const GSAddButton = styled.button`
  width: 100%;
  padding: 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  transition: background-color 0.2s;
  &:hover {
    background-color: #0056b3;
  }

  @media (max-width: 480px) {
    padding: 8px;
  }
`;
const GSDropdown = styled.div`
  margin-top: 5px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  max-height: 150px;
  overflow-y: auto;
`;

const GSDropdownItem = styled.div`
  padding: 10px 15px;
  cursor: pointer;
  &:hover {
    background-color: #f8f9fa;
  }

  @media (max-width: 768px) {
    padding: 8px 12px;
  }
`;

export default GaugeSettingsPopup;
