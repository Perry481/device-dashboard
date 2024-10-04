import React, { createContext, useState, useEffect } from "react";

export const CompanyContext = createContext();

export const CompanyProvider = ({ children }) => {
  const [companyName, setCompanyName] = useState("ebc");

  useEffect(() => {
    console.log("Company Name set to:", companyName);
  }, [companyName]);

  return (
    <CompanyContext.Provider value={{ companyName }}>
      {children}
    </CompanyContext.Provider>
  );
};
