import React from "react";
import Link from "next/link";
import styled from "styled-components";

const Nav = styled.nav`
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const NavbarBrand = styled.a`
  font-weight: bold;
  color: #333;
  &:hover {
    color: #007bff;
  }
`;

const NavItem = styled.li`
  margin-right: 10px;
`;

const NavLink = styled.a`
  color: #333;
  padding: 10px 15px;
  border-radius: 4px;
  transition: background-color 0.3s ease, color 0.3s ease;
  cursor: pointer;

  &:hover {
    background-color: #f8f9fa;
    color: #007bff;
  }

  &.active {
    /* background-color: #007bff; */
    color: #ffffff;
  }
`;

const DropdownToggle = styled(NavLink)`
  &.active {
    /* background-color: #007bff; */
    color: #ffffff;
  }
`;

const DropdownMenu = styled.ul`
  background-color: #ffffff;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 0.5rem 0;
  min-width: 200px;
`;

const DropdownItem = styled.a`
  color: #333;
  padding: 0.5rem 1rem;
  display: block;
  transition: background-color 0.3s ease, color 0.3s ease;
  cursor: pointer;

  &:hover {
    background-color: #f8f9fa;
    color: #333;
  }
`;

const TopNavigation = ({ onPageChange, selectedPage }) => {
  return (
    <Nav className="main-header navbar navbar-expand-md navbar-light">
      <div className="container">
        <Link href="/" legacyBehavior>
          <NavbarBrand className="navbar-brand">
            <span className="brand-text font-weight-light">設備儀錶板</span>
          </NavbarBrand>
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
            <NavItem
              className={`nav-item ${selectedPage === "Index" ? "active" : ""}`}
            >
              <Link href="/" legacyBehavior>
                <NavLink
                  className={`nav-link ${
                    selectedPage === "Index" ? "active" : ""
                  }`}
                  onClick={() => onPageChange("Index")}
                >
                  主控台
                </NavLink>
              </Link>
            </NavItem>
            <NavItem
              className={`nav-item ${
                selectedPage === "RTMonitoring" ? "active" : ""
              }`}
            >
              <Link href="/RTMonitoring" legacyBehavior>
                <NavLink
                  className={`nav-link ${
                    selectedPage === "RTMonitoring" ? "active" : ""
                  }`}
                  onClick={() => onPageChange("RTMonitoring")}
                >
                  即時監控
                </NavLink>
              </Link>
            </NavItem>
            <NavItem
              className={`nav-item ${
                selectedPage === "energyCostAnalysis" ? "active" : ""
              }`}
            >
              <Link href="/energyCostAnalysis" legacyBehavior>
                <NavLink
                  className={`nav-link ${
                    selectedPage === "energyCostAnalysis" ? "active" : ""
                  }`}
                  onClick={() => onPageChange("energyCostAnalysis")}
                >
                  能耗監控
                </NavLink>
              </Link>
            </NavItem>
            <NavItem
              className={`nav-item ${
                selectedPage === "energyPriceAnalysis" ? "active" : ""
              }`}
            >
              <Link href="/energyPriceAnalysis" legacyBehavior>
                <NavLink
                  className={`nav-link ${
                    selectedPage === "energyPriceAnalysis" ? "active" : ""
                  }`}
                  onClick={() => onPageChange("energyPriceAnalysis")}
                >
                  電費分析
                </NavLink>
              </Link>
            </NavItem>

            <NavItem
              className={`nav-item dropdown ${
                selectedPage === "electricMeterDetails" ? "active" : ""
              }`}
            >
              <DropdownToggle
                className={`nav-link dropdown-toggle ${
                  selectedPage === "electricMeterDetails" ? "active" : ""
                }`}
                href="#"
                data-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false"
              >
                電表詳細資訊
              </DropdownToggle>
              <DropdownMenu className="dropdown-menu border-0 shadow">
                <li>
                  <Link
                    href="/electricMeterDetails?view=fifteenMinuteDemand"
                    legacyBehavior
                  >
                    <DropdownItem className="dropdown-item">
                      每十五分鐘需量
                    </DropdownItem>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/electricMeterDetails?view=dailyUsage"
                    legacyBehavior
                  >
                    <DropdownItem className="dropdown-item">
                      每日用電圖
                    </DropdownItem>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/electricMeterDetails?view=intervalUsage"
                    legacyBehavior
                  >
                    <DropdownItem className="dropdown-item">
                      區間用電圖
                    </DropdownItem>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/electricMeterDetails?view=energyTrend"
                    legacyBehavior
                  >
                    <DropdownItem className="dropdown-item">
                      能耗趨勢圖
                    </DropdownItem>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/electricMeterDetails?view=cumulativeEnergy"
                    legacyBehavior
                  >
                    <DropdownItem className="dropdown-item">
                      累積能耗圖
                    </DropdownItem>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/electricMeterDetails?view=powerHeatmap"
                    legacyBehavior
                  >
                    <DropdownItem className="dropdown-item">
                      電力熱點圖
                    </DropdownItem>
                  </Link>
                </li>
              </DropdownMenu>
            </NavItem>
            <NavItem
              className={`nav-item ${
                selectedPage === "SettingsPage" ? "active" : ""
              }`}
            >
              <Link href="/SettingsPage" legacyBehavior>
                <NavLink
                  className={`nav-link ${
                    selectedPage === "SettingsPage" ? "active" : ""
                  }`}
                  onClick={() => onPageChange("SettingsPage")}
                >
                  設定
                </NavLink>
              </Link>
            </NavItem>
          </ul>
        </div>
      </div>
    </Nav>
  );
};

export default TopNavigation;
