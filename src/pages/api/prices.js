// pages/api/prices.js
import { promises as fs } from "fs";
import path from "path";

const filePath = path.resolve(process.cwd(), "prices.json");

// Initialize prices with default values if the file doesn't exist
const defaultPrices = {
  offPeakPrices: { 夏月: "NT$1.66", 非夏月: "NT$1.58" },
  peakPrices: { 夏月: "NT$4.02", 非夏月: "NT$3.92" },
  halfPeakPrices: { 夏月: "NT$2.14", 非夏月: "NT$2.06" },
};

async function readPricesFromFile() {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      // If file does not exist, return default prices
      return defaultPrices;
    }
    throw error;
  }
}

async function writePricesToFile(prices) {
  const data = JSON.stringify(prices, null, 2);
  await fs.writeFile(filePath, data, "utf-8");
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const prices = await readPricesFromFile();
      res.status(200).json(prices);
    } catch (error) {
      res.status(500).json({ message: "Failed to read prices", error });
    }
  } else if (req.method === "POST") {
    try {
      await writePricesToFile(req.body);
      res.status(200).json({ message: "Prices saved successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to save prices", error });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
