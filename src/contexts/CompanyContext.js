import React, { createContext, useState, useEffect } from "react";
import styled from "styled-components";

// Styled Components for Loading Screen
const LoadingContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f8f9fa;
  z-index: 9999;
`;

const LoadingCard = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  max-width: 90%;
  width: 400px;
`;

const LoadingTitle = styled.h2`
  color: #3ba272;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 500;
`;

const Spinner = styled.div`
  width: 50px;
  height: 50px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3ba272;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const LoadingScreen = () => (
  <LoadingContainer>
    <LoadingCard>
      <LoadingTitle>Device Dashboard</LoadingTitle>
      <Spinner />
      <div style={{ color: "#6c757d", fontSize: "1rem", marginTop: "1rem" }}>
        Waiting for Company Data...
      </div>
    </LoadingCard>
  </LoadingContainer>
);

// Context Implementation
export const CompanyContext = createContext();

export const CompanyProvider = ({ children }) => {
  const [companyName, setCompanyName] = useState("");
  const [isCompanyNameSet, setIsCompanyNameSet] = useState(false);
  const [loadingDelayCompleted, setLoadingDelayCompleted] = useState(false);

  useEffect(() => {
    const detectCompanyName = () => {
      const isInIframe = window !== window.top;
      let retryTimeouts = [];

      const setValidCompanyName = (name) => {
        if (!isCompanyNameSet || companyName === "") {
          setCompanyName(name);
          setIsCompanyNameSet(true);
          console.log("Valid company name set:", name);

          // Stop all retries once the company name is set
          retryTimeouts.forEach((timeout) => clearTimeout(timeout));
          retryTimeouts = [];
        }
      };

      if (process.env.NODE_ENV === "development") {
        // Development mode: default company name
        setValidCompanyName("ebc");
        console.log("Development mode: using default company name 'ebc'.");
      } else if (isInIframe) {
        const messageHandler = (event) => {
          const allowedOrigins = [
            "https://iot.jtmes.net",
            "http://localhost:8000",
          ];

          if (allowedOrigins.includes(event.origin) && event.data.companyName) {
            setValidCompanyName(event.data.companyName);
            console.log(
              "Company name received via postMessage:",
              event.data.companyName
            );
          } else {
            console.warn(
              "Received message from untrusted origin or invalid data:",
              event.origin
            );
          }
        };

        window.addEventListener("message", messageHandler);

        // Request company name explicitly from the parent
        window.parent.postMessage({ type: "REQUEST_COMPANY_NAME" }, "*");

        // Retry mechanism for document.referrer
        let retries = 0;
        const maxRetries = 5;
        const retryInterval = 500;

        const checkReferrer = () => {
          if (isCompanyNameSet) return; // Prevent further retries if already set

          try {
            const parentURL = new URL(document.referrer);
            const fallbackCompanyName = parentURL.pathname.split("/")[1];
            if (fallbackCompanyName) {
              setValidCompanyName(fallbackCompanyName);
              console.log(
                "Company name from document.referrer:",
                fallbackCompanyName
              );
            } else if (retries < maxRetries) {
              retries++;
              const timeout = setTimeout(checkReferrer, retryInterval);
              retryTimeouts.push(timeout);
            } else {
              console.warn(
                "Failed to get company name from document.referrer after retries."
              );
            }
          } catch (error) {
            retries++;
            if (retries < maxRetries) {
              const timeout = setTimeout(checkReferrer, retryInterval);
              retryTimeouts.push(timeout);
            } else {
              console.warn("Error with document.referrer after retries.");
            }
          }
        };

        const initialRetryTimeout = setTimeout(checkReferrer, 1000); // Delay the initial check
        retryTimeouts.push(initialRetryTimeout);

        return () => {
          window.removeEventListener("message", messageHandler);
          retryTimeouts.forEach((timeout) => clearTimeout(timeout)); // Clear all pending retries
        };
      } else {
        console.error("This app is expected to run in an iframe.");
      }
    };

    detectCompanyName();

    // Ensure the loading screen shows for at least 1 second
    const delayTimeout = setTimeout(() => setLoadingDelayCompleted(true), 1000);

    return () => clearTimeout(delayTimeout);
  }, [companyName, isCompanyNameSet]);

  if (!loadingDelayCompleted || !isCompanyNameSet || companyName === "") {
    return <LoadingScreen />;
  }

  return (
    <CompanyContext.Provider value={{ companyName }}>
      {children}
    </CompanyContext.Provider>
  );
};
