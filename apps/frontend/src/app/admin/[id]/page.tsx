"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, AuditEvent, VerificationRecord } from "../../../lib/api";
import { useAuth } from "../../../hooks/useAuth";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AuditTimeline } from "../../../components/AuditTimeline";
import { DecisionPanel } from "../../../components/DecisionPanel";
import { StatusBadge } from "../../../components/StatusBadge";
import { format } from "date-fns";
import {
  ArrowLeft,
  FileText,
  Lock,
  ShieldAlert,
  User,
  Calendar,
  ExternalLink,
  RefreshCcw,
} from "lucide-react";
import Link from "next/link";

export default function AdminRecordPage() {
  const { isAuthenticated, role, user, isInitialized } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const [conflictError, setConflictError] = useState(false);

  useEffect(() => {
    if (!isInitialized) return;

    if (!isAuthenticated) {
      router.push("/login");
    } else if (role !== "admin") {
      router.push("/seller");
    }
  }, [isInitialized, isAuthenticated, role, router]);

  const {
    data: record,
    isLoading: loadingRecord,
    refetch: refetchRecord,
  } = useQuery({
    queryKey: ["admin-verification", id],
    queryFn: async () => {
      const { data } = await api.get<VerificationRecord>(
        `/admin/verifications/${id}`,
      );
      return data;
    },
    enabled: !!id && isAuthenticated && role === "admin",
    retry: false,
  });

  const { data: history, isLoading: loadingHistory } = useQuery({
    queryKey: ["admin-history", id],
    queryFn: async () => {
      const { data } = await api.get<AuditEvent[]>(
        `/admin/verifications/${id}/history`,
      );
      return data;
    },
    enabled: !!id && isAuthenticated && role === "admin",
  });

  const { data: documentData, isLoading: loadingDoc } = useQuery({
    queryKey: ["admin-document", id],
    queryFn: async () => {
      const { data } = await api.get<{ url: string }>(
        `/admin/verifications/${id}/document`,
      );
      return data;
    },
    enabled: !!id && isAuthenticated && role === "admin",
  });

  const claimMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<VerificationRecord>(
        `/admin/verifications/${id}/claim`,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-verification", id] });
    },
  });

  const decisionMutation = useMutation({
    mutationFn: async ({
      decision,
      reason,
    }: {
      decision: "approved" | "denied";
      reason: string;
    }) => {
      const version = record?.version || 1;
      const { data } = await api.post<VerificationRecord>(
        `/admin/verifications/${id}/decision`,
        {
          decision,
          reason,
          version,
        },
      );
      return data;
    },
    onSuccess: () => {
      setConflictError(false);
      queryClient.invalidateQueries({ queryKey: ["admin-verification", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-history", id] });
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { status?: number } };
      if (axiosError?.response?.status === 409) {
        setConflictError(true);
        queryClient.invalidateQueries({ queryKey: ["admin-verification", id] });
        queryClient.invalidateQueries({ queryKey: ["admin-history", id] });
      } else {
        throw error;
      }
    },
  });

  if (!isInitialized || !isAuthenticated || role !== "admin") return null;

  const handleClaim = () => {
    claimMutation.mutate();
  };

  const isLoading = loadingRecord || loadingHistory || loadingDoc;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-32 flex flex-col items-center">
        <RefreshCcw className="animate-spin text-primary mb-4" size={40} />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">
          Loading Record Data...
        </p>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-slate-50 pt-32 px-4">
        <div className="max-w-md mx-auto text-center space-y-6">
          <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto text-slate-300">
            <ShieldAlert size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-900">
              Record Not Found
            </h2>
            <p className="text-sm text-slate-500">
              The verification request you are looking for does not exist or has
              been deleted.
            </p>
          </div>
          <button
            onClick={() => router.push("/admin")}
            className="w-full py-4 bg-slate-900 text-white font-black uppercase tracking-tighter text-xs rounded-2xl hover:bg-slate-800 transition-all"
          >
            Return to Queue
          </button>
        </div>
      </div>
    );
  }

  const isLockedByMe = record?.lockedBy === user?.id;
  const isLockedByOther = record?.lockedBy && !isLockedByMe;
  const isTerminal = ["verified", "rejected", "approved", "denied"].includes(
    record?.status || "",
  );

  return (
    <div className="min-h-screen bg-slate-50/50 pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Sub Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/admin")}
              className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary transition-all shadow-sm"
            >
              <ArrowLeft size={20} strokeWidth={2.5} />
            </button>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                <FileText size={12} />
                Verification Detail
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                ID: {record.id.slice(-6)}
                <StatusBadge status={record.status} />
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <div className="flex flex-col items-end">
                <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400">
                  Created At
                </p>
                <p className="text-sm font-bold text-slate-900">
                  {format(new Date(record.createdAt), "MMM d, HH:mm")}
                </p>
              </div>
              <Calendar size={20} className="text-slate-300" />
            </div>
            {isLockedByOther && !isTerminal && (
              <button
                onClick={handleClaim}
                disabled={claimMutation.isPending}
                className="px-6 py-2.5 bg-amber-600 text-white text-xs font-black uppercase tracking-tighter rounded-xl shadow-lg shadow-amber-200 transition hover:bg-amber-700 disabled:opacity-50"
              >
                {claimMutation.isPending ? "Processing..." : "Take Over Review"}
              </button>
            )}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Document Preview */}
          <div className="lg:col-span-8 space-y-6">
            {/* Conflict Alert */}
            {conflictError && (
              <div className="p-6 bg-red-50 border-2 border-red-200 rounded-3xl flex items-start gap-4 animate-in shake duration-500">
                <ShieldAlert
                  size={24}
                  className="text-red-600 shrink-0 mt-0.5"
                />
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-red-900 uppercase tracking-tighter">
                    Concurrent Update Detected
                  </h4>
                  <p className="text-sm text-red-700 font-medium">
                    This record was modified by another administrator. We've
                    refreshed the data to ensure accuracy.
                  </p>
                  <button
                    onClick={() => {
                      setConflictError(false);
                      refetchRecord();
                    }}
                    className="mt-2 text-xs font-black text-red-600 uppercase tracking-widest hover:underline"
                  >
                    Dismiss Warning
                  </button>
                </div>
              </div>
            )}

            {/* Document Viewer */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-tighter">
                  <FileText size={16} className="text-primary" />
                  Government Issued ID
                </div>
                <a
                  href={documentData?.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                >
                  Open Original <ExternalLink size={12} />
                </a>
              </div>

              <div className="p-10 bg-slate-200/30 flex items-center justify-center min-h-[600px] relative">
                {documentData?.url ? (
                  <div className="w-full h-full min-h-[600px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
                    <iframe
                      src={documentData.url}
                      className="w-full h-full min-h-[600px]"
                      title="Document Preview"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 text-slate-400">
                    <ShieldAlert size={64} strokeWidth={1} />
                    <p className="font-bold">
                      Preview is currently unavailable
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Seller Info & Actions */}
          <div className="lg:col-span-4 space-y-8">

            {/* Decision Logic */}
            {record?.status === "inconclusive" && !isTerminal && (
              <div className="space-y-4">
                {!record?.lockedBy ? (
                  <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-primary/20 text-center space-y-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                      <Lock size={32} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-black text-slate-900">
                        Claim to Review
                      </h3>
                      <p className="text-sm text-slate-500">
                        You must lock this record to yourself before you can
                        submit a final decision.
                      </p>
                    </div>
                    <button
                      onClick={handleClaim}
                      disabled={claimMutation.isPending}
                      className="w-full py-4 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition disabled:opacity-50"
                    >
                      {claimMutation.isPending
                        ? "Claiming Record..."
                        : "Start Review Process"}
                    </button>
                  </div>
                ) : isLockedByMe ? (
                  <DecisionPanel
                    onSubmit={async (decision, reason) => {
                      await decisionMutation.mutateAsync({ decision, reason });
                    }}
                  />
                ) : (
                  <div className="bg-amber-50 p-6 rounded-3xl border-2 border-amber-200 text-center space-y-4">
                    <Lock size={32} className="mx-auto text-amber-500" />
                    <p className="text-xs font-bold text-amber-900 leading-relaxed uppercase tracking-tighter">
                      This record is locked by another administrator.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Audit History */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <RefreshCcw size={14} className="text-slate-400" />
                  Full Audit Trail
                </h3>
              </div>
              <div className="p-6 max-h-[500px] overflow-y-auto custom-scrollbar">
                <AuditTimeline events={history || []} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
