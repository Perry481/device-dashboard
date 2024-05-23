// SidebarContext.js
import React, { createContext, useContext, useState } from "react";

const SidebarContext = createContext({
  sidebarWidth: 250,
  setSidebarWidth: () => {},
});

export const useSidebarContext = () => useContext(SidebarContext);

export const SidebarProvider = ({ children }) => {
  const [sidebarWidth, setSidebarWidth] = useState(250); // Default width of the sidebar

  return (
    <SidebarContext.Provider value={{ sidebarWidth, setSidebarWidth }}>
      {children}
    </SidebarContext.Provider>
  );
};
