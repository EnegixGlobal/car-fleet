import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { useApp } from '../../context/AppContext';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Icon } from '../../components/ui/Icon';
import { Vehicle } from '../../types';
import { vehicleCategoryAPI, VehicleCategoryDTO } from '../../services/api';

const editVehicleSchema = z.object({
  registrationNumber: z.string().min(1),
  categoryId: z.string().min(1),
  owner: z.enum(['owned', 'rented']),
  status: z.enum(['active', 'maintenance', 'inactive']),
  insuranceExpiry: z.string().min(1),
  fitnessExpiry: z.string().min(1),
  permitExpiry: z.string().min(1),
  pollutionExpiry: z.string().min(1),
  mileageTrips: z.number().optional().nullable(),
  mileageKm: z.number().optional().nullable()
});

type EditVehicleForm = z.infer<typeof editVehicleSchema>;

export const EditVehicle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { vehicles, updateVehicle } = useApp();
  const [vehicleCategories, setVehicleCategories] = React.useState<VehicleCategoryDTO[]>([]);
  React.useEffect(() => { vehicleCategoryAPI.list().then(setVehicleCategories).catch(()=>setVehicleCategories([])); }, []);
  const vehicle = vehicles.find(v => v.id === id);
  const [photoFile, setPhotoFile] = React.useState<File | null>(null);
  const [documentFile, setDocumentFile] = React.useState<File | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<EditVehicleForm>({
    resolver: zodResolver(editVehicleSchema),
    defaultValues: vehicle ? {
      registrationNumber: vehicle.registrationNumber,
      categoryId: vehicle.categoryId || (vehicleCategories.find(c => c.name === vehicle.category)?.id || ''),
      owner: vehicle.owner,
      status: vehicle.status,
      insuranceExpiry: vehicle.insuranceExpiry,
      fitnessExpiry: vehicle.fitnessExpiry,
      permitExpiry: vehicle.permitExpiry,
      pollutionExpiry: vehicle.pollutionExpiry,
      mileageTrips: vehicle.mileageTrips ?? undefined,
      mileageKm: vehicle.mileageKm ?? undefined
    } : undefined
  });

  if (!vehicle) {
    return (
      <div className="space-y-4">
        <p className="text-gray-600">Vehicle not found.</p>
        <Button onClick={() => navigate('/vehicles')}>Back</Button>
      </div>
    );
  }

  const onSubmit = async (data: EditVehicleForm) => {
    const catName = vehicleCategories.find(c => c.id === data.categoryId)?.name || vehicle.category;
    const updates: Partial<Vehicle> = {
      ...data,
      category: catName,
      mileageTrips: data.mileageTrips ?? undefined,
      mileageKm: data.mileageKm ?? undefined
    };
    try {
  await updateVehicle(vehicle.id, updates, { photoFile: photoFile || undefined, documentFile: documentFile || undefined });
      toast.success('Vehicle updated');
      navigate(`/vehicles/${vehicle.id}`);
    } catch {
      toast.error('Failed to update vehicle');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <Icon name="back" className="h-4 w-4 mr-2" /> Back
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Edit Vehicle</h1>
      </div>
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">Vehicle Details</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input {...register('registrationNumber')} label="Registration Number" error={errors.registrationNumber?.message} />
              <Select
                {...register('categoryId')}
                label="Category"
                error={errors.categoryId?.message}
                options={vehicleCategories.map(c => ({
                  value: c.id,
                  label: c.description ? `${c.name} - ${c.description}` : c.name
                }))}
              />
              <Select {...register('owner')} label="Ownership" error={errors.owner?.message} options={[{value:'owned',label:'Owned'},{value:'rented',label:'Rented'}]} />
              <Select {...register('status')} label="Status" error={errors.status?.message} options={[{value:'active',label:'Active'},{value:'maintenance',label:'Maintenance'},{value:'inactive',label:'Inactive'}]} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input type="date" {...register('insuranceExpiry')} label="Insurance Expiry" error={errors.insuranceExpiry?.message} />
              <Input type="date" {...register('fitnessExpiry')} label="Fitness Expiry" error={errors.fitnessExpiry?.message} />
              <Input type="date" {...register('permitExpiry')} label="Permit Expiry" error={errors.permitExpiry?.message} />
              <Input type="date" {...register('pollutionExpiry')} label="Pollution Expiry" error={errors.pollutionExpiry?.message} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input type="number" step="1" {...register('mileageTrips', { valueAsNumber: true })} label="Trips (optional)" />
              <Input type="number" step="1" {...register('mileageKm', { valueAsNumber: true })} label="Mileage Km (optional)" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Input type="file" label="Vehicle Image (optional)" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
                {photoFile && <p className="mt-1 text-xs text-gray-500">Selected: {photoFile.name}</p>}
              </div>
              <div>
                <Input type="file" label="Vehicle Document (optional)" accept="image/*,.pdf" onChange={(e) => setDocumentFile(e.target.files?.[0] || null)} />
                {documentFile && <p className="mt-1 text-xs text-gray-500">Selected: {documentFile.name}</p>}
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
              <Button type="submit" loading={isSubmitting}>Save Changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
