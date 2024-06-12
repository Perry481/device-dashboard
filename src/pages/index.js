import React, { useEffect, useRef } from "react";
import * as echarts from "echarts";
import "bootstrap/dist/css/bootstrap.min.css";
import { nodeName } from "jquery";

const HomePage = () => {
  const energyCostChartRef = useRef(null);
  const totalEnergyTrendChartRef = useRef(null);
  const totalEnergyNeedChartRef = useRef(null);
  const pieChartRef = useRef(null);

  const updatePieChart = () => {
    if (pieChartRef.current) {
      const pieChart = echarts.init(pieChartRef.current);
      const pieOptions = {
        title: {
          text: "用電估比",
          left: "center",
        },
        tooltip: {
          trigger: "item",
        },
        legend: {
          bottom: "0",
          left: "center",
        },
        series: [
          {
            name: "用電估比",
            type: "pie",
            radius: "50%",
            data: [
              { value: 40.57, name: "研發辦公室" },
              { value: 29.54, name: "業務辦公室" },
              { value: 29.88, name: "廠務辦公室" },
              { value: 0.01, name: "(無群組)" },
            ],
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: "rgba(0, 0, 0, 0.5)",
              },
            },
          },
        ],
      };
      pieChart.setOption(pieOptions);
      return pieChart;
    }
  };

  const updateEnergyCostChart = () => {
    if (energyCostChartRef.current) {
      const energyCostChart = echarts.init(energyCostChartRef.current);
      const energyData = [
        320, 332, 301, 334, 390, 330, 320, 310, 340, 370, 320, 334, 390, 330,
        320, 310, 340, 370, 320, 334, 390, 330, 320, 310, 340, 370, 320, 334,
        390, 330, 320,
      ];
      const standardLine = 330;
      const belowStandardData = energyData.map((value) =>
        value <= standardLine ? value : standardLine
      );
      const aboveStandardData = energyData.map((value) =>
        value > standardLine ? value - standardLine : 0
      );
      const energyCostOptions = {
        title: {
          text: "能耗趨勢",
          left: "center",
        },
        xAxis: {
          type: "category",
          data: [
            "5/1",
            "5/2",
            "5/3",
            "5/4",
            "5/5",
            "5/6",
            "5/7",
            "5/8",
            "5/9",
            "5/10",
            "5/11",
            "5/12",
            "5/13",
            "5/14",
            "5/15",
            "5/16",
            "5/17",
            "5/18",
            "5/19",
            "5/20",
            "5/21",
            "5/22",
            "5/23",
            "5/24",
            "5/25",
            "5/26",
            "5/27",
            "5/28",
            "5/29",
            "5/30",
            "5/31",
          ],
        },
        yAxis: {
          type: "value",
        },
        series: [
          {
            name: "Below Standard",
            data: belowStandardData,
            type: "bar",
            stack: "energy",
            itemStyle: {
              color: "#3ba272",
            },
            markLine: {
              silent: true,
              symbol: "none",
              data: [
                {
                  yAxis: standardLine,
                  lineStyle: {
                    color: "black",
                    type: "dashed",
                  },
                  label: {
                    formatter: "{c}",
                    position: "end",
                    color: "black",
                  },
                },
              ],
            },
          },
          {
            name: "Above Standard",
            data: aboveStandardData,
            type: "bar",
            stack: "energy",
            itemStyle: {
              color: "red",
            },
          },
        ],
      };
      energyCostChart.setOption(energyCostOptions);
      return energyCostChart;
    }
  };

  const updateTotalEnergyTrendChart = () => {
    if (totalEnergyTrendChartRef.current) {
      const totalEnergyTrendChart = echarts.init(
        totalEnergyTrendChartRef.current
      );
      const energyData = [
        18, 16, 10, 14, 17, 19, 16, 15, 13, 12, 11, 10, 14, 17, 19, 16, 15, 13,
        12, 11, 10, 14, 17, 19, 16, 15, 13, 12, 11, 10, 14,
      ];
      const standardValue = 16;
      const totalEnergyTrendOptions = {
        title: {
          text: "總有效功率趨勢",
          left: "center",
        },
        xAxis: {
          type: "category",
          data: [
            "5/1",
            "5/2",
            "5/3",
            "5/4",
            "5/5",
            "5/6",
            "5/7",
            "5/8",
            "5/9",
            "5/10",
            "5/11",
            "5/12",
            "5/13",
            "5/14",
            "5/15",
            "5/16",
            "5/17",
            "5/18",
            "5/19",
            "5/20",
            "5/21",
            "5/22",
            "5/23",
            "5/24",
            "5/25",
            "5/26",
            "5/27",
            "5/28",
            "5/29",
            "5/30",
            "5/31",
          ],
        },
        yAxis: {
          type: "value",
        },
        series: [
          {
            name: "Effective Power",
            type: "line",
            data: energyData,
            areaStyle: {},
            itemStyle: {
              color: (params) =>
                params.value > standardValue ? "red" : "#3ba272",
            },
            lineStyle: {
              color: "#3ba272",
            },
            markLine: {
              silent: true,
              symbol: "none",
              data: [
                {
                  yAxis: standardValue,
                  lineStyle: {
                    color: "black",
                    type: "dashed",
                  },
                },
              ],
            },
          },
        ],
        visualMap: {
          show: false,
          pieces: [
            {
              gt: 0,
              lte: standardValue,
              color: "#3ba272",
            },
            {
              gt: standardValue,
              color: "red",
            },
          ],
        },
      };
      totalEnergyTrendChart.setOption(totalEnergyTrendOptions);
      return totalEnergyTrendChart;
    }
  };

  useEffect(() => {
    const pieChart = updatePieChart();
    const energyCostChart = updateEnergyCostChart();
    const totalEnergyTrendChart = updateTotalEnergyTrendChart();

    const handleResize = () => {
      if (pieChart) {
        pieChart.resize();
      }
      if (energyCostChart) {
        energyCostChart.resize();
      }
      if (totalEnergyTrendChart) {
        totalEnergyTrendChart.resize();
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      if (pieChart) {
        pieChart.dispose();
      }
      if (energyCostChart) {
        energyCostChart.dispose();
      }
      if (totalEnergyTrendChart) {
        totalEnergyTrendChart.dispose();
      }
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="container-fluid min-vh-100 d-flex flex-column">
      {/* Top 40% section */}
      <div className="row flex-grow-1" style={{ minHeight: "40%" }}>
        <div className="col-12">
          {/* Row for the three cards and pie chart */}
          <div className="row h-100">
            <div className="col-lg-8 d-flex flex-column">
              <div className="row flex-grow-1">
                <div className="col-md-4 col-12 mb-4 d-flex">
                  <div className="card text-center shadow-sm flex-fill">
                    <div className="card-body d-flex flex-column justify-content-center">
                      <h5 className="card-title text-success">能耗量</h5>
                      <h3 className="card-text">92,926.4 kWh</h3>
                      <p className="card-text">當月 6,616.2 kWh</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 col-12 mb-4 d-flex">
                  <div className="card text-center shadow-sm flex-fill">
                    <div className="card-body d-flex flex-column justify-content-center">
                      <h5 className="card-title text-success">參考電費</h5>
                      <h3 className="card-text">335,015.3 NT$</h3>
                      <p className="card-text">當月 16,498.6 NT$</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 col-12 mb-4 d-flex">
                  <div className="card text-center shadow-sm flex-fill">
                    <div className="card-body d-flex flex-column justify-content-center">
                      <h5 className="card-title text-success">碳排放量</h5>
                      <h3 className="card-text">45,996.2 kg</h3>
                      <p className="card-text">當月 3,272.6 kg</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-12 mb-4 d-flex">
              <div className="card text-center shadow-sm flex-fill">
                <div className="card-body d-flex flex-column justify-content-center">
                  <h5 className="card-title">用電估比</h5>
                  <div
                    ref={pieChartRef}
                    style={{ width: "100%", height: "200px" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom 60% section */}
      <div className="row flex-grow-1" style={{ minHeight: "60%" }}>
        <div className="col-12 h-100">
          {/* Row for the two trend charts */}
          <div className="row h-100">
            <div className="col-lg-4 col-12 mb-4 d-flex">
              <div className="card text-center shadow-sm flex-fill">
                <div className="card-body d-flex flex-column justify-content-center">
                  <h5 className="card-title text-success">能耗趨勢</h5>
                  <div
                    ref={energyCostChartRef}
                    style={{ width: "100%", height: "300px" }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-12 mb-4 d-flex">
              <div className="card text-center shadow-sm flex-fill">
                <div className="card-body d-flex flex-column justify-content-center">
                  <h5 className="card-title text-success">總有效功率趨勢</h5>
                  <div
                    ref={totalEnergyTrendChartRef}
                    style={{ width: "100%", height: "300px" }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-12 mb-4 d-flex">
              <div className="card text-center shadow-sm flex-fill">
                <div className="card-body d-flex flex-column justify-content-center">
                  <h5 className="card-title text-success">
                    總有效功率需量趨勢
                  </h5>
                  <div
                    ref={totalEnergyNeedChartRef}
                    style={{ width: "100%", height: "100%" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
