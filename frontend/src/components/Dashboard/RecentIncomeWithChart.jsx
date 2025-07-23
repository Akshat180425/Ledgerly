import React from 'react' 
import { useState, useEffect } from 'react';
import CustomPieChart from '../../components/Charts/CustomPieChart';

const COLORS = ["#875CF5", "#FA2C37", "#FF6900", "#413976" ];
const RecentIncomeWithChart = ({data, totalIncome}) => { 

  const [chartData, setChartData] = useState([]); 
  const prepareChartData = () => { 
    const dataArr = data?.map( (item) => ({ name: item?.source, amount: item?.amount, })) || []; 
    setChartData(dataArr); 
  }; 

  useEffect(() => { 
    prepareChartData(); 
    return () => {}; 
  }, [data]);

  return ( 
  <div className="card"> 
    <div className="flex items-center justify-between "> 
      <h5 className="text-1g">Last 60 Days Income</h5> 
    </div> 
    <CustomPieChart data={data} label="Total Income" totalAmount={`$${totalIncome}`} showTextAnchor colors={COLORS} /> 
  </div> 
)} 

export default RecentIncomeWithChart
