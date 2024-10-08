import {
  getCompanyFile,
  readJSONFile,
  writeJSONFile,
} from "../../../utils/fileHandler";

export default async function handler(req, res) {
  const { companyName } = req.query;

  try {
    const filePath = await getCompanyFile("machineOrder", companyName);

    if (req.method === "GET") {
      const machineOrder = await readJSONFile(filePath);
      res.status(200).json(machineOrder);
    } else if (req.method === "POST") {
      const updatedOrder = req.body;
      await writeJSONFile(filePath, updatedOrder);
      res.status(200).json({ message: "Machine order updated successfully" });
    } else {
      res.setHeader("Allow", ["GET", "POST"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error(`Error processing machine order for ${companyName}:`, error);
    res.status(500).json({
      message: "Failed to process machine order",
      error: error.message,
    });
  }
}
