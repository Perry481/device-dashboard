// src/components/CustomValueContainer.js
import React, { useEffect, useRef } from "react";
import { components } from "react-select";
import styled from "styled-components";

const ScrollHideContainer = styled.div`
  max-height: 100px;
  overflow-y: auto;
  width: 100%;
  ::-webkit-scrollbar {
    width: 0px;
    height: 0px;
  }
  -ms-overflow-style: none; /* Internet Explorer 10+ */
  scrollbar-width: none; /* Firefox */
`;

const CustomValueContainer = (props) => {
  const valueContainerRef = useRef(null);
  const previousLengthRef = useRef(props.selectProps.value.length);

  useEffect(() => {
    const currentLength = props.selectProps.value.length;
    if (
      valueContainerRef.current &&
      currentLength > previousLengthRef.current
    ) {
      valueContainerRef.current.scrollTop =
        valueContainerRef.current.scrollHeight;
    }
    previousLengthRef.current = currentLength;
  }, [props.children, props.selectProps.value]);

  return (
    <components.ValueContainer {...props}>
      <ScrollHideContainer ref={valueContainerRef}>
        {props.children}
      </ScrollHideContainer>
    </components.ValueContainer>
  );
};

export default CustomValueContainer;
