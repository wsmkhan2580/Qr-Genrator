import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { listWorkers, createWorker, updateWorker } from '../services/userService.js';
import { workerFormSchema } from '../validation/schemas.js';
import { useAuth } from '../context/AuthContext.jsx';
import TextField from '../components/TextField.jsx';
import SelectField from '../components/SelectField.jsx';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import EmptyState from '../components/EmptyState.jsx';

const ROLE_OPTIONS = [
  { value: 'WORKER', label: 'Worker' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'ADMIN', label: 'Admin' },
];

export default function WorkersPage() {
  const { isAdmin, user: currentUser } = useAuth();
  const [users, setUsers] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formError, setFormError] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(workerFormSchema), defaultValues: { role: 'WORKER' } });

  const load = () => {
    setIsLoading(true);
    listWorkers({ page: 1, pageSize: 50 })
      .then((data) => setUsers(data.users))
      .catch((err) => setError(err.message || 'Could not load workers.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(load, []);

  const onCreate = async (values) => {
    setFormError(null);
    try {
      await createWorker(values);
      reset();
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(err.message || 'Could not create worker.');
    }
  };

  const toggleActive = async (user) => {
    try {
      setError(null);
      await updateWorker(user.id, { isActive: !user.isActive });
    } catch (err) {
      setError(err.message || 'Could not update this account.');
    }
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Workers</h1>
          <p className="text-sm text-ink-500">Manage worker accounts and roles.</p>
        </div>
        {isAdmin && <Button onClick={() => setModalOpen(true)}>+ Add Worker</Button>}
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner label="Loading workers…" />
        </div>
      )}

      {!isLoading && error && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {!isLoading && !error && users?.length === 0 && (
        <EmptyState title="No workers found." description="Add your first worker to get started." />
      )}

      {!isLoading && !error && users?.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-ink-200">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Worker accounts</caption>
            <thead className="bg-ink-50 text-xs uppercase text-ink-500">
              <tr>
                <th scope="col" className="px-4 py-3">Name</th>
                <th scope="col" className="px-4 py-3">Email</th>
                <th scope="col" className="px-4 py-3">Role</th>
                <th scope="col" className="px-4 py-3">Status</th>
                {isAdmin && (
                  <th scope="col" className="px-4 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3">{u.name}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{u.role}</td>
                  <td className="px-4 py-3">{u.isActive ? 'Active' : 'Deactivated'}</td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      {u.id !== currentUser?.id && (
                        <Button variant="secondary" onClick={() => toggleActive(u)}>
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Worker">
        <form onSubmit={handleSubmit(onCreate)} className="space-y-4" noValidate>
          {formError && (
            <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </p>
          )}
          <TextField label="Name" required error={errors.name?.message} {...register('name')} />
          <TextField label="Email" type="email" required error={errors.email?.message} {...register('email')} />
          <TextField
            label="Temporary Password"
            type="password"
            required
            hint="At least 8 characters, with upper, lower and a number."
            error={errors.password?.message}
            {...register('password')}
          />
          <SelectField label="Role" required options={ROLE_OPTIONS} error={errors.role?.message} {...register('role')} />
          <div className="flex gap-3 pt-2">
            <Button type="submit" isLoading={isSubmitting}>
              Create Worker
            </Button>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
