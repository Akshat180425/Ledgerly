import React, { useState } from 'react' 
import Input from "../Inputs/Input"
import EmojiPickerPopup from '../layouts/EmojiPickerPopup';

const AddExpenseForm = ({onAddExpense}) => { 
  const [expense, setExpense] = useState({ 
    source: "", 
    amount: "", 
    date: "", 
    icon: "", 
  });
  
  const handleChange = (key, value) => setExpense({ ...expense, [key]: value}); 
  
  return (
    <div> 

      <EmojiPickerPopup 
        icon={expense.icon} 
        onSelect={(selectedIcon) => handleChange("icon", selectedIcon)} 
      />

      <Input 
        value={expense.source} 
        onChange={({ target }) => handleChange("source", target.value)} 
        label="Expense Source" 
        placeholder="Freelance, Salary, etc" 
        type="text" 
      /> 

      <Input 
        value={expense.amount} 
        onChange={({ target }) => handleChange("amount", target.value)} 
        label="Amount" 
        placeholder="" 
        type="number" 
      />

      <Input 
        value={expense.date}
        onChange={({ target }) => handleChange("date", target.value)} 
        label="Date" 
        placeholder="Freelance, Salary, etc" 
        type="date" 
      />

      <div className="flex justify-end mt-6">
        <button className="add-btn add-btn-fill" type='button' onClick={() => onAddExpense(expense)}>
          Add Expense
        </button>
      </div>
    </div>
  )
}
      
export default AddExpenseForm
