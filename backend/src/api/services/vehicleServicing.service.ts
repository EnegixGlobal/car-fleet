// src/services/vehicleServicing.service.ts
import { VehicleServicing } from '../models';
import { IVehicleServicing } from '../types';
import { Vehicle } from '../models';

export const upsertVehicleServicing = async (vehicleId: string, data: Partial<IVehicleServicing>) => {
  // Ensure we don't pass _id or vehicleId conflicts in nested docs
  const update: any = { ...data };
  delete update._id;
  update.vehicleId = vehicleId;
  const doc = await VehicleServicing.findOneAndUpdate(
    { vehicleId },
    { $set: update },
    { new: true, upsert: true }
  );
  return doc;
};

export const getVehicleServicing = async (vehicleId: string) => {
  return VehicleServicing.findOne({ vehicleId });
};

export const addServicingEntries = async (vehicleId: string, section: keyof Omit<IVehicleServicing,'_id'|'vehicleId'|'createdAt'|'updatedAt'>, entries: any[]) => {
  const doc = await VehicleServicing.findOneAndUpdate(
    { vehicleId },
    { $push: { [section]: { $each: entries } }, $setOnInsert: { vehicleId } },
    { new: true, upsert: true }
  );
  return doc;
};

// Get servicing notifications (EMI, Insurance, Pollution)
export const getServicingNotifications = async () => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const thirtyDaysFromNow = new Date(now);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  thirtyDaysFromNow.setHours(23, 59, 59, 999);

  const notifications: Array<{
    type: 'emi' | 'insurance' | 'pollution';
    status: 'upcoming' | 'expired';
    vehicleId: string;
    vehicleNumber?: string;
    description: string;
    dueDate: Date;
    amount?: number;
    itemId: string;
  }> = [];

  // Get all servicing records with populated vehicle info
  const allServicing = await VehicleServicing.find({}).populate('vehicleId', 'registrationNumber', Vehicle);

  for (const servicing of allServicing) {
    const vehicle = servicing.vehicleId as any;
    const vehicleNumber = vehicle?.registrationNumber || 'Unknown';

    // Check EMI/Installments - monthly notifications
    if (servicing.installments && servicing.installments.length > 0) {
      for (const installment of servicing.installments) {
        if (!installment.date) continue;
        
        const lastPaymentDate = new Date(installment.date);
        // Calculate next due date (same day next month)
        const nextDueDate = new Date(lastPaymentDate);
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        
        // Check if due tomorrow or expired
        if (nextDueDate <= tomorrow && nextDueDate < now) {
          // Expired
          notifications.push({
            type: 'emi',
            status: 'expired',
            vehicleId: servicing.vehicleId.toString(),
            vehicleNumber,
            description: installment.description || 'EMI Payment',
            dueDate: nextDueDate,
            amount: installment.amount,
            itemId: (installment as any)._id?.toString() || '',
          });
        } else if (nextDueDate <= tomorrow && nextDueDate >= now) {
          // Due tomorrow
          notifications.push({
            type: 'emi',
            status: 'upcoming',
            vehicleId: servicing.vehicleId.toString(),
            vehicleNumber,
            description: installment.description || 'EMI Payment',
            dueDate: nextDueDate,
            amount: installment.amount,
            itemId: (installment as any)._id?.toString() || '',
          });
        }
      }
    }

    // Check Insurance - yearly notifications
    if (servicing.insurances && servicing.insurances.length > 0) {
      for (const insurance of servicing.insurances) {
        if (!insurance.validTo) continue;
        
        const expiryDate = new Date(insurance.validTo);
        expiryDate.setHours(23, 59, 59, 999);
        
        if (expiryDate < now) {
          // Expired
          notifications.push({
            type: 'insurance',
            status: 'expired',
            vehicleId: servicing.vehicleId.toString(),
            vehicleNumber,
            description: `${insurance.provider || 'Insurance'} - ${insurance.policyNumber || 'N/A'}`,
            dueDate: expiryDate,
            amount: insurance.cost,
            itemId: (insurance as any)._id?.toString() || '',
          });
        } else if (expiryDate <= thirtyDaysFromNow) {
          // Expiring within 30 days
          notifications.push({
            type: 'insurance',
            status: 'upcoming',
            vehicleId: servicing.vehicleId.toString(),
            vehicleNumber,
            description: `${insurance.provider || 'Insurance'} - ${insurance.policyNumber || 'N/A'}`,
            dueDate: expiryDate,
            amount: insurance.cost,
            itemId: (insurance as any)._id?.toString() || '',
          });
        }
      }
    }

    // Check Pollution/Legal Papers - yearly notifications
    if (servicing.legalPapers && servicing.legalPapers.length > 0) {
      for (const legalPaper of servicing.legalPapers) {
        if (!legalPaper.expiryDate) continue;
        
        const expiryDate = new Date(legalPaper.expiryDate);
        expiryDate.setHours(23, 59, 59, 999);
        
        if (expiryDate < now) {
          // Expired
          notifications.push({
            type: 'pollution',
            status: 'expired',
            vehicleId: servicing.vehicleId.toString(),
            vehicleNumber,
            description: `${legalPaper.type || 'Legal Paper'} - ${legalPaper.description || ''}`,
            dueDate: expiryDate,
            amount: legalPaper.cost,
            itemId: (legalPaper as any)._id?.toString() || '',
          });
        } else if (expiryDate <= thirtyDaysFromNow) {
          // Expiring within 30 days
          notifications.push({
            type: 'pollution',
            status: 'upcoming',
            vehicleId: servicing.vehicleId.toString(),
            vehicleNumber,
            description: `${legalPaper.type || 'Legal Paper'} - ${legalPaper.description || ''}`,
            dueDate: expiryDate,
            amount: legalPaper.cost,
            itemId: (legalPaper as any)._id?.toString() || '',
          });
        }
      }
    }
  }

  return notifications.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
};
