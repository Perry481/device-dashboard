import {
  getCompanyFile,
  readJSONFile,
  writeJSONFile,
} from "../../../utils/fileHandler";

export default async function handler(req, res) {
  const { companyName } = req.query;

  try {
    const filePath = await getCompanyFile("cardSettings", companyName);

    if (req.method === "GET") {
      const cardSettings = await readJSONFile(filePath);
      res.status(200).json(cardSettings);
    } else if (req.method === "POST") {
      const updatedSettings = req.body;
      await writeJSONFile(filePath, updatedSettings);
      res.status(200).json({ message: "Card settings updated successfully" });
    } else {
      res.setHeader("Allow", ["GET", "POST"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error(`Error processing card settings for ${companyName}:`, error);
    res.status(500).json({
      message: "Failed to process card settings",
      error: error.message,
    });
  }
}
