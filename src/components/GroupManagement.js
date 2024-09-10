import React, { useState } from "react";
import styled from "styled-components";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { FaChevronRight } from "react-icons/fa";

const SplitContainer = styled.div`
  display: flex;
  height: 600px;
  overflow: hidden;
  flex-direction: column;
`;

const ColumnsContainer = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const Column = styled.div`
  flex: 1;
  margin: 0 10px;
  padding: 10px;
  background-color: #fff;
  border-radius: 4px;
  overflow-y: auto;
  border: 1px solid #ddd;
  min-height: 200px;
`;

const ColumnHeader = styled.h3`
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ddd;
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
  -ms-user-select: none;
  -moz-user-select: none;
`;

const DraggableContent = styled.div`
  display: flex;
  align-items: center;
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
    const newGroupName = prompt("Enter new group name:");
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

  const renameGroup = (oldName, newName) => {
    setGroups((prevGroups) =>
      prevGroups.map((group) =>
        group.name === oldName ? { ...group, name: newName } : group
      )
    );
  };

  const toggleGroup = (groupName) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const handleSave = () => {
    onSave(groups, ungroupedMachines);
  };

  return (
    <SplitContainer>
      <ColumnsContainer>
        <DragDropContext onDragEnd={onDragEnd}>
          <Column>
            <ColumnHeader>Ungrouped Machines</ColumnHeader>
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
                            <DraggableContent>{machine.name}</DraggableContent>
                          </MachineItem>
                        )}
                      </Draggable>
                    ))
                  ) : (
                    <EmptyState>No ungrouped machines</EmptyState>
                  )}
                  {provided.placeholder}
                </DroppableArea>
              )}
            </Droppable>
          </Column>
          <Column>
            <ColumnHeader>Groups</ColumnHeader>
            {groups.map((group) => (
              <GroupContainer key={group.name}>
                <GroupHeader>
                  <GroupNameWrapper>
                    <ExpandButton onClick={() => toggleGroup(group.name)}>
                      <ToggleIcon isExpanded={expandedGroups[group.name]}>
                        <FaChevronRight />
                      </ToggleIcon>
                    </ExpandButton>
                    <GroupName
                      value={group.name}
                      onChange={(e) => renameGroup(group.name, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </GroupNameWrapper>
                  <GroupInfo>
                    <MachineCount>({group.machines.length} 台)</MachineCount>
                    <DeleteButton
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteGroup(group.name);
                      }}
                    >
                      Delete
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
                                  <DraggableContent>
                                    {machine.name}
                                  </DraggableContent>
                                </MachineItem>
                              )}
                            </Draggable>
                          ))
                        ) : (
                          <EmptyState>This group is empty</EmptyState>
                        )}
                        {provided.placeholder}
                      </DroppableArea>
                    )}
                  </Droppable>
                </GroupContent>
              </GroupContainer>
            ))}
            <AddGroupButton onClick={addGroup}>Add Group</AddGroupButton>
          </Column>
        </DragDropContext>
      </ColumnsContainer>
      <SaveButton onClick={handleSave}>Save Group Settings</SaveButton>
    </SplitContainer>
  );
};

export default GroupManagement;
