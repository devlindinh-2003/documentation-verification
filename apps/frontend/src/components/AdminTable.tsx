import { VerificationRecord } from '../types';
import { StatusBadge } from './StatusBadge';
import { formatDistanceToNow, format } from 'date-fns';
import Link from 'next/link';
import { Lock, User, Clock, ChevronRight } from 'lucide-react';

interface AdminTableProps {
  data: VerificationRecord[];
}

export function AdminTable({ data }: AdminTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="p-20 text-center space-y-4">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
          <User size={32} />
        </div>
        <div className="space-y-1">
          <p className="text-base font-semibold text-slate-900">No records found</p>
          <p className="text-sm text-slate-500">
            There are no verification requests matching your current filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead>
          <tr className="bg-slate-50/50 text-slate-500 border-b border-slate-200">
            <th className="px-6 py-4 font-bold uppercase tracking-tighter text-[10px]">
              Seller Information
            </th>
            <th className="px-6 py-4 font-bold uppercase tracking-tighter text-[10px]">
              Verification Status
            </th>
            <th className="px-6 py-4 font-bold uppercase tracking-tighter text-[10px]">
              Time in Queue
            </th>
            <th className="px-6 py-4 font-bold uppercase tracking-tighter text-[10px]">
              Review Status
            </th>
            <th className="px-6 py-4 font-bold uppercase tracking-tighter text-[10px] text-right">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((record) => {
            const isLocked = !!record?.lockedBy;

            return (
              <tr
                key={record?.id}
                className="group hover:bg-slate-50/50 transition-colors duration-200"
              >
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                      <User size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 leading-tight">
                        ID: {record?.id?.substring(0, 8)}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <StatusBadge status={record?.status} />
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <Clock size={14} className="text-slate-400" />
                      {record?.createdAt ? formatDistanceToNow(new Date(record.createdAt)) : '—'}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tighter pl-5">
                      {record?.createdAt ? format(new Date(record.createdAt), 'MMM d, h:mm a') : ''}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  {isLocked ? (
                    <div className="flex items-center gap-2 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-xs font-bold uppercase tracking-tighter w-fit">
                      <Lock size={12} strokeWidth={3} />
                      Under Review
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-100 text-slate-500 border border-slate-200 rounded-lg text-xs font-bold uppercase tracking-tighter w-fit">
                      Available
                    </div>
                  )}
                </td>
                <td className="px-6 py-5 text-right">
                  <Link
                    href={`/admin/${record?.id}`}
                    className="inline-flex items-center justify-center gap-1 px-4 py-2 text-xs font-bold uppercase tracking-tighter text-primary hover:bg-primary/5 rounded-xl transition-all duration-200"
                  >
                    Details
                    <ChevronRight
                      size={14}
                      strokeWidth={3}
                      className="group-hover:translate-x-0.5 transition-transform"
                    />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
