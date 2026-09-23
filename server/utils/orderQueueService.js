const Order = require("../models/Order");
const PriorityQueue = require("./PriorityQueue");

const computePriority = (order) => {
    const baseScore = order.isExpress ? 100 : 10;
    const minutesWating = (Date.now() - new Date(order.createdAt)) / (1000 * 60);
    const waitTimeBonus = Math.floor(minutesWating);
    return baseScore + waitTimeBonus;
}

const buildOrderQueue = async () =>{
    const placeOrders = await Order.find({
        currentStatus: "Placed",
        paymentStatus: "Paid",
        orderVisibility: "Visible",
    });

    const pq = new PriorityQueue();
    placeOrders.forEach((order)=>{
        const priority = computePriority(order);
        pq.insert(order, priority);
    });

    return pq;
}

module.exports = {buildOrderQueue, computePriority};