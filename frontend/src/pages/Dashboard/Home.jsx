import React, { useState } from 'react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import { useNavigate } from 'react-router-dom'
import { useUserAuth } from '../../hooks/UseUserAuth'
import axiosInstance from '../../utils/axiosInstance'
import { API_PATHS } from '../../utils/apiPaths'
import { addThousandsSeparator } from '../../utils/helper'
import { IoMdCard } from 'react-icons/io'
import InfoCard from '../../components/Cards/InfoCard'
import RecentTransactions from '../../components/Dashboard/RecentTransactions'
import { LuHandCoins, LuWalletMinimal } from 'react-icons/lu'
import Last30DaysExpenses from '../../components/Dashboard/Last30DaysExpenses'
import FinanceOverview from '../../components/Dashboard/FinanceOverview'
import RecentIncomeWithChart from '../../components/Dashboard/RecentIncomeWithChart'
import RecentIncome from "../../components/Dashboard/RecentIncome"

const Home = () => {

  useUserAuth();

  const navigate = useNavigate(); 
  const [dashboardData, setDashboardData] = useState(null); 
  const [loading, setLoading] = useState(false); 
  
  const fetchDashboardData = async () => { 
    if (loading) return; 
    setLoading(true); 
    try { 
      const response = await axiosInstance.get(
        `${API_PATHS.DASHBOARD.GET_DATA}` 
      ); 
      if (response.data) { 
        setDashboardData(response.data); 
      } 
    } catch (error) { 
      console.log(
        "Something went wrong. Please try again.", 
        error
      ) 
    } finally { 
      setLoading(false); 
    } 
  };

  React.useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <DashboardLayout activeMenu="Dashboard">
      <div className="my-5 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6"> 
          <InfoCard 
            icon={<IoMdCard/>} 
            label="Total Balance" 
            value={addThousandsSeparator(dashboardData?.totalBalance || 0)} 
            color="bg-primary" 
          />
          <InfoCard 
            icon={<LuWalletMinimal/>} 
            label="Total Income" 
            value={addThousandsSeparator(dashboardData?.totalIncome || 0)} 
            color="bg-orange-500" 
          />
          <InfoCard 
            icon={<LuHandCoins/>} 
            label="Total Expense" 
            value={addThousandsSeparator(dashboardData?.totalExpense || 0)} 
            color="bg-red-500" 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <RecentTransactions 
            transactions={dashboardData?.recentTransactions} 
            onSeeMore={() => navigate("/expense")} 
          /> 

          <FinanceOverview
            totalBalance={dashboardData?.totalBalance || 0}
            totalIncome={dashboardData?.totalIncome || 0}
            totalExpense={dashboardData?.totalExpense || 0}
          />

          <RecentTransactions
            transactions={dashboardData?.last30daysExpenses || []}
            onSeeMore={() => navigate("/expense")}
          />

          <Last30DaysExpenses
            data={dashboardData?.last30daysExpenses?.transactions || []}
          />

          <RecentIncomeWithChart
            data={dashboardData?.last60daysIncome?.transactions || []}
            totalIncome={dashboardData?.totalIncome || 0}
          />

          <RecentIncome
            transactions={dashboardData?.last60daysIncome?.transactions || []}
            onSeeMore={() => navigate("/income")}
          />

        </div>
      </div>
    </DashboardLayout>
  )
}

export default Home
