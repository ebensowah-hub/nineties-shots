import React, { useState, useEffect, useMemo } from 'react';
import {
  FinanceOverviewStats,
  FinanceAnalyticsData,
  FinancialTransaction,
  Expense,
  ExpenseCategory,
  PaymentMethod,
  Booking
} from '../../types';
import {
  getFinanceOverview,
  getFinanceAnalytics,
  getFinancialTransactions,
  getAdminExpenses,
  createAdminExpense,
  updateAdminExpense,
  deleteAdminExpense
} from '../../lib/api';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Filter,
  Search,
  Download,
  Receipt,
  CheckCircle2,
  Clock,
  AlertCircle,
  PieChart as PieChartIcon,
  BarChart2,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  RefreshCw,
  X,
  CreditCard,
  Building2,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminFinanceProps {
  bookings: Booking[];
  onRefreshAll?: () => void;
}

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Equipment',
  'Transport',
  'Editing/software',
  'Marketing',
  'Studio/location',
  'Staff/assistants',
  'Other'
];

const PAYMENT_METHODS: PaymentMethod[] = [
  'Mobile Money',
  'Bank Transfer',
  'Cash',
  'Credit/Debit Card',
  'Other'
];

export const AdminFinance: React.FC<AdminFinanceProps> = ({ bookings, onRefreshAll }) => {
  // Navigation & Subview Tabs
  const [subTab, setSubTab] = useState<'overview' | 'expenses' | 'transactions'>('overview');

  // Time Range Filter
  const [timeRange, setTimeRange] = useState<string>('this_year');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showCustomDateModal, setShowCustomDateModal] = useState<boolean>(false);

  // Data States
  const [overview, setOverview] = useState<FinanceOverviewStats | null>(null);
  const [analytics, setAnalytics] = useState<FinanceAnalyticsData | null>(null);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Expense Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);

  // Expense Form Fields
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('Equipment');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formPaymentMethod, setFormPaymentMethod] = useState<PaymentMethod>('Mobile Money');
  const [formReceiptRef, setFormReceiptRef] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  // Expense Filters
  const [expenseSearch, setExpenseSearch] = useState<string>('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('all');
  const [expenseMethodFilter, setExpenseMethodFilter] = useState<string>('all');

  // Transactions Filter
  const [txSearch, setTxSearch] = useState<string>('');
  const [txTypeFilter, setTxTypeFilter] = useState<string>('all');
  const [txStatusFilter, setTxStatusFilter] = useState<string>('all');

  // Load Finance Data
  const loadFinanceData = async (showLoadingSpinner: boolean = true) => {
    try {
      if (showLoadingSpinner) setLoading(true);
      else setRefreshing(true);
      setActionError(null);

      const params = {
        timeRange,
        startDate: timeRange === 'custom' ? customStartDate : undefined,
        endDate: timeRange === 'custom' ? customEndDate : undefined
      };

      const [overviewData, analyticsData, txData, expensesData] = await Promise.all([
        getFinanceOverview(params),
        getFinanceAnalytics(params),
        getFinancialTransactions(),
        getAdminExpenses()
      ]);

      setOverview(overviewData);
      setAnalytics(analyticsData);
      setTransactions(txData);
      setExpenses(expensesData);
    } catch (err: any) {
      console.error('Failed to load finance data:', err);
      setActionError(err.message || 'Failed to load financial records');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFinanceData(true);
  }, [timeRange, customStartDate, customEndDate]);

  // Open Create Expense Modal
  const handleOpenCreateExpense = () => {
    setEditingExpense(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormCategory('Equipment');
    setFormAmount('');
    setFormDescription('');
    setFormPaymentMethod('Mobile Money');
    setFormReceiptRef('');
    setFormNotes('');
    setIsExpenseModalOpen(true);
  };

  // Open Edit Expense Modal
  const handleOpenEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setFormDate(expense.date);
    setFormCategory(expense.category);
    setFormAmount(String(expense.amount));
    setFormDescription(expense.description);
    setFormPaymentMethod(expense.paymentMethod);
    setFormReceiptRef(expense.receiptRef || '');
    setFormNotes(expense.notes || '');
    setIsExpenseModalOpen(true);
  };

  // Submit Expense Form
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(formAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setActionError('Please enter a valid expense amount greater than 0.');
      return;
    }
    if (!formDescription.trim()) {
      setActionError('Please enter a short description for this expense.');
      return;
    }

    try {
      setFormSubmitting(true);
      setActionError(null);

      const payload = {
        date: formDate,
        category: formCategory,
        amount: parsedAmount,
        description: formDescription.trim(),
        paymentMethod: formPaymentMethod,
        receiptRef: formReceiptRef.trim() || undefined,
        notes: formNotes.trim() || undefined
      };

      if (editingExpense) {
        await updateAdminExpense(editingExpense.id, payload);
        setActionSuccess('Expense updated successfully.');
      } else {
        await createAdminExpense(payload);
        setActionSuccess('Expense recorded successfully.');
      }

      setIsExpenseModalOpen(false);
      await loadFinanceData(false);
      if (onRefreshAll) onRefreshAll();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      console.error('Error saving expense:', err);
      setActionError(err.message || 'Failed to save expense');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete Expense Handler
  const handleDeleteExpense = async () => {
    if (!deletingExpenseId) return;
    try {
      setFormSubmitting(true);
      await deleteAdminExpense(deletingExpenseId);
      setDeletingExpenseId(null);
      setActionSuccess('Expense deleted successfully.');
      await loadFinanceData(false);
      if (onRefreshAll) onRefreshAll();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      console.error('Error deleting expense:', err);
      setActionError(err.message || 'Failed to delete expense');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (expenseCategoryFilter !== 'all' && e.category.toLowerCase() !== expenseCategoryFilter.toLowerCase()) {
        return false;
      }
      if (expenseMethodFilter !== 'all' && e.paymentMethod.toLowerCase() !== expenseMethodFilter.toLowerCase()) {
        return false;
      }
      if (expenseSearch.trim()) {
        const q = expenseSearch.toLowerCase().trim();
        const matches =
          e.description.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          (e.receiptRef && e.receiptRef.toLowerCase().includes(q)) ||
          (e.notes && e.notes.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [expenses, expenseCategoryFilter, expenseMethodFilter, expenseSearch]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (txTypeFilter !== 'all') {
        if (txTypeFilter === 'income' && (t.type === 'expense' || t.type === 'refund')) return false;
        if (txTypeFilter === 'expense' && t.type !== 'expense') return false;
        if (txTypeFilter !== 'income' && txTypeFilter !== 'expense' && t.type !== txTypeFilter) return false;
      }
      if (txStatusFilter !== 'all' && t.status.toLowerCase() !== txStatusFilter.toLowerCase()) {
        return false;
      }
      if (txSearch.trim()) {
        const q = txSearch.toLowerCase().trim();
        const matches =
          t.title.toLowerCase().includes(q) ||
          t.clientOrPayee.toLowerCase().includes(q) ||
          t.serviceOrCategory.toLowerCase().includes(q) ||
          (t.bookingRef && t.bookingRef.toLowerCase().includes(q)) ||
          (t.notes && t.notes.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [transactions, txTypeFilter, txStatusFilter, txSearch]);

  // Export Expenses to CSV
  const handleExportExpensesCSV = () => {
    if (filteredExpenses.length === 0) return;
    const headers = ['ID', 'Date', 'Category', 'Description', 'Amount (GHS)', 'Payment Method', 'Receipt Ref', 'Notes'];
    const rows = filteredExpenses.map(e => [
      e.id,
      e.date,
      `"${e.category}"`,
      `"${e.description.replace(/"/g, '""')}"`,
      e.amount.toFixed(2),
      `"${e.paymentMethod}"`,
      `"${e.receiptRef || ''}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ninetiesshots_expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Financial Ledger to CSV
  const handleExportLedgerCSV = () => {
    if (filteredTransactions.length === 0) return;
    const headers = ['Transaction ID', 'Date', 'Type', 'Title', 'Client/Payee', 'Category/Service', 'Amount (GHS)', 'Status', 'Payment Method', 'Notes'];
    const rows = filteredTransactions.map(t => [
      t.id,
      t.date,
      `"${t.typeLabel}"`,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.clientOrPayee.replace(/"/g, '""')}"`,
      `"${t.serviceOrCategory.replace(/"/g, '""')}"`,
      t.amount.toFixed(2),
      `"${t.status}"`,
      `"${t.paymentMethod}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ninetiesshots_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatGHS = (val: number | undefined) => {
    if (val === undefined || isNaN(val)) return 'GH₵0.00';
    return `GH₵${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const profitMargin = overview && overview.totalRevenue > 0
    ? Math.round((overview.netIncome / overview.totalRevenue) * 100)
    : 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 font-sans">
      {/* Toast Notification Alerts */}
      <AnimatePresence>
        {actionSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 text-xs font-mono flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
            <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {actionError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-rose-950/80 border border-rose-800/80 text-rose-300 text-xs font-mono flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button onClick={() => setActionError(null)} className="text-rose-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-neutral-900 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-mono tracking-[0.25em] text-neutral-500 uppercase">
              EXECUTIVE FINANCE CONTROL & AUDIT
            </span>
            <span className="px-2 py-0.5 text-[9px] font-mono uppercase bg-neutral-900 text-neutral-400 border border-neutral-800">
              OFFICIAL CURRENCY: GH₵ (GHS)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading text-white uppercase tracking-tight flex items-center gap-3">
            <span>Finance & Income Analytics</span>
            {refreshing && <RefreshCw className="w-5 h-5 text-neutral-500 animate-spin" />}
          </h1>
        </div>

        {/* Global Controls: Time Filter & Record Expense Action */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex items-center bg-neutral-950 border border-neutral-800 p-1 font-mono text-xs">
            {[
              { id: 'today', label: 'Today' },
              { id: 'this_week', label: 'Week' },
              { id: 'this_month', label: 'Month' },
              { id: 'last_3_months', label: '3M' },
              { id: 'this_year', label: 'This Year' },
              { id: 'all', label: 'All Time' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setTimeRange(tab.id)}
                className={`px-3 py-1.5 transition-colors ${
                  timeRange === tab.id
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
            <button
              onClick={() => setShowCustomDateModal(true)}
              className={`px-3 py-1.5 flex items-center gap-1 transition-colors ${
                timeRange === 'custom'
                  ? 'bg-white text-black font-bold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Custom</span>
            </button>
          </div>

          <button
            onClick={handleOpenCreateExpense}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs uppercase tracking-wider font-bold transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Navigation Tabs */}
      <div className="flex border-b border-neutral-900 gap-8 font-mono text-xs">
        <button
          onClick={() => setSubTab('overview')}
          className={`pb-3 transition-colors relative flex items-center gap-2 ${
            subTab === 'overview' ? 'text-white font-bold' : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>FINANCIAL OVERVIEW & CHARTS</span>
          {subTab === 'overview' && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-white shadow-glow" />
          )}
        </button>

        <button
          onClick={() => setSubTab('expenses')}
          className={`pb-3 transition-colors relative flex items-center gap-2 ${
            subTab === 'expenses' ? 'text-white font-bold' : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>EXPENSE TRACKING ({expenses.length})</span>
          {subTab === 'expenses' && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-white shadow-glow" />
          )}
        </button>

        <button
          onClick={() => setSubTab('transactions')}
          className={`pb-3 transition-colors relative flex items-center gap-2 ${
            subTab === 'transactions' ? 'text-white font-bold' : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>TRANSACTION LEDGER ({transactions.length})</span>
          {subTab === 'transactions' && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-white shadow-glow" />
          )}
        </button>
      </div>

      {/* VIEW 1: FINANCIAL OVERVIEW & INTERACTIVE ANALYTICS CHARTS */}
      {subTab === 'overview' && (
        <div className="space-y-10">
          {/* Top 4 Primary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Revenue */}
            <div className="p-5 bg-neutral-950 border border-neutral-900 space-y-3 relative overflow-hidden group hover:border-neutral-800 transition-colors">
              <div className="flex items-center justify-between text-neutral-400 text-xs font-mono uppercase">
                <span>TOTAL REVENUE</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-heading font-bold text-white tracking-tight">
                {formatGHS(overview?.totalRevenue)}
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 pt-1 border-t border-neutral-900/60">
                <span>This Month:</span>
                <span className="text-emerald-400 font-bold">{formatGHS(overview?.revenueThisMonth)}</span>
              </div>
            </div>

            {/* Total Expenses */}
            <div className="p-5 bg-neutral-950 border border-neutral-900 space-y-3 relative overflow-hidden group hover:border-neutral-800 transition-colors">
              <div className="flex items-center justify-between text-neutral-400 text-xs font-mono uppercase">
                <span>TOTAL EXPENSES</span>
                <TrendingDown className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-heading font-bold text-rose-300 tracking-tight">
                {formatGHS(overview?.totalExpenses)}
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 pt-1 border-t border-neutral-900/60">
                <span>This Month:</span>
                <span className="text-rose-400 font-bold">{formatGHS(overview?.expensesThisMonth)}</span>
              </div>
            </div>

            {/* Net Income / Profit */}
            <div className="p-5 bg-neutral-950 border border-neutral-900 space-y-3 relative overflow-hidden group hover:border-neutral-800 transition-colors">
              <div className="flex items-center justify-between text-neutral-400 text-xs font-mono uppercase">
                <span>NET INCOME / PROFIT</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <div className={`text-2xl sm:text-3xl font-heading font-bold tracking-tight ${(overview?.netIncome || 0) >= 0 ? 'text-amber-300' : 'text-rose-400'}`}>
                {formatGHS(overview?.netIncome)}
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 pt-1 border-t border-neutral-900/60">
                <span>Profit Margin:</span>
                <span className="text-neutral-300 font-bold">{profitMargin}%</span>
              </div>
            </div>

            {/* Outstanding Payments */}
            <div className="p-5 bg-neutral-950 border border-neutral-900 space-y-3 relative overflow-hidden group hover:border-neutral-800 transition-colors">
              <div className="flex items-center justify-between text-neutral-400 text-xs font-mono uppercase">
                <span>OUTSTANDING BALANCE</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-heading font-bold text-amber-400 tracking-tight">
                {formatGHS(overview?.outstandingPayments)}
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 pt-1 border-t border-neutral-900/60">
                <span>Avg. Booking Value:</span>
                <span className="text-neutral-300 font-bold">{formatGHS(overview?.averageBookingValue)}</span>
              </div>
            </div>
          </div>

          {/* Secondary Financial Indicators Bento */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-4 bg-neutral-950/80 border border-neutral-900">
              <span className="text-[10px] text-neutral-500 uppercase block">PAID BOOKINGS</span>
              <div className="text-lg font-heading text-white mt-1">
                {overview?.paidBookingsCount || 0} <span className="text-neutral-600 text-xs font-mono">/ {overview?.totalBookingsCount || 0} total</span>
              </div>
            </div>
            <div className="p-4 bg-neutral-950/80 border border-neutral-900">
              <span className="text-[10px] text-neutral-500 uppercase block">DEPOSIT INFLOW</span>
              <div className="text-lg font-heading text-emerald-400 mt-1">
                {formatGHS(overview?.depositRevenue)}
              </div>
            </div>
            <div className="p-4 bg-neutral-950/80 border border-neutral-900">
              <span className="text-[10px] text-neutral-500 uppercase block">FINAL BALANCES</span>
              <div className="text-lg font-heading text-indigo-400 mt-1">
                {formatGHS(overview?.finalPaymentRevenue)}
              </div>
            </div>
            <div className="p-4 bg-neutral-950/80 border border-neutral-900">
              <span className="text-[10px] text-neutral-500 uppercase block">ANNUAL ESTIMATE ({new Date().getFullYear()})</span>
              <div className="text-lg font-heading text-amber-300 mt-1">
                {formatGHS(overview?.revenueThisYear)}
              </div>
            </div>
          </div>

          {/* Charts Row 1: Monthly Trends (Bar & Net Line) & Timeline Area Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Monthly Inflow vs Outflow */}
            <div className="p-6 bg-neutral-950 border border-neutral-900 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-heading uppercase text-white tracking-wide">
                    Monthly Revenue & Expense Trajectory
                  </h3>
                  <p className="text-[11px] font-mono text-neutral-500">
                    Gross revenue vs operational expenses over recent months
                  </p>
                </div>
                <BarChart2 className="w-4 h-4 text-neutral-500" />
              </div>

              <div className="h-64 w-full pt-4">
                {analytics?.monthlyRevenue && analytics.monthlyRevenue.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.monthlyRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                      <XAxis
                        dataKey="monthLabel"
                        stroke="#666"
                        fontSize={11}
                        fontFamily="monospace"
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#666"
                        fontSize={11}
                        fontFamily="monospace"
                        tickLine={false}
                        tickFormatter={(v) => `GH₵${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#000', border: '1px solid #333', fontSize: '11px', fontFamily: 'monospace' }}
                        formatter={(val: any) => [`GH₵${Number(val).toLocaleString()}`, '']}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '10px' }}
                      />
                      <Bar dataKey="revenue" name="Revenue" fill="#10B981" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="expenses" name="Expenses" fill="#F43F5E" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-neutral-600 font-mono text-xs">
                    No monthly data recorded yet
                  </div>
                )}
              </div>
            </div>

            {/* Timeline Area Trend */}
            <div className="p-6 bg-neutral-950 border border-neutral-900 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-heading uppercase text-white tracking-wide">
                    Net Income & Cash Timeline
                  </h3>
                  <p className="text-[11px] font-mono text-neutral-500">
                    Net earnings velocity across recent period
                  </p>
                </div>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>

              <div className="h-64 w-full pt-4">
                {analytics?.revenueOverTime && analytics.revenueOverTime.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.revenueOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="netIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                      <XAxis
                        dataKey="date"
                        stroke="#666"
                        fontSize={11}
                        fontFamily="monospace"
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#666"
                        fontSize={11}
                        fontFamily="monospace"
                        tickLine={false}
                        tickFormatter={(v) => `GH₵${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#000', border: '1px solid #333', fontSize: '11px', fontFamily: 'monospace' }}
                        formatter={(val: any) => [`GH₵${Number(val).toLocaleString()}`, '']}
                      />
                      <Area
                        type="monotone"
                        dataKey="netIncome"
                        name="Net Income"
                        stroke="#D4AF37"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#netIncomeGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-neutral-600 font-mono text-xs">
                    No timeline activity recorded yet
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Charts Row 2: Service Distribution & Collections / Category Donut Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Revenue by Photography Service */}
            <div className="p-6 bg-neutral-950 border border-neutral-900 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono uppercase font-bold text-white tracking-wider">
                  REVENUE BY SERVICE
                </h3>
                <span className="text-[10px] font-mono text-neutral-500">COMMISSIONS</span>
              </div>

              <div className="space-y-3 pt-2 font-mono text-xs">
                {analytics?.revenueByService && analytics.revenueByService.length > 0 ? (
                  analytics.revenueByService.map((srv, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-neutral-300 text-xs">
                        <span className="truncate pr-2 font-medium">{srv.service}</span>
                        <span className="font-bold text-white shrink-0">{formatGHS(srv.revenue)} ({srv.percentage}%)</span>
                      </div>
                      <div className="w-full bg-neutral-900 h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full transition-all duration-500"
                          style={{ width: `${srv.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-neutral-600 font-mono text-xs">
                    No booking commissions recorded
                  </div>
                )}
              </div>
            </div>

            {/* Expenses by Category Breakdown */}
            <div className="p-6 bg-neutral-950 border border-neutral-900 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono uppercase font-bold text-white tracking-wider">
                  EXPENSES BY CATEGORY
                </h3>
                <span className="text-[10px] font-mono text-neutral-500">OUTFLOW</span>
              </div>

              <div className="space-y-3 pt-2 font-mono text-xs">
                {analytics?.expensesByCategory && analytics.expensesByCategory.length > 0 ? (
                  analytics.expensesByCategory.map((cat, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-neutral-300 text-xs">
                        <span className="truncate pr-2 font-medium">{cat.category}</span>
                        <span className="font-bold text-rose-300 shrink-0">{formatGHS(cat.amount)} ({cat.percentage}%)</span>
                      </div>
                      <div className="w-full bg-neutral-900 h-1.5 overflow-hidden">
                        <div
                          className="bg-rose-500 h-full transition-all duration-500"
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-neutral-600 font-mono text-xs">
                    No expenses logged yet
                  </div>
                )}
              </div>
            </div>

            {/* Paid vs Outstanding Balances */}
            <div className="p-6 bg-neutral-950 border border-neutral-900 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono uppercase font-bold text-white tracking-wider">
                    COLLECTIONS VS OUTSTANDING
                  </h3>
                  <PieChartIcon className="w-4 h-4 text-neutral-500" />
                </div>
                <p className="text-[11px] font-mono text-neutral-500 mt-1">
                  Cash collected vs pending client balances
                </p>

                <div className="h-44 w-full pt-2">
                  {analytics?.paidVsOutstanding && (analytics.paidVsOutstanding[0].value > 0 || analytics.paidVsOutstanding[1].value > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.paidVsOutstanding}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={4}
                        >
                          {analytics.paidVsOutstanding.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#000', border: '1px solid #333', fontSize: '11px', fontFamily: 'monospace' }}
                          formatter={(val: any) => [`GH₵${Number(val).toLocaleString()}`, '']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-neutral-600 font-mono text-xs">
                      No invoices recorded
                    </div>
                  )}
                </div>
              </div>

              {/* Legend with amounts */}
              <div className="space-y-2 pt-2 border-t border-neutral-900 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-neutral-400">Collected</span>
                  </div>
                  <span className="text-emerald-400 font-bold">{formatGHS(overview?.totalRevenue)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-neutral-400">Pending</span>
                  </div>
                  <span className="text-amber-400 font-bold">{formatGHS(overview?.outstandingPayments)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: EXPENSE TRACKING MANAGER */}
      {subTab === 'expenses' && (
        <div className="space-y-6">
          {/* Action & Filter Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-950 p-4 border border-neutral-900">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search expense description, receipt ref..."
                  value={expenseSearch}
                  onChange={(e) => setExpenseSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-black border border-neutral-800 text-white font-mono text-xs focus:border-white focus:outline-none placeholder:text-neutral-600"
                />
              </div>

              {/* Category Filter */}
              <select
                value={expenseCategoryFilter}
                onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                className="bg-black border border-neutral-800 text-neutral-300 font-mono text-xs px-3 py-2 focus:border-white focus:outline-none"
              >
                <option value="all">All Categories</option>
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Payment Method Filter */}
              <select
                value={expenseMethodFilter}
                onChange={(e) => setExpenseMethodFilter(e.target.value)}
                className="bg-black border border-neutral-800 text-neutral-300 font-mono text-xs px-3 py-2 focus:border-white focus:outline-none"
              >
                <option value="all">All Payment Methods</option>
                {PAYMENT_METHODS.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportExpensesCSV}
                className="flex items-center gap-2 px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 font-mono text-xs transition-colors"
                title="Export filtered expenses to CSV spreadsheet"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={handleOpenCreateExpense}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs font-bold uppercase transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Expense</span>
              </button>
            </div>
          </div>

          {/* Expenses Table */}
          <div className="border border-neutral-900 bg-neutral-950 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-neutral-900 bg-black text-neutral-500 uppercase text-[10px] tracking-wider">
                    <th className="p-4">Date</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Description</th>
                    <th className="p-4">Payment Method</th>
                    <th className="p-4">Receipt / Notes</th>
                    <th className="p-4 text-right">Amount (GH₵)</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  {filteredExpenses.length > 0 ? (
                    filteredExpenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-neutral-900/40 transition-colors">
                        <td className="p-4 text-neutral-300 whitespace-nowrap">
                          {expense.date}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-[10px] uppercase font-bold bg-neutral-900 text-neutral-300 border border-neutral-800">
                            {expense.category}
                          </span>
                        </td>
                        <td className="p-4 text-white font-medium">
                          {expense.description}
                        </td>
                        <td className="p-4 text-neutral-400 whitespace-nowrap">
                          {expense.paymentMethod}
                        </td>
                        <td className="p-4 text-neutral-500 text-[11px] max-w-xs truncate">
                          {expense.receiptRef && (
                            <span className="text-neutral-400 mr-2">Ref: {expense.receiptRef}</span>
                          )}
                          {expense.notes || '—'}
                        </td>
                        <td className="p-4 text-right text-rose-400 font-bold whitespace-nowrap font-mono">
                          -GH₵{expense.amount.toFixed(2)}
                        </td>
                        <td className="p-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenEditExpense(expense)}
                              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                              title="Edit Expense"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingExpenseId(expense.id)}
                              className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                              title="Delete Expense"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-neutral-500 font-mono text-xs">
                        No expenses match the current filter or search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Total Footer Summary */}
            <div className="p-4 bg-black border-t border-neutral-900 flex items-center justify-between font-mono text-xs text-neutral-400">
              <span>Showing {filteredExpenses.length} expense records</span>
              <span className="font-bold text-rose-400">
                Filtered Total: -GH₵{filteredExpenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: UNIFIED TRANSACTION LEDGER */}
      {subTab === 'transactions' && (
        <div className="space-y-6">
          {/* Action & Filter Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-950 p-4 border border-neutral-900">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search client, booking reference, notes..."
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-black border border-neutral-800 text-white font-mono text-xs focus:border-white focus:outline-none placeholder:text-neutral-600"
                />
              </div>

              {/* Type Filter */}
              <select
                value={txTypeFilter}
                onChange={(e) => setTxTypeFilter(e.target.value)}
                className="bg-black border border-neutral-800 text-neutral-300 font-mono text-xs px-3 py-2 focus:border-white focus:outline-none"
              >
                <option value="all">All Transaction Types</option>
                <option value="income">Inflow (All Income)</option>
                <option value="expense">Outflow (Expenses)</option>
                <option value="deposit">Deposit Payments</option>
                <option value="final_payment">Final Balance Payments</option>
                <option value="additional_payment">Additional Add-ons</option>
                <option value="refund">Refunds</option>
              </select>

              {/* Status Filter */}
              <select
                value={txStatusFilter}
                onChange={(e) => setTxStatusFilter(e.target.value)}
                className="bg-black border border-neutral-800 text-neutral-300 font-mono text-xs px-3 py-2 focus:border-white focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Deposit Paid">Deposit Paid</option>
                <option value="Cancelled — Deposit Retained">Cancelled — Deposit Retained</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Refunded">Refunded</option>
              </select>
            </div>

            {/* Export Ledger Button */}
            <button
              onClick={handleExportLedgerCSV}
              className="flex items-center gap-2 px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 font-mono text-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Ledger CSV</span>
            </button>
          </div>

          {/* Unified Ledger Table */}
          <div className="border border-neutral-900 bg-neutral-950 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-neutral-900 bg-black text-neutral-500 uppercase text-[10px] tracking-wider">
                    <th className="p-4">Date</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Title / Scope</th>
                    <th className="p-4">Client / Payee</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Payment Method</th>
                    <th className="p-4 text-right">Amount (GH₵)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((tx) => {
                      const isIncome = tx.amount > 0;
                      return (
                        <tr key={tx.id} className="hover:bg-neutral-900/40 transition-colors">
                          <td className="p-4 text-neutral-300 whitespace-nowrap">
                            {tx.date}
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <span className={`px-2 py-0.5 text-[9px] uppercase font-bold border ${
                              tx.type === 'expense'
                                ? 'bg-rose-950/60 text-rose-400 border-rose-900'
                                : tx.type === 'refund'
                                ? 'bg-orange-950/60 text-orange-400 border-orange-900'
                                : 'bg-emerald-950/60 text-emerald-400 border-emerald-900'
                            }`}>
                              {tx.typeLabel}
                            </span>
                          </td>
                          <td className="p-4 text-white font-medium">
                            <div>{tx.title}</div>
                            {tx.bookingRef && (
                              <div className="text-[10px] text-neutral-500">Ref: {tx.bookingRef}</div>
                            )}
                          </td>
                          <td className="p-4 text-neutral-300">
                            {tx.clientOrPayee}
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <span className="text-[11px] text-neutral-400">
                              {tx.status}
                            </span>
                          </td>
                          <td className="p-4 text-neutral-400 whitespace-nowrap">
                            {tx.paymentMethod}
                          </td>
                          <td className={`p-4 text-right font-bold whitespace-nowrap font-mono ${
                            isIncome ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {isIncome ? `+GH₵${tx.amount.toFixed(2)}` : `-GH₵${Math.abs(tx.amount).toFixed(2)}`}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-neutral-500 font-mono text-xs">
                        No financial transactions match the current filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT EXPENSE */}
      <AnimatePresence>
        {isExpenseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f0f0f] border border-neutral-800 w-full max-w-lg overflow-hidden shadow-2xl font-mono text-xs"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-neutral-900 flex items-center justify-between bg-black">
                <div className="flex items-center gap-2 text-white">
                  <Receipt className="w-4 h-4 text-amber-400" />
                  <span className="font-heading uppercase tracking-wide text-sm">
                    {editingExpense ? 'EDIT STUDIO EXPENSE' : 'RECORD STUDIO EXPENSE'}
                  </span>
                </div>
                <button
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="text-neutral-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSaveExpense} className="p-6 space-y-4">
                {/* Date & Amount */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-neutral-400 block">
                      Expense Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full px-3 py-2 bg-black border border-neutral-800 text-white font-mono text-xs focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-neutral-400 block">
                      Amount (GH₵) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="0.00"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-black border border-neutral-800 text-white font-mono text-xs focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Category & Payment Method */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-neutral-400 block">
                      Category *
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as ExpenseCategory)}
                      className="w-full px-3 py-2 bg-black border border-neutral-800 text-white font-mono text-xs focus:border-amber-400 focus:outline-none"
                    >
                      {EXPENSE_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-neutral-400 block">
                      Payment Method *
                    </label>
                    <select
                      value={formPaymentMethod}
                      onChange={(e) => setFormPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full px-3 py-2 bg-black border border-neutral-800 text-white font-mono text-xs focus:border-amber-400 focus:outline-none"
                    >
                      {PAYMENT_METHODS.map(method => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-neutral-400 block">
                    Description / Purpose *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Memory Cards, Studio Lighting Rental, Uber to Labadi"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-neutral-800 text-white font-mono text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>

                {/* Receipt Reference */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-neutral-400 block">
                    Receipt / Invoice Ref # (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. REC-98421, MoMo TxID 498329"
                    value={formReceiptRef}
                    onChange={(e) => setFormReceiptRef(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-neutral-800 text-white font-mono text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-neutral-400 block">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Provide any additional context or vendor remarks"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-neutral-800 text-white font-mono text-xs focus:border-amber-400 focus:outline-none resize-none"
                  />
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-900">
                  <button
                    type="button"
                    onClick={() => setIsExpenseModalOpen(false)}
                    className="px-4 py-2 text-neutral-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    {formSubmitting ? 'Saving...' : editingExpense ? 'Update Expense' : 'Save Expense'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: DELETE CONFIRMATION */}
      <AnimatePresence>
        {deletingExpenseId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f0f0f] border border-rose-900/60 p-6 max-w-sm w-full font-mono text-xs space-y-4 shadow-2xl"
            >
              <div className="flex items-center gap-2 text-rose-400">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="font-heading uppercase tracking-wide text-sm font-bold">
                  Delete Expense Record?
                </span>
              </div>
              <p className="text-neutral-400">
                Are you sure you want to permanently delete this expense? This action will adjust all financial analytics and cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setDeletingExpenseId(null)}
                  className="px-3 py-1.5 text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteExpense}
                  disabled={formSubmitting}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold uppercase transition-colors"
                >
                  {formSubmitting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: CUSTOM DATE RANGE PICKER */}
      <AnimatePresence>
        {showCustomDateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f0f0f] border border-neutral-800 p-6 max-w-sm w-full font-mono text-xs space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                <div className="flex items-center gap-2 text-white">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span className="font-heading uppercase tracking-wide text-sm">
                    Select Custom Date Scope
                  </span>
                </div>
                <button onClick={() => setShowCustomDateModal(false)} className="text-neutral-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase block mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-neutral-800 text-white font-mono text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase block mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-neutral-800 text-white font-mono text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-900">
                <button
                  type="button"
                  onClick={() => setShowCustomDateModal(false)}
                  className="px-3 py-1.5 text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTimeRange('custom');
                    setShowCustomDateModal(false);
                  }}
                  className="px-4 py-1.5 bg-white text-black font-bold uppercase transition-colors"
                >
                  Apply Filter
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
