import React from "react";
import { render } from "@testing-library/react-native";
import { expect, test } from "@jest/globals";

import { Text } from "react-native";

test("renders simple text", () => {
  const { getByText } = render(<Text>Testing!!!</Text>);
  expect(getByText("Testing!!!")).toBeTruthy();
});
