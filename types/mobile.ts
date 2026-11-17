export interface MobileScreen {
  name: string;
  label: string;
  slots: string[]; // ordered widget IDs from the same desktop page
}

export interface MobileConfig {
  screens: MobileScreen[];
}
