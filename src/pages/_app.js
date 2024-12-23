import React, { useState, useEffect } from "react";
import Head from "next/head";
import TopNavigation from "../components/TopNavigation";
import MainLayout from "../components/MainLayout";
import { useRouter } from "next/router";
import { CompanyProvider } from "../contexts/CompanyContext";
import { LanguageProvider } from "../contexts/LanguageContext";

const App = ({ Component, pageProps }) => {
  const [selectedPage, setSelectedPage] = useState("Index");
  const router = useRouter();

  const handlePageChange = (page) => {
    setSelectedPage(page);
  };

  useEffect(() => {
    const path = router.pathname.split("/")[1];
    switch (path) {
      case "":
        setSelectedPage("Index");
        break;
      case "RTMonitoring":
        setSelectedPage("RTMonitoring");
        break;
      case "energyCostAnalysis":
        setSelectedPage("energyCostAnalysis");
        break;
      case "energyPriceAnalysis":
        setSelectedPage("energyPriceAnalysis");
        break;
      case "SettingsPage":
        setSelectedPage("SettingsPage");
        break;
      case "electricMeterDetails":
        setSelectedPage("electricMeterDetails");
        break;
      default:
        setSelectedPage("Index");
        break;
    }
  }, [router.pathname]);

  return (
    <LanguageProvider>
      <CompanyProvider>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>設備儀錶板</title>
          <style>{`
            html, body, #__next {
              height: 100%;
            }
            .wrapper {
              min-height: 80%;
              display: flex;
              flex-direction: column;
            }
            .content-wrapper {
              flex: 1 0 auto;
              display: flex;
              flex-direction: column;
            }
            .navbar-light .navbar-nav .active > .nav-link, 
            .navbar-light .navbar-nav .nav-link.active, 
            .navbar-light .navbar-nav .nav-link.show, 
            .navbar-light .navbar-nav .show > .nav-link {
              color: rgba(0, 0, 0, 0.9);
              font-weight: bold;
            }
            .chart-container {
              height: 400px;
            }
          `}</style>
        </Head>
        <div className="wrapper">
          <TopNavigation
            onPageChange={handlePageChange}
            selectedPage={selectedPage}
          />
          <div className="content-wrapper">
            <div className="container-fluid h-100">
              <MainLayout>
                <Component {...pageProps} />
              </MainLayout>
            </div>
          </div>
        </div>
      </CompanyProvider>
    </LanguageProvider>
  );
};

export default App;
