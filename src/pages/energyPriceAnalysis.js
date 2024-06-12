// src/pages/energyPriceAnalysis.js
import React, { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import * as echarts from "echarts";

import DataTableComponent from "../components/DataTableComponent";
import DetailCard from "../components/DetailCard";
import PriceTable from "../components/PriceTable";

const dummyData = [
  {
    Key: "2024/03/01 07",
    Value: 0,
  },
  {
    Key: "2024/03/01 08",
    Value: 0,
  },
  {
    Key: "2024/03/01 09",
    Value: 0,
  },
  {
    Key: "2024/03/01 10",
    Value: 0,
  },
  {
    Key: "2024/03/01 11",
    Value: 0,
  },
  {
    Key: "2024/03/01 12",
    Value: 0,
  },
  {
    Key: "2024/03/01 13",
    Value: 0,
  },
  {
    Key: "2024/03/01 14",
    Value: 0.01,
  },
  {
    Key: "2024/03/01 15",
    Value: 0,
  },
  {
    Key: "2024/03/01 16",
    Value: 1.12,
  },
  {
    Key: "2024/03/01 17",
    Value: 0,
  },
  {
    Key: "2024/03/01 18",
    Value: 0,
  },
  {
    Key: "2024/03/01 19",
    Value: 0.01,
  },
  {
    Key: "2024/03/02 08",
    Value: 0.01,
  },
  {
    Key: "2024/03/02 09",
    Value: 0,
  },
  {
    Key: "2024/03/02 10",
    Value: 0,
  },
  {
    Key: "2024/03/02 11",
    Value: 0,
  },
  {
    Key: "2024/03/02 12",
    Value: 0,
  },
  {
    Key: "2024/03/02 13",
    Value: 0,
  },
  {
    Key: "2024/03/02 14",
    Value: 0,
  },
  {
    Key: "2024/03/02 15",
    Value: 0,
  },
  {
    Key: "2024/03/02 16",
    Value: 0,
  },
  {
    Key: "2024/03/02 17",
    Value: 0.05,
  },
  {
    Key: "2024/03/04 07",
    Value: 0,
  },
  {
    Key: "2024/03/04 08",
    Value: 0.05,
  },
  {
    Key: "2024/03/04 09",
    Value: 1.62,
  },
  {
    Key: "2024/03/04 10",
    Value: 0.74,
  },
  {
    Key: "2024/03/04 11",
    Value: 1.02,
  },
  {
    Key: "2024/03/04 12",
    Value: 0.25,
  },
  {
    Key: "2024/03/04 13",
    Value: 1.27,
  },
  {
    Key: "2024/03/04 14",
    Value: 1.29,
  },
  {
    Key: "2024/03/04 15",
    Value: 1.12,
  },
  {
    Key: "2024/03/04 16",
    Value: 1.28,
  },
  {
    Key: "2024/03/04 17",
    Value: 0.03,
  },
  {
    Key: "2024/03/05 07",
    Value: 0.34,
  },
  {
    Key: "2024/03/05 08",
    Value: 0.26,
  },
  {
    Key: "2024/03/05 09",
    Value: 0.31,
  },
  {
    Key: "2024/03/05 10",
    Value: 0.25,
  },
  {
    Key: "2024/03/05 11",
    Value: 0,
  },
  {
    Key: "2024/03/05 12",
    Value: 0,
  },
  {
    Key: "2024/03/05 13",
    Value: 0,
  },
  {
    Key: "2024/03/05 14",
    Value: 0,
  },
  {
    Key: "2024/03/05 15",
    Value: 0,
  },
  {
    Key: "2024/03/05 16",
    Value: 0,
  },
  {
    Key: "2024/03/05 17",
    Value: 0.02,
  },
  {
    Key: "2024/03/06 07",
    Value: 0.3,
  },
  {
    Key: "2024/03/06 08",
    Value: 0.26,
  },
  {
    Key: "2024/03/06 09",
    Value: 0.84,
  },
  {
    Key: "2024/03/06 10",
    Value: 1.18,
  },
  {
    Key: "2024/03/06 11",
    Value: 1.35,
  },
  {
    Key: "2024/03/06 12",
    Value: 0.25,
  },
  {
    Key: "2024/03/06 13",
    Value: 1.2,
  },
  {
    Key: "2024/03/06 14",
    Value: 1.25,
  },
  {
    Key: "2024/03/06 15",
    Value: 1.08,
  },
  {
    Key: "2024/03/06 16",
    Value: 1.2,
  },
  {
    Key: "2024/03/06 17",
    Value: 1.21,
  },
  {
    Key: "2024/03/06 18",
    Value: 0.04,
  },
  {
    Key: "2024/03/06 19",
    Value: 0.01,
  },
  {
    Key: "2024/03/07 07",
    Value: 0,
  },
  {
    Key: "2024/03/07 08",
    Value: 0,
  },
  {
    Key: "2024/03/07 09",
    Value: 0,
  },
  {
    Key: "2024/03/07 10",
    Value: 0.01,
  },
  {
    Key: "2024/03/07 11",
    Value: 0,
  },
  {
    Key: "2024/03/07 12",
    Value: 0,
  },
  {
    Key: "2024/03/07 13",
    Value: 0.9,
  },
  {
    Key: "2024/03/07 14",
    Value: 0,
  },
  {
    Key: "2024/03/07 15",
    Value: 0,
  },
  {
    Key: "2024/03/07 16",
    Value: 0,
  },
  {
    Key: "2024/03/07 17",
    Value: 0.01,
  },
  {
    Key: "2024/03/07 18",
    Value: 0,
  },
  {
    Key: "2024/03/07 19",
    Value: 0.01,
  },
  {
    Key: "2024/03/08 07",
    Value: 0,
  },
  {
    Key: "2024/03/08 08",
    Value: 0,
  },
  {
    Key: "2024/03/08 09",
    Value: 0,
  },
  {
    Key: "2024/03/08 10",
    Value: 0.91,
  },
  {
    Key: "2024/03/08 11",
    Value: 1.15,
  },
  {
    Key: "2024/03/08 12",
    Value: 0.25,
  },
  {
    Key: "2024/03/08 13",
    Value: 0.18,
  },
  {
    Key: "2024/03/08 14",
    Value: 0,
  },
  {
    Key: "2024/03/08 15",
    Value: 0,
  },
  {
    Key: "2024/03/08 16",
    Value: 0,
  },
  {
    Key: "2024/03/08 17",
    Value: 0.07,
  },
  {
    Key: "2024/03/11 07",
    Value: 0,
  },
  {
    Key: "2024/03/11 08",
    Value: 0.32,
  },
  {
    Key: "2024/03/11 09",
    Value: 1.27,
  },
  {
    Key: "2024/03/11 10",
    Value: 1.06,
  },
  {
    Key: "2024/03/11 11",
    Value: 0.94,
  },
  {
    Key: "2024/03/11 12",
    Value: 0.27,
  },
  {
    Key: "2024/03/11 13",
    Value: 1.22,
  },
  {
    Key: "2024/03/11 14",
    Value: 0.9,
  },
  {
    Key: "2024/03/11 15",
    Value: 0.54,
  },
  {
    Key: "2024/03/11 16",
    Value: 0,
  },
  {
    Key: "2024/03/11 17",
    Value: 0.01,
  },
  {
    Key: "2024/03/12 07",
    Value: 0.01,
  },
  {
    Key: "2024/03/12 08",
    Value: 0,
  },
  {
    Key: "2024/03/12 09",
    Value: 0,
  },
  {
    Key: "2024/03/12 10",
    Value: 0,
  },
  {
    Key: "2024/03/12 11",
    Value: 0,
  },
  {
    Key: "2024/03/12 12",
    Value: 0,
  },
  {
    Key: "2024/03/12 13",
    Value: 0.29,
  },
  {
    Key: "2024/03/12 14",
    Value: 1.41,
  },
  {
    Key: "2024/03/12 15",
    Value: 1.22,
  },
  {
    Key: "2024/03/12 16",
    Value: 1.37,
  },
  {
    Key: "2024/03/12 17",
    Value: 0.05,
  },
  {
    Key: "2024/03/13 07",
    Value: 0.32,
  },
  {
    Key: "2024/03/13 08",
    Value: 1.23,
  },
  {
    Key: "2024/03/13 09",
    Value: 1.58,
  },
  {
    Key: "2024/03/13 10",
    Value: 1.15,
  },
  {
    Key: "2024/03/13 11",
    Value: 1.06,
  },
  {
    Key: "2024/03/13 12",
    Value: 0,
  },
  {
    Key: "2024/03/13 13",
    Value: 1.25,
  },
  {
    Key: "2024/03/13 14",
    Value: 1.26,
  },
  {
    Key: "2024/03/13 15",
    Value: 1.06,
  },
  {
    Key: "2024/03/13 16",
    Value: 1.09,
  },
  {
    Key: "2024/03/13 17",
    Value: 0.01,
  },
  {
    Key: "2024/03/14 07",
    Value: 0.33,
  },
  {
    Key: "2024/03/14 08",
    Value: 1.16,
  },
  {
    Key: "2024/03/14 09",
    Value: 1.38,
  },
  {
    Key: "2024/03/14 10",
    Value: 1.18,
  },
  {
    Key: "2024/03/14 11",
    Value: 1.35,
  },
  {
    Key: "2024/03/14 12",
    Value: 0.26,
  },
  {
    Key: "2024/03/14 13",
    Value: 1.36,
  },
  {
    Key: "2024/03/14 14",
    Value: 1.31,
  },
  {
    Key: "2024/03/14 15",
    Value: 1.1,
  },
  {
    Key: "2024/03/14 16",
    Value: 1.34,
  },
  {
    Key: "2024/03/14 17",
    Value: 0.02,
  },
  {
    Key: "2024/03/15 07",
    Value: 0.3,
  },
  {
    Key: "2024/03/15 08",
    Value: 0.31,
  },
  {
    Key: "2024/03/15 09",
    Value: 0,
  },
  {
    Key: "2024/03/15 10",
    Value: 0,
  },
  {
    Key: "2024/03/15 11",
    Value: 0,
  },
  {
    Key: "2024/03/15 12",
    Value: 0,
  },
  {
    Key: "2024/03/15 13",
    Value: 0.01,
  },
  {
    Key: "2024/03/15 14",
    Value: 0,
  },
  {
    Key: "2024/03/15 15",
    Value: 0,
  },
  {
    Key: "2024/03/15 16",
    Value: 0,
  },
  {
    Key: "2024/03/15 17",
    Value: 0,
  },
  {
    Key: "2024/03/15 18",
    Value: 0,
  },
  {
    Key: "2024/03/15 19",
    Value: 0.02,
  },
  {
    Key: "2024/03/16 07",
    Value: 0,
  },
  {
    Key: "2024/03/16 08",
    Value: 0,
  },
  {
    Key: "2024/03/16 09",
    Value: 0,
  },
  {
    Key: "2024/03/16 10",
    Value: 0,
  },
  {
    Key: "2024/03/16 11",
    Value: 0,
  },
  {
    Key: "2024/03/16 12",
    Value: 0.05,
  },
  {
    Key: "2024/03/18 07",
    Value: 0,
  },
  {
    Key: "2024/03/18 08",
    Value: 0,
  },
  {
    Key: "2024/03/18 09",
    Value: 0,
  },
  {
    Key: "2024/03/18 10",
    Value: 0.83,
  },
  {
    Key: "2024/03/18 11",
    Value: 0.79,
  },
  {
    Key: "2024/03/18 12",
    Value: 0,
  },
  {
    Key: "2024/03/18 13",
    Value: 0.36,
  },
  {
    Key: "2024/03/18 14",
    Value: 1.22,
  },
  {
    Key: "2024/03/18 15",
    Value: 1.26,
  },
  {
    Key: "2024/03/18 16",
    Value: 1.31,
  },
  {
    Key: "2024/03/18 17",
    Value: 0.02,
  },
  {
    Key: "2024/03/19 07",
    Value: 0.3,
  },
  {
    Key: "2024/03/19 08",
    Value: 1.22,
  },
  {
    Key: "2024/03/19 09",
    Value: 1.4,
  },
  {
    Key: "2024/03/19 10",
    Value: 1.14,
  },
  {
    Key: "2024/03/19 11",
    Value: 1.29,
  },
  {
    Key: "2024/03/19 12",
    Value: 0.26,
  },
  {
    Key: "2024/03/19 13",
    Value: 1.49,
  },
  {
    Key: "2024/03/19 14",
    Value: 1.48,
  },
  {
    Key: "2024/03/19 15",
    Value: 1.21,
  },
  {
    Key: "2024/03/19 16",
    Value: 1.04,
  },
  {
    Key: "2024/03/19 17",
    Value: 0.01,
  },
  {
    Key: "2024/03/20 07",
    Value: 0,
  },
  {
    Key: "2024/03/20 08",
    Value: 0.01,
  },
  {
    Key: "2024/03/20 09",
    Value: 0,
  },
  {
    Key: "2024/03/20 10",
    Value: 0,
  },
  {
    Key: "2024/03/20 11",
    Value: 0,
  },
  {
    Key: "2024/03/20 12",
    Value: 0,
  },
  {
    Key: "2024/03/20 13",
    Value: 0,
  },
  {
    Key: "2024/03/20 14",
    Value: 0.51,
  },
  {
    Key: "2024/03/20 15",
    Value: 0.69,
  },
  {
    Key: "2024/03/20 16",
    Value: 0,
  },
  {
    Key: "2024/03/20 17",
    Value: 0.02,
  },
  {
    Key: "2024/03/21 07",
    Value: 0,
  },
  {
    Key: "2024/03/21 08",
    Value: 0,
  },
  {
    Key: "2024/03/21 09",
    Value: 0,
  },
  {
    Key: "2024/03/21 10",
    Value: 0,
  },
  {
    Key: "2024/03/21 11",
    Value: 0,
  },
  {
    Key: "2024/03/21 12",
    Value: 0.01,
  },
  {
    Key: "2024/03/21 13",
    Value: 0,
  },
  {
    Key: "2024/03/21 14",
    Value: 0,
  },
  {
    Key: "2024/03/21 15",
    Value: 1.03,
  },
  {
    Key: "2024/03/21 16",
    Value: 0.77,
  },
  {
    Key: "2024/03/21 17",
    Value: 0.02,
  },
  {
    Key: "2024/03/22 07",
    Value: 0,
  },
  {
    Key: "2024/03/22 08",
    Value: 1.3,
  },
  {
    Key: "2024/03/22 09",
    Value: 1.1,
  },
  {
    Key: "2024/03/22 10",
    Value: 0.98,
  },
  {
    Key: "2024/03/22 11",
    Value: 0.95,
  },
  {
    Key: "2024/03/22 12",
    Value: 0.24,
  },
  {
    Key: "2024/03/22 13",
    Value: 1,
  },
  {
    Key: "2024/03/22 14",
    Value: 1.02,
  },
  {
    Key: "2024/03/22 15",
    Value: 0.92,
  },
  {
    Key: "2024/03/22 16",
    Value: 0.88,
  },
  {
    Key: "2024/03/22 17",
    Value: 0.02,
  },
  {
    Key: "2024/03/23 07",
    Value: 0,
  },
  {
    Key: "2024/03/23 08",
    Value: 0,
  },
  {
    Key: "2024/03/23 09",
    Value: 0.05,
  },
  {
    Key: "2024/03/25 07",
    Value: 0.31,
  },
  {
    Key: "2024/03/25 08",
    Value: 1.13,
  },
  {
    Key: "2024/03/25 09",
    Value: 1.03,
  },
  {
    Key: "2024/03/25 10",
    Value: 0.89,
  },
  {
    Key: "2024/03/25 11",
    Value: 1.03,
  },
  {
    Key: "2024/03/25 12",
    Value: 0.23,
  },
  {
    Key: "2024/03/25 13",
    Value: 1.44,
  },
  {
    Key: "2024/03/25 14",
    Value: 1.02,
  },
  {
    Key: "2024/03/25 15",
    Value: 0.88,
  },
  {
    Key: "2024/03/25 16",
    Value: 0.63,
  },
  {
    Key: "2024/03/25 17",
    Value: 0.02,
  },
  {
    Key: "2024/03/26 07",
    Value: 0.22,
  },
  {
    Key: "2024/03/26 08",
    Value: 0.24,
  },
  {
    Key: "2024/03/26 09",
    Value: 0.22,
  },
  {
    Key: "2024/03/26 10",
    Value: 0.22,
  },
  {
    Key: "2024/03/26 11",
    Value: 0.22,
  },
  {
    Key: "2024/03/26 12",
    Value: 0.22,
  },
  {
    Key: "2024/03/26 13",
    Value: 0.21,
  },
  {
    Key: "2024/03/26 14",
    Value: 0.6,
  },
  {
    Key: "2024/03/26 15",
    Value: 1.1,
  },
  {
    Key: "2024/03/26 16",
    Value: 1.15,
  },
  {
    Key: "2024/03/26 17",
    Value: 0.02,
  },
  {
    Key: "2024/03/27 07",
    Value: 0.22,
  },
  {
    Key: "2024/03/27 08",
    Value: 1.16,
  },
  {
    Key: "2024/03/27 09",
    Value: 0.31,
  },
  {
    Key: "2024/03/27 10",
    Value: 0.21,
  },
  {
    Key: "2024/03/27 11",
    Value: 0.22,
  },
  {
    Key: "2024/03/27 12",
    Value: 0.22,
  },
  {
    Key: "2024/03/27 13",
    Value: 0.22,
  },
  {
    Key: "2024/03/27 14",
    Value: 0.7,
  },
  {
    Key: "2024/03/27 15",
    Value: 1.13,
  },
  {
    Key: "2024/03/27 16",
    Value: 1.22,
  },
  {
    Key: "2024/03/27 17",
    Value: 0.02,
  },
  {
    Key: "2024/03/28 07",
    Value: 0.23,
  },
  {
    Key: "2024/03/28 08",
    Value: 1.15,
  },
  {
    Key: "2024/03/28 09",
    Value: 1.4,
  },
  {
    Key: "2024/03/28 10",
    Value: 0.91,
  },
  {
    Key: "2024/03/28 11",
    Value: 1.32,
  },
  {
    Key: "2024/03/28 12",
    Value: 0.25,
  },
  {
    Key: "2024/03/28 13",
    Value: 1.49,
  },
  {
    Key: "2024/03/28 14",
    Value: 1.56,
  },
  {
    Key: "2024/03/28 15",
    Value: 1.18,
  },
  {
    Key: "2024/03/28 16",
    Value: 1.24,
  },
  {
    Key: "2024/03/28 17",
    Value: 0.02,
  },
  {
    Key: "2024/03/28 18",
    Value: 0,
  },
  {
    Key: "2024/03/28 19",
    Value: 0.01,
  },
  {
    Key: "2024/03/29 07",
    Value: 0.34,
  },
  {
    Key: "2024/03/29 08",
    Value: 1.19,
  },
  {
    Key: "2024/03/29 09",
    Value: 0.74,
  },
  {
    Key: "2024/03/29 10",
    Value: 0,
  },
  {
    Key: "2024/03/29 11",
    Value: 0,
  },
  {
    Key: "2024/03/29 12",
    Value: 0,
  },
  {
    Key: "2024/03/29 13",
    Value: 0,
  },
  {
    Key: "2024/03/29 14",
    Value: 0,
  },
  {
    Key: "2024/03/29 15",
    Value: 0,
  },
  {
    Key: "2024/03/29 16",
    Value: 0.01,
  },
  {
    Key: "2024/03/29 17",
    Value: 0.02,
  },
  {
    Key: "2024/03/30 14",
    Value: 0,
  },
  {
    Key: "2024/03/30 15",
    Value: 0,
  },
  {
    Key: "2024/03/30 16",
    Value: 0,
  },
  {
    Key: "2024/03/30 17",
    Value: 0.05,
  },
];

const removeYearFromDate = (data) => {
  return data.map((item) => {
    const dateWithoutYear = item.Key.split(" ")[0].slice(5); // Remove the year from the date
    return {
      ...item,
      Key: dateWithoutYear + " " + item.Key.split(" ")[1], // Reassemble the key without the year
    };
  });
};

const getDayOfWeek = (dateStr) => {
  const daysOfWeek = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];
  const date = new Date(`2024/${dateStr}`); // Re-add a year for date parsing
  return daysOfWeek[date.getDay()];
};

const categorizeData = (data) => {
  return data.map((item) => {
    const date = new Date(`2024/${item.Key.split(" ")[0]}`);
    const day = date.getDay();
    const hour = parseInt(item.Key.split(" ")[1]);
    const month = date.getMonth() + 1; // getMonth() returns 0-11, so add 1 to get 1-12

    const isSummer = month >= 6 && month <= 9;
    let peakState = "";

    if (day >= 1 && day <= 5) {
      // Weekdays
      if (isSummer) {
        // Summer
        if (hour >= 9 && hour < 24) {
          peakState = "peak";
        } else {
          peakState = "offpeak";
        }
      } else {
        // Non-summer
        if ((hour >= 6 && hour < 11) || (hour >= 14 && hour < 24)) {
          peakState = "peak";
        } else {
          peakState = "offpeak";
        }
      }
    } else if (day === 6) {
      // Saturday
      if (isSummer) {
        // Summer
        if (hour >= 9 && hour < 24) {
          peakState = "semi-peak";
        } else {
          peakState = "offpeak";
        }
      } else {
        // Non-summer
        if ((hour >= 6 && hour < 11) || (hour >= 14 && hour < 24)) {
          peakState = "semi-peak";
        } else {
          peakState = "offpeak";
        }
      }
    } else {
      // Sunday and Holidays
      peakState = "offpeak";
    }

    return {
      ...item,
      peakState,
      DayOfWeek: getDayOfWeek(item.Key.split(" ")[0]),
    };
  });
};

const groupDataByDate = (data) => {
  return data.reduce((acc, item) => {
    const date = item.Key.split(" ")[0];
    const time = item.Key.split(" ")[1];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push({
      Time: time,
      Value: item.Value,
      DayOfWeek: item.DayOfWeek,
      PeakState: item.peakState,
    });
    return acc;
  }, {});
};

const aggregateDataByPeakState = (groupedData) => {
  const aggregatedData = {};

  Object.keys(groupedData).forEach((date) => {
    aggregatedData[date] = {
      peak: 0,
      semiPeak: 0,
      offPeak: 0,
    };

    groupedData[date].forEach((item) => {
      if (item.PeakState === "peak") {
        aggregatedData[date].peak += item.Value;
      } else if (item.PeakState === "semi-peak") {
        aggregatedData[date].semiPeak += item.Value;
      } else if (item.PeakState === "offpeak") {
        aggregatedData[date].offPeak += item.Value;
      }
    });

    // Format aggregated values to 2 decimal places
    aggregatedData[date].peak = aggregatedData[date].peak.toFixed(2);
    aggregatedData[date].semiPeak = aggregatedData[date].semiPeak.toFixed(2);
    aggregatedData[date].offPeak = aggregatedData[date].offPeak.toFixed(2);
  });

  return aggregatedData;
};

const EnergyPriceAnalysis = () => {
  const [groupedData, setGroupedData] = useState({});
  const [aggregatedData, setAggregatedData] = useState({});
  const [prices, setPrices] = useState(null);
  const barChartRef = useRef(null);
  const pieChartRef = useRef(null);

  const fetchPrices = async () => {
    try {
      const response = await fetch("/api/prices");
      if (!response.ok) {
        throw new Error("Failed to fetch prices");
      }
      const savedPrices = await response.json();
      setPrices(savedPrices);
    } catch (error) {
      console.error("Error fetching prices:", error);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  useEffect(() => {
    const dataWithoutYear = removeYearFromDate(dummyData);
    const updatedDummyData = dataWithoutYear.map((item) => ({
      ...item,
      DayOfWeek: getDayOfWeek(item.Key.split(" ")[0]),
    }));
    const categorizedData = categorizeData(updatedDummyData);
    const groupedByDate = groupDataByDate(categorizedData);
    const aggregatedByPeakState = aggregateDataByPeakState(groupedByDate);
    setGroupedData(groupedByDate);
    setAggregatedData(aggregatedByPeakState);
  }, []);

  useEffect(() => {
    if (
      barChartRef.current &&
      prices &&
      Object.keys(aggregatedData).length > 0
    ) {
      const dates = Object.keys(aggregatedData);
      const peakPrice =
        parseFloat(prices.peakPrices?.夏月.replace("NT$", "")) || 0;
      const semiPeakPrice =
        parseFloat(prices.halfPeakPrices?.夏月.replace("NT$", "")) || 0;
      const offPeakPrice =
        parseFloat(prices.offPeakPrices?.夏月.replace("NT$", "")) || 0;

      const barChart = echarts.init(barChartRef.current);
      const barChartOptions = {
        color: ["#ee6666", "#fac858", "#91CC75"],
        title: {
          text: "尖離峰費用分析",
          left: "center",
        },
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "shadow",
          },
          formatter: (params) => {
            const date = params[0].axisValue;
            let tooltipText = `${date}<br/>`;
            params.forEach((param) => {
              const value = parseFloat(param.value);
              tooltipText += `${param.marker} ${
                param.seriesName
              }: NT$${value.toFixed(2)}<br/>`;
            });
            return tooltipText;
          },
        },
        xAxis: {
          type: "category",
          data: dates,
        },
        yAxis: {
          type: "value",
          name: "NT$",
        },
        series: [
          {
            name: "尖峰",
            type: "bar",
            stack: "total",
            data: dates.map((date) =>
              (parseFloat(aggregatedData[date].peak) * peakPrice).toFixed(2)
            ),
          },
          {
            name: "半尖峰",
            type: "bar",
            stack: "total",
            data: dates.map((date) =>
              (
                parseFloat(aggregatedData[date].semiPeak) * semiPeakPrice
              ).toFixed(2)
            ),
          },
          {
            name: "離峰",
            type: "bar",
            stack: "total",
            data: dates.map((date) =>
              (parseFloat(aggregatedData[date].offPeak) * offPeakPrice).toFixed(
                2
              )
            ),
          },
        ],
      };
      barChart.setOption(barChartOptions);

      const handleResize = () => {
        barChart.resize();
      };
      window.addEventListener("resize", handleResize);

      return () => {
        barChart.dispose();
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [aggregatedData, prices]);

  useEffect(() => {
    if (
      pieChartRef.current &&
      prices &&
      Object.keys(aggregatedData).length > 0
    ) {
      const peakPrice =
        parseFloat(prices.peakPrices?.夏月.replace("NT$", "")) || 0;
      const semiPeakPrice =
        parseFloat(prices.halfPeakPrices?.夏月.replace("NT$", "")) || 0;
      const offPeakPrice =
        parseFloat(prices.offPeakPrices?.夏月.replace("NT$", "")) || 0;

      const totalPeak = Object.values(aggregatedData).reduce(
        (acc, curr) => acc + parseFloat(curr.peak) * peakPrice,
        0
      );
      const totalSemiPeak = Object.values(aggregatedData).reduce(
        (acc, curr) => acc + parseFloat(curr.semiPeak) * semiPeakPrice,
        0
      );
      const totalOffPeak = Object.values(aggregatedData).reduce(
        (acc, curr) => acc + parseFloat(curr.offPeak) * offPeakPrice,
        0
      );

      const pieChart = echarts.init(pieChartRef.current);
      const pieChartOptions = {
        color: ["#ee6666", "#fac858", "#91CC75"],
        title: {
          text: "尖離峰費用分佈",
          left: "center",
        },
        tooltip: {
          trigger: "item",
          formatter: "{a} <br/>{b}: NT${c} ({d}%)",
        },
        legend: {
          orient: "vertical",
          left: "left",
          data: ["尖峰", "半尖峰", "離峰"],
        },
        series: [
          {
            name: "費用分佈",
            type: "pie",
            radius: ["50%", "70%"],
            avoidLabelOverlap: false,
            label: {
              show: false,
              position: "center",
            },
            emphasis: {
              label: {
                show: true,
                fontSize: "30",
                fontWeight: "bold",
              },
            },
            labelLine: {
              show: false,
            },
            data: [
              { value: totalPeak.toFixed(2), name: "尖峰" },
              { value: totalSemiPeak.toFixed(2), name: "半尖峰" },
              { value: totalOffPeak.toFixed(2), name: "離峰" },
            ],
          },
        ],
      };
      pieChart.setOption(pieChartOptions);

      const handleResize = () => {
        pieChart.resize();
      };
      window.addEventListener("resize", handleResize);

      return () => {
        pieChart.dispose();
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [aggregatedData, prices]);

  if (!prices) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container-fluid">
      <div className="row mb-4">
        <div className="col-12">
          <div ref={barChartRef} style={{ height: "400px" }}></div>
        </div>
      </div>
      <div className="row mb-4">
        <div className="col-md-7 col-sm-12">
          <div ref={pieChartRef} style={{ height: "400px" }}></div>
        </div>
        <div className="col-md-5 col-sm-12">
          <DetailCard
            aggregatedData={aggregatedData}
            energyPrice
            prices={prices}
          />
        </div>
      </div>
      <div className="row mb-4">
        <div className="col-12">
          <PriceTable onPricesUpdate={fetchPrices} />
        </div>
      </div>
      <div className="row">
        <div className="col-12">
          <DataTableComponent
            aggregatedData={aggregatedData}
            energyPrice
            prices={prices}
          />
        </div>
      </div>
    </div>
  );
};
export default EnergyPriceAnalysis;
