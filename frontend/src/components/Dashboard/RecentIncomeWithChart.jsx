import React, { useState, useEffect } from 'react';
import CustomLineChart from '../Charts/CustomLineChart';
import { prepareIncomeBarChartData } from '../../utils/helper';

const RecentIncomeWithChart = ({ data, totalIncome }) => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    setChartData(prepareIncomeBarChartData(data));
  }, [data]);

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <h5 className="text-lg">Last 60 Days Income</h5>
      </div>
      <p className="text-sm text-gray-500 mt-1">
        Total Income: <span className="font-medium text-black">₹{totalIncome}</span>
      </p>
      <CustomLineChart data={chartData} />
    </div>
  );
};

export default RecentIncomeWithChart;
