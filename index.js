import express, { urlencoded } from "express";
import csvParser from "csv-parser";
import fs from "fs";
import cookieParser from "cookie-parser";
import Trade from "./models/trade.js"; 
import dotenv from "dotenv";
import connectDB from "./utils/db.js";
dotenv.config();
import { upload } from "./utils/upload.js";
import { uploadOnColoudinary } from "./utils/cloudinary.js";


const app = express();
const port = process.env.PORT || 8001;

app.use(express.json()); 
app.use(cookieParser());
app.use(urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('products api running new deploy');
});

// API endpoint to upload CSV
app.post("/upload-csv", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    const filePath = req.file.path;
    const trades = [];

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (row) => {
        try {
          const [baseCoin, quoteCoin] = row.Market.split("/");

          const trade = {
            userId: parseInt(row.User_ID, 10),
            utcTime: new Date(row.UTC_Time),
            operation: row.Operation,
            baseCoin: baseCoin,
            quoteCoin: quoteCoin,
            amount: parseFloat(row["Buy/Sell Amount"]),
            price: parseFloat(row.Price),
          };

          trades.push(trade);
        } catch (err) {
          console.error("Error parsing row:", err);
        }
      })
      .on("end", async () => {
        try {
          
          await Trade.insertMany(trades);

          // Upload the file to Cloudinary
          await uploadOnColoudinary(filePath);
          console.log("NIKHIL",filePath);
          res.status(200).send("Trades uploaded and saved successfully.");
        } catch (err) {
          console.error(
            "Error saving trades to database or uploading to Cloudinary:",
            err
          );
          res.status(500).send("Error processing trades.");
        }
      })
      .on("error", (err) => {
        console.error("Error reading the CSV file:", err);
        res.status(500).send("Error reading the CSV file.");
      });
  } catch (err) {
    console.error("Error handling the request:", err);
    res.status(500).send("Server error.");
  }
});

// API endpoint to get balance at a specific timestamp
app.post("/balance", async (req, res) => {
  const { timestamp } = req.body;

  if (!timestamp) {
    return res.status(400).send("Timestamp is required");
  }

  const date = new Date(timestamp);
  const endOfDay = new Date(date);
  endOfDay.setUTCHours(23, 59, 59, 999);

  try {
    const trades = await Trade.find({ utcTime: { $lte: endOfDay } });

    const balances = {};

    trades.forEach((trade) => {
      const { baseCoin, operation, amount } = trade;

      if (!balances[baseCoin]) {
        balances[baseCoin] = 0;
      }

      if (operation === "Buy") {
        balances[baseCoin] += amount;
      } else if (operation === "Sell") {
        balances[baseCoin] -= amount;
      }
    });

    res.json(balances);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error calculating balance.");
  }
});

app.listen(port, () => {
  connectDB();
  console.log(`Server running on port ${port}`);
});
