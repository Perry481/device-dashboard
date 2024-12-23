import React, { createContext, useState } from "react";

export const CompanyContext = createContext();

export const CompanyProvider = ({ children }) => {
  const [companyName] = useState("ebc");

  return (
    <CompanyContext.Provider value={{ companyName }}>
      {children}
    </CompanyContext.Provider>
  );
};
