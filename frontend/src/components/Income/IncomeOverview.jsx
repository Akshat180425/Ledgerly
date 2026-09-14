import React, { useState, useEffect } from 'react';
import { LuPlus } from "react-icons/lu";
import CustomBarChart from "../Charts/CustomBarChart";
import { prepareIncomeBarChartData } from "../../utils/helper";

const IncomeOverview = ({ transactions, onAddIncome }) => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    setChartData(prepareIncomeBarChartData(transactions));
  }, [transactions]);

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <h5 className="text-lg">Income Overview</h5>
          <p className="text-xs text-gray-400 mt-0.5">
            Track your income sources and trends over time.
          </p>
        </div>

        <button className="add-btn" onClick={onAddIncome}>
          <LuPlus className="text-lg" /> Add Income
        </button>
      </div>

      <div className="mt-10">
        {chartData.length === 0 ? (
          <p className="text-sm text-gray-400 text-center">No income data to display.</p>
        ) : (
          <CustomBarChart data={chartData} />
        )}
      </div>
    </div>
  );
};

export default IncomeOverview;
