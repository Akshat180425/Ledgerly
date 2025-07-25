import React, { useState, useEffect } from 'react';
import CustomBarChart from '../Charts/CustomBarChartForExpenses';
import { prepareExpenseBarChartData } from '../../utils/helper';

const Last30DaysExpenses = ({ data, totalExpense }) => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const result = prepareExpenseBarChartData(data);
    setChartData(result);
  }, [data]);

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <h5 className="text-lg">Last 30 Days Expense</h5>
      </div>
      <CustomBarChart
        data={chartData}
        label="Total Expense"
        totalAmount={`₹${totalExpense}`}
        color="#FA2C37" // Optional: use red shade for expense
      />
    </div>
  );
};

export default Last30DaysExpenses;
