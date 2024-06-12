import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Other styles */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,400i,700&display=fallback"
        />
        <link
          rel="stylesheet"
          href="/plugins/fontawesome-free/css/all.min.css"
        />
        <link
          rel="stylesheet"
          href="https://code.ionicframework.com/ionicons/2.0.1/css/ionicons.min.css"
        />
        <link
          rel="stylesheet"
          href="/plugins/tempusdominus-bootstrap-4/css/tempusdominus-bootstrap-4.min.css"
        />
        <link
          rel="stylesheet"
          href="/plugins/icheck-bootstrap/icheck-bootstrap.min.css"
        />
        <link rel="stylesheet" href="/plugins/jqvmap/jqvmap.min.css" />
        <link rel="stylesheet" href="/dist/css/adminlte.min.css" />
        <link
          rel="stylesheet"
          href="/plugins/overlayScrollbars/css/OverlayScrollbars.min.css"
        />
        <link
          rel="stylesheet"
          href="/plugins/daterangepicker/daterangepicker.css"
        />
        <link
          rel="stylesheet"
          href="/plugins/summernote/summernote-bs4.min.css"
        />
      </Head>
      <body className="layout-top-nav">
        <Main />
        <NextScript />

        {/* Scripts */}
        <script src="/plugins/jquery/jquery.min.js"></script>
        <script src="/plugins/jquery-ui/jquery-ui.min.js"></script>
        <script src="/plugins/bootstrap/js/bootstrap.bundle.min.js"></script>
        <script src="/plugins/chart.js/Chart.min.js"></script>
        <script src="/plugins/jqvmap/jquery.vmap.min.js"></script>
        <script src="/plugins/jqvmap/maps/jquery.vmap.usa.js"></script>
        <script src="/plugins/jquery-knob/jquery.knob.min.js"></script>
        <script src="/plugins/moment/moment.min.js"></script>
        <script src="/plugins/daterangepicker/daterangepicker.js"></script>
        <script src="/plugins/tempusdominus-bootstrap-4/js/tempusdominus-bootstrap-4.min.js"></script>
        <script src="/plugins/summernote/summernote-bs4.min.js"></script>
        <script src="/plugins/overlayScrollbars/js/jquery.overlayScrollbars.min.js"></script>
        <script src="/dist/js/adminlte.js"></script>
      </body>
    </Html>
  );
}
