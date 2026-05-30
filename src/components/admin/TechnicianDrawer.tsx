// TechnicianDrawer.tsx
// Drop this file into your components folder and import it in your technicians page.

import { X, Phone, MapPin, Briefcase, Wrench, Star, Eye, CalendarDays, BadgeCheck } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
export interface Technician {
  _id: string;
  fullName?: string;
  mobile?: string;
  address?: string;
  district?: string;
  taluk?: string;
  experience?: string;
  skills?: string[];
  brands?: string[];
  tools?: string[];
  jobType?: string;
  paymentType?: string;
  expectedSalary?: number;
  workLocation?: string;
  joinReady?: string;
  radnusAgree?: string;
  remarks?: string;
  availabilityStatus?: "New" | "Available" | "Interview" | "Hired" | "Archived";
  featured?: boolean;
  profileViews?: number;
  publishedAt?: string;
  createdAt?: string;
}

// ── Status badge colors ────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  New:       "bg-blue-100 text-blue-700",
  Available: "bg-green-100 text-green-700",
  Interview: "bg-yellow-100 text-yellow-700",
  Hired:     "bg-purple-100 text-purple-700",
  Archived:  "bg-gray-100 text-gray-500",
};

// ── Small helper components ────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | number }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800 text-right max-w-[60%]">{value}</span>
    </div>
  );
}

function TagList({ items }: { items?: string[] }) {
  if (!items?.length) return <p className="text-sm text-gray-400 italic">Not specified</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="px-2.5 py-1 text-xs rounded-full bg-orange-50 text-orange-700 border border-orange-100"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

// ── Main Drawer Component ──────────────────────────────────────────────────────
interface Props {
  technician: Technician | null;
  onClose: () => void;
}

export default function TechnicianDrawer({ technician, onClose }: Props) {
  if (!technician) return null;

  const status = technician.availabilityStatus ?? "New";
  const location = [technician.taluk, technician.district].filter(Boolean).join(", ");

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col overflow-hidden">
        
        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 text-white flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[status]} bg-white/20 text-white`}>
                  {status}
                </span>
                {technician.featured && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-300 text-yellow-900 font-medium flex items-center gap-1">
                    <Star size={10} fill="currentColor" /> Featured
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold">{technician.fullName || "—"}</h2>
              {location && (
                <p className="text-orange-100 text-sm flex items-center gap-1 mt-1">
                  <MapPin size={12} /> {location}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="ml-4 p-1.5 rounded-full hover:bg-white/20 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Quick stats row */}
          <div className="flex gap-4 mt-4 pt-4 border-t border-orange-400">
            <div className="flex items-center gap-1.5 text-orange-100 text-xs">
              <Eye size={13} />
              <span>{technician.profileViews ?? 0} views</span>
            </div>
            {technician.expectedSalary && (
              <div className="flex items-center gap-1.5 text-orange-100 text-xs">
                <Briefcase size={13} />
                <span>₹{technician.expectedSalary.toLocaleString()}</span>
              </div>
            )}
            {technician.mobile && (
              <div className="flex items-center gap-1.5 text-orange-100 text-xs">
                <Phone size={13} />
                <span>{technician.mobile}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          
          {/* Personal Info */}
          <Section title="Personal Info">
            <Row label="Full Name"   value={technician.fullName} />
            <Row label="Mobile"      value={technician.mobile} />
            <Row label="Address"     value={technician.address} />
            <Row label="District"    value={technician.district} />
            <Row label="Taluk"       value={technician.taluk} />
          </Section>

          {/* Work Info */}
          <Section title="Work Info">
            <Row label="Experience"     value={technician.experience} />
            <Row label="Job Type"       value={technician.jobType} />
            <Row label="Payment Type"   value={technician.paymentType} />
            <Row label="Expected Salary" value={technician.expectedSalary ? `₹${technician.expectedSalary.toLocaleString()}` : undefined} />
            <Row label="Work Location"  value={technician.workLocation} />
            <Row label="Join Ready"     value={technician.joinReady} />
          </Section>

          {/* Skills */}
          <Section title="Skills">
            <TagList items={technician.skills} />
          </Section>

          {/* Brands */}
          <Section title="Brands Handled">
            <TagList items={technician.brands} />
          </Section>

          {/* Tools */}
          <Section title="Tools Known">
            <TagList items={technician.tools} />
          </Section>

          {/* Other */}
          <Section title="Other Details">
            <Row label="Radnus Agree"  value={technician.radnusAgree} />
            <Row label="Published At"  value={technician.publishedAt ? new Date(technician.publishedAt).toLocaleDateString("en-IN") : undefined} />
            <Row label="Registered"    value={technician.createdAt ? new Date(technician.createdAt).toLocaleDateString("en-IN") : undefined} />
          </Section>

          {/* Remarks */}
          {technician.remarks && (
            <Section title="Remarks">
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed">
                {technician.remarks}
              </p>
            </Section>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex-shrink-0 px-6 py-4 border-t bg-gray-50">
          <a
            href={`tel:${technician.mobile}`}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
          >
            <Phone size={15} />
            Call {technician.fullName?.split(" ")[0]}
          </a>
        </div>
      </div>
    </>
  );
}