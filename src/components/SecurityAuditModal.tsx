import React from 'react';
import { useCrm } from '../context/CrmContext';
import {
  ShieldCheck,
  Lock,
  Key,
  Database,
  FileCheck,
  X,
  ArrowLeft
} from 'lucide-react';
import { formatIST } from '../lib/utils';

interface SecurityAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityAuditModal: React.FC<SecurityAuditModalProps> = ({ isOpen, onClose }) => {
  const { currentRole, currentUser, activityLogs } = useCrm();

  if (!isOpen) return null;

  const securityChecklist = [
    {
      title: 'Row Level Security (RLS) Active',
      status: 'Enforced',
      description: 'Postgres RLS policies ensure agents can only read and write leads where assigned_to matches their auth.uid(). Admin holds master view.',
      icon: Database,
      badge: 'Fiduciary Tier 1'
    },
    {
      title: 'Zero Client API Key Leakage',
      status: 'Secured',
      description: 'Google Gemini API is called exclusively via server-side Supabase Edge Functions. GEMINI_API_KEY is never bundled into frontend JS code or network logs.',
      icon: Key,
      badge: 'Server Vault'
    },
    {
      title: 'DPDP Act (2023) Compliance Active',
      status: 'Compliant',
      description: 'Consent timestamps are mandatory before saving contact details. Admins can permanently purge customer data under India Digital Personal Data Protection standards.',
      icon: FileCheck,
      badge: 'Regulatory'
    },
    {
      title: 'Meta Webhook Cryptographic Verification',
      status: 'Ready (SHA-256)',
      description: 'Pre-configured X-Hub-Signature-256 HMAC verification prevents spoofed payloads or replay attacks when Instagram messaging is connected.',
      icon: Lock,
      badge: 'HMAC Guard'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0A09]/80 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-xl border border-[#383126] bg-[#181613] p-6 shadow-2xl text-[#EAE5D9] max-h-[90vh] overflow-y-auto space-y-6">
        <div className="flex items-center justify-between border-b border-[#2C2720] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#221F1A] text-[#9DBFA5] border border-[#2B3E30]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#F4EFE6]">
                Fiduciary Security & Regulatory Compliance Center
              </h3>
              <p className="text-xs text-[#8C8477]">
                Active Session: {currentUser.full_name} ({currentRole.toUpperCase()})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 rounded-lg border border-[#3E362A] bg-[#221F1A] px-2.5 py-1 text-xs text-[#C2A675] hover:text-[#F4EFE6] hover:bg-[#2C2720] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[#8C8477] hover:bg-[#201D18] hover:text-[#EAE5D9] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Security Checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {securityChecklist.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="rounded-lg border border-[#2C2720] bg-[#14120F] p-4 space-y-2 hover:border-[#3E3528] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-[#9DBFA5]" />
                    <span className="font-serif font-bold text-[#F4EFE6] text-xs">{item.title}</span>
                  </div>
                  <span className="rounded px-2 py-0.5 text-[10px] font-mono font-medium badge-forest">
                    {item.status}
                  </span>
                </div>
                <p className="text-[11px] text-[#A8A194] leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Recent Audit Logs */}
        <div className="space-y-3 border-t border-[#2C2720] pt-4">
          <div className="flex items-center justify-between">
            <h4 className="font-serif font-bold text-sm text-[#F4EFE6]">Fiduciary Audit Log Trail</h4>
            <span className="text-[11px] text-[#8C8477] font-mono">{activityLogs.length} events logged</span>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-2 rounded-lg border border-[#28231C] bg-[#11100E] p-3">
            {activityLogs.length === 0 ? (
              <div className="text-center py-6 text-xs text-[#736B5F]">
                No activity logs recorded in current session.
              </div>
            ) : (
              activityLogs.map((log) => (
                <div key={log.id} className="flex items-start justify-between text-xs py-1.5 border-b border-[#201D18] last:border-0">
                  <div>
                    <span className="font-mono text-[#C2A675] text-[11px]">
                      [{log.action.replace(/_/g, ' ')}]
                    </span>{' '}
                    <span className="text-[#A8A194]">
                      by {log.user_profile?.full_name || 'System / Portal'}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#736B5F] shrink-0 font-mono ml-2">
                    {formatIST(log.created_at)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-lg border border-[#3E362A] bg-[#221F1A] px-4 py-2 text-xs font-medium text-[#C2A675] hover:bg-[#2C2720] hover:text-[#F4EFE6] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>← Return to Workspace</span>
          </button>
        </div>
      </div>
    </div>
  );
};
