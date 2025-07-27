import React from 'react' 
import { LuPlus } from "react-icons/lu"; 
import CustomBarChart from "../Charts/CustomBarChartForExpenses"; 
import { useState, useEffect } from 'react';
import { prepareExpenseLineChartData } from "../../utils/helper";

const ExpenseOverview = ({transactions, onAddExpense}) => { 
  const [chartData, setChartData] = useState([]) 
  useEffect(() => { 
    const result = prepareExpenseLineChartData(transactions); 
    setChartData(result); 
    return () => {}; 
  }, [transactions]); 
  return ( 
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="">
          <h5 className="text-lg">
            Expense Overview
          </h5>
          <p className="text-xs text-gray-400 mt-0.5">
            Track your expense sources and trends over time.
          </p>
        </div>

        <button className="add-btn" onClick={onAddExpense}>
          <LuPlus className='text-lg'/> Add Expense
        </button>
      </div>
      <div className="mt-10">
        <CustomBarChart data={chartData} /> 
      </div>
    </div>
  ) 
} 
  
export default ExpenseOverview
