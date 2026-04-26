import { VerificationRecord } from '../lib/api';
import { StatusBadge } from './StatusBadge';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/navigation';
import { Lock } from 'lucide-react';

interface AdminTableProps {
  data: VerificationRecord[];
}

export function AdminTable({ data }: AdminTableProps) {
  if (data?.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        No verification records found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider text-xs">
          <tr>
            <th className="px-6 py-4 font-medium">Record ID</th>
            <th className="px-6 py-4 font-medium">Status</th>
            <th className="px-6 py-4 font-medium">Time in Queue</th>
            <th className="px-6 py-4 font-medium">Lock Status</th>
            <th className="px-6 py-4 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data?.map((record) => {
            const isLocked = !!record?.lockedBy;
            
            return (
              <tr key={record?.id} className="hover:bg-slate-50/50 transition">
                <td className="px-6 py-4">
                  <span className="font-mono text-xs text-slate-500">{record?.id?.substring(0, 8)}...</span>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={record?.status} />
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {record?.createdAt ? formatDistanceToNow(new Date(record.createdAt)) : '—'}
                </td>
                <td className="px-6 py-4">
                  {isLocked ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded">
                      <Lock size={12} />
                      In Review
                    </span>
                  ) : (
                    <span className="text-slate-400 text-xs">—</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <a
                    href={`/admin/${record?.id}`}
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition"
                  >
                    View Details
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
