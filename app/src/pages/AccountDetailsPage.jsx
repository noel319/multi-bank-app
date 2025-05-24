import { TransactionHistoryChart } from '../components/charts/TransactionHistoryChart';
import { TransactionTable } from '../components/transactions/TransactionTable';
import { TransactionsFilter } from '../components/transactions/TransactionsFilter';

export function AccountDetails() {
  const [filters, setFilters] = useState({
    dateRange: 'monthly',
    type: 'all',
    costCenter: 'all'
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Account Overview</h2>
        <TransactionHistoryChart />
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Transactions</h2>
          <TransactionsFilter 
            filters={filters}
            onChange={setFilters}
          />
        </div>
        <TransactionTable />
      </div>
    </div>
  );
}