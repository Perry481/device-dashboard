import React, { useState } from "react";
import Link from "next/link";
import styled from "styled-components";
import { FaQuestionCircle, FaGlobe } from "react-icons/fa";
import InstructionModal from "./InstructionModal";
import { useTranslation } from "../hooks/useTranslation";
import { useRouter } from "next/router";

const Nav = styled.nav`
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;

  @media (max-width: 1200px) {
    .navbar-collapse {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      z-index: 1000;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      padding: 10px;
    }
  }
`;

const NavContainer = styled.div`
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  @media (max-width: 1200px) {
    flex-wrap: wrap;
  }
`;

const NavbarBrand = styled.a`
  font-weight: bold;
  color: #333;
  padding: 10px 0;
  &:hover {
    color: #007bff;
    text-decoration: none;
  }
`;

const NavbarNav = styled.ul`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin: 0;
  padding: 0;
  list-style: none;

  @media (max-width: 1200px) {
    flex-direction: column;
    width: 100%;
  }
`;

const NavItem = styled.li`
  margin: 5px;
  width: auto;
  display: flex;
  align-items: stretch;

  @media (max-width: 1200px) {
    width: 100%;
    margin: 2px 0;
  }

  &.dropdown {
    position: relative;
  }
`;

const NavLink = styled.a`
  color: #333;
  padding: 10px 15px;
  border-radius: 4px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  white-space: normal;
  min-height: 48px;
  line-height: 1.2;
  width: 100%;

  @media (max-width: 1200px) {
    justify-content: flex-start;
    padding: 12px 15px;
  }

  &:hover {
    background-color: #f8f9fa;
    color: #007bff;
    text-decoration: none;
  }

  &.active {
    color: #007bff;
  }
`;

const DropdownToggle = styled(NavLink)`
  &.active {
    color: #007bff;
  }
  min-width: 120px;

  @media (max-width: 1200px) {
    &:after {
      margin-left: auto;
    }
  }
`;

const DropdownMenu = styled.ul`
  background-color: #ffffff;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 0.5rem 0;
  min-width: 200px;
  list-style: none;

  @media (max-width: 1200px) {
    position: static;
    box-shadow: none;
    padding-left: 20px;
  }

  li {
    width: 100%;
  }
`;

const DropdownItem = styled.a`
  color: #333;
  padding: 0.75rem 1rem;
  display: block;
  transition: background-color 0.3s ease, color 0.3s ease;
  cursor: pointer;
  line-height: 1.2;
  white-space: normal;
  text-align: left;

  &:hover {
    background-color: #f8f9fa;
    color: #333;
    text-decoration: none;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;

  @media (max-width: 1200px) {
    margin: 10px 0;
  }
`;

const QuestionButton = styled.button`
  background: none;
  border: none;
  color: #007bff;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #0056b3;
  }
`;

const LanguageButton = styled(QuestionButton)`
  display: flex;
  align-items: center;
  gap: 5px;
`;

const HamburgerButton = styled.button`
  display: none;
  padding: 10px;
  background: #f1f1f1; /* Light contrasting background */
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 10px;
  position: relative;

  @media (max-width: 1200px) {
    display: block;
    order: 1;
  }

  &:hover {
    background-color: #e0e0e0; /* Slightly darker hover effect */
    border-color: #bbb;
  }

  .navbar-toggler-icon {
    display: inline-block;
    width: 1.5em;
    height: 1.5em;
    background-image: url("data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3E%3Cpath stroke='rgba%280, 0, 0, 0.8%29' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3E%3C/svg%3E"); /* Bold hamburger icon */
    background-repeat: no-repeat;
    background-position: center;
    background-size: 1.2em 1.2em;
  }
`;

const NavbarCollapse = styled.div`
  display: flex;
  flex-grow: 1;

  @media (max-width: 1200px) {
    display: ${(props) => (props.$isOpen ? "block" : "none")};
    width: 100%;
    order: 2;
  }
`;

const TopNavigation = ({ onPageChange, selectedPage }) => {
  const [showInstructions, setShowInstructions] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const { t } = useTranslation();
  const router = useRouter();
  const { locale } = router;

  const toggleInstructions = () => {
    setShowInstructions(!showInstructions);
  };

  const toggleLanguage = () => {
    const newLocale = locale === "en" ? "zh-TW" : "en";
    router.push(router.pathname, router.asPath, { locale: newLocale });
  };

  const handleLinkClick = (page) => {
    onPageChange(page);
    setIsNavOpen(false);
  };

  return (
    <Nav className="main-header navbar navbar-expand-xl navbar-light">
      <NavContainer>
        <Link href="/" legacyBehavior>
          <NavbarBrand className="navbar-brand">
            <span className="brand-text font-weight-light">
              {t("navigation.title")}
            </span>
          </NavbarBrand>
        </Link>

        <HamburgerButton
          onClick={() => setIsNavOpen(!isNavOpen)}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </HamburgerButton>

        <NavbarCollapse $isOpen={isNavOpen}>
          <NavbarNav>
            <NavItem>
              <Link href="/" legacyBehavior>
                <NavLink
                  className={`nav-link ${
                    selectedPage === "Index" ? "active" : ""
                  }`}
                  onClick={() => handleLinkClick("Index")}
                >
                  {t("navigation.dashboard")}
                </NavLink>
              </Link>
            </NavItem>
            <NavItem>
              <Link href="/RTMonitoring" legacyBehavior>
                <NavLink
                  className={`nav-link ${
                    selectedPage === "RTMonitoring" ? "active" : ""
                  }`}
                  onClick={() => handleLinkClick("RTMonitoring")}
                >
                  {t("navigation.realTimeMonitoring")}
                </NavLink>
              </Link>
            </NavItem>
            <NavItem>
              <Link href="/energyCostAnalysis" legacyBehavior>
                <NavLink
                  className={`nav-link ${
                    selectedPage === "energyCostAnalysis" ? "active" : ""
                  }`}
                  onClick={() => handleLinkClick("energyCostAnalysis")}
                >
                  {t("navigation.energyMonitoring")}
                </NavLink>
              </Link>
            </NavItem>
            <NavItem>
              <Link href="/energyPriceAnalysis" legacyBehavior>
                <NavLink
                  className={`nav-link ${
                    selectedPage === "energyPriceAnalysis" ? "active" : ""
                  }`}
                  onClick={() => handleLinkClick("energyPriceAnalysis")}
                >
                  {t("navigation.electricityAnalysis")}
                </NavLink>
              </Link>
            </NavItem>
            <NavItem className="dropdown">
              <DropdownToggle
                className={`nav-link dropdown-toggle ${
                  selectedPage === "electricMeterDetails" ? "active" : ""
                }`}
                href="#"
                data-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false"
              >
                {t("navigation.meterDetails.title")}
              </DropdownToggle>
              <DropdownMenu className="dropdown-menu border-0 shadow">
                <li>
                  <Link
                    href="/electricMeterDetails?view=fifteenMinuteDemand"
                    legacyBehavior
                  >
                    <DropdownItem className="dropdown-item">
                      {t("navigation.meterDetails.fifteenMinuteDemand")}
                    </DropdownItem>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/electricMeterDetails?view=dailyUsage"
                    legacyBehavior
                  >
                    <DropdownItem className="dropdown-item">
                      {t("navigation.meterDetails.dailyUsage")}
                    </DropdownItem>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/electricMeterDetails?view=intervalUsage"
                    legacyBehavior
                  >
                    <DropdownItem className="dropdown-item">
                      {t("navigation.meterDetails.intervalUsage")}
                    </DropdownItem>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/electricMeterDetails?view=energyTrend"
                    legacyBehavior
                  >
                    <DropdownItem className="dropdown-item">
                      {t("navigation.meterDetails.energyTrend")}
                    </DropdownItem>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/electricMeterDetails?view=cumulativeEnergy"
                    legacyBehavior
                  >
                    <DropdownItem className="dropdown-item">
                      {t("navigation.meterDetails.cumulativeEnergy")}
                    </DropdownItem>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/electricMeterDetails?view=powerHeatmap"
                    legacyBehavior
                  >
                    <DropdownItem className="dropdown-item">
                      {t("navigation.meterDetails.powerHeatmap")}
                    </DropdownItem>
                  </Link>
                </li>
              </DropdownMenu>
            </NavItem>
            <NavItem>
              <Link href="/SettingsPage" legacyBehavior>
                <NavLink
                  className={`nav-link ${
                    selectedPage === "SettingsPage" ? "active" : ""
                  }`}
                  onClick={() => handleLinkClick("SettingsPage")}
                >
                  {t("navigation.settings")}
                </NavLink>
              </Link>
            </NavItem>
          </NavbarNav>
        </NavbarCollapse>

        <ActionButtons>
          <QuestionButton onClick={toggleInstructions}>
            <FaQuestionCircle />
          </QuestionButton>
          <LanguageButton onClick={toggleLanguage}>
            <FaGlobe />
            <span style={{ fontSize: "0.9rem" }}>
              {locale === "en" ? "中文" : "EN"}
            </span>
          </LanguageButton>
        </ActionButtons>
      </NavContainer>

      <InstructionModal
        show={showInstructions}
        onClose={toggleInstructions}
        currentPage={selectedPage}
      />
    </Nav>
  );
};

export default TopNavigation;
