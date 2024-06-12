// src/pages/_app.js
import React, { useState, useEffect } from "react";
import Head from "next/head";
import TopNavigation from "../components/TopNavigation";
import Footer from "../components/Footer";
import IframeLayout from "../components/IframeLayout";
import { useRouter } from "next/router";

const App = ({ Component, pageProps }) => {
  const [selectedPage, setSelectedPage] = useState("Index");
  const router = useRouter();
  const isIframe = router.query.iframe === "true";

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
      default:
        setSelectedPage("Index");
        break;
    }
  }, [router.pathname]);

  if (isIframe) {
    return (
      <IframeLayout>
        <Component {...pageProps} />
      </IframeLayout>
    );
  }

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>設備儀錶板</title>
        <style>{`
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
      <TopNavigation
        onPageChange={handlePageChange}
        selectedPage={selectedPage}
      />
      <div className="content-wrapper full-width">
        <div className="container-fluid">
          <Component {...pageProps} isIframe={isIframe} />
        </div>
      </div>
      <Footer />
    </>
  );
};

export default App;
