// components/Header.js
import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";

const Navbar = ({ onButtonClick }) => {
  return (
    <nav className="main-header navbar navbar-expand navbar-white navbar-light">
      {/* Left navbar links */}
      <ul className="navbar-nav">
        <li className="nav-item">
          <a className="nav-link" data-widget="pushmenu" href="#" role="button">
            <i className="fas fa-bars" />
          </a>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
