import React, { useRef, useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import * as echarts from "echarts";

const CombinedCard = ({ title, value, unit, details }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    const chart = echarts.init(chartRef.current);

    const options = {
      series: [
        {
          type: "gauge",
          startAngle: 180,
          endAngle: 0,
          max: 10000,
          progress: {
            show: true,
            width: 12,
          },
          axisLine: {
            lineStyle: {
              width: 12,
            },
          },
          axisTick: {
            show: false,
          },
          splitLine: {
            length: 10,
            lineStyle: {
              width: 2,
              color: "#999",
            },
            interval: 2,
          },
          axisLabel: {
            distance: 15,
            color: "#999",
            fontSize: 12,
            formatter: function (value) {
              if (value % 2500 === 0) {
                return value;
              }
              return "";
            },
          },
          title: {
            show: false,
          },
          detail: {
            valueAnimation: true,
            fontSize: 16,
            offsetCenter: [0, "30%"],
          },
          data: [{ value, name: title }],
        },
      ],
    };

    chart.setOption(options);

    const resizeChart = () => {
      chart.resize();
    };

    window.addEventListener("resize", resizeChart);

    return () => {
      window.removeEventListener("resize", resizeChart);
      chart.dispose();
    };
  }, [title, value, unit]);

  return (
    <div className="col-md-6 col-sm-12 mb-4">
      <div className="card shadow-sm h-100">
        <div className="card-body d-flex flex-row align-items-center">
          <div className="col-6">
            <div
              ref={chartRef}
              style={{ width: "100%", height: "200px" }}
            ></div>
          </div>
          <div className="col-6">
            <h6 className="card-title mb-2">{title}</h6>
            <h4 className="card-text mt-3">
              {value} {unit}
            </h4>
            <p className="card-text">
              {details.value} {details.unit}
            </p>
            <ul className="list-unstyled">
              {details.items.map((item, index) => (
                <li key={index}>
                  {item.label}: {item.value}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const MonitorPage = () => {
  const [page, setPage] = useState(1);
  const metersPerPage = 4;

  const meterData = [
    {
      title: "Gauge 1",
      value: 8140,
      unit: "W",
      details: {
        title: "AD-580/CPM-12D 1",
        value: "1,834.9",
        unit: "kWh",
        items: [
          { label: "線電壓V12", value: "191 V" },
          { label: "線電壓V23", value: "190.2 V" },
          { label: "線電壓V31", value: "190.7 V" },
          { label: "平均線電壓", value: "190.6 V" },
          { label: "電流1", value: "18.692 A" },
          { label: "電流2", value: "11.517 A" },
        ],
      },
    },
    {
      title: "Gauge 2",
      value: 7140,
      unit: "W",
      details: {
        title: "AD-580/CPM-12D 2",
        value: "1,634.9",
        unit: "kWh",
        items: [
          { label: "線電壓V12", value: "189 V" },
          { label: "線電壓V23", value: "188.2 V" },
          { label: "線電壓V31", value: "188.7 V" },
          { label: "平均線電壓", value: "188.6 V" },
          { label: "電流1", value: "17.692 A" },
          { label: "電流2", value: "10.517 A" },
        ],
      },
    },
    {
      title: "Gauge 3",
      value: 6140,
      unit: "W",
      details: {
        title: "AD-580/CPM-12D 3",
        value: "1,434.9",
        unit: "kWh",
        items: [
          { label: "線電壓V12", value: "185 V" },
          { label: "線電壓V23", value: "184.2 V" },
          { label: "線電壓V31", value: "184.7 V" },
          { label: "平均線電壓", value: "184.6 V" },
          { label: "電流1", value: "16.692 A" },
          { label: "電流2", value: "9.517 A" },
        ],
      },
    },
    {
      title: "Gauge 4",
      value: 5140,
      unit: "W",
      details: {
        title: "AD-580/CPM-12D 4",
        value: "1,234.9",
        unit: "kWh",
        items: [
          { label: "線電壓V12", value: "181 V" },
          { label: "線電壓V23", value: "180.2 V" },
          { label: "線電壓V31", value: "180.7 V" },
          { label: "平均線電壓", value: "180.6 V" },
          { label: "電流1", value: "15.692 A" },
          { label: "電流2", value: "8.517 A" },
        ],
      },
    },
    {
      title: "Gauge 5",
      value: 9140,
      unit: "W",
      details: {
        title: "AD-580/CPM-12D 5",
        value: "2,034.9",
        unit: "kWh",
        items: [
          { label: "線電壓V12", value: "193 V" },
          { label: "線電壓V23", value: "192.2 V" },
          { label: "線電壓V31", value: "192.7 V" },
          { label: "平均線電壓", value: "192.6 V" },
          { label: "電流1", value: "19.692 A" },
          { label: "電流2", value: "12.517 A" },
        ],
      },
    },
    {
      title: "Gauge 6",
      value: 8140,
      unit: "W",
      details: {
        title: "AD-580/CPM-12D 6",
        value: "1,834.9",
        unit: "kWh",
        items: [
          { label: "線電壓V12", value: "191 V" },
          { label: "線電壓V23", value: "190.2 V" },
          { label: "線電壓V31", value: "190.7 V" },
          { label: "平均線電壓", value: "190.6 V" },
          { label: "電流1", value: "18.692 A" },
          { label: "電流2", value: "11.517 A" },
        ],
      },
    },
    {
      title: "Gauge 7",
      value: 7140,
      unit: "W",
      details: {
        title: "AD-580/CPM-12D 7",
        value: "1,634.9",
        unit: "kWh",
        items: [
          { label: "線電壓V12", value: "189 V" },
          { label: "線電壓V23", value: "188.2 V" },
          { label: "線電壓V31", value: "188.7 V" },
          { label: "平均線電壓", value: "188.6 V" },
          { label: "電流1", value: "17.692 A" },
          { label: "電流2", value: "10.517 A" },
        ],
      },
    },
    {
      title: "Gauge 8",
      value: 6140,
      unit: "W",
      details: {
        title: "AD-580/CPM-12D 8",
        value: "1,434.9",
        unit: "kWh",
        items: [
          { label: "線電壓V12", value: "185 V" },
          { label: "線電壓V23", value: "184.2 V" },
          { label: "線電壓V31", value: "184.7 V" },
          { label: "平均線電壓", value: "184.6 V" },
          { label: "電流1", value: "16.692 A" },
          { label: "電流2", value: "9.517 A" },
        ],
      },
    },
  ];

  const handleNextPage = () => {
    setPage((prev) =>
      Math.min(prev + 1, Math.ceil(meterData.length / metersPerPage))
    );
  };

  const handlePrevPage = () => {
    setPage((prev) => Math.max(prev - 1, 1));
  };

  const currentMeters = meterData.slice(
    (page - 1) * metersPerPage,
    page * metersPerPage
  );

  return (
    <div className="container-fluid min-vh-100 d-flex flex-column">
      <div className="row flex-grow-1">
        {currentMeters.map((meter, index) => (
          <CombinedCard key={index} {...meter} />
        ))}
      </div>
      <div className="d-flex justify-content-center mt-4">
        <button
          className="btn btn-primary mr-2"
          onClick={handlePrevPage}
          disabled={page === 1}
        >
          Previous
        </button>
        <button
          className="btn btn-primary"
          onClick={handleNextPage}
          disabled={page === Math.ceil(meterData.length / metersPerPage)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default MonitorPage;
