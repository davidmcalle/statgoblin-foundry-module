import "fvtt-types";

// Augment Foundry's own interfaces so our settings/flags are typed at the call
// sites. Pure types, no runtime output — add future Foundry-type patches here.
declare global {
  interface SettingConfig {
    "rollwatch.ingestUrl": string;
    "rollwatch.ingestToken": string;
    "rollwatch.campaignId": string;
  }
}

export {};
