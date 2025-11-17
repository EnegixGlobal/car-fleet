import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useApp } from '../../context/AppContext';
import { vehicleCategoryAPI, VehicleCategoryDTO } from '../../services/api';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Icon } from '../../components/ui/Icon';

const vehicleSchema = z.object({
  registrationNumber: z.string().min(1, 'Registration number is required'),
  categoryId: z.string().min(1, 'Category is required'),
  owner: z.enum(['owned', 'rented']),
  insuranceExpiry: z.string().min(1, 'Insurance expiry date is required'),
  fitnessExpiry: z.string().min(1, 'Fitness expiry date is required'),
  permitExpiry: z.string().min(1, 'Permit expiry date is required'),
  pollutionExpiry: z.string().min(1, 'Pollution expiry date is required'),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

export const CreateVehicle: React.FC = () => {
  const navigate = useNavigate();
  const { addVehicle } = useApp();
  const [vehicleCategories, setVehicleCategories] = React.useState<VehicleCategoryDTO[]>([]);
  React.useEffect(() => { vehicleCategoryAPI.list().then(setVehicleCategories).catch(()=>setVehicleCategories([])); }, []);
  const [photoFile, setPhotoFile] = React.useState<File | null>(null);
  const [documentFile, setDocumentFile] = React.useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
  });

  const onSubmit = async (data: VehicleFormData) => {
    try {
      const name = vehicleCategories.find(c => c.id === data.categoryId)?.name || '';
      const vehicleData = {
        registrationNumber: data.registrationNumber,
        categoryId: data.categoryId,
        category: name,
        owner: data.owner,
        insuranceExpiry: data.insuranceExpiry,
        fitnessExpiry: data.fitnessExpiry,
        permitExpiry: data.permitExpiry,
        pollutionExpiry: data.pollutionExpiry,
        status: 'active' as const,
      };

  await addVehicle(vehicleData, { photoFile: photoFile || undefined, documentFile: documentFile || undefined });
  toast.success('Vehicle created successfully!');
  navigate('/vehicles');
  } catch {
      toast.error('Failed to create vehicle');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          onClick={() => navigate('/vehicles')}
        >
          <Icon name="back" className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Add New Vehicle</h1>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">Vehicle Information</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input
                {...register('registrationNumber')}
                label="Registration Number"
                error={errors.registrationNumber?.message}
                placeholder="Enter registration number"
              />

              <Select
                {...register('categoryId')}
                label="Vehicle Category"
                error={errors.categoryId?.message}
                placeholder="Select category"
                options={vehicleCategories.map(c => ({ value: c.id, label: c.name + (c.description ? ` - ${c.description}` : '') }))}
              />

              <Select
                {...register('owner')}
                label="Ownership"
                error={errors.owner?.message}
                placeholder="Select ownership"
                options={[
                  { value: 'owned', label: 'Owned' },
                  { value: 'rented', label: 'Rented' }
                ]}
              />
            </div>

            {/* Document Expiry Dates */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Document Expiry Dates</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  {...register('insuranceExpiry')}
                  type="date"
                  label="Insurance Expiry"
                  error={errors.insuranceExpiry?.message}
                />

                <Input
                  {...register('fitnessExpiry')}
                  type="date"
                  label="Fitness Certificate Expiry"
                  error={errors.fitnessExpiry?.message}
                />

                <Input
                  {...register('permitExpiry')}
                  type="date"
                  label="Permit Expiry"
                  error={errors.permitExpiry?.message}
                />

                <Input
                  {...register('pollutionExpiry')}
                  type="date"
                  label="Pollution Certificate Expiry"
                  error={errors.pollutionExpiry?.message}
                />
              </div>
            </div>

            {/* Uploads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Input type="file" label="Vehicle Image" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
                {photoFile && <p className="mt-1 text-xs text-gray-500">Selected: {photoFile.name}</p>}
              </div>
              <div>
                <Input type="file" label="Vehicle Document" accept="image/*,.pdf" onChange={(e) => setDocumentFile(e.target.files?.[0] || null)} />
                {documentFile && <p className="mt-1 text-xs text-gray-500">Selected: {documentFile.name}</p>}
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/vehicles')}
              >
                Cancel
              </Button>
              <Button type="submit" loading={isSubmitting} onClick={() => { /* ensure files passed in submit */ }}>
                Create Vehicle
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};