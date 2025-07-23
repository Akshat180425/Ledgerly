import React from "react"; 
import { 
  PieChart, 
  Pie, Cell, Tooltip, ResponsiveContainer, Legend, 
} from "recharts"; 
import CustomTooltip from "./CustomToolkit";
import CustomLegend from "./CustomLegend";

const CustomPieChart = ({ data, label, totalAmount, colors, showTextAnchor, }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Legend content={CustomLegend}/>
        <Tooltip content={CustomTooltip}/>
        <Pie
          data={data}
          dataKey="amount"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={130}
          labelLine={false}
          innerRadius={100}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        {showTextAnchor && (
          <>
            <text
              x="50%"
              y="50%"
              dy={-25}
              textAnchor="middle"
              fill="#666"
              fontSize="14px"
            >
              {label}
            </text>
            <text
              x="50%"
              y="50%"
              dy={8}
              textAnchor="middle"
              fill="#333"
              fontSize="24px"
              fontWeight="semi-bold"
            >
              {totalAmount}
            </text>
          </>
        )}
      </PieChart>
    </ResponsiveContainer>
  );
};

export default CustomPieChart;
