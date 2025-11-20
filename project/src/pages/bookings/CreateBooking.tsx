import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useApp } from '../../context/AppContext';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Icon } from '../../components/ui/Icon';
import { Modal } from '../../components/ui/Modal';
import { cityAPI, vehicleCategoryAPI, VehicleCategoryDTO } from '../../services/api';

const bookingSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerPhone: z.string().min(10, 'Valid phone number is required'),
  bookingSource: z.enum(['company', 'travel-agency', 'individual']),
  companyId: z.string().optional(),
  pickupLocation: z.string().min(1, 'Pickup location is required'),
  dropLocation: z.string().min(1, 'Drop location is required'),
  journeyType: z.enum(['outstation-one-way','outstation','local-outstation','local','transfer']),
  cityOfWork: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  vehicleCategoryId: z.string().optional(),
  vehicleId: z.string().optional(),
  driverId: z.string().optional(),
  tariffRate: z.number().min(0, 'Tariff rate must be positive'),
  totalAmount: z.number().min(0, 'Total amount must be positive'),
  advanceReceived: z.number().min(0, 'Advance must be positive'),
  advanceReason: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

const toISOFromLocalInput = (value: string) => {
  if (!value) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toISOString();
};

export const CreateBooking: React.FC = () => {
  const navigate = useNavigate();
  const { addBooking, drivers, vehicles, companies, customers } = useApp();
  console.log(vehicles);
  const [cities, setCities] = React.useState<string[]>([]);
  const [vehicleCategories, setVehicleCategories] = React.useState<VehicleCategoryDTO[]>([]);
  React.useEffect(() => {
    vehicleCategoryAPI
      .list()
      .then(setVehicleCategories)
      .catch(() => setVehicleCategories([]));
  }, []);

  const sanitizeCities = React.useCallback((raw: string[]): string[] => {
    const cleaned = raw
      .map(c => (c || '').trim())
      .filter(c => c && c.toLowerCase() !== 'select city')
      .map(c => c.replace(/\s+/g,' '));
    return Array.from(new Set(cleaned)).sort((a,b)=> a.localeCompare(b));
  }, []);
  const [newCity, setNewCity] = React.useState('');
  const [cityModalOpen, setCityModalOpen] = React.useState(false);
  const [cityError, setCityError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      tariffRate: 0,
      totalAmount: 0,
      advanceReceived: 0,
      vehicleCategoryId: undefined,
      vehicleId: undefined,
      driverId: undefined,
  }
  });

  const bookingSource = watch('bookingSource');
  const totalAmount = watch('totalAmount');
  const advanceReceived = watch('advanceReceived');
  const journeyType = watch('journeyType');
  const startDateVal = watch('startDate');

  // Hide end date for one-way & transfer
  const hideEndDate = journeyType === 'outstation-one-way' || journeyType === 'transfer';

  // Keep endDate in sync (auto = startDate) when hidden
  React.useEffect(() => {
    if (hideEndDate && startDateVal) {
      setValue('endDate', startDateVal, { shouldValidate: true, shouldDirty: true });
    }
  }, [hideEndDate, startDateVal, setValue]);

  // Clear company/agency selection whenever booking source switches to individual
  React.useEffect(() => {
    if (bookingSource === 'individual') {
      setValue('companyId', undefined, { shouldDirty: true, shouldValidate: true });
    }
  }, [bookingSource, setValue]);

  // Calculate balance automatically
  React.useEffect(() => {
    // Balance derived value (totalAmount - advanceReceived) can be displayed later if needed
  }, [totalAmount, advanceReceived]);

  const onSubmit = async (data: BookingFormData) => {
    try {
      const normalizedCompanyId =
        data.bookingSource === 'individual' ? undefined : data.companyId || undefined;
      const normalizedDates = {
        startDate: toISOFromLocalInput(data.startDate),
        endDate: toISOFromLocalInput(data.endDate),
      };
      const bookingData = {
        ...data,
        ...normalizedDates,
        companyId: normalizedCompanyId,
        vehicleCategoryId: data.vehicleCategoryId || undefined,
        vehicleId: data.vehicleId || undefined,
        driverId: data.driverId || undefined,
        balance: data.totalAmount - data.advanceReceived,
        status: 'booked' as const,
        expenses: [],
        billed: false,
        dutySlipSubmitted: false,
        dutySlipSubmittedToCompany: false,
        statusHistory: [{
          id: '1',
          status: 'booked' as const,
          timestamp: new Date().toISOString(),
          changedBy: 'Dispatcher'
        }]
      };

      await addBooking(bookingData); // wait so list has proper id + assignments
      toast.success('Booking created successfully!');
      navigate('/bookings');
    } catch (err) {
      console.error(err);
      toast.error('Failed to create booking');
    }
  };

  // Load cities from API (fallback to localStorage if API fails)
  React.useEffect(() => {
    (async () => {
      try {
    const list = await cityAPI.list();
    const names = sanitizeCities(list.map(c => c.name));
    setCities(names);
    localStorage.setItem('bolt_cities', JSON.stringify(names));
      } catch {
    const saved = localStorage.getItem('bolt_cities');
    const parsed = saved ? JSON.parse(saved) : [];
    const cleaned = sanitizeCities(parsed);
    setCities(cleaned);
      }
    })();
  }, [sanitizeCities]);

  const driverOptions = drivers
    .filter(d => d.status === 'active')
    .map(driver => ({
      value: driver.id,
      label: driver.name
    }));

  const vehicleOptions = vehicles
    .filter(v => v.status === 'active')
    .map(vehicle => {
      const categoryInfo = vehicleCategories.find((c) => c.id === vehicle.categoryId);
      const categoryLabel = categoryInfo?.name || vehicle.category || 'Uncategorized';
      const descriptionLabel = categoryInfo?.description ? ` - ${categoryInfo.description}` : '';
      return {
        value: vehicle.id,
        label: `${vehicle.registrationNumber} (${categoryLabel})${descriptionLabel}`,
      };
    });

  const companyOptions = companies.map(company => ({
    value: company.id,
    label: company.name
  }));

  const vehicleCategoryOptions = vehicleCategories.map(cat => ({
    value: cat.id,
    label: cat.description ? `${cat.name} - (${cat.description})` : cat.name
  }));

  return (
  <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          onClick={() => navigate('/bookings')}
        >
          <Icon name="back" className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Create New Booking</h1>
      </div>

  <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">Booking Details</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Customer (Optional)</label>
                <select
                  aria-label="Select existing customer"
                  className="w-full border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                  // onChange={(e) => {
                  //   const id = e.target.value;
                  //   if (!id) {
                  //     setValue('customerName', '');
                  //     setValue('customerPhone', '');
                  //     return;
                  //   }
                  //   const c = customers.find(cu => cu.id === id);
                  //   if (c) {
                  //     setValue('customerName', c.name, { shouldValidate: true });
                  //     setValue('customerPhone', c.phone, { shouldValidate: true });
                  //     if (c.companyId) {
                  //       setValue('bookingSource', 'company');
                  //       setValue('companyId', c.companyId);
                  //     }
                  //     (document.getElementById('selectedCustomerId') as HTMLInputElement).value = id;
                  //   }
                  // }}
                  onChange={(e) => {
                    const id = e.target.value;
                  
                    // If user selects "-- New / Manual --"
                    if (!id) {
                      setValue('customerName', '');
                      setValue('customerPhone', '');
                      setValue('bookingSource', 'individual');
                      setValue('companyId', undefined);
                      return;
                    }
                  
                    const c = customers.find(cu => cu.id === id);
                  
                    if (c) {
                      setValue('customerName', c.name, { shouldValidate: true });
                      setValue('customerPhone', c.phone, { shouldValidate: true });
                  
                      if (c.companyId) {
                        // Customer belongs to a company/agency
                        setValue('bookingSource', 'company');
                        setValue('companyId', c.companyId);
                      } else {
                        // Customer is individual
                        setValue('bookingSource', 'individual');
                        setValue('companyId', undefined);
                      }
                  
                      (document.getElementById('selectedCustomerId') as HTMLInputElement).value = id;
                    }
                  }}
                  
                  defaultValue=""
                >
                  <option value="">-- New / Manual --</option>
                  {customers.map(c => {
                    const comp = companies.find(co => co.id === c.companyId);
                    const companyLabel = comp ? comp.name : 'Individual';
                    return (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone}) - {companyLabel}
                      </option>
                    );
                  })}
                </select>
                <input id="selectedCustomerId" name="customerId" type="hidden" />
              </div>
              <Input
                {...register('customerName')}
                label="Customer Name"
                error={errors.customerName?.message}
                placeholder="Enter customer name"
              />

              <Input
                {...register('customerPhone')}
                label="Customer Phone"
                error={errors.customerPhone?.message}
                placeholder="Enter phone number"
              />
            </div>

            {/* Booking Source */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select
                {...register('bookingSource')}
                label="Booking Source"
                error={errors.bookingSource?.message}
                placeholder="Select booking source"
                options={[
                  { value: 'company', label: 'Company' },
                  { value: 'travel-agency', label: 'Travel Agency' },
                  { value: 'individual', label: 'Individual' }
                ]}
              />

              {(bookingSource === 'company' || bookingSource === 'travel-agency') && (
                <Select
                  {...register('companyId')}
                  label={bookingSource === 'company' ? 'Company' : 'Agency'}
                  error={errors.companyId?.message}
                  placeholder={`Select ${bookingSource === 'company' ? 'company' : 'agency'}`}
                  options={companyOptions}
                />
              )}
            </div>

            {/* Journey Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                {...register('pickupLocation')}
                label="Pickup Location"
                error={errors.pickupLocation?.message}
                placeholder="Enter pickup location"
              />

              <Input
                {...register('dropLocation')}
                label="Drop Location"
                error={errors.dropLocation?.message}
                placeholder="Enter drop location"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Select
                {...register('journeyType')}
                label="Journey Type"
                error={errors.journeyType?.message}
                placeholder="Select journey type"
                options={[
                  { value: 'outstation-one-way', label: 'Outstation One Way' },
                  { value: 'outstation', label: 'Outstation' },
                  { value: 'local-outstation', label: 'Local + Outstation' },
                  { value: 'local', label: 'Local' },
                  { value: 'transfer', label: 'Transfer' },
                ]}
              />

              <Input
                {...register('startDate')}
                type="datetime-local"
                label="Start Date & Time"
                error={errors.startDate?.message}
              />
              {!hideEndDate && (
                <Input
                  {...register('endDate')}
                  type="datetime-local"
                  label="End Date & Time"
                  error={errors.endDate?.message}
                />
              )}
            </div>

            {/* City of Work */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Select
                  {...register('cityOfWork')}
                  label="City of Work"
                  placeholder="Select city"
                  options={cities.map(c => ({ value: c, label: c }))}
                />
              </div>
              <div className="flex items-end">
                <Button type="button" variant="outline" onClick={() => { setCityError(null); setNewCity(''); setCityModalOpen(true); }}>
                  <Icon name="plus" className="h-4 w-4 mr-2" /> Add City
                </Button>
              </div>
            </div>

            {/* Vehicle and Driver Assignment */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Select
                {...register('vehicleCategoryId')}
                label="Vehicle Category (Optional)"
                placeholder="Select vehicle category"
                options={vehicleCategoryOptions}
              />
              <Select
                {...register('vehicleId')}
                label="Assign Vehicle (Optional)"
                error={errors.vehicleId?.message}
                placeholder="Select vehicle"
                options={vehicleOptions}
              />

              <Select
                {...register('driverId')}
                label="Assign Driver (Optional)"
                error={errors.driverId?.message}
                placeholder="Select driver"
                options={driverOptions}
              />
            </div>

            {/* Tariff and Payment */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input
                {...register('tariffRate', { valueAsNumber: true })}
                type="number"
                step="0.01"
                label="Tariff Rate (per km/hour)"
                error={errors.tariffRate?.message}
                placeholder="0.00"
              />

              <Input
                {...register('totalAmount', { valueAsNumber: true })}
                type="number"
                step="0.01"
                label="Total Amount"
                error={errors.totalAmount?.message}
                placeholder="0.00"
              />

              <Input
                {...register('advanceReceived', { valueAsNumber: true })}
                type="number"
                step="0.01"
                label="Advance to Driver"
                error={errors.advanceReceived?.message}
                placeholder="0.00"
              />
            </div>

             {/* Advance Reason */}
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Advance Reason / Notes
              </label>
              <textarea
                {...register('advanceReason')}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
                placeholder="Enter reason for giving advance to driver (optional)"
                rows={3}
              />
              {errors.advanceReason?.message && (
                <p className="mt-1 text-sm text-red-600">{errors.advanceReason.message}</p>
              )}
            </div>

            {/* Balance Display */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm text-amber-800">
                <span className="font-medium">Balance Amount: </span>
                ₹{(totalAmount - advanceReceived).toLocaleString()}
              </p>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/bookings')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={isSubmitting}
              >
                Create Booking
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      {/* Add City Modal */}
      <CreateBookingCityModal
        isOpen={cityModalOpen}
        onClose={() => setCityModalOpen(false)}
        value={newCity}
        setValue={setNewCity}
        error={cityError}
        onAdd={(name) => {
          const c = name.trim();
          if (!c) { setCityError('City name is required'); return; }
          if (cities.includes(c)) { setCityError('City already exists'); return; }
          (async () => {
            try {
              await cityAPI.create(c);
              const list = await cityAPI.list();
              const names = sanitizeCities(list.map(ci => ci.name));
              localStorage.setItem('bolt_cities', JSON.stringify(names));
              setCityError(null);
              setCities(names);
              setValue('cityOfWork', c, { shouldDirty: true, shouldValidate: true });
              setNewCity('');
              setCityModalOpen(false);
            } catch {
              // If duplicate or network fail, still ensure it's selected from LS if present
              const saved = localStorage.getItem('bolt_cities');
              const names = saved ? JSON.parse(saved) : [];
              if (!names.includes(c)) names.push(c);
              const cleaned = sanitizeCities(names);
              localStorage.setItem('bolt_cities', JSON.stringify(cleaned));
              setCities(cleaned);
              setValue('cityOfWork', c, { shouldDirty: true, shouldValidate: true });
              setNewCity('');
              setCityModalOpen(false);
            }
          })();
        }}
      />
    </div>
  );
};

// Add City Modal (inline usage)
export const CreateBookingCityModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string) => void;
  error?: string | null;
  value: string;
  setValue: (v: string) => void;
}> = ({ isOpen, onClose, onAdd, error, value, setValue }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add City" size="sm">
      <div className="space-y-4">
        <Input label="City Name" placeholder="e.g., Delhi" value={value} onChange={(e)=>setValue(e.target.value)} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onAdd(value)}>Save</Button>
        </div>
      </div>
    </Modal>
  );
};