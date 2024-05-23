import { connect } from "mssql";

export const config = {
  api: {
    responseLimit: false,
  },
};

export default async function handler(req, res) {
  // Replace the SQL query placeholder with your actual query
  const sqlQuery = `
  WITH m1 AS (
    SELECT
        KPM.製令單號,
        KPM.客戶編號,
        (KPM.訂單數量 * KPM.產品單價) AS 分攤金額1,
        (KPM.訂單數量 * KPM.產品單價) AS 銷貨總價,
        EMC.文字年月,
        EMC.DateOfYearPer,
        EMC.DateOfQPer,
        EMC.DateOfMonthPer
    FROM dbo.absKPMKStatistics KPM
    LEFT JOIN ebcMonthCalendar EMC ON CONVERT(VARCHAR(10), KPM.Shiptime, 23) = EMC.DateID
    WHERE KPM.客戶編號 IN ('110843','110958','111083','111035','110803','110996','110839')

    UNION ALL

    SELECT
        KPM.製令單號,
        KPM.客戶編號,
        0 AS 分攤金額1,
        (KPM.訂單數量 * KPM.產品單價) AS 銷貨總價,
        EMC.文字年月,
        EMC.DateOfYearPer,
        EMC.DateOfQPer,
        EMC.DateOfMonthPer
    FROM dbo.absKPMKStatistics KPM
    LEFT JOIN ebcMonthCalendar EMC ON CONVERT(VARCHAR(10), KPM.Shiptime, 23) = EMC.DateID
    WHERE KPM.客戶編號 NOT IN ('110843','110958','111083','111035','110803','110996','110839')
),
m2 AS (
    SELECT
        (37500 / SUM(m1.分攤金額1)) AS 合計,
        m1.文字年月
    FROM m1
    GROUP BY m1.文字年月
),
m_final AS (
    SELECT
        m1.客戶編號,
        m1.文字年月,
        SUM(m1.分攤金額1 * m2.合計) AS 租金總額,
        MAX(m1.DateOfYearPer) AS DateOfYearPer,
        MAX(m1.DateOfQPer) AS DateOfQPer,
        MAX(m1.DateOfMonthPer) AS DateOfMonthPer
    FROM m1
    LEFT JOIN m2 ON m1.文字年月 = m2.文字年月
    GROUP BY m1.客戶編號, m1.文字年月
),
db2 AS (
    SELECT          
        BA.CustID,
        BA.ShortName AS 客戶名稱,
        MC.DateOfYearPer,
        MC.DateOfQPer,
        MC.DateOfMonthPer,
        SUM(BA.LocalTotal) AS TotalLocal
    FROM 
        [CHIComp01].[dbo].[comBillAccountsForSales] BA
    LEFT JOIN 
        [CHIComp01].[dbo].[ebcMonthCalendar] MC ON CONVERT(VARCHAR, BA.BillDate, 23) = MC.DateID
    WHERE 
        BA.BillDate >= '20201226'
    GROUP BY 
        BA.CustID,
        BA.ShortName,
        MC.DateOfYearPer,
        MC.DateOfQPer,
        MC.DateOfMonthPer
)
SELECT
    db2.CustID AS 客戶編號,
    db2.客戶名稱,
    db2.DateOfYearPer,
    db2.DateOfQPer,
    db2.DateOfMonthPer,
    SUM(ISNULL(t1.製造成本, 0)) AS 製造成本,
    SUM(ISNULL(t1.零件成本, 0)) AS 零件成本,
    SUM(ISNULL(t1.委外成本, 0)) AS 委外成本,
    SUM(ISNULL(t1.產品總成本, 0)) AS 產品總成本,
    SUM(ISNULL(t1.訂單金額, 0)) AS 訂單金額,
    SUM(ISNULL(t1.佣金, 0)) AS 佣金,
    SUM(ISNULL(t1.間接成本, 0)) AS 間接成本,
    SUM(ISNULL(t2.損失金額, 0)) AS 損失金額,
    SUM(ISNULL(t3.MLAmount, 0)) AS 買進賣出進貨金額,
    MAX(db2.TotalLocal) AS TotalLocal,
    MAX(ISNULL(db4.ClassID, '')) AS ClassID,
    MAX(ISNULL(m_final.租金總額, 0)) AS 租金總額
FROM
    db2
LEFT JOIN
    (
        SELECT 
            a.客戶編號,
            c.DateOfYearPer,
            c.DateOfQPer,
            c.DateOfMonthPer,
            SUM(a.製造成本) AS 製造成本, 
            SUM(a.零件成本) AS 零件成本, 
            SUM(a.委外成本) AS 委外成本, 
            SUM(a.產品總成本) AS 產品總成本,
            SUM(a.訂單數量 * a.產品單價) AS 訂單金額, 
            SUM(
                CASE 
                    WHEN a.客戶編號 <> '94810' THEN e.單價 * a.訂單數量
                    ELSE e.百分比 * a.訂單數量 * a.產品單價 
                END
            ) AS 佣金,
            SUM(j.WorkHour) * 400 AS 間接成本
        FROM 
            [CHIComp01].[dbo].[absKPMKStatistics] a
        LEFT JOIN 
            [CHIComp01].[dbo].[ebcMoneyBack] e ON a.客戶編號 = e.客戶編號 AND a.母件編號 = e.新呈料號 
        LEFT JOIN 
            [CHIComp01].[dbo].[ebcMonthCalendar] c ON CONVERT(varchar, a.Shiptime, 23) = c.DateID
        LEFT JOIN 
            [CHIComp01].[dbo].[absKPJobItem] j ON j.CustomerName = a.客戶編號 AND CONVERT(varchar, j.CreatedTime, 23) = c.DateID
        WHERE 
            a.Shiptime >= '20201226'
        GROUP BY
            a.客戶編號,
            c.DateOfYearPer,
            c.DateOfQPer,
            c.DateOfMonthPer
    ) t1 ON db2.CustID = t1.客戶編號
          AND db2.DateOfYearPer = t1.DateOfYearPer
          AND db2.DateOfQPer = t1.DateOfQPer
          AND db2.DateOfMonthPer = t1.DateOfMonthPer
LEFT JOIN
    (
        SELECT 
            b.客戶編號,
            c.DateOfYearPer,
            c.DateOfQPer,
            c.DateOfMonthPer,
            SUM(b.損失金額) AS 損失金額
        FROM 
            [CHIComp01].[dbo].[ccpBillMain] b
        LEFT JOIN 
            [CHIComp01].[dbo].[ebcMonthCalendar] c ON CONVERT(varchar, b.客訴日期, 23) = c.DateID
        WHERE 
            b.客訴日期 >= '20201226'
        GROUP BY
            b.客戶編號,
            c.DateOfYearPer,
            c.DateOfQPer,
            c.DateOfMonthPer
    ) t2 ON db2.CustID = t2.客戶編號
          AND db2.DateOfYearPer = t2.DateOfYearPer
          AND db2.DateOfQPer = t2.DateOfQPer
          AND db2.DateOfMonthPer = t2.DateOfMonthPer
LEFT JOIN
    (
        SELECT
            BA.CustID,
            MC.DateOfYearPer,
            MC.DateOfQPer,
            MC.DateOfMonthPer,
            SUM(PR.MLAmount) AS MLAmount
        FROM 
            [CHIComp01].[dbo].[comProdRec] AS PR
        LEFT JOIN 
            (
                SELECT 
                    ProdID,
                    MAX(BillNO) AS 銷貨單號
                FROM 
                    [CHIComp01].[dbo].[comProdRec]
                WHERE 
                    Flag = '500' 
                    AND BillDate >= '20201226'
                GROUP BY 
                    ProdID
            ) AS PR1 ON PR.ProdID = PR1.ProdID
        LEFT JOIN 
            [CHIComp01].[dbo].[comBillAccountsForSales] AS BA ON PR1.銷貨單號 = BA.FundBillNo
        LEFT JOIN 
            [CHIComp01].[dbo].[ebcMonthCalendar] AS MC ON CONVERT(VARCHAR, PR.BillDate, 23) = MC.DateID
        WHERE 
            PR.Flag = '100'
            AND PR.BillDate >= '20201226'
            AND PR.ProdID LIKE '[0-9]%'
        GROUP BY
            BA.CustID,
            MC.DateOfYearPer,
            MC.DateOfQPer,
            MC.DateOfMonthPer
    ) t3 ON db2.CustID = t3.CustID
          AND db2.DateOfYearPer = t3.DateOfYearPer
          AND db2.DateOfQPer = t3.DateOfQPer
          AND db2.DateOfMonthPer = t3.DateOfMonthPer
LEFT JOIN
    (
        SELECT
            ID,
            ClassID
        FROM [CHIComp01].[dbo].[comCustomerForSales]
    ) db4 ON db2.CustID = db4.ID
LEFT JOIN m_final ON db2.CustID = m_final.客戶編號
                 AND db2.DateOfYearPer = m_final.DateOfYearPer
                 AND db2.DateOfQPer = m_final.DateOfQPer
                 AND db2.DateOfMonthPer = m_final.DateOfMonthPer
GROUP BY
    db2.CustID,
    db2.客戶名稱,
    db2.DateOfYearPer,
    db2.DateOfQPer,
    db2.DateOfMonthPer
ORDER BY 
    db2.CustID, 
    db2.DateOfYearPer, 
    db2.DateOfQPer, 
    db2.DateOfMonthPer;


    `;

  // Connect to your SQL Server
  const sqlConfig = {
    user: "sa",
    password: "chi",
    server: "192.168.0.9", // This should be a string
    database: "CHIComp01",
    encrypt: false,
  };

  try {
    const pool = await connect(sqlConfig);
    const result = await pool.request().query(sqlQuery);
    await pool.close();

    const data = result.recordset;
    const groupedData = data.reduce((acc, item) => {
      const year = item.DateOfYearPer;
      const quarter = `Q${item.DateOfQPer}`;
      const month = `Month ${item.DateOfMonthPer.trim()}`;

      if (!acc[year]) {
        acc[year] = {};
      }
      if (!acc[year][quarter]) {
        acc[year][quarter] = {};
      }
      if (!acc[year][quarter][month]) {
        acc[year][quarter][month] = [];
      }

      const formattedCustomerName = `${item.客戶名稱} (${item.ClassID})`;

      acc[year][quarter][month].push({
        客戶名稱: formattedCustomerName,
        // classID: item.ClassID,
        製造成本: Number(item.製造成本).toFixed(0),
        零件成本: Number(item.零件成本).toFixed(0),
        委外成本: Number(item.委外成本).toFixed(0),
        產品總成本: Number(item.產品總成本).toFixed(0),
        佣金: Number(item.佣金).toFixed(0),
        間接成本: Number(item.間接成本).toFixed(0),
        損失金額: Number(item.損失金額).toFixed(0),
        買進賣出進貨金額: Number(item.買進賣出進貨金額).toFixed(0),
        銷貨金額: Number(item.TotalLocal).toFixed(0),
        租金: Number(item.租金總額).toFixed(0),
        // Add more fields as needed, applying .toFixed(0) similarly
      });

      return acc;
    }, {});

    res.status(200).json(groupedData);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
