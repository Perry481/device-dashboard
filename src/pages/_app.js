import React, { useState, useEffect } from "react";
import Head from "next/head";
import TopNavigation from "../components/TopNavigation";
import Footer from "../components/Footer";
import IframeLayout from "../components/IframeLayout";
import { useRouter } from "next/router";
import "../styles/globals.css"; // Make sure you have this if you use global styles

const App = ({ Component, pageProps }) => {
  const [selectedPage, setSelectedPage] = useState("Index");
  const router = useRouter();
  const isIframe = router.query.iframe === "true";

  const handlePageChange = (page) => {
    setSelectedPage(page);
  };

  useEffect(() => {
    const path = router.pathname.split("/")[1];
    setSelectedPage(
      path ? path.charAt(0).toUpperCase() + path.slice(1) : "Index"
    );
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
