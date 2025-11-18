import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { Booking } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { cityAPI } from '../../services/api';

const bookingSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerPhone: z.string().min(10, 'Valid phone number is required'),
  bookingSource: z.enum(['company', 'travel-agency', 'individual']),
  companyId: z.string().optional(),
  pickupLocation: z.string().min(1, 'Pickup location is required'),
  dropLocation: z.string().min(1, 'Drop location is required'),
  journeyType: z.enum(['outstation-one-way','outstation','local-outstation','local','transfer']),
  cityOfWork: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  vehicleId: z.string().optional(),
  driverId: z.string().optional(),
  tariffRate: z.number().min(0),
  totalAmount: z.number().min(0),
  advanceReceived: z.number().min(0),
  advanceReason: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

export const EditBooking: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { bookings, updateBooking, drivers, vehicles, companies } = useApp();
  const [cities, setCities] = React.useState<string[]>([]);
  const sanitizeCities = React.useCallback((raw: string[]): string[] => {
    const cleaned = raw.map(c => (c||'').trim())
      .filter(c => c && c.toLowerCase() !== 'select city')
      .map(c => c.replace(/\s+/g,' '));
    return Array.from(new Set(cleaned)).sort((a,b)=> a.localeCompare(b));
  }, []);
  const [cityModalOpen, setCityModalOpen] = React.useState(false);
  const [newCity, setNewCity] = React.useState('');
  const [cityError, setCityError] = React.useState<string | null>(null);
  const booking = bookings.find(b => b.id === id);

  const {
    register,
    handleSubmit,
    watch,
  setValue,
  reset,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    // Start with blank defaults; real booking loaded via effect & reset
    defaultValues: {
      customerName: '',
      customerPhone: '',
      bookingSource: 'individual',
      companyId: undefined,
      pickupLocation: '',
      dropLocation: '',
      journeyType: 'outstation-one-way',
      cityOfWork: '',
      startDate: '',
      endDate: '',
      vehicleId: undefined,
      driverId: undefined,
      tariffRate: 0,
      totalAmount: 0,
      advanceReceived: 0,
      advanceReason: '',
    }
  });

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await cityAPI.list();
        if (cancelled) return;
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
    return () => { cancelled = true; };
  }, [sanitizeCities]);

  // When booking changes (async load), reset entire form so RHF picks up values.
  React.useEffect(() => {
    if (!booking) return;
    reset({
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      bookingSource: booking.bookingSource,
      companyId: booking.companyId,
      pickupLocation: booking.pickupLocation,
      dropLocation: booking.dropLocation,
      journeyType: booking.journeyType as 'outstation-one-way'|'outstation'|'local-outstation'|'local'|'transfer',
      cityOfWork: booking.cityOfWork || '',
      startDate: booking.startDate.slice(0,16),
      endDate: booking.endDate.slice(0,16),
      vehicleId: booking.vehicleId,
      driverId: booking.driverId,
      tariffRate: booking.tariffRate,
      totalAmount: booking.totalAmount,
      advanceReceived: booking.advanceReceived,
      advanceReason: booking.advanceReason || '',
    });
  }, [booking, reset]);

  // Ensure booking's saved city (possibly legacy, different casing, or trimmed) is present in options AFTER cities load/refresh
  React.useEffect(() => {
    if (!booking?.cityOfWork) return;
    const normalized = booking.cityOfWork.trim().replace(/\s+/g,' ');
    if (!normalized) return;
    setValue('cityOfWork', normalized, { shouldValidate: false });
    if (!cities.some(c => c.toLowerCase() === normalized.toLowerCase())) {
      const next = sanitizeCities([...cities, normalized]);
      setCities(next);
      localStorage.setItem('bolt_cities', JSON.stringify(next));
    }
  }, [booking?.cityOfWork, cities, setValue, sanitizeCities]);

  const bookingSource = watch('bookingSource');
  const totalAmount = watch('totalAmount');
  const advanceReceived = watch('advanceReceived');
  const journeyType = watch('journeyType');
  const startDateVal = watch('startDate');
  const hideEndDate = journeyType === 'outstation-one-way' || journeyType === 'transfer';

  React.useEffect(() => {
    if (hideEndDate && startDateVal) {
      setValue('endDate', startDateVal, { shouldDirty: true, shouldValidate: false });
    }
  }, [hideEndDate, startDateVal, setValue]);

  React.useEffect(() => {
    if (bookingSource === 'individual') {
      setValue('companyId', undefined, { shouldDirty: true, shouldValidate: true });
    }
  }, [bookingSource, setValue]);

  if (!booking) {
    return (
      <div className="space-y-4">
        <p className="text-gray-600">Booking not found.</p>
        <Button onClick={() => navigate('/bookings')}>Back</Button>
      </div>
    );
  }

  const onSubmit = async (data: BookingFormData) => {
    const normalizedCompanyId =
      data.bookingSource === 'individual' ? undefined : data.companyId || undefined;
    await updateBooking(booking.id, {
      ...data,
      companyId: normalizedCompanyId,
      balance: data.totalAmount - data.advanceReceived,
      driverId: data.driverId || undefined,
      vehicleId: data.vehicleId || undefined,
    } as Partial<Booking>);
    toast.success('Booking updated');
    navigate(`/bookings/${booking.id}`);
  };

  const driverOptions = drivers.filter(d => d.status === 'active').map(d => ({ value: d.id, label: d.name }));
  const vehicleOptions = vehicles
    .filter(v => v.status === 'active')
    .map(vehicle => ({
      value: vehicle.id,
      label: `${vehicle.registrationNumber} (${vehicle.category}) ${vehicle.categoryDescription ? ` - ${vehicle.categoryDescription}` : ''}`
    }));
  const companyOptions = companies.map(c => ({ value: c.id, label: c.name }));

  const handleAddCity = async (name: string) => {
    const trimmed = (name || '').trim();
    if (!trimmed) {
      setCityError('City name is required');
      return;
    }
    const exists = cities.some(c => c.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setCityError('City already exists');
      return;
    }
    try {
  const created = await cityAPI.create(trimmed);
  const next = sanitizeCities([...cities, created.name]);
  setCities(next);
  localStorage.setItem('bolt_cities', JSON.stringify(next));
  setValue('cityOfWork', created.name, { shouldDirty: true });
      toast.success('City added');
      setCityModalOpen(false);
  } catch {
      // Fallback to local storage if API fails
  const next = sanitizeCities([...cities, trimmed]);
  setCities(next);
  localStorage.setItem('bolt_cities', JSON.stringify(next));
      setValue('cityOfWork', trimmed, { shouldDirty: true });
      toast.success('City added locally');
      setCityModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <Icon name="back" className="h-4 w-4 mr-2" /> Back
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Edit Booking</h1>
      </div>
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">Booking Details</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input {...register('customerName')} label="Customer Name" error={errors.customerName?.message} />
              <Input {...register('customerPhone')} label="Customer Phone" error={errors.customerPhone?.message} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select {...register('bookingSource')} label="Booking Source" error={errors.bookingSource?.message} options={[{value:'company',label:'Company'},{value:'travel-agency',label:'Travel Agency'},{value:'individual',label:'Individual'}]} />
              {(bookingSource === 'company' || bookingSource === 'travel-agency') && (
                <Select {...register('companyId')} label={bookingSource==='company'?'Company':'Agency'} options={companyOptions} />
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input {...register('pickupLocation')} label="Pickup Location" error={errors.pickupLocation?.message} />
              <Input {...register('dropLocation')} label="Drop Location" error={errors.dropLocation?.message} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Select {...register('journeyType')} label="Journey Type" error={errors.journeyType?.message} options={[{value:'outstation-one-way',label:'Outstation One Way'},{value:'outstation',label:'Outstation'},{value:'local-outstation',label:'Local + Outstation'},{value:'local',label:'Local'},{value:'transfer',label:'Transfer'}]} />
              <Input type="datetime-local" {...register('startDate')} label="Start" />
              {!hideEndDate && (
                <Input type="datetime-local" {...register('endDate')} label="End" />
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Select {...register('cityOfWork')} label="City of Work" placeholder="Select city" options={cities.map(c=>({value:c,label:c}))} />
              </div>
              <div className="flex items-end">
                <Button type="button" variant="outline" onClick={()=>{ setCityError(null); setNewCity(''); setCityModalOpen(true); }}>
                  <Icon name="plus" className="h-4 w-4 mr-2"/> Add City
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select {...register('vehicleId')} label="Vehicle" placeholder="Select vehicle" options={vehicleOptions} />
              <Select {...register('driverId')} label="Driver" placeholder="Select driver" options={driverOptions} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input type="number" step="0.01" {...register('tariffRate', { valueAsNumber: true })} label="Tariff Rate" />
              <Input type="number" step="0.01" {...register('totalAmount', { valueAsNumber: true })} label="Total Amount" />
              <Input type="number" step="0.01" {...register('advanceReceived', { valueAsNumber: true })} label="Advance to Driver" />
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-md text-sm">Balance: ₹{(totalAmount - advanceReceived).toLocaleString()}</div>
            
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
            
            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
              <Button type="submit" loading={isSubmitting}>Save Changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <EditBookingCityModal
        isOpen={cityModalOpen}
        onClose={() => setCityModalOpen(false)}
        onAdd={handleAddCity}
        error={cityError}
        value={newCity}
        setValue={setNewCity}
      />
    </div>
  );
};

export const EditBookingCityModal: React.FC<{ isOpen: boolean; onClose: () => void; onAdd: (name: string)=>void; error?: string|null; value: string; setValue: (v: string)=>void; }> = ({ isOpen, onClose, onAdd, error, value, setValue }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add City" size="sm">
      <div className="space-y-4">
        <Input label="City Name" placeholder="e.g., Delhi" value={value} onChange={(e)=>setValue(e.target.value)} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={()=>onAdd(value)}>Save</Button>
        </div>
      </div>
    </Modal>
  );
};
