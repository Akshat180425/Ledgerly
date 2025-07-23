import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import AddExpenseForm from "../../components/Expense/AddExpenseForm";
import ExpenseOverview from "../../components/Expense/ExpenseOverview";
import Modal from "../../components/Modal";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { toast } from "react-hot-toast";
import ExpenseList from "../../components/Expense/ExpenseList";

const Expense = () => {

  const [expenseData, setExpenseData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDeleteAlert, setOpenDeleteAlert] = useState({ show: false, data: null, });
  const [openAddExpenseModal, setOpenAddExpenseModal] = useState(false);
  const fetchExpenseDetails = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await axiosInstance.get(`${API_PATHS.INCOME.GET_ALL_INCOME}`);
      if (response.data) {
        setExpenseData(response.data);
      }
    } catch (error) {
      console.log("Something went wrong. Please try again.", error);
    } finally {
      setLoading(false);
    }
  };
  const handleAddExpense = async (expense) => { 
    const { source, amount, date, icon } = expense;

    // Validation Checks

    if (!source.trim()) { 
      toast.error("Source is required."); 
      return;
    }

    if (!amount || isNaN(amount) || Number(amount) <= 0) { 
      toast.error("Amount should be a valid number greater than 0.");
      return;
    }

    if (!date) {
      toast.error("Date is required.")
      return;
    };

    try { 
      await axiosInstance.post(API_PATHS.INCOME.ADD_INCOME, { 
        source, 
        amount, 
        date, 
        icon, 
      }); 
      
      setOpenAddExpenseModal(false); 
      toast.success("Expense added successfully"); 
      fetchExpenseDetails(); 
    } catch (error) { 
      console.error( 
        "Error adding expense:", 
        error.response?.data?.message || error.message 
      ); 
    }
  };
  const deleteExpense = async (id) => {
    try { 
      await axiosInstance.delete(API_PATHS.INCOME.DELETE_INCOME (id)); 
      setOpenDeleteAlert({ show: false, data: null }); 
      toast.success ("Expense details deleted successfully"); 
      fetchExpenseDetails(); 
    } catch (error) { 
      console.error( 
        "Error deleting expense:", 
        error.response?.data?.message || error.message 
      ); 
    }
  };
  const handleDownloadExpenseDetails = async () => {
    try { 
      const response = await axiosInstance.get( 
        API_PATHS. EXPENSE. DOWNLOAD_EXPENSE, 
        { responseType: "blob", } 
      );
      const url = window.URL.createObjectURL(new Blob( [response.data]));
      const link = document.createElement("a"); 
      link.href = url; 
      link.setAttribute("download", "expense_details.xlsx"); 
      document. body.appendChild (link); 
      link.click(); 
      link.parentNode. removeChild( link); 
      window. URL. revokeObjectURL (url); 
    } catch (error) { 
      console.error("Error downloading expense details:", error);
      toast.error("Failed to download expnse details. Please try again later.")
    }
  };

  useEffect(() => {
    fetchExpenseDetails();
  }, []);

  return (

    <DashboardLayout activeMenu="Expense">
      <div className="my-5 mx-auto">
        <div className="grid grid-cols-1 gap-6">
          <div className="">
            <ExpenseOverview
              transactions={expenseData}
              onAddExpense={() => setOpenAddExpenseModal(true)}
            />
          </div>

          <ExpenseList 
            transactions={expenseData} 
            onDelete={(id) => { 
              setOpenDeleteAlert({ 
                show: true, 
                data: id 
              }); 
            }}
            onDownload={handleDownloadExpenseDetails} 
          />
        </div>

        <Modal
          isOpen={openAddExpenseModal}
          onClose={() => setOpenAddExpenseModal(false)}
          title="Add Expense"
        >
          <AddExpenseForm onAddExpense={handleAddExpense} />
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default Expense;
