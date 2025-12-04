import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useApp } from '../../context/AppContext';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Icon } from '../../components/ui/Icon';
import { Driver } from '../../types';

const driverSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  licenseNumber: z.string().min(1, 'License number is required'),
  aadhaar: z.string().min(12, 'Valid Aadhaar number is required'),
  vehicleType: z.enum(['owned', 'rented']),
  licenseExpiry: z.string().min(1, 'License expiry date is required'),
  policeVerificationExpiry: z.string().min(1, 'Police verification expiry is required'),
  paymentMode: z.enum(['per-trip', 'daily', 'monthly', 'fuel-basis']),
  dateOfJoining: z.string().min(1, 'Date of joining required'),
  status: z.enum(['active','inactive']).default('active'),
  referenceNote: z.string().optional(),
  // photo & document handled via file inputs separately
});

type DriverSchemaFields = z.infer<typeof driverSchema>;
// Form state extends schema fields with file inputs not part of validation schema
type DriverFormData = DriverSchemaFields & { photoFile?: FileList; documentFile?: FileList };

export const CreateDriver: React.FC = () => {
  const navigate = useNavigate();
  const { appendDriverLocal } = useApp();

  // Create a resolver that ignores the file fields by mapping them out before validation
  const schemaResolver: Resolver<DriverFormData> = async (values, context, options) => {
    const { photoFile, documentFile, ...schemaValues } = values;
    const baseResolver = zodResolver(driverSchema) as Resolver<DriverSchemaFields>;
    const result = await baseResolver(schemaValues as DriverSchemaFields, context, options);
    return {
      values: result.values ? { ...(result.values as DriverSchemaFields), photoFile, documentFile } as DriverFormData : {} as DriverFormData,
      // result.errors type compatible with our form; cast to expected generic mapping
  errors: result.errors as unknown as Record<string, unknown>
    };
  };

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<DriverFormData>({
    resolver: schemaResolver,
    defaultValues: {
      status: 'active',
    }
  });

  const onSubmit = async (data: DriverFormData) => {
    try {
      const { photoFile, documentFile, ...formValues } = data;
      const payload = { ...formValues };
      // Build named FormData manually because backend expects named fields, not generic array
      const fd = new FormData();
      const toIso = (val: unknown) => {
        if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
          return new Date(val + 'T00:00:00.000Z').toISOString();
        }
        return String(val);
      };
      Object.entries(payload).forEach(([k,v])=>{
        if(v===undefined || v===null) return;
        if (k === 'licenseExpiry' || k === 'policeVerificationExpiry' || k === 'dateOfJoining') {
          fd.append(k, toIso(v));
        } else {
          fd.append(k, String(v));
        }
      });
      if (photoFile && photoFile[0]) fd.append('photo', photoFile[0]);
      if (documentFile && documentFile[0]) fd.append('licenseDocument', documentFile[0]);
      const res = await fetch(`${import.meta.env.FRONTEND_URL || 'http://localhost:3000/api'}/drivers`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')||''}` },
        body: fd,
      });
      if (!res.ok) {
        let msg = 'Upload failed';
        try {
          const text = await res.text();
          msg = (()=>{ try { const j = JSON.parse(text); return j.error || j.message || text; } catch { return text; } })();
  } catch { /* ignore parse errors */ }
        throw new Error(msg);
      }
      const created = await res.json();
      // Helper to convert filename to full URL if needed
      const getFileUrl = (filename: string | undefined): string | undefined => {
        if (!filename) return undefined;
        if (filename.startsWith('http://') || filename.startsWith('https://')) return filename;
        const apiBaseUrl = import.meta.env.FRONTEND_URL || 'http://localhost:3000/api';
        const baseUrl = apiBaseUrl.replace('/api', '');
        return `${baseUrl}/uploads/${filename}`;
      };
      const normalized = {
        id: created._id || created.id || '',
        name: created.name as string,
        phone: created.phone as string,
        licenseNumber: created.licenseNumber as string,
        aadhaar: created.aadhaar as string,
        photo: getFileUrl(created.photo),
        vehicleType: created.vehicleType as 'owned' | 'rented',
        licenseExpiry: new Date(created.licenseExpiry).toISOString(),
        policeVerificationExpiry: new Date(created.policeVerificationExpiry).toISOString(),
        licenseDocument: getFileUrl(created.licenseDocument),
        policeVerificationDocument: getFileUrl(created.policeVerificationDocument),
        paymentMode: created.paymentMode as 'per-trip' | 'daily' | 'monthly' | 'fuel-basis',
        salary: created.salary as number | undefined,
        dateOfJoining: created.dateOfJoining ? new Date(created.dateOfJoining).toISOString() : new Date().toISOString(),
        referenceNote: created.referenceNote as string | undefined,
        document: getFileUrl(created.document),
        advances: (created.advances || []) as Driver['advances'],
        status: created.status as 'active' | 'inactive',
        createdAt: new Date(created.createdAt || Date.now()).toISOString(),
      };
    // Append created driver locally without triggering another POST
    appendDriverLocal(normalized as unknown as Driver);
      toast.success('Driver created successfully!');
      navigate('/drivers');
  } catch (e) {
      const err = e as Error;
      toast.error(err.message || 'Failed to create driver');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          onClick={() => navigate('/drivers')}
        >
          <Icon name="back" className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Add New Driver</h1>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">Driver Information</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                {...register('name')}
                label="Full Name"
                error={errors.name?.message}
                placeholder="Enter driver's full name"
              />

              <Input
                {...register('phone')}
                label="Phone Number"
                error={errors.phone?.message}
                placeholder="Enter phone number"
              />

              <Input
                {...register('licenseNumber')}
                label="License Number"
                error={errors.licenseNumber?.message}
                placeholder="Enter driving license number"
              />

              <Input
                {...register('aadhaar')}
                label="Aadhaar Number"
                error={errors.aadhaar?.message}
                placeholder="Enter Aadhaar number"
              />
            </div>

            {/* Vehicle & Employment Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select
                {...register('vehicleType')}
                label="Vehicle Ownership"
                error={errors.vehicleType?.message}
                placeholder="Select vehicle type"
                options={[
                  { value: 'owned', label: 'Own Vehicle' },
                  { value: 'rented', label: 'Company Vehicle' }
                ]}
              />

              <Select
                {...register('paymentMode')}
                label="Payment Mode"
                error={errors.paymentMode?.message}
                placeholder="Select payment mode"
                options={[
                  { value: 'per-trip', label: 'Per Trip' },
                  { value: 'daily', label: 'Daily' },
                  { value: 'monthly', label: 'Monthly' },
                  { value: 'fuel-basis', label: 'Fuel Basis' }
                ]}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input
                {...register('licenseExpiry')}
                type="date"
                label="License Expiry Date"
                error={errors.licenseExpiry?.message}
              />
              <Input
                {...register('policeVerificationExpiry')}
                type="date"
                label="Police Verification Expiry"
                error={errors.policeVerificationExpiry?.message}
              />
              <Input
                {...register('dateOfJoining')}
                type="date"
                label="Date of Joining"
                error={errors.dateOfJoining?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Select
                {...register('status')}
                label="Status"
                error={errors.status?.message}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' }
                ]}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Driver Photo</label>
                <input type="file" accept="image/*" {...register('photoFile')} className="block w-full text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document (PDF/Image)</label>
                <input type="file" accept="image/*,.pdf" {...register('documentFile')} className="block w-full text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="referenceNote">Reference Note</label>
              <textarea id="referenceNote" {...register('referenceNote')} className="w-full border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500" rows={3} placeholder="Any additional notes or references" />
              {errors.referenceNote && <p className="text-sm text-red-600 mt-1">{errors.referenceNote.message}</p>}
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/drivers')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={isSubmitting}
              >
                Create Driver
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};