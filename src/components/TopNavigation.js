import React from "react";
import Link from "next/link";

const TopNavigation = ({ onPageChange, selectedPage }) => {
  return (
    <nav className="main-header navbar navbar-expand-md navbar-light navbar-white">
      <div className="container">
        <Link href="/" legacyBehavior>
          <a className="navbar-brand">
            <span className="brand-text font-weight-light">設備儀錶板</span>
          </a>
        </Link>
        <button
          className="navbar-toggler order-1"
          type="button"
          data-toggle="collapse"
          data-target="#navbarCollapse"
          aria-controls="navbarCollapse"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse order-3" id="navbarCollapse">
          <ul className="navbar-nav">
            <li
              className={`nav-item ${selectedPage === "Index" ? "active" : ""}`}
            >
              <Link href="/" legacyBehavior>
                <a className="nav-link" onClick={() => onPageChange("Index")}>
                  主控台
                </a>
              </Link>
            </li>
            <li
              className={`nav-item ${
                selectedPage === "RTMonitoring" ? "active" : ""
              }`}
            >
              <Link href="/RTMonitoring" legacyBehavior>
                <a
                  className="nav-link"
                  onClick={() => onPageChange("RTMonitoring")}
                >
                  即時監控
                </a>
              </Link>
            </li>
            <li
              className={`nav-item ${
                selectedPage === "energyCostAnalysis" ? "active" : ""
              }`}
            >
              <Link href="/energyCostAnalysis" legacyBehavior>
                <a
                  className="nav-link"
                  onClick={() => onPageChange("energyCostAnalysis")}
                >
                  能耗監控
                </a>
              </Link>
            </li>
            <li
              className={`nav-item ${
                selectedPage === "energyPriceAnalysis" ? "active" : ""
              }`}
            >
              <Link href="/energyPriceAnalysis" legacyBehavior>
                <a
                  className="nav-link"
                  onClick={() => onPageChange("energyPriceAnalysis")}
                >
                  電費分析
                </a>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default TopNavigation;
