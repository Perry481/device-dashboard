import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { FaChevronRight, FaPlus, FaTimes, FaBars } from "react-icons/fa";
import { useTranslation } from "../hooks/useTranslation";
const colors = {
  primary: {
    main: "#3ba272",
    light: "rgba(59, 162, 114, 0.1)",
    border: "#e2e8f0",
    text: "#2d3748",
  },
  danger: {
    main: "#ee6666",
    hover: "#e74c4c",
  },
};

const SplitContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 600px;
  overflow: hidden;
  gap: 20px;
`;

const ColumnsContainer = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const LeftColumn = styled.div`
  flex: 0 0 auto;
  width: 300px;
  margin: 0 10px;
  padding: 16px;
  background-color: #fff;
  border-radius: 8px;
  border: 1px solid ${colors.primary.border};
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    width: 100px;
  }
  @media (max-width: 576px) {
    width: 80px;
  }
`;
const RightColumn = styled.div`
  flex: 1;
  margin: 0 10px;
  padding: 16px;
  background-color: #fff;
  border-radius: 8px;
  border: 1px solid ${colors.primary.border};
  display: flex;
  flex-direction: column;
  overflow-x: auto;
  overflow-y: auto;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const DraggableContent = styled.div`
  display: flex;
  align-items: center;

  @media (max-width: 768px) {
    ${({ isUngrouped }) =>
      isUngrouped &&
      `
      &::before {
        content: attr(data-number);
      }
      > span {
        display: none;
      }
    `}
  }
`;

const Column = styled.div`
  flex: 1;
  margin: 0 10px;
  padding: 10px;
  background-color: #fff;
  border-radius: 4px;
  border: 1px solid #ddd;
  display: flex;
  flex-direction: column;
`;

const ColumnHeader = styled.h3`
  position: relative;
  margin-bottom: 16px;
  padding-bottom: 12px;
  font-size: 1.2rem;
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
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
`;

const ListWrapper = styled.div`
  flex: 1;
  overflow-y: auto;
  max-height: 450px;
`;

const DroppableArea = styled.div`
  min-height: 100px;
`;

const EmptyState = styled.div`
  padding: 20px;
  text-align: center;
  color: #999;

  @media (max-width: 768px) {
    font-size: 12px;
    padding: 10px;
  }
`;

const MachineItem = styled.div`
  padding: 10px;
  margin-bottom: 8px;
  background-color: ${(props) =>
    props.isDragging ? colors.primary.light : "#fff"};
  border: 1px solid ${colors.primary.border};
  border-radius: 6px;
  user-select: none;
  &:hover {
    background-color: ${colors.primary.light};
    transform: translateY(-1px);
  }
  @media (max-width: 768px) {
    padding: 8px;
    font-size: 12px;
  }
`;
const GroupContainer = styled.div`
  margin-bottom: 16px;
  border: 1px solid ${colors.primary.border};
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
`;

const GroupHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: ${colors.primary.light};
  border-bottom: 1px solid ${colors.primary.border};
  @media (max-width: 768px) {
    padding: 8px 10px;
  }
`;

const GroupNameWrapper = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  margin-right: 15px;

  @media (max-width: 768px) {
    margin-right: 8px;
  }
`;

const GroupName = styled.input`
  padding: 5px 10px;
  border: 1px solid ${colors.primary.border};
  border-radius: 4px;
  background-color: white;
  font-size: 0.95rem;
  font-weight: 500;
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  &:focus {
    outline: none;
    border-color: ${colors.primary.main};
    box-shadow: 0 0 0 2px ${colors.primary.light};
  }

  @media (max-width: 768px) {
    font-size: 14px;
    padding: 4px 8px;
  }
`;

const GroupInfo = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;

  @media (max-width: 768px) {
    margin-left: 8px;
  }
`;

const MachineCount = styled.span`
  margin-right: 15px;
  color: #6c757d;
  white-space: nowrap;

  @media (max-width: 768px) {
    display: none;
  }
`;

const DeleteButton = styled.button`
  background-color: ${colors.danger.main};
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    background-color: ${colors.danger.hover};
    transform: translateY(-1px);
  }

  @media (max-width: 768px) {
    padding: 6px;
    width: 28px;
    height: 28px;
    border-radius: 4px;
    justify-content: center;
  }
`;
const ToggleIcon = styled.span`
  margin-right: 12px;
  font-size: 16px;
  color: ${colors.primary.main};
  transition: transform 0.2s;
  transform: ${(props) => (props.isExpanded ? "rotate(90deg)" : "rotate(0)")};

  @media (max-width: 768px) {
    margin-right: 8px;
    font-size: 16px;
  }
`;

const ExpandButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
`;

const GroupContent = styled.div`
  display: ${(props) => (props.isExpanded ? "block" : "none")};
  min-height: 50px;
`;

const AddGroupButton = styled.button`
  padding: 10px 20px;
  background-color: ${colors.primary.main};
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.2s ease;
  margin-top: 10px;
  align-self: center;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background-color: #2d8659;
    transform: translateY(-1px);
  }

  @media (max-width: 768px) {
    padding: 8px;
    font-size: 14px;
    width: 32px;
    height: 32px;
    border-radius: 16px;
    justify-content: center;

    span {
      display: none;
    }
  }
`;

const SaveButton = styled.button`
  padding: 10px 24px;
  background-color: ${colors.primary.main};
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.2s ease;
  align-self: flex-end;

  &:hover {
    background-color: #2d8659;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(1px);
  }

  @media (max-width: 768px) {
    padding: 8px 16px;
    font-size: 14px;
    margin-top: 16px;
  }
`;

const GroupManagement = ({
  initialGroups,
  initialUngroupedMachines,
  onSave,
}) => {
  const { t } = useTranslation();
  const [groups, setGroups] = useState(initialGroups);
  const [ungroupedMachines, setUngroupedMachines] = useState(
    initialUngroupedMachines
  );
  const [expandedGroups, setExpandedGroups] = useState({});
  const [editingGroup, setEditingGroup] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 769
  );
  const inputRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (editingGroup !== null && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingGroup]);

  const onDragEnd = (result) => {
    const { source, destination } = result;

    if (!destination) {
      return;
    }

    if (source.droppableId === destination.droppableId) {
      const listName = source.droppableId;
      const items =
        listName === "ungrouped"
          ? Array.from(ungroupedMachines)
          : Array.from(groups.find((g) => g.name === listName).machines);

      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);

      if (listName === "ungrouped") {
        setUngroupedMachines(items);
      } else {
        setGroups((prevGroups) =>
          prevGroups.map((group) =>
            group.name === listName ? { ...group, machines: items } : group
          )
        );
      }
    } else {
      const sourceItems =
        source.droppableId === "ungrouped"
          ? Array.from(ungroupedMachines)
          : Array.from(
              groups.find((g) => g.name === source.droppableId).machines
            );

      const destItems =
        destination.droppableId === "ungrouped"
          ? Array.from(ungroupedMachines)
          : Array.from(
              groups.find((g) => g.name === destination.droppableId).machines
            );

      const [movedItem] = sourceItems.splice(source.index, 1);
      destItems.splice(destination.index, 0, movedItem);

      if (source.droppableId === "ungrouped") {
        setUngroupedMachines(sourceItems);
      } else {
        setGroups((prevGroups) =>
          prevGroups.map((group) =>
            group.name === source.droppableId
              ? { ...group, machines: sourceItems }
              : group
          )
        );
      }

      if (destination.droppableId === "ungrouped") {
        setUngroupedMachines(destItems);
      } else {
        setGroups((prevGroups) =>
          prevGroups.map((group) =>
            group.name === destination.droppableId
              ? { ...group, machines: destItems }
              : group
          )
        );
      }
    }
  };

  const addGroup = () => {
    const newGroupName = prompt(t("groupSettings.newGroupPrompt"));
    if (newGroupName) {
      setGroups((prevGroups) => [
        ...prevGroups,
        { name: newGroupName, machines: [] },
      ]);
    }
  };

  const deleteGroup = (groupName) => {
    setGroups((prevGroups) => {
      const groupToDelete = prevGroups.find(
        (group) => group.name === groupName
      );
      const updatedGroups = prevGroups.filter(
        (group) => group.name !== groupName
      );
      setUngroupedMachines((prev) => [...prev, ...groupToDelete.machines]);
      return updatedGroups;
    });
  };

  const toggleGroup = (groupName) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const startEditingGroup = (groupName) => {
    setEditingGroup(groupName);
    setEditingValue(groupName);
  };

  const finishEditingGroup = () => {
    if (editingGroup !== null && editingValue.trim() !== "") {
      setGroups((prevGroups) =>
        prevGroups.map((group) =>
          group.name === editingGroup
            ? { ...group, name: editingValue.trim() }
            : group
        )
      );
    }
    setEditingGroup(null);
    setEditingValue("");
  };

  const handleInputChange = (e) => {
    setEditingValue(e.target.value);
  };

  const handleInputKeyPress = (e) => {
    if (e.key === "Enter") {
      finishEditingGroup();
    }
  };

  const handleSave = () => {
    onSave(groups, ungroupedMachines);
  };

  const getNumberFromMachineName = (name) => {
    const match = name.match(/\d+/);
    return match ? match[0] : "";
  };

  return (
    <SplitContainer>
      <ColumnsContainer>
        <DragDropContext onDragEnd={onDragEnd}>
          <LeftColumn>
            <ColumnHeader>{t("groupSettings.ungroupedMachines")}</ColumnHeader>
            <ListWrapper>
              <Droppable droppableId="ungrouped">
                {(provided) => (
                  <DroppableArea
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {ungroupedMachines.length > 0 ? (
                      ungroupedMachines.map((machine, index) => (
                        <Draggable
                          key={machine.id}
                          draggableId={machine.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <MachineItem
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              isDragging={snapshot.isDragging}
                            >
                              <DraggableContent
                                isUngrouped={true}
                                data-number={getNumberFromMachineName(
                                  machine.name
                                )}
                              >
                                <span>{machine.name}</span>
                              </DraggableContent>
                            </MachineItem>
                          )}
                        </Draggable>
                      ))
                    ) : (
                      <EmptyState>
                        {t("groupSettings.noUngroupedMachines")}
                      </EmptyState>
                    )}
                    {provided.placeholder}
                  </DroppableArea>
                )}
              </Droppable>
            </ListWrapper>
          </LeftColumn>

          <RightColumn>
            <ColumnHeader>{t("groupSettings.meterGroups")}</ColumnHeader>
            <ListWrapper>
              {groups.map((group) => (
                <GroupContainer key={group.name}>
                  <GroupHeader>
                    <GroupNameWrapper>
                      <ExpandButton onClick={() => toggleGroup(group.name)}>
                        <ToggleIcon isExpanded={expandedGroups[group.name]}>
                          <FaChevronRight />
                        </ToggleIcon>
                      </ExpandButton>
                      {editingGroup === group.name ? (
                        <GroupName
                          ref={inputRef}
                          value={editingValue}
                          onChange={handleInputChange}
                          onBlur={finishEditingGroup}
                          onKeyPress={handleInputKeyPress}
                        />
                      ) : (
                        <GroupName
                          as="div"
                          onClick={() => startEditingGroup(group.name)}
                        >
                          {group.name}
                        </GroupName>
                      )}
                    </GroupNameWrapper>
                    <GroupInfo>
                      <MachineCount>
                        (
                        {t("groupSettings.machineCount", {
                          count: group.machines.length,
                        })}
                        )
                      </MachineCount>
                      <DeleteButton
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteGroup(group.name);
                        }}
                      >
                        {windowWidth <= 768 ? (
                          <FaTimes />
                        ) : (
                          t("groupSettings.deleteGroup")
                        )}
                      </DeleteButton>
                    </GroupInfo>
                  </GroupHeader>
                  <GroupContent isExpanded={expandedGroups[group.name]}>
                    <Droppable droppableId={group.name}>
                      {(provided) => (
                        <DroppableArea
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                        >
                          {group.machines.length > 0 ? (
                            group.machines.map((machine, index) => (
                              <Draggable
                                key={machine.id}
                                draggableId={machine.id}
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <MachineItem
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    isDragging={snapshot.isDragging}
                                  >
                                    <DraggableContent isUngrouped={false}>
                                      {machine.name}
                                    </DraggableContent>
                                  </MachineItem>
                                )}
                              </Draggable>
                            ))
                          ) : (
                            <EmptyState>
                              {t("groupSettings.emptyGroup")}
                            </EmptyState>
                          )}
                          {provided.placeholder}
                        </DroppableArea>
                      )}
                    </Droppable>
                  </GroupContent>
                </GroupContainer>
              ))}
            </ListWrapper>
            <AddGroupButton onClick={addGroup}>
              <FaPlus />
              <span>{t("groupSettings.addGroup")}</span>
            </AddGroupButton>
          </RightColumn>
        </DragDropContext>
      </ColumnsContainer>
      <SaveButton onClick={handleSave}>
        {t("groupSettings.saveButton")}
      </SaveButton>
    </SplitContainer>
  );
};

export default GroupManagement;
