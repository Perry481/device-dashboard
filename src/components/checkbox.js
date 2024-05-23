import React, { useState, useEffect } from "react";

const dates = {
  2021: { Q1: [1, 2, 3], Q2: [4, 5, 6], Q3: [7, 8, 9], Q4: [10, 11, 12] },
  2022: { Q1: [1, 2, 3], Q2: [4, 5, 6], Q3: [7, 8, 9], Q4: [10, 11, 12] },
  2023: { Q1: [1, 2, 3], Q2: [4, 5, 6], Q3: [7, 8, 9], Q4: [10, 11, 12] },
  2024: { Q1: [1, 2, 3], Q2: [4, 5, 6], Q3: [7, 8, 9], Q4: [10, 11, 12] },
};

const initializeSelections = (dates) => {
  const initSelections = {};
  Object.keys(dates).forEach((year) => {
    initSelections[year] = {};
    Object.keys(dates[year]).forEach((quarter) => {
      initSelections[year][quarter] = {};
      dates[year][quarter].forEach((month) => {
        initSelections[year][quarter][month] = false;
      });
    });
  });
  return initSelections;
};

const Checkbox = ({ onUpdate, isLoading }) => {
  const [selections, setSelections] = useState(() =>
    initializeSelections(dates)
  );
  const [collapsedQuarters, setCollapsedQuarters] = useState(() =>
    Object.keys(dates).reduce((acc, year) => {
      acc[year] = Object.keys(dates[year]).reduce((quarterAcc, quarter) => {
        quarterAcc[quarter] = true; // default to collapsed
        return quarterAcc;
      }, {});
      return acc;
    }, {})
  );
  const [collapsedYears, setCollapsedYears] = useState(() =>
    Object.keys(dates).reduce((acc, year) => {
      acc[year] = true; // default to collapsed
      return acc;
    }, {})
  );

  const handleCheckboxChange = (year, quarter, month) => {
    const newSelections = JSON.parse(JSON.stringify(selections));

    if (month) {
      // Toggle the specific month
      newSelections[year][quarter][month] =
        !newSelections[year][quarter][month];
    } else if (quarter) {
      // Toggle all months within the quarter
      const allSelected = dates[year][quarter].every(
        (m) => newSelections[year][quarter][m]
      );
      dates[year][quarter].forEach((m) => {
        newSelections[year][quarter][m] = !allSelected;
      });
    } else if (year) {
      // Toggle all quarters and their months within the year
      const allSelected = Object.keys(dates[year]).every((q) =>
        dates[year][q].every((m) => newSelections[year][q][m])
      );
      Object.keys(dates[year]).forEach((q) => {
        dates[year][q].forEach((m) => {
          newSelections[year][q][m] = !allSelected;
        });
      });
    } else {
      const allSelected = Object.keys(newSelections).every((y) =>
        Object.keys(newSelections[y]).every((q) =>
          Object.values(newSelections[y][q]).every(Boolean)
        )
      );
      Object.keys(newSelections).forEach((y) => {
        Object.keys(newSelections[y]).forEach((q) => {
          Object.keys(newSelections[y][q]).forEach((m) => {
            newSelections[y][q][m] = !allSelected;
          });
        });
      });
    }

    setSelections(newSelections);
    updateIndeterminateStates(newSelections);
    onUpdate(newSelections);
  };

  const handleQuarterToggle = (year, quarter) => {
    setCollapsedQuarters((prev) => ({
      ...prev,
      [year]: {
        ...prev[year],
        [quarter]: !prev[year][quarter],
      },
    }));
  };

  const handleYearToggle = (year) => {
    setCollapsedYears((prev) => ({
      ...prev,
      [year]: !prev[year],
    }));
  };

  const updateIndeterminateStates = (selections) => {
    Object.keys(dates).forEach((year) => {
      const yearCheckbox = document.getElementById(`year-${year}`);
      const totalQuarters = Object.keys(dates[year]).length;
      let selectedQuarters = 0;

      Object.keys(dates[year]).forEach((quarter) => {
        let allMonthsSelected = dates[year][quarter].every(
          (month) => selections[year][quarter][month]
        );
        if (allMonthsSelected) {
          selectedQuarters += 1;
        }
      });

      if (selectedQuarters === 0) {
        yearCheckbox.indeterminate = false;
        yearCheckbox.checked = false;
      } else if (selectedQuarters === totalQuarters) {
        yearCheckbox.indeterminate = false;
        yearCheckbox.checked = true;
      } else {
        yearCheckbox.indeterminate = true;
      }
    });
  };

  return (
    <div className="card" style={{ maxHeight: "350px", overflowY: "auto" }}>
      {isLoading && (
        <div className="overlay">
          <i className="fas fa-2x fa-sync-alt fa-spin"></i>
        </div>
      )}
      <div className="card-header">
        <h3 className="card-title">選擇日期</h3>
      </div>
      <div className="card-body">
        <div className="form-check">
          <input
            type="checkbox"
            className="form-check-input"
            id="select-all"
            onChange={() => handleCheckboxChange()}
            checked={Object.keys(selections).every((year) =>
              Object.keys(selections[year]).every((quarter) =>
                Object.values(selections[year][quarter]).every(Boolean)
              )
            )}
          />
          <label className="form-check-label" htmlFor="select-all">
            全選
          </label>
        </div>
        {Object.keys(dates).map((year) => (
          <div key={year}>
            <div
              className="form-check"
              style={{ display: "flex", alignItems: "center" }}
            >
              <input
                className="form-check-input"
                type="checkbox"
                checked={
                  selections[year] &&
                  Object.keys(dates[year]).every(
                    (quarter) =>
                      selections[year][quarter] &&
                      dates[year][quarter].every(
                        (month) => selections[year][quarter][month]
                      )
                  )
                }
                onChange={() => handleCheckboxChange(year)}
                id={`year-${year}`}
              />
              <label className="form-check-label" htmlFor={`year-${year}`}>
                {year}
              </label>
              <span
                style={{ cursor: "pointer", marginLeft: "auto" }}
                onClick={() => handleYearToggle(year)}
              >
                {collapsedYears[year] ? "▼" : "▲"}
              </span>
            </div>
            {!collapsedYears[year] &&
              Object.keys(dates[year]).map((quarter) => (
                <div key={quarter} style={{ paddingLeft: 20 }}>
                  <div
                    className="form-check"
                    style={{ display: "flex", alignItems: "center" }}
                  >
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={
                        selections[year] &&
                        selections[year][quarter] &&
                        dates[year][quarter].every(
                          (month) => selections[year][quarter][month]
                        )
                      }
                      onChange={() => handleCheckboxChange(year, quarter)}
                      id={`quarter-${year}-${quarter}`}
                    />
                    <label
                      className="form-check-label"
                      htmlFor={`quarter-${year}-${quarter}`}
                    >
                      {quarter}
                    </label>
                    <span
                      style={{ cursor: "pointer", marginLeft: "auto" }}
                      onClick={() => handleQuarterToggle(year, quarter)}
                    >
                      {collapsedQuarters[year][quarter] ? "▼" : "▲"}
                    </span>
                  </div>
                  {!collapsedQuarters[year][quarter] &&
                    dates[year][quarter].map((month) => (
                      <div key={month} style={{ paddingLeft: 40 }}>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={
                              selections[year] &&
                              selections[year][quarter] &&
                              selections[year][quarter][month]
                            }
                            onChange={() =>
                              handleCheckboxChange(year, quarter, month)
                            }
                            id={`month-${year}-${quarter}-${month}`}
                          />
                          <label
                            className="form-check-label"
                            htmlFor={`month-${year}-${quarter}-${month}`}
                          >
                            {month}
                          </label>
                        </div>
                      </div>
                    ))}
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Checkbox;
