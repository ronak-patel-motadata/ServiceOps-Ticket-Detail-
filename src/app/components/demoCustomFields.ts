// Demo custom form fields — mirrors a real customer who has configured 50+
// custom fields, so we can show how the Additional Fields panel scrolls/behaves
// at that scale. Shared between AdditionalFieldsAccordion (the list + pin
// affordance) and PinnedFieldsAccordion (so a pinned custom field resolves to
// its value/color in the top "Pinned Fields" section). Rendered only on the
// ticket detail page, gated by the `demoCustomFields` prop.
export interface DemoCustomField {
  label: string;
  value: string;
  color?: string;
}

export const DEMO_CUSTOM_FORM_FIELDS: DemoCustomField[] = [
  { label: 'Requester Department', value: 'Information Technology', color: '#3D8BD0' },
  { label: 'Sub-Department', value: 'Network Operations' },
  { label: 'Office Location', value: 'Bengaluru, IN', color: '#0D9488' },
  { label: 'Floor', value: '3rd Floor' },
  { label: 'Desk Number', value: 'Seat 4-B' },
  { label: 'Asset Tag', value: 'AST-90432' },
  { label: 'Employee ID', value: 'EMP-100245' },
  { label: 'Reporting Manager', value: 'Rakesh Rathod' },
  { label: 'Manager Email', value: 'rakesh.rathod@motadata.com' },
  { label: 'Reporting Group', value: 'Infrastructure', color: '#3D8BD0' },
  { label: 'Cost Code', value: 'CC-1001' },
  { label: 'GL Account', value: '6000-IT-NET' },
  { label: 'Budget Line', value: 'FY25-OPEX' },
  { label: 'Approval Required', value: 'Yes', color: '#22A06B' },
  { label: 'Approver', value: 'Sarah Johnson' },
  { label: 'Urgency Justification', value: 'Business Critical', color: '#EF4444' },
  { label: 'Impact Scope', value: 'Department-wide', color: '#F59E0B' },
  { label: 'Service Category', value: 'Network & Connectivity', color: '#3D8BD0' },
  { label: 'Service Sub-Category', value: 'Wired / Wireless' },
  { label: 'Configuration Item', value: 'LAP-IT-0245' },
  { label: 'Hardware Vendor', value: 'Cisco Systems', color: '#8B5CF6' },
  { label: 'Vendor Ticket #', value: 'CISCO-559021' },
  { label: 'Warranty Status', value: 'In Warranty', color: '#22A06B' },
  { label: 'Purchase Order #', value: 'PO-2407-118' },
  { label: 'Contract Reference', value: 'CON-44' },
  { label: 'SLA Plan', value: 'Gold', color: '#F59E0B' },
  { label: 'Operational Hours', value: '24 x 7' },
  { label: 'Preferred Contact', value: 'Email', color: '#3D8BD0' },
  { label: 'Alternate Contact', value: '+91 98765 43221' },
  { label: 'Work Shift', value: 'General (9 - 6)' },
  { label: 'Time Zone', value: 'IST (GMT +5:30)' },
  { label: 'Preferred Language', value: 'English' },
  { label: 'Region', value: 'APAC', color: '#0D9488' },
  { label: 'Country', value: 'India' },
  { label: 'State', value: 'Karnataka' },
  { label: 'City', value: 'Bengaluru' },
  { label: 'Postal Code', value: '560103' },
  { label: 'Building Access Level', value: 'Level 2', color: '#F59E0B' },
  { label: 'Remote Work Eligible', value: 'Yes', color: '#22A06B' },
  { label: 'VPN Profile', value: 'corp-split-tunnel' },
  { label: 'Network Segment', value: 'VLAN 30' },
  { label: 'IP Address', value: '192.168.1.84' },
  { label: 'MAC Address', value: '3C:22:FB:8A:11:09' },
  { label: 'Hostname', value: 'LAP-IT-0245' },
  { label: 'OS Version', value: 'Windows 11 Pro 23H2' },
  { label: 'Antivirus Status', value: 'Compliant', color: '#22A06B' },
  { label: 'Patch Compliance', value: '98%', color: '#F59E0B' },
  { label: 'Last Hardware Scan', value: '02 Mar 2025, 08:42' },
  { label: 'Account Type', value: 'Domain', color: '#3D8BD0' },
  { label: 'Security Group', value: 'IT-Network-Admins' },
  { label: 'Data Classification', value: 'Confidential', color: '#EF4444' },
  { label: 'Compliance Tag', value: 'ISO 27001', color: '#8B5CF6' },
  { label: 'Project Code', value: 'PRJ-NET-2025' },
  { label: 'Billing Type', value: 'Internal', color: '#94A3B8' },
];
