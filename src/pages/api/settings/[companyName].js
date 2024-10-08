import {
  getCompanyFile,
  readJSONFile,
  writeJSONFile,
} from "../../../utils/fileHandler";

const defaultSettings = {
  pricingStandards: {
    簡易型時間電價三段式: {
      name: "簡易型時間電價三段式",
      timeRanges: {
        夏月: {
          weekdays: {
            peak: [[16, 22]],
            halfpeak: [
              [9, 16],
              [22, 24],
            ],
            offpeak: [[0, 9]],
          },
          saturday: { offpeak: [[0, 24]] },
          sunday: { offpeak: [[0, 24]] },
        },
        非夏月: {
          weekdays: {
            halfpeak: [
              [6, 11],
              [14, 24],
            ],
            offpeak: [
              [0, 6],
              [11, 14],
            ],
          },
          saturday: { offpeak: [[0, 24]] },
          sunday: { offpeak: [[0, 24]] },
        },
      },
      prices: {
        offPeakPrices: { 夏月: "NT$1.96", 非夏月: "NT$1.89" },
        peakPrices: { 夏月: "NT$6.92", 非夏月: "NT$4.33" },
        halfPeakPrices: { 夏月: "NT$4.54", 非夏月: "NT$4.33" },
      },
      基本電費: { 單相: { 夏月: 75.0, 非夏月: 75.0 } },
      每月鐘度數超過2000度之部分: 1.02,
    },
  },
  CO2: 0.494,
  activePricingStandard: "簡易型時間電價三段式",
  contractCapacity: 5,
};

export default async function handler(req, res) {
  const { companyName } = req.query;

  try {
    const filePath = await getCompanyFile("settings", companyName);

    if (req.method === "GET") {
      const settings = await readJSONFile(filePath);
      res.status(200).json({ ...defaultSettings, ...settings });
    } else if (req.method === "PATCH") {
      const updates = req.body;
      const currentSettings = await readJSONFile(filePath);
      const updatedSettings = {
        ...currentSettings,
        ...updates,
        machineGroups: updates.machineGroups || currentSettings.machineGroups,
      };
      await writeJSONFile(filePath, updatedSettings);
      res.status(200).json({ message: "Settings updated successfully" });
    } else {
      res.setHeader("Allow", ["GET", "PATCH"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error(`Error processing settings for ${companyName}:`, error);
    res.status(500).json({
      message: "Failed to process settings",
      error: error.message,
    });
  }
}
