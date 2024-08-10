import mongoose from "mongoose";

const tradeSchema = new mongoose.Schema({
    userId: { type: Number, required: true },
    utcTime: { type: Date, required: true },
    operation: { type: String, required: true, enum: ['Buy', 'Sell'] },
    baseCoin: { type: String, required: true },
    quoteCoin: { type: String, required: true },
    amount: { type: Number, required: true },
    price: { type: Number, required: true },
});

const Trade = mongoose.model('Trade', tradeSchema);

export default Trade;
