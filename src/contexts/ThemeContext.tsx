import React, { createContext, useContext } from "react";
import { theme, Theme } from "../constants/theme";

const ThemeContext = createContext<Theme>(theme);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
