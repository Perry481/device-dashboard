import React, { useState, useEffect } from "react";
import Head from "next/head";
import Navbar from "../components/Navbar";
import SidebarMenu from "../components/SidebarMenu";
import Footer from "../components/Footer";
import IframeLayout from "../components/IframeLayout";
import { SidebarProvider } from "../contexts/SidebarContext";
import { useRouter } from "next/router";

const App = ({ Component, pageProps }) => {
  const [selectedPage, setSelectedPage] = useState("");
  const router = useRouter();
  const isIframe = router.query.iframe === "true";

  const handlePageChange = (page) => {
    setSelectedPage(page);
  };

  useEffect(() => {
    if (router.pathname === "/") {
      router.push("/cost");
      setSelectedPage("Cost");
    } else {
      const path = router.pathname.split("/")[1];
      setSelectedPage(path.charAt(0).toUpperCase() + path.slice(1));
    }
  }, [router.pathname]); // <-- Changed from [router] to [router.pathname]

  if (isIframe) {
    return (
      <IframeLayout>
        <Component {...pageProps} />
      </IframeLayout>
    );
  }

  return (
    <SidebarProvider>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>成本分析</title>
      </Head>
      <Navbar />
      <SidebarMenu
        onPageChange={handlePageChange}
        selectedPage={selectedPage}
      />
      <div className="content-wrapper">
        <div className="container-fluid">
          <Component {...pageProps} isIframe={isIframe} />
        </div>
      </div>
      <Footer />
    </SidebarProvider>
  );
};

export default App;
