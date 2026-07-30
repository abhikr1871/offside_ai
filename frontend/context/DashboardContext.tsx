import React, { createContext, useContext, useState, ReactNode } from "react";
import * as Types from "../lib/types";

export const DashboardContext = createContext<any>(null);

export const useDashboard = () => useContext(DashboardContext);

export const DashboardProvider = ({ children, value }: { children: ReactNode, value: any }) => {
  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};
