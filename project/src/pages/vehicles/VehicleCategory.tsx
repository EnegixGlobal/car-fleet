import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { vehicleCategoryAPI, VehicleCategoryDTO } from '../../services/api';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { DataTable } from '../../components/common/DataTable';
import { Icon } from '../../components/ui/Icon';

const categorySchema = z.object({
	name: z.string().min(2, 'Name is required'),
	description: z.string().optional(),
});

type CategoryForm = z.infer<typeof categorySchema>;

export const VehicleCategoryPage: React.FC = () => {
	const navigate = useNavigate();
	const [vehicleCategories, setVehicleCategories] = React.useState<VehicleCategoryDTO[]>([]);
	const [loading, setLoading] = React.useState(false);
	const [editingCategory, setEditingCategory] = React.useState<VehicleCategoryDTO | null>(null);
	const [deletingId, setDeletingId] = React.useState<string | null>(null);

	const load = React.useCallback(async () => {
		setLoading(true);
		try { setVehicleCategories(await vehicleCategoryAPI.list()); } finally { setLoading(false); }
	}, []);

	React.useEffect(() => { load(); }, [load]);

	const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CategoryForm>({
		resolver: zodResolver(categorySchema),
	});

	const onSubmit = async (data: CategoryForm) => {
		try {
			if (editingCategory) {
				await vehicleCategoryAPI.update(editingCategory.id, {
					name: data.name.trim(),
					description: data.description,
				});
				toast.success('Category updated');
			} else {
				await vehicleCategoryAPI.create({ name: data.name.trim(), description: data.description });
				toast.success('Category added');
			}
			reset({ name: '', description: '' });
			setEditingCategory(null);
			await load();
		} catch {
			toast.error('Operation failed');
		}
	};

	const handleEdit = (category: VehicleCategoryDTO) => {
		setEditingCategory(category);
		reset({ name: category.name, description: category.description || '' });
	};

	const handleCancelEdit = () => {
		setEditingCategory(null);
		reset({ name: '', description: '' });
	};

	const handleDelete = async (category: VehicleCategoryDTO) => {
		if (!window.confirm(`Delete category "${category.name}"?`)) return;
		try {
			setDeletingId(category.id);
			await vehicleCategoryAPI.delete(category.id);
			toast.success('Category deleted');
			if (editingCategory?.id === category.id) {
				handleCancelEdit();
			}
			await load();
		} catch {
			toast.error('Delete failed');
		} finally {
			setDeletingId(null);
		}
	};

			const columns: { key: keyof VehicleCategoryDTO; header: string; render?: (row: VehicleCategoryDTO) => React.ReactNode }[] = [
				{ key: 'name', header: 'Name' },
				{ key: 'description', header: 'Description', render: (row: VehicleCategoryDTO) => row.description || '-' },
				{ key: 'createdAt', header: 'Created', render: (row: VehicleCategoryDTO) => new Date(row.createdAt).toLocaleString() },
			];
			const isEditing = Boolean(editingCategory);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-3">
					<Button variant="outline" onClick={() => navigate('/vehicles')}>
						<Icon name="back" className="h-4 w-4 mr-2" /> Back
					</Button>
					<h1 className="text-3xl font-bold text-gray-900">Vehicle Category</h1>
				</div>
					<Button variant="outline" onClick={load}>
							<Icon name="filter" className="h-4 w-4 mr-2" /> Refresh
				</Button>
			</div>

			<Card>
				<CardHeader>
					<h2 className="text-xl font-semibold text-gray-900">Add New Category</h2>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
						<Input label="Name" placeholder="e.g. Sedan" {...register('name')} error={errors.name?.message} />
						<Input label="Description" placeholder="Optional" {...register('description')} />
						<div className="flex items-center space-x-2">
							<Button type="submit" loading={isSubmitting}>
								{isEditing ? 'Update Category' : 'Add Category'}
							</Button>
							{isEditing && (
								<Button type="button" variant="outline" onClick={handleCancelEdit}>
									Cancel
								</Button>
							)}
						</div>
					</form>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<h2 className="text-xl font-semibold text-gray-900">Categories</h2>
				</CardHeader>
				<CardContent>
								{loading ? (
									<div className="p-6 text-sm text-gray-500">Loading...</div>
								) : (
									<DataTable
										data={vehicleCategories}
										columns={columns}
										searchPlaceholder="Search categories..."
										actions={(row) => (
											<div className="flex items-center justify-end space-x-3">
												<button
													type="button"
													onClick={(e) => {
														e.stopPropagation();
														handleEdit(row);
													}}
													className="text-amber-600 hover:text-amber-800"
													aria-label="Edit category"
													title="Edit"
												>
													<Icon name="edit" className="h-4 w-4" />
												</button>
												<span className="text-gray-300">|</span>
												<button
													type="button"
													onClick={(e) => {
														e.stopPropagation();
														handleDelete(row);
													}}
													disabled={deletingId === row.id}
													className={`${
														deletingId === row.id
															? 'text-gray-400'
															: 'text-amber-600 hover:text-amber-800'
													}`}
													aria-label="Delete category"
													title={deletingId === row.id ? 'Deleting...' : 'Delete'}
												>
													<Icon
														name={deletingId === row.id ? 'spinner' : 'delete'}
														className="h-4 w-4"
														spin={deletingId === row.id}
													/>
												</button>
											</div>
										)}
									/>
								)}
				</CardContent>
			</Card>
		</div>
	);
};

export default VehicleCategoryPage;
