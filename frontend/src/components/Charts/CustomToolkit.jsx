import React from 'react' 
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-white p-2 shadow rounded text-sm">
        <p><strong>{label}</strong></p>
        <p>Amount: ₹{item.amount}</p>
        {item.category && <p>Category: {item.category}</p>}
        {item.source && <p>Source: {item.source}</p>}
      </div>
    );
  }

  return null;
};

export default CustomTooltip
