import type { CapacitorConfig } from "@capacitor/cli";

const remoteUrl = process.env.CAPACITOR_SERVER_URL;

const config: CapacitorConfig = {
  appId: "com.primeform.app",
  appName: "Primeform",
  webDir: "out",
  server: remoteUrl
    ? {
        url: remoteUrl,
        cleartext: remoteUrl.startsWith("http://"),
      }
    : undefined,
};

export default config;
