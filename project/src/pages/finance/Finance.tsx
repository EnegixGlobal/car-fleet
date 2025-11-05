import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Icon } from '../../components/ui/Icon';
import { useForm } from 'react-hook-form';
import { financeAPI } from '../../services/api';
import toast from 'react-hot-toast';

export const Finance: React.FC = () => {
  const { bookings, drivers, companies, payments, addPayment } = useApp();
  console.log("bookings", bookings);
  const [apiMetrics, setApiMetrics] = useState<{ totalRevenue: number; totalOutstanding: number; totalExpenses: number; netProfit: number }|null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm<PaymentForm>();

  const entityType = watch('entityType');

  // Calculate financial metrics
  const totalRevenueLocal = bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
  const totalAdvances = bookings.reduce((sum, booking) => sum + booking.advanceReceived, 0);
  const totalOutstandingLocal = companies.reduce((sum, company) => sum + company.outstandingAmount, 0);
  const unbilledAmount = bookings
    .filter(booking => !booking.billed && booking.status === 'completed')
    .reduce((sum, booking) => sum + booking.balance, 0);

  const totalExpensesLocal = bookings.reduce((sum, booking) => 
    sum + booking.expenses.reduce((expSum, exp) => expSum + exp.amount, 0), 0
  );

  const driverAdvances = drivers.reduce((sum, driver) => 
    sum + driver.advances
      .filter(advance => !advance.settled)
      .reduce((advSum, adv) => advSum + adv.amount, 0), 0
  );

  interface PaymentForm { entityId: string; entityType: 'customer' | 'driver'; amount: string; type: 'received' | 'paid'; description?: string }
  const onAddPayment = (data: PaymentForm) => {
    const payment = {
      entityId: data.entityId,
      entityType: data.entityType,
      amount: parseFloat(data.amount),
      type: data.type,
      date: new Date().toISOString(),
      description: data.description || '',
    };

    addPayment(payment);
    toast.success('Payment recorded successfully');
    setShowPaymentModal(false);
    reset();
  };

  const getEntityOptions = () => {
    if (entityType === 'customer') {
      return companies.map(company => ({
        value: company.id,
        label: company.name
      }));
    } else if (entityType === 'driver') {
      return drivers.map(driver => ({
        value: driver.id,
        label: driver.name
      }));
    }
    return [];
  };

  // (Future) Group payments by entity if needed for aggregation

  const getEntityName = (entityId: string, entityType: string) => {
    if (entityType === 'customer') {
      const company = companies.find(c => c.id === entityId);
      return company?.name || 'Unknown Company';
    } else if (entityType === 'driver') {
      const driver = drivers.find(d => d.id === entityId);
      return driver?.name || 'Unknown Driver';
    }
    return 'Unknown Entity';
  };

  // Fetch metrics from backend
  useEffect(() => {
    (async () => {
      setLoadingMetrics(true);
      try {
        const m = await financeAPI.getMetrics();
        setApiMetrics(m);
      } catch (err) {
        console.error('Finance metrics API failed, using local computed', err);
      } finally {
        setLoadingMetrics(false);
      }
    })();
  }, []);

  const totalRevenue = apiMetrics?.totalRevenue ?? totalRevenueLocal;
  const totalOutstanding = apiMetrics?.totalOutstanding ?? totalOutstandingLocal;
  const totalExpenses = apiMetrics?.totalExpenses ?? totalExpensesLocal;
  const netProfit = apiMetrics?.netProfit ?? (totalRevenueLocal - (totalExpensesLocal + driverAdvances));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Finance Dashboard</h1>
        <div className="flex space-x-3">
          <Button onClick={() => setShowPaymentModal(true)}>
            <Icon name="plus" className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Icon name="money" className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{loadingMetrics ? '…' : `₹${totalRevenue.toLocaleString()}`}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Icon name="chart" className="h-8 w-8 text-amber-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Advances Received</p>
                <p className="text-2xl font-bold text-gray-900">₹{totalAdvances.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Icon name="warning" className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Outstanding</p>
                <p className="text-2xl font-bold text-gray-900">{loadingMetrics ? '…' : `₹${totalOutstanding.toLocaleString()}`}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Icon name="money" className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Unbilled</p>
                <p className="text-2xl font-bold text-gray-900">₹{unbilledAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">Expense Breakdown</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Trip Expenses</span>
                <span className="font-medium">₹{totalExpenses.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Driver Advances</span>
                <span className="font-medium">₹{driverAdvances.toLocaleString()}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total Expenses</span>
                <span>₹{(totalExpenses + driverAdvances).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">Net Position</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Income</span>
                <span className="font-medium text-green-600">₹{totalRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Expenses</span>
                <span className="font-medium text-red-600">₹{(totalExpenses + driverAdvances).toLocaleString()}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                <span>Net Profit</span>
                <span className={netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                  ₹{netProfit.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium text-gray-900">Recent Payment Activity</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payments.length === 0 ? (
              <p className="text-gray-500">No payment records found</p>
            ) : (
              payments.slice(-10).reverse().map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {payment.entityType === 'customer' ? (
                      <Icon name="building" className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Icon name="user" className="h-5 w-5 text-gray-400" />
                    )}
                    <div>
                      <p className="font-medium">{getEntityName(payment.entityId, payment.entityType)}</p>
                      <p className="text-sm text-gray-500">{payment.description || 'No description'}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(payment.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${payment.type === 'received' ? 'text-green-600' : 'text-red-600'}`}>
                      {payment.type === 'received' ? '+' : '-'}₹{payment.amount.toLocaleString()}
                    </p>
                    <Badge variant={payment.type === 'received' ? 'completed' : 'ongoing'}>
                      {payment.type}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Record Payment"
      >
        <form onSubmit={handleSubmit(onAddPayment)} className="space-y-4">
          <Select
            {...register('entityType', { required: 'Entity type is required' })}
            label="Entity Type"
            error={errors.entityType?.message as string}
            options={[
              { value: 'customer', label: 'Customer/Company' },
              { value: 'driver', label: 'Driver' }
            ]}
          />

          {entityType && (
            <Select
              {...register('entityId', { required: 'Entity is required' })}
              label={entityType === 'customer' ? 'Company' : 'Driver'}
              error={errors.entityId?.message as string}
              options={getEntityOptions()}
            />
          )}

          <Select
            {...register('type', { required: 'Payment type is required' })}
            label="Payment Type"
            error={errors.type?.message as string}
            options={[
              { value: 'received', label: 'Payment Received' },
              { value: 'paid', label: 'Payment Made' }
            ]}
          />

          <Input
            {...register('amount', { required: 'Amount is required' })}
            type="number"
            step="0.01"
            label="Amount"
            error={errors.amount?.message as string}
            placeholder="0.00"
          />

          <Input
            {...register('description')}
            label="Description (Optional)"
            error={errors.description?.message as string}
            placeholder="Enter payment description"
          />

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPaymentModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Record Payment</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};