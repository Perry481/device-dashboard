// components/MainLayout.js
import React from "react";
import styled from "styled-components";

const PageWrapper = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const MainLayout = ({ children }) => {
  return <PageWrapper>{children}</PageWrapper>;
};

export default MainLayout;
