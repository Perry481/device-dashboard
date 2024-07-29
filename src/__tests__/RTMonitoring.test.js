import React from "react";
import { render, screen } from "@testing-library/react";
import MonitorPage from "../pages/RTMonitoring";

// Mock the fetch function
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () =>
      Promise.resolve([
        {
          name: "Meter 1",
          last_data: JSON.stringify({ Total_active_power: 100 }),
        },
        {
          name: "Meter 2",
          last_data: JSON.stringify({ Total_active_power: 200 }),
        },
      ]),
  })
);

describe("MonitorPage", () => {
  it("renders meter data", async () => {
    render(<MonitorPage />);

    // Wait for the component to update
    await screen.findByText("Meter 1");

    // Check if the meters are rendered
    expect(screen.getByText("Meter 1")).toBeInTheDocument();
    expect(screen.getByText("Meter 2")).toBeInTheDocument();
  });
});
