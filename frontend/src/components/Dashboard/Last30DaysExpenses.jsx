import React, { useState, useEffect } from 'react';
import CustomLineChart from '../Charts/CustomLineChart';
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
      
      <p className="text-sm text-gray-500 mt-1">
        Total Expense: <span className="font-medium text-black">₹{totalExpense}</span>
      </p>

      <CustomLineChart data={chartData} />
    </div>
  );
};

export default Last30DaysExpenses;
