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
      let machineOrder = await readJSONFile(filePath);

      // Fetch machine list
      const machineResponse = await fetch(
        `https://iot.jtmes.net/${companyName}/api/equipment/powermeter_list`
      );
      const machineData = await machineResponse.json();

      // Get list of machine names
      const machineNames = machineData.map((machine) => machine.name);

      // Add any new machines to the end of the existing order
      machineNames.forEach((name) => {
        if (!machineOrder.includes(name)) {
          machineOrder.push(name);
        }
      });

      // Remove any machines that no longer exist
      machineOrder = machineOrder.filter((name) => machineNames.includes(name));

      // Save the updated order back to the file
      await writeJSONFile(filePath, machineOrder);

      res.status(200).json(machineOrder);
    } else if (req.method === "POST") {
      const newOrder = req.body;
      await writeJSONFile(filePath, newOrder);
      res.status(200).json({ message: "Machine order updated successfully" });
    } else {
      res.setHeader("Allow", ["GET", "POST"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error(`Error processing machine order for ${companyName}:`, error);
    res
      .status(500)
      .json({
        message: "Failed to process machine order",
        error: error.message,
      });
  }
}
