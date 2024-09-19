import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { FaChevronRight, FaPlus, FaTimes, FaBars } from "react-icons/fa";
const SplitContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 600px;
  overflow: hidden;
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
  padding: 10px;
  background-color: #fff;
  border-radius: 4px;
  border: 1px solid #ddd;
  display: flex;
  flex-direction: column;
  overflow-y: auto;

  @media (max-width: 768px) {
    width: 80px;
  }
`;

const RightColumn = styled.div`
  flex: 1;
  margin: 0 10px;
  padding: 10px;
  background-color: #fff;
  border-radius: 4px;
  border: 1px solid #ddd;
  display: flex;
  flex-direction: column;
  overflow-x: auto;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`;

const RightColumnWrapper = styled.div`
  flex: 1;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
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
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ddd;
  font-size: 1.2rem;

  @media (max-width: 768px) {
    font-size: 1rem;
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
`;

const MachineItem = styled.div`
  padding: 10px;
  margin-bottom: 8px;
  background-color: ${(props) => (props.isDragging ? "#e0e0e0" : "#f8f9fa")};
  border: 1px solid #ddd;
  border-radius: 4px;
  user-select: none;
`;

const GroupContainer = styled.div`
  margin-bottom: 20px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  overflow: hidden;
`;

const GroupHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
`;

const GroupNameWrapper = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  margin-right: 15px;
`;

const GroupName = styled.input`
  padding: 5px 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  background-color: #f1f3f5;
  font-size: 16px;
  font-weight: bold;
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  &:focus {
    outline: none;
    background-color: #fff;
    border-color: #80bdff;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  }
`;

const GroupInfo = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
`;

const MachineCount = styled.span`
  margin-right: 15px;
  color: #6c757d;
  white-space: nowrap;
`;

const DeleteButton = styled.button`
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
  &:hover {
    background-color: #c82333;
  }
`;

const ToggleIcon = styled.span`
  margin-right: 15px;
  font-size: 20px;
  color: #007bff;
  transition: transform 0.2s;
  transform: ${(props) => (props.isExpanded ? "rotate(90deg)" : "rotate(0)")};
  flex-shrink: 0;
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
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.2s;
  margin-top: 10px;
  align-self: center;

  &:hover {
    background-color: #0056b3;
  }
`;

const SaveButton = styled.button`
  padding: 10px 20px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.2s;
  margin-top: 20px;
  align-self: flex-end;

  &:hover {
    background-color: #218838;
  }
`;

const GroupManagement = ({
  initialGroups,
  initialUngroupedMachines,
  onSave,
}) => {
  const [groups, setGroups] = useState(initialGroups);
  const [ungroupedMachines, setUngroupedMachines] = useState(
    initialUngroupedMachines
  );
  const [expandedGroups, setExpandedGroups] = useState({});
  const [editingGroup, setEditingGroup] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const inputRef = useRef(null);

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
      // Reordering within the same list
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
      // Moving between lists
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
    const newGroupName = prompt("輸入新分組名:");
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
            <ColumnHeader>未分組機器</ColumnHeader>
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
                      <EmptyState>沒有未分組的機器</EmptyState>
                    )}
                    {provided.placeholder}
                  </DroppableArea>
                )}
              </Droppable>
            </ListWrapper>
          </LeftColumn>

          <RightColumn>
            <ColumnHeader>電表組</ColumnHeader>
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
                      <MachineCount>({group.machines.length} 台)</MachineCount>
                      <DeleteButton
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteGroup(group.name);
                        }}
                      >
                        刪除
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
                            <EmptyState>此分組為空</EmptyState>
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
              <FaPlus /> 新增分組
            </AddGroupButton>
          </RightColumn>
        </DragDropContext>
      </ColumnsContainer>
      <SaveButton onClick={handleSave}>儲存分組設定</SaveButton>
    </SplitContainer>
  );
};
export default GroupManagement;
