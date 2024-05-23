import React from "react";
import Head from "next/head";

const IframeLayout = ({ children }) => {
  return (
    <>
      <Head>
        <title>Embedded Page</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="custom-iframe-container">
        {children}{" "}
        {/* Render the passed React children inside this container */}
      </div>
    </>
  );
};

export default IframeLayout;
