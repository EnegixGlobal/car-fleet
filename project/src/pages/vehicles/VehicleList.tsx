import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { DataTable } from '../../components/common/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Icon } from '../../components/ui/Icon';
import { format, parseISO, isBefore, addDays } from 'date-fns';
import { Vehicle } from '../../types';
import { vehicleCategoryAPI, VehicleCategoryDTO } from '../../services/api';
import { useToast } from '../../hooks/useToast';

export const VehicleList: React.FC = () => {
  const navigate = useNavigate();
  const { vehicles, vehiclesLoading, deleteVehicle } = useApp();
  const { showSuccess, showError } = useToast();
  const [vehicleCategories, setVehicleCategories] = useState<VehicleCategoryDTO[]>([]);
  useEffect(() => { vehicleCategoryAPI.list().then(setVehicleCategories).catch(()=>setVehicleCategories([])); }, []);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'maintenance' | 'inactive'>('all');
  const [ownerFilter, setOwnerFilter] = useState<'all' | 'owned' | 'rented'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  let filteredVehicles = vehicles;
  if (statusFilter !== 'all') filteredVehicles = filteredVehicles.filter(v => v.status === statusFilter);
  if (ownerFilter !== 'all') filteredVehicles = filteredVehicles.filter(v => v.owner === ownerFilter);
  if (categoryFilter !== 'all') {
  const selected = vehicleCategories.find((c: VehicleCategoryDTO) => c.id === categoryFilter);
    filteredVehicles = filteredVehicles.filter(v => v.categoryId === categoryFilter || (!v.categoryId && selected && v.category === selected.name));
  }

  const getExpiryStatus = (vehicle: Vehicle) => {
    const thirtyDaysFromNow = addDays(new Date(), 30);
    const insurance = parseISO(vehicle.insuranceExpiry);
    const fitness = parseISO(vehicle.fitnessExpiry);
    const permit = parseISO(vehicle.permitExpiry);
    const pollution = parseISO(vehicle.pollutionExpiry);

    if (
      isBefore(insurance, thirtyDaysFromNow) ||
      isBefore(fitness, thirtyDaysFromNow) ||
      isBefore(permit, thirtyDaysFromNow) ||
      isBefore(pollution, thirtyDaysFromNow)
    ) {
      return 'expiring';
    }
    return 'valid';
  };

  const columns = [
    {
      key: 'photo' as keyof Vehicle,
      header: 'Photo',
      render: (vehicle: Vehicle) => (
        vehicle.photo ? (
          <img src={vehicle.photo} alt="vehicle" className="h-10 w-16 object-cover rounded border" />
        ) : (
          <div className="h-10 w-16 flex items-center justify-center rounded border bg-gray-50 text-gray-400">
            <Icon name="car" className="h-4 w-4" />
          </div>
        )
      )
    },
    {
      key: 'registrationNumber' as keyof Vehicle,
      header: 'Registration',
      render: (vehicle: Vehicle) => (
        <div className="flex items-center">
          <div>
            <p className="font-medium">{vehicle.registrationNumber}</p>
            <p className="text-sm text-gray-500 capitalize">{vehicle.category || vehicleCategories.find((c: { id: string; name: string }) => c.id === vehicle.categoryId)?.name}</p>
          </div>
          {getExpiryStatus(vehicle) === 'expiring' && (
            <Icon name="warning" className="h-4 w-4 text-orange-500 ml-2" />
          )}
        </div>
      )
    },
    {
      key: 'document' as keyof Vehicle,
      header: 'Doc',
      render: (vehicle: Vehicle) => (
        vehicle.document ? (
          <a href={vehicle.document} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-amber-600 underline text-xs">
            <Icon name="file" className="h-3 w-3" />
            {/\.pdf$/i.test(vehicle.document) ? 'PDF' : 'File'}
          </a>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )
      )
    },
    {
      key: 'category' as keyof Vehicle,
      header: 'Category',
      render: (vehicle: Vehicle) => {
        const category = vehicleCategories.find(
          (c: { id: string; name: string; description?: string }) =>
            c.id === vehicle.categoryId
        );
    
        return (
          <div className="flex flex-col">
            <span className="text-sm capitalize">
              {vehicle.category || category?.name}
            </span>
    
            {category?.description && (
              <span className="text-xs text-gray-500 leading-tight">
                {category.description}
              </span>
            )}
          </div>
        );
      }
    },
    {
      key: 'owner' as keyof Vehicle,
      header: 'Ownership',
      render: (vehicle: Vehicle) => (
        <Badge variant={vehicle.owner === 'owned' ? 'completed' : 'ongoing'}>
          {vehicle.owner}
        </Badge>
      )
    },
    {
      key: 'insuranceExpiry' as keyof Vehicle,
      header: 'Insurance Expiry',
      render: (vehicle: Vehicle) => {
        const isExpiring = isBefore(parseISO(vehicle.insuranceExpiry), addDays(new Date(), 30));
        return (
          <div>
            <p className="text-sm">{format(parseISO(vehicle.insuranceExpiry), 'MMM d, yyyy')}</p>
            {isExpiring && (
              <p className="text-xs text-orange-600">Expiring Soon</p>
            )}
          </div>
        );
      }
    },
    {
      key: 'fitnessExpiry' as keyof Vehicle,
      header: 'Fitness Expiry',
      render: (vehicle: Vehicle) => {
        const isExpiring = isBefore(parseISO(vehicle.fitnessExpiry), addDays(new Date(), 30));
        return (
          <div>
            <p className="text-sm">{format(parseISO(vehicle.fitnessExpiry), 'MMM d, yyyy')}</p>
            {isExpiring && (
              <p className="text-xs text-orange-600">Expiring Soon</p>
            )}
          </div>
        );
      }
    },
    {
      key: 'status' as keyof Vehicle,
      header: 'Status',
      render: (vehicle: Vehicle) => {
        const variants: Record<Vehicle['status'], 'completed' | 'ongoing' | 'pending'> = {
          active: 'completed',
          maintenance: 'ongoing',
          inactive: 'pending'
        };
        return (
          <Badge variant={variants[vehicle.status]}>
            {vehicle.status}
          </Badge>
        );
      }
    }
  ];

  const handleDelete = async (vehicle: Vehicle) => {
    const confirmed = window.confirm(`Delete vehicle ${vehicle.registrationNumber}?`);
    if (!confirmed) return;
    setDeletingId(vehicle.id);
    try {
      await deleteVehicle(vehicle.id);
      showSuccess('Vehicle deleted');
    } catch (err) {
      console.error(err);
      showError('Failed to delete vehicle');
    } finally {
      setDeletingId(null);
    }
  };

  const actions = (vehicle: Vehicle) => (
    <div className="flex items-center space-x-2">
      <button
        onClick={(e) => { e.stopPropagation(); navigate(`/vehicles/${vehicle.id}`); }}
        className="text-amber-600 hover:text-amber-800"
        aria-label="View vehicle"
      >
        <Icon name="eye" className="h-4 w-4" />
      </button>
      <span className="text-gray-300">|</span>
      <button
        onClick={(e) => { e.stopPropagation(); navigate(`/vehicles/${vehicle.id}/edit`); }}
        className="text-amber-600 hover:text-amber-800"
        aria-label="Edit vehicle"
      >
        <Icon name="edit" className="h-4 w-4" />
      </button>
      <span className="text-gray-300">|</span>
      <button
        onClick={(e) => { e.stopPropagation(); handleDelete(vehicle); }}
        className="text-amber-600 hover:text-amber-800 disabled:text-gray-400"
        aria-label="Delete vehicle"
        disabled={deletingId === vehicle.id}
      >
        <Icon
          name={deletingId === vehicle.id ? 'spinner' : 'delete'}
          className="h-4 w-4"
          spin={deletingId === vehicle.id}
        />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Vehicles</h1>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => navigate('/vehicles/categories')}>
            <Icon name="filter" className="h-4 w-4 mr-2" /> Category
          </Button>
          <Button variant="outline" onClick={() => navigate('/vehicles/servicing/manage')}>
            <Icon name="car" className="h-4 w-4 mr-2" /> Servicing
          </Button>
          <Button onClick={() => navigate('/vehicles/create')}>
            <Icon name="plus" className="h-4 w-4 mr-2" />
            New Vehicle
          </Button>
        </div>
      </div>

      {vehiclesLoading ? (
        <div className="p-8 text-center text-sm text-gray-500">Loading vehicles...</div>
      ) : (
      <DataTable
        data={filteredVehicles}
        columns={columns}
        searchPlaceholder="Search vehicles..."
        onRowClick={(vehicle) => navigate(`/vehicles/${vehicle.id}`)}
        actions={actions}
        filtersArea={(
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label htmlFor="vehicleStatusFilter" className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select id="vehicleStatusFilter" value={statusFilter} onChange={e=>setStatusFilter(e.target.value as 'all' | 'active' | 'maintenance' | 'inactive')} className="w-full border-gray-300 rounded-md text-sm focus:ring-amber-500 focus:border-amber-500">
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label htmlFor="vehicleOwnerFilter" className="block text-xs font-medium text-gray-500 mb-1">Owner</label>
              <select id="vehicleOwnerFilter" value={ownerFilter} onChange={e=>setOwnerFilter(e.target.value as 'all' | 'owned' | 'rented')} className="w-full border-gray-300 rounded-md text-sm focus:ring-amber-500 focus:border-amber-500">
                <option value="all">All</option>
                <option value="owned">Owned</option>
                <option value="rented">Rented</option>
              </select>
            </div>
            <div>
              <label htmlFor="vehicleCategoryFilter" className="block text-xs font-medium text-gray-500 mb-1">Category</label>
              <select id="vehicleCategoryFilter" value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)} className="w-full border-gray-300 rounded-md text-sm focus:ring-amber-500 focus:border-amber-500">
                <option value="all">All</option>
                {vehicleCategories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full" onClick={()=>{setStatusFilter('all');setOwnerFilter('all');setCategoryFilter('all');}}>Reset</Button>
            </div>
          </div>
        )}
  />
  )}
    </div>
  );
};