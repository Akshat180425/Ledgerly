import React from 'react' 
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, } from 'recharts';
const CustomBarChart = ({data}) => {
  
  const getBarColor = (index) => {
    return index % 2 === 0 ? '#875cf5' : '#cfbefb';
  };

  const CustomTooltip = ({active, payload}) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white shadow-md rounded-lg p-2 border border-gray-300">
          <p className="font-semibold text-xs text-purple-800 mb-1">{payload[0].payload.category}</p>
          <p className="text-sm text-gray-600">{`Amount: ${payload[0].payload.amount}`}</p>
        </div>
      );
    }
    return null;
  };

  return (

    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid stroke='none' />
        <XAxis dataKey="month" tick={{ fill: '#555', fontSize: 12 }} stroke='none'/>
        <YAxis tick={{ fill: '#555', fontSize: 12 }} stroke='none' />
        <Tooltip content={CustomTooltip} />
        <Bar dataKey="amount" fill="#8884d8" radius={[10, 10, 0, 0]} activeDot={{ r: 8, fill: 'yellow' }} activeStyle={{ fill: 'green' }}>
          {data.map((entry, index) => (
            <Cell key={index} fill={getBarColor(index)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
export default CustomBarChart
