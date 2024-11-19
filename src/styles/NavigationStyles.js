import styled from "styled-components";

export const NavigationContainer = styled.nav`
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1000;

  .navbar {
    padding: 0.5rem 1rem;
  }

  .navbar-brand {
    color: #333;
    font-weight: 500;
    font-size: 1.25rem;
    padding: 0.5rem 1rem;
    margin-right: 1rem;
    text-decoration: none;

    &:hover {
      color: #007bff;
    }
  }

  .navbar-nav {
    display: flex;
    align-items: center;

    .nav-item {
      position: relative;
      margin-right: 0.5rem;

      .nav-link {
        color: #333;
        padding: 0.5rem 1rem;
        font-size: 1rem;
        font-weight: 400;
        text-decoration: none;
        border-radius: 4px;
        transition: all 0.2s ease-in-out;

        &:hover {
          background-color: #f8f9fa;
          color: #007bff;
        }

        &.active {
          color: #007bff;
          font-weight: 500;
        }
      }

      &.dropdown {
        .dropdown-toggle {
          padding-right: 1.5rem;

          &::after {
            position: absolute;
            right: 0.5rem;
            top: 50%;
            transform: translateY(-50%);
            transition: transform 0.2s ease-in-out;
          }

          &[aria-expanded="true"]::after {
            transform: translateY(-50%) rotate(180deg);
          }
        }

        .dropdown-menu {
          background-color: #ffffff;
          border: none;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          padding: 0.5rem 0;
          margin-top: 0.5rem;
          min-width: 220px;
          animation: dropdownFade 0.2s ease-in-out;

          .dropdown-item {
            color: #333;
            padding: 0.75rem 1.25rem;
            font-size: 0.95rem;
            text-decoration: none;
            transition: all 0.2s ease-in-out;
            position: relative;

            &:hover {
              background-color: #f8f9fa;
              color: #007bff;
              padding-left: 1.5rem;
            }

            &:active {
              background-color: #e9ecef;
            }

            &:not(:last-child) {
              border-bottom: 1px solid #f1f1f1;
            }

            &.active {
              color: #007bff;
              background-color: #f8f9fa;
            }
          }
        }
      }
    }
  }

  @keyframes dropdownFade {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  // Language and help buttons
  .nav-buttons {
    display: flex;
    align-items: center;
    margin-left: auto;

    button {
      background: none;
      border: none;
      color: #007bff;
      font-size: 1.2rem;
      padding: 0.5rem;
      margin-left: 0.5rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.25rem;
      transition: color 0.2s ease-in-out;

      &:hover {
        color: #0056b3;
      }

      span {
        font-size: 0.9rem;
      }
    }
  }

  // Responsive styles
  @media (max-width: 768px) {
    .navbar-collapse {
      background-color: #ffffff;
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      padding: 1rem;
      border-top: 1px solid rgba(0, 0, 0, 0.1);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);

      .navbar-nav {
        flex-direction: column;
        width: 100%;

        .nav-item {
          margin-right: 0;
          margin-bottom: 0.5rem;
          width: 100%;

          .nav-link {
            padding: 0.75rem 1rem;
            width: 100%;
            display: block;
          }

          &.dropdown {
            .dropdown-menu {
              position: static !important;
              width: 100%;
              margin: 0;
              padding: 0.5rem 0;
              border: none;
              box-shadow: none;
              background-color: #ffffff;
              border-radius: 0;

              .dropdown-item {
                padding: 0.75rem 1.5rem;
                border-left: 3px solid transparent;
                margin: 2px 0;
                background-color: #ffffff;
                transition: all 0.2s ease-in-out;

                &:hover {
                  border-left: 3px solid #007bff;
                  background-color: #f8f9fa;
                  padding-left: 1.75rem;
                }

                &:not(:last-child) {
                  border-bottom: none;
                }

                &.active {
                  border-left: 3px solid #007bff;
                  color: #007bff;
                }
              }
            }

            .dropdown-toggle {
              width: 100%;
              display: block;

              &::after {
                float: right;
                margin-top: 8px;
              }

              &[aria-expanded="true"] {
                color: #007bff;
                background-color: #f8f9fa;
              }
            }
          }
        }
      }
    }
  }
`;

export const GlobalNavigationStyle = styled.div`
  * {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      "Helvetica Neue", Arial, sans-serif;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
`;
