import React from "react";
import { render } from "@testing-library/react-native";

const AllProviders = ({ children }: { children: React.ReactNode }) => {
  return children;
};

export const customRender = (ui: React.ReactElement) =>
  render(ui, { wrapper: AllProviders });
