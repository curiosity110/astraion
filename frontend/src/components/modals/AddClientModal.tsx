import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { api } from '../../api';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AddClientModal({ open, onClose }: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [passport, setPassport] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await api('/api/clients/', {
        method: 'POST',
        body: JSON.stringify({ first_name: firstName, last_name: lastName, phone, passport_id: passport, notes }),
      });
      onClose();
      setFirstName('');
      setLastName('');
      setPhone('');
      setPassport('');
      setNotes('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-6 shadow">
                <Dialog.Title className="text-lg font-medium">Add Client</Dialog.Title>
                <div className="mt-4 space-y-3">
                  <input
                    className="w-full rounded border p-2"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                  <input
                    className="w-full rounded border p-2"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                  <input
                    className="w-full rounded border p-2"
                    placeholder="Phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <input
                    className="w-full rounded border p-2"
                    placeholder="Passport"
                    value={passport}
                    onChange={(e) => setPassport(e.target.value)}
                  />
                  <textarea
                    className="w-full rounded border p-2"
                    placeholder="Notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    className="px-4 py-2 rounded bg-gray-200"
                    onClick={onClose}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 rounded bg-primary text-white disabled:opacity-50"
                    onClick={submit}
                    disabled={loading}
                  >
                    Save
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
