import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { DataTable } from '../../components/common/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Icon } from '../../components/ui/Icon';
import { format, parseISO, isBefore, addDays } from 'date-fns';
import { Driver } from '../../types';

export const DriverList: React.FC = () => {
  const navigate = useNavigate();
  const { drivers } = useApp();
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [modeFilter, setModeFilter] = useState<'all' | 'per-trip' | 'daily' | 'monthly' | 'fuel-basis'>('all');

  let filteredDrivers = drivers;
  if (statusFilter !== 'all') filteredDrivers = filteredDrivers.filter(d => d.status === statusFilter);
  if (modeFilter !== 'all') filteredDrivers = filteredDrivers.filter(d => d.paymentMode === modeFilter);

  const getExpiryStatus = (driver: Driver) => {
    const thirtyDaysFromNow = addDays(new Date(), 30);
    const licenseExpiry = parseISO(driver.licenseExpiry);
    const policeExpiry = parseISO(driver.policeVerificationExpiry);

    if (isBefore(licenseExpiry, thirtyDaysFromNow) || isBefore(policeExpiry, thirtyDaysFromNow)) {
      return 'expiring';
    }
    return 'valid';
  };

  const columns = [
    {
      key: 'name' as keyof Driver,
      header: 'Name',
      render: (driver: Driver) => (
        <div className="flex items-center">
          <div>
            <p className="font-medium">{driver.name}</p>
            <p className="text-sm text-gray-500">{driver.phone}</p>
          </div>
          {getExpiryStatus(driver) === 'expiring' && (
            <Icon name="warning" className="h-4 w-4 text-orange-500 ml-2" />
          )}
        </div>
      )
    },
    {
      key: 'licenseNumber' as keyof Driver,
      header: 'License Number',
    },
    {
      key: 'vehicleType' as keyof Driver,
      header: 'Vehicle Type',
      render: (driver: Driver) => (
        <Badge variant={driver.vehicleType === 'owned' ? 'completed' : 'ongoing'}>
          {driver.vehicleType}
        </Badge>
      )
    },
    {
      key: 'paymentMode' as keyof Driver,
      header: 'Payment Mode',
      render: (driver: Driver) => (
        <span className="capitalize">{driver.paymentMode.replace('-', ' ')}</span>
      )
    },
    {
      key: 'salary' as keyof Driver,
      header: 'Salary/Rate',
      render: (driver: Driver) => `₹${driver.salary.toLocaleString()}`
    },
    {
      key: 'licenseExpiry' as keyof Driver,
      header: 'License Expiry',
      render: (driver: Driver) => (
        <div>
          <p className="text-sm">{format(parseISO(driver.licenseExpiry), 'MMM d, yyyy')}</p>
          {getExpiryStatus(driver) === 'expiring' && (
            <p className="text-xs text-orange-600">Expiring Soon</p>
          )}
        </div>
      )
    },
    {
      key: 'status' as keyof Driver,
      header: 'Status',
      render: (driver: Driver) => (
        <Badge variant={driver.status === 'active' ? 'completed' : 'pending'}>
          {driver.status}
        </Badge>
      )
    }
  ];

  const actions = (driver: Driver) => (
    <div className="flex space-x-2">
      <button
  onClick={(e) => { e.stopPropagation(); navigate(`/drivers/${driver.id}`); }}
        className="text-amber-600 hover:text-amber-800"
        aria-label="View driver"
      >
  <Icon name="eye" className="h-4 w-4" />
      </button>
      <button
  onClick={(e) => { e.stopPropagation(); navigate(`/drivers/${driver.id}/edit`); }}
        className="text-amber-600 hover:text-amber-800"
        aria-label="Edit driver"
      >
  <Icon name="edit" className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Drivers</h1>
        <Button onClick={() => navigate('/drivers/create')}>
          <Icon name="plus" className="h-4 w-4 mr-2" />
          New Driver
        </Button>
      </div>

      <DataTable
        data={filteredDrivers}
        columns={columns}
        searchPlaceholder="Search drivers..."
        onRowClick={(driver) => navigate(`/drivers/${driver.id}`)}
        actions={actions}
        filtersArea={(
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1" htmlFor="driverStatusFilter">Status</label>
              <select id="driverStatusFilter" value={statusFilter} onChange={e=>setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')} className="w-full border-gray-300 rounded-md text-sm focus:ring-amber-500 focus:border-amber-500">
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1" htmlFor="driverModeFilter">Payment Mode</label>
              <select id="driverModeFilter" value={modeFilter} onChange={e=>setModeFilter(e.target.value as 'all' | 'per-trip' | 'daily' | 'monthly' | 'fuel-basis')} className="w-full border-gray-300 rounded-md text-sm focus:ring-amber-500 focus:border-amber-500">
                <option value="all">All</option>
                <option value="per-trip">Per Trip</option>
                <option value="daily">Daily</option>
                <option value="monthly">Monthly</option>
                <option value="fuel-basis">Fuel Basis</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full" onClick={()=>{setStatusFilter('all');setModeFilter('all');}}>Reset</Button>
            </div>
          </div>
        )}
      />
    </div>
  );
};