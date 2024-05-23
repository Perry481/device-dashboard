import { connect } from "mssql";

export const config = {
  api: {
    responseLimit: false,
  },
};

export default async function handler(req, res) {
  try {
    // Replace the SQL query placeholder with your actual query
    const sqlQuery = `
    SELECT          
    a.客戶名稱, 
    c.DateOfYearPer,
    c.DateOfQPer,
    c.DateOfMonthPer,
    SUM(a.製造成本) AS 製造成本, 
    SUM(a.零件成本) AS 零件成本, 
    SUM(a.委外成本) AS 委外成本, 
    SUM(a.產品總成本) AS 產品總成本,
    SUM(CASE 
            WHEN a.客戶編號 <> '94810' THEN e.單價 * a.訂單數量
            ELSE e.百分比 * a.訂單數量 * a.產品單價 
        END) AS 佣金,
    SUM(j.WorkHour) AS TotalWorkHours  -- Using SUM to accumulate all WorkHours
FROM              
    [CHIComp01].dbo.absKPMKStatistics a
LEFT OUTER JOIN
    [CHIComp01].dbo.ebcMoneyBack e ON a.客戶編號 = e.客戶編號 AND a.母件編號 = e.新呈料號 
LEFT OUTER JOIN
    [CHIComp01].dbo.ebcMonthCalendar c ON CONVERT(varchar, a.Shiptime, 23) = c.DateID
LEFT OUTER JOIN
    [CHIComp01].dbo.absKPJobItem j ON j.CustomerName = a.客戶編號
    AND CONVERT(varchar, j.CreatedTime, 23) = c.DateID  -- Matching Year and Month
WHERE
    a.Shiptime >= '2020-12-26'
GROUP BY
    a.客戶名稱,
    c.DateOfYearPer,
    c.DateOfQPer,
    c.DateOfMonthPer

    `;

    // Connect to your SQL Server
    const sqlConfig = {
      user: "sa",
      password: "chi",
      server: "192.168.0.9", // This should be a string
      database: "CHIComp01",
      encrypt: false,
    };
    const pool = await connect(sqlConfig);

    try {
      // Execute the SQL query
      const result = await pool.request().query(sqlQuery);
      const nestedResult = nestResults(result.recordset);
      res.status(200).json(nestedResult);
    } catch (error) {
      console.error("Error:", error.message);
      res.status(500).json({ error: "Internal Server Error" });
    } finally {
      // Close the SQL connection
      await pool.close();
    }
    function nestResults(data) {
      const nested = {};

      data.forEach((item) => {
        const { DateOfYearPer, DateOfQPer, DateOfMonthPer, ...details } = item;

        // Ensure all date parts are strings and properly formatted
        const year = DateOfYearPer.toString().trim(); // Convert year to string and trim
        const quarter = `Q${DateOfQPer.toString().trim()}`; // Ensure quarter is prefixed with 'Q' and trimmed
        const month = `Month ${DateOfMonthPer.toString().trim()}`; // Prefix month to clearly denote it as a month and trim

        if (!nested[year]) {
          nested[year] = {};
        }
        if (!nested[year][quarter]) {
          nested[year][quarter] = {};
        }
        if (!nested[year][quarter][month]) {
          nested[year][quarter][month] = [];
        }

        nested[year][quarter][month].push(details);
      });

      // Sort quarters and months within each year
      Object.keys(nested).forEach((year) => {
        const sortedQuarters = {};
        Object.keys(nested[year])
          .sort()
          .forEach((quarter) => {
            const sortedMonths = {};
            Object.keys(nested[year][quarter])
              .sort()
              .forEach((month) => {
                sortedMonths[month] = nested[year][quarter][month];
              });
            sortedQuarters[quarter] = sortedMonths; // Replace with sorted months
          });
        nested[year] = sortedQuarters; // Replace year with sorted quarters
      });

      return nested;
    }
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
