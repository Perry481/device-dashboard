import React from "react";
import Link from "next/link";

const SidebarMenu = ({ onPageChange, selectedPage }) => {
  const handleClick = (page) => {
    onPageChange(page);
  };

  return (
    <aside
      style={{ height: "100vh", position: "fixed" }}
      className="main-sidebar sidebar-dark-primary elevation-4"
    >
      <a href="/" className="brand-link">
        <img
          src="dist/img/EBC/EBCimage.jpg"
          alt="AdminLTE Logo"
          className="brand-image img-circle elevation-3"
        />
        <span className="brand-text font-weight-light">成本分析</span>
        <button
          style={{
            backgroundColor: "#343A40",
            color: "#D6D8D9",
            marginLeft: "20px",
          }}
          className="btn btn-secondary btn-sm"
          data-widget="pushmenu"
        >
          關閉選單
        </button>
      </a>
      <div className="sidebar">
        <div className="user-panel mt-3 pb-3 mb-3 d-flex">
          <div className="image">
            <img
              src="dist/img/EBC/userIconBlue.jpg"
              className="img-circle elevation-2"
              alt="User Image"
            />
          </div>
          <div className="info">
            <a href="#" className="d-block">
              User
            </a>
          </div>
        </div>
        <nav className="mt-2">
          <ul
            className="nav nav-pills nav-sidebar flex-column"
            data-widget="treeview"
            role="menu"
            data-accordion="false"
          >
            <li className="nav-item">
              <Link href="/cost" legacyBehavior>
                <a
                  className={`nav-link ${
                    selectedPage === "Cost" ? "active" : ""
                  }`}
                >
                  <i className="far fa-circle nav-icon" />
                  <p>成本</p>
                </a>
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/costAnalysis" legacyBehavior>
                <a
                  className={`nav-link ${
                    selectedPage === "CostAnalysis" ? "active" : ""
                  }`}
                >
                  <i className="far fa-circle nav-icon" />
                  <p>成本分析</p>
                </a>
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/customerCostAnalysis" legacyBehavior>
                <a
                  className={`nav-link ${
                    selectedPage === "CustomerCostAnalysis" ? "active" : ""
                  }`}
                >
                  <i className="far fa-circle nav-icon" />
                  <p>客戶成本分析</p>
                </a>
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/grossProfitCostAnalysis" legacyBehavior>
                <a
                  className={`nav-link ${
                    selectedPage === "GrossProfitCostAnalysis" ? "active" : ""
                  }`}
                >
                  <i className="far fa-circle nav-icon" />
                  <p>成本分析毛利比</p>
                </a>
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/paretoCostAnalysis" legacyBehavior>
                <a
                  className={`nav-link ${
                    selectedPage === "ParetoCostAnalysis" ? "active" : ""
                  }`}
                >
                  <i className="far fa-circle nav-icon" />
                  <p>客戶成本柏拉圖分析</p>
                </a>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default SidebarMenu;
