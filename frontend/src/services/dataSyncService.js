// frontend/src/services/dataSyncService.js
import { expenseAPI } from './api';

class DataSyncService {
    // Sync uploaded CSV data to backend
    static async syncUploadedData(uploadedData) {
        if (!uploadedData || !uploadedData.saved || uploadedData.saved.length === 0) {
            return { success: false, message: 'No data to sync' };
        }

        try {
            
            // The expenses are already saved in backend during upload
            // Just need to refresh the UI by fetching fresh data from API
            const freshData = await expenseAPI.getAll();
            
            return {
                success: true,
                message: 'Data synced successfully',
                count: uploadedData.saved.length,
                data: freshData.data
            };
        } catch (error) {
            console.error('Sync error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get merged data (API + Uploaded) - FIXED VERSION
    static async getMergedExpenses() {
        try {
            // Get data from backend API - this includes ALL expenses (manual + CSV imports)
            const apiRes = await expenseAPI.getAll();
            const apiExpenses = apiRes.data || [];
            
            
            return {
                success: true,
                expenses: apiExpenses, // Just return API data - it already has everything!
                apiCount: apiExpenses.length,
                uploadCount: 0, // No need to track separately
                totalCount: apiExpenses.length
            };
        } catch (error) {
            console.error('Error getting merged expenses:', error);
            return { success: false, error: error.message, expenses: [] };
        }
    }

    // Get category summary including uploaded data
    static async getCategorySummaryWithUpload(month, year) {
        try {
            // Get summary from API - this already includes CSV data
            const apiRes = await expenseAPI.getSummary(month, year);
            return apiRes.data || { category_summary: [] };
        } catch (error) {
            console.error('Error getting category summary:', error);
            return { category_summary: [] };
        }
    }

    // Get monthly summary including uploaded data
    static async getMonthlySummaryWithUpload(year) {
        try {
            // Get summary from API - this already includes CSV data
            const apiRes = await expenseAPI.getSummary(new Date().getMonth() + 1, year);
            return apiRes.data || { monthly_summary: [] };
        } catch (error) {
            console.error('Error getting monthly summary:', error);
            return { monthly_summary: [] };
        }
    }
}

export default DataSyncService;
