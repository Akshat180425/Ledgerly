const baseURL = import.meta.env.VITE_API_URL;

export const API_PATHS = {
  AUTH: {
    LOGIN: `${baseURL}/api/v1/auth/login`,
    REGISTER: `${baseURL}/api/v1/auth/register`,
    GET_USER_INFO: `${baseURL}/api/v1/auth/getUser`,
  },
  DASHBOARD: {
    GET_DATA: `${baseURL}/api/v1/dashboard`,
  },
  INCOME: {
    ADD_INCOME: `${baseURL}/api/v1/income/add`,
    GET_ALL_INCOME: `${baseURL}/api/v1/income/get`,
    DELETE_INCOME: (incomeId) => `${baseURL}/api/v1/income/${incomeId}`,
    DOWNLOAD_INCOME: `${baseURL}/api/v1/income/downloadexcel`,
  },
  EXPENSE: {
    ADD_EXPENSE: `${baseURL}/api/v1/expense/add`,
    GET_ALL_EXPENSE: `${baseURL}/api/v1/expense/get`,
    DELETE_EXPENSE: (expenseId) => `${baseURL}/api/v1/expense/${expenseId}`,
    DOWNLOAD_EXPENSE: `${baseURL}/api/v1/expense/downloadexcel`,
  },
  IMAGE: {
    UPLOAD_IMAGE: `${baseURL}/api/v1/auth/upload-image`,
  },
};
