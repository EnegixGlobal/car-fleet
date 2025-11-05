import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { DataTable } from '../../components/common/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Icon } from '../../components/ui/Icon';
import { Company } from '../../types';

export const CompanyList: React.FC = () => {
  const navigate = useNavigate();
  const { companies } = useApp();
  const [outstandingStatus, setOutstandingStatus] = useState<'all' | 'with' | 'clear'>('all');
  const [minOutstanding, setMinOutstanding] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  let filteredCompanies = companies;
  if (outstandingStatus === 'with') filteredCompanies = filteredCompanies.filter(c => c.outstandingAmount > 0);
  if (outstandingStatus === 'clear') filteredCompanies = filteredCompanies.filter(c => c.outstandingAmount === 0);
  if (minOutstanding) filteredCompanies = filteredCompanies.filter(c => c.outstandingAmount >= Number(minOutstanding));
  if (startDate) filteredCompanies = filteredCompanies.filter(c => c.createdAt >= startDate);
  if (endDate) filteredCompanies = filteredCompanies.filter(c => c.createdAt <= endDate + 'T23:59:59');

  const columns = [
    {
      key: 'name' as keyof Company,
      header: 'Company Name',
    },
    {
      key: 'gst' as keyof Company,
      header: 'GST Number',
    },
    {
      key: 'contactPerson' as keyof Company,
      header: 'Contact Person',
      render: (company: Company) => (
        <div>
          <p className="font-medium">{company.contactPerson}</p>
          <p className="text-sm text-gray-500">{company.phone}</p>
        </div>
      )
    },
    {
      key: 'email' as keyof Company,
      header: 'Email',
    },
    {
      key: 'outstandingAmount' as keyof Company,
      header: 'Outstanding',
      render: (company: Company) => (
        <div>
          <p className="font-medium">₹{company.outstandingAmount.toLocaleString()}</p>
          {company.outstandingAmount > 0 && (
            <Badge variant="pending">Pending</Badge>
          )}
        </div>
      )
    }
  ];

  const actions = (company: Company) => (
    <div className="flex space-x-2">
      <button
  onClick={(e) => { e.stopPropagation(); navigate(`/companies/${company.id}`); }}
        className="text-amber-600 hover:text-amber-800"
        aria-label="View company"
      >
  <Icon name="eye" className="h-4 w-4" />
      </button>
      <span className="text-gray-300">|</span>
      <button
  onClick={(e) => { e.stopPropagation(); navigate(`/companies/${company.id}/edit`); }}
        className="text-amber-600 hover:text-amber-800"
        aria-label="Edit company"
      >
  <Icon name="edit" className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Companies & Agencies</h1>
        <Button onClick={() => navigate('/companies/create')}>
          <Icon name="plus" className="h-4 w-4 mr-2" />
          New Company
        </Button>
      </div>

      <DataTable
        data={filteredCompanies}
        columns={columns}
        searchPlaceholder="Search companies..."
        onRowClick={(company) => navigate(`/companies/${company.id}`)}
        actions={actions}
        filtersArea={(
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label htmlFor="outstandingStatusFilter" className="block text-xs font-medium text-gray-500 mb-1">Outstanding</label>
              <select id="outstandingStatusFilter" value={outstandingStatus} onChange={e=>setOutstandingStatus(e.target.value as 'all' | 'with' | 'clear')} className="w-full border-gray-300 rounded-md text-sm focus:ring-amber-500 focus:border-amber-500">
                <option value="all">All</option>
                <option value="with">With Dues</option>
                <option value="clear">Clear</option>
              </select>
            </div>
            <div>
              <label htmlFor="minOutstandingFilter" className="block text-xs font-medium text-gray-500 mb-1">Min Outstanding (₹)</label>
              <input id="minOutstandingFilter" type="number" value={minOutstanding} onChange={e=>setMinOutstanding(e.target.value)} className="w-full border-gray-300 rounded-md text-sm focus:ring-amber-500 focus:border-amber-500" />
            </div>
            <div>
              <label htmlFor="companyStartDate" className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
              <input id="companyStartDate" type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="w-full border-gray-300 rounded-md text-sm focus:ring-amber-500 focus:border-amber-500" />
            </div>
            <div>
              <label htmlFor="companyEndDate" className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
              <input id="companyEndDate" type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="w-full border-gray-300 rounded-md text-sm focus:ring-amber-500 focus:border-amber-500" />
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full" onClick={()=>{setOutstandingStatus('all');setMinOutstanding('');setStartDate('');setEndDate('');}}>Reset</Button>
            </div>
          </div>
        )}
      />
    </div>
  );
};