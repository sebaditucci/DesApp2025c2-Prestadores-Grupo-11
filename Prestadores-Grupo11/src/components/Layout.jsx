import React from "react";
import Footer from "./Footer";

const Layout = ({ header, children }) => {
  return (
    <div className="app-shell d-flex flex-column min-vh-100">
      {/* Header */}
      {header && (
        <div className="container-fluid p-0">{header}</div>
      )}

      {/* Contenido principal */}
      <main className="app-main flex-grow-1 container-fluid">
        {children}
      </main>

      {/* Footer */}
      <div className="container-fluid p-0">
        <Footer />
      </div>
    </div>
  );
};

export default Layout;

