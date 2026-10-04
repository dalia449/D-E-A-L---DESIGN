import React, { useEffect, useState } from 'react';
import { useI18n } from '../lib/i18n';
import { DealLogo } from './DealLogo';
import { apiFetch } from '../lib/api';
import {
  Users,
  ShieldCheck,
  FolderKanban,
  FileText,
  Mail,
  Cpu,
  Settings,
  Activity,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Database,
  Lock,
  ArrowRight,
  Search,
  Save,
  Globe,
  Star,
  Eye,
  EyeOff,
  History,
  Check,
  Send
} from 'lucide-react';

interface AdminDashboardProps {
  onBackToApp: () => void;
  onContentUpdated?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToApp, onContentUpdated }) => {
  const { t, isRTL } = useI18n();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'users' | 'email' | 'content' | 'brand' | 'projects' | 'reviews' | 'inquiries' | 'marketing' | 'audit'
  >('overview');

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Real Database Overview Data (Zero fake statistics)
  const [stats, setStats] = useState<{
    totalUsers: number;
    verifiedUsers: number;
    activeUsers: number;
    activeProjects: number;
    completedProjects: number;
    sharedProjects: number;
    inquiries: number;
    clientReviews: number;
  }>({
    totalUsers: 0,
    verifiedUsers: 0,
    activeUsers: 0,
    activeProjects: 0,
    completedProjects: 0,
    sharedProjects: 0,
    inquiries: 0,
    clientReviews: 0
  });

  const [users, setUsers] = useState<Array<{
    id: string;
    email: string;
    name: string;
    role: string;
    isVerified: boolean;
    isActive: boolean;
    createdAt: string;
    projectCount: number;
  }>>([]);

  const [contactRequests, setContactRequests] = useState<Array<{
    id: string;
    name: string;
    email: string;
    category: string;
    subject: string;
    message: string;
    status: string;
    created_at: string;
  }>>([]);

  const [clientReviews, setClientReviews] = useState<Array<{
    id: string;
    project_id?: string;
    client_name: string;
    client_email?: string;
    rating: number;
    review_text: string;
    is_public: number;
    created_at: string;
  }>>([]);

  // Projects list
  const [allProjects, setAllProjects] = useState<any[]>([]);

  // User search/filter
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');

  // Content Management State (Arabic & English editable strings)
  const [contentLang, setContentLang] = useState<'ar' | 'en'>('en');
  const [contentItems, setContentItems] = useState<{
    brand_name: { en: string; ar: string };
    brand_tagline: { en: string; ar: string };
    hero_title: { en: string; ar: string };
    hero_subtitle: { en: string; ar: string };
    vision_2030_text: { en: string; ar: string };
    announcement: { en: string; ar: string };
  }>({
    brand_name: { en: 'DEAL', ar: 'ديل DEAL' },
    brand_tagline: { en: 'Design • Engineering • Architecture • Living', ar: 'تصميم • هندسة • عمارة • حياة' },
    hero_title: { en: 'AI-Powered Architectural Engineering Platform', ar: 'المنصة الهندسية والمعمارية الذكية المدعومة بالذكاء الاصطناعي' },
    hero_subtitle: { en: 'Transforming ideas, sketches, floor plans, site surveys, voice notes, and hand gestures into realistic interactive 3D architecture.', ar: 'تحويل الأفكار والرسومات اليدوية ومخططات الأراضي والأوامر الصوتية إلى واقع معماري تفاعلي ثلاثي الأبعاد.' },
    vision_2030_text: { en: 'Aligned with Saudi Vision 2030 for sustainable urban innovation, smart architectural planning, and green living environments.', ar: 'متوافق مع مستهدفات رؤية السعودية 2030 في الابتكار الحضري المستدام، والتخطيط المعماري الذكي، والمباني الخضراء.' },
    announcement: { en: 'DEAL Architecture AI Engine v3.4 is live.', ar: 'محرك ديل المعماري الذكي متاح الآن.' }
  });

  // Brand Settings State
  const [brandSettings, setBrandSettings] = useState({
    brandName: 'DEAL',
    tagline: 'Design • Engineering • Architecture • Living',
    primaryColor: '#54483C',
    bgColor: '#F6EFE5',
    cardBgColor: '#FAF7F2',
    accentColor: '#8A7A6A',
    contactEmail: 'dd3.99d@gmail.com',
    headquarters: 'King Abdullah Financial District (KAFD), Riyadh, Saudi Arabia'
  });

  // Marketing Consents
  const [marketingConsents, setMarketingConsents] = useState<Array<{ email: string; consented_at: string }>>([]);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<Array<{ id: string; action: string; details: string; ip_address: string; created_at: string }>>([]);

  // Real Email & SMTP Service State
  const [emailStatus, setEmailStatus] = useState<{
    provider: string;
    senderEmail?: string;
    senderName?: string;
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    hasSmtpPass?: boolean;
    hasResendKey?: boolean;
    connected: boolean;
    connectionDetails?: string;
    connectionError?: string;
  } | null>(null);

  const [emailForm, setEmailForm] = useState({
    provider: 'custom_smtp',
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPass: '',
    smtpSecure: false,
    senderEmail: 'verify@deal-architecture.com',
    senderName: 'DEAL Platform',
    resendApiKey: ''
  });

  const [testEmailTo, setTestEmailTo] = useState('dd3.99d@gmail.com');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; code?: string } | null>(null);
  const [isSavingEmailConfig, setIsSavingEmailConfig] = useState(false);

  const fetchEmailStatus = async () => {
    try {
      const res = await apiFetch<any>('/api/admin/email-status');
      if (res.success) {
        setEmailStatus(res);
        setEmailForm(prev => ({
          ...prev,
          provider: res.provider !== 'none' ? res.provider : 'custom_smtp',
          smtpHost: res.smtpHost || prev.smtpHost,
          smtpPort: res.smtpPort ? String(res.smtpPort) : prev.smtpPort,
          smtpUser: res.smtpUser || prev.smtpUser,
          senderEmail: res.senderEmail || prev.senderEmail,
          senderName: res.senderName || prev.senderName
        }));
      }
    } catch (err: any) {
      console.warn('Could not fetch email status:', err);
    }
  };

  const handleSaveEmailConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingEmailConfig(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await apiFetch<any>('/api/admin/email-config', {
        method: 'POST',
        body: JSON.stringify({
          provider: emailForm.provider,
          smtpHost: emailForm.smtpHost,
          smtpPort: Number(emailForm.smtpPort),
          smtpUser: emailForm.smtpUser,
          smtpPass: emailForm.smtpPass,
          smtpSecure: emailForm.smtpSecure,
          senderEmail: emailForm.senderEmail,
          senderName: emailForm.senderName,
          resendApiKey: emailForm.resendApiKey
        })
      });
      setSuccessMsg(res.message || 'Email settings saved successfully.');
      fetchEmailStatus();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save email configuration.');
    } finally {
      setIsSavingEmailConfig(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailTo || isSendingTest) return;
    setIsSendingTest(true);
    setTestResult(null);
    setErrorMsg(null);
    try {
      const res = await apiFetch<any>('/api/admin/test-email', {
        method: 'POST',
        body: JSON.stringify({ to: testEmailTo.trim() })
      });
      setTestResult({ success: true, message: res.message, code: res.code });
      setSuccessMsg(`Test verification email sent to ${testEmailTo}!`);
    } catch (err: any) {
      const errMsg = err.message || 'Test email delivery failed.';
      setTestResult({ success: false, message: errMsg });
      setErrorMsg(`Delivery error: ${errMsg}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  // Load Real Data from Server
  const fetchOverview = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiFetch<{
        stats: any;
        users: any[];
        contactRequests: any[];
        reviews: any[];
      }>('/api/admin/overview');

      if (res.stats) setStats(res.stats);
      if (res.users) setUsers(res.users);
      if (res.contactRequests) setContactRequests(res.contactRequests);
      if (res.reviews) setClientReviews(res.reviews);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load administrative overview.');
    } finally {
      setLoading(false);
    }
  };

  const fetchContent = async () => {
    try {
      const res = await apiFetch<{ items: Array<{ content_key: string; lang: string; content: string }> }>('/api/admin/content');
      if (res.items) {
        const nextContent: any = { ...contentItems };
        res.items.forEach(item => {
          if (nextContent[item.content_key]) {
            nextContent[item.content_key][item.lang] = item.content;
          }
        });
        setContentItems(nextContent);
      }
    } catch (e) {
      console.warn('Error fetching content:', e);
    }
  };

  const fetchBrandSettings = async () => {
    try {
      const res = await apiFetch<{ settings: Array<{ setting_key: string; value_json: string }> }>('/api/admin/settings');
      if (res.settings) {
        const branding = res.settings.find(s => s.setting_key === 'branding');
        if (branding) {
          setBrandSettings(JSON.parse(branding.value_json));
        }
      }
    } catch (e) {
      console.warn('Error fetching settings:', e);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await apiFetch<{ projects: any[] }>('/api/projects?all=true');
      if (res.projects) setAllProjects(res.projects);
    } catch (e) {
      console.warn('Error fetching all projects:', e);
    }
  };

  const fetchMarketingConsents = async () => {
    try {
      const res = await apiFetch<{ consents: any[] }>('/api/admin/marketing-consents');
      if (res.consents) setMarketingConsents(res.consents);
    } catch (e) {}
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await apiFetch<{ logs: any[] }>('/api/admin/audit-logs');
      if (res.logs) setAuditLogs(res.logs);
    } catch (e) {}
  };

  useEffect(() => {
    fetchOverview();
    fetchContent();
    fetchBrandSettings();
    fetchProjects();
    fetchMarketingConsents();
    fetchAuditLogs();
    fetchEmailStatus();
  }, []);

  const handleToggleUser = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await apiFetch<{ success: boolean; userId: string; isActive: boolean }>('/api/admin/toggle-user-status', {
        method: 'POST',
        body: JSON.stringify({ userId, isActive: !currentStatus })
      });
      if (res.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: res.isActive } : u));
        setSuccessMsg(`User status updated to ${res.isActive ? 'Active' : 'Deactivated'}.`);
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      const res = await apiFetch<{ success: boolean; userId: string; newRole: string }>('/api/admin/change-user-role', {
        method: 'POST',
        body: JSON.stringify({ userId, newRole })
      });
      if (res.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        setSuccessMsg(`User role updated to ${newRole}.`);
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  const handleSaveContentKey = async (key: string, lang: 'ar' | 'en', text: string) => {
    try {
      await apiFetch('/api/admin/content', {
        method: 'POST',
        body: JSON.stringify({ key, lang, content: text })
      });
      setSuccessMsg(`Saved content for "${key}" (${lang.toUpperCase()}) to database.`);
      setTimeout(() => setSuccessMsg(null), 3000);
      if (onContentUpdated) onContentUpdated();
    } catch (err: any) {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  const handleSaveBrandSettings = async () => {
    try {
      await apiFetch('/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify({ settingKey: 'branding', value: brandSettings })
      });
      setSuccessMsg('Brand & platform settings persisted to database.');
      setTimeout(() => setSuccessMsg(null), 3000);
      if (onContentUpdated) onContentUpdated();
    } catch (err: any) {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  // Filtered users
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                          u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAF7F2] p-6 lg:p-8 overflow-y-auto text-[#3F3832]">
      {/* Top Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-[#D8CEC2] gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded bg-[#54483C] text-[#FAF7F2] flex items-center justify-center font-serif-arch font-bold text-xl shadow-sm">
            D
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-[#54483C] text-[#FAF7F2] rounded text-[10px] font-bold tracking-wider uppercase">
                Owner Administrative Authority
              </span>
              <span className="text-xs text-[#756A60]">Primary Owner: dd3.99d@gmail.com</span>
            </div>
            <h1 className="font-serif-arch text-2xl font-bold text-[#3F3832] mt-0.5">
              DEAL Executive Control Center
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchOverview}
            className="px-3.5 py-2 bg-[#EFE6DA] text-[#54483C] border border-[#D8CEC2] rounded text-xs font-medium hover:bg-[#D8CEC2] transition-colors"
          >
            Refresh Database
          </button>
          <button
            onClick={onBackToApp}
            className="px-4 py-2 bg-[#54483C] text-[#FAF7F2] rounded text-xs font-semibold hover:bg-[#3F3832] transition-colors"
          >
            Return to Design Workspace
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {errorMsg && (
        <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded text-xs">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Admin Section Tabs */}
      <div className="flex items-center gap-1.5 mt-6 border-b border-[#D8CEC2] pb-3 text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'overview' ? 'bg-[#54483C] text-[#FAF7F2]' : 'text-[#756A60] hover:text-[#3F3832]'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'users' ? 'bg-[#54483C] text-[#FAF7F2]' : 'text-[#756A60] hover:text-[#3F3832]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Users ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('email')}
          className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'email' ? 'bg-[#54483C] text-[#FAF7F2]' : 'text-[#756A60] hover:text-[#3F3832]'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Email & SMTP</span>
          {emailStatus?.connected ? (
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          ) : (
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('content')}
          className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'content' ? 'bg-[#54483C] text-[#FAF7F2]' : 'text-[#756A60] hover:text-[#3F3832]'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Content (AR / EN)</span>
        </button>

        <button
          onClick={() => setActiveTab('brand')}
          className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'brand' ? 'bg-[#54483C] text-[#FAF7F2]' : 'text-[#756A60] hover:text-[#3F3832]'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Brand Settings</span>
        </button>

        <button
          onClick={() => setActiveTab('projects')}
          className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'projects' ? 'bg-[#54483C] text-[#FAF7F2]' : 'text-[#756A60] hover:text-[#3F3832]'
          }`}
        >
          <FolderKanban className="w-3.5 h-3.5" />
          <span>Projects ({allProjects.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('inquiries')}
          className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'inquiries' ? 'bg-[#54483C] text-[#FAF7F2]' : 'text-[#756A60] hover:text-[#3F3832]'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Inquiries ({contactRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'reviews' ? 'bg-[#54483C] text-[#FAF7F2]' : 'text-[#756A60] hover:text-[#3F3832]'
          }`}
        >
          <Star className="w-3.5 h-3.5" />
          <span>Client Reviews ({clientReviews.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('marketing')}
          className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'marketing' ? 'bg-[#54483C] text-[#FAF7F2]' : 'text-[#756A60] hover:text-[#3F3832]'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Opted-In Emails ({marketingConsents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'audit' ? 'bg-[#54483C] text-[#FAF7F2]' : 'text-[#756A60] hover:text-[#3F3832]'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Audit Logs ({auditLogs.length})</span>
        </button>
      </div>

      {/* TAB A: OVERVIEW (Real DB Data Only) */}
      {activeTab === 'overview' && (
        <div className="space-y-6 mt-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-[#EFE6DA] p-4 rounded border border-[#D8CEC2]">
              <span className="text-[#756A60] block mb-1">Registered Users</span>
              <span className="text-2xl font-bold text-[#3F3832]">{stats.totalUsers}</span>
              <span className="text-[10px] text-[#756A60] block mt-1">Real database records</span>
            </div>
            <div className="bg-[#EFE6DA] p-4 rounded border border-[#D8CEC2]">
              <span className="text-[#756A60] block mb-1">Verified Users</span>
              <span className="text-2xl font-bold text-emerald-800">{stats.verifiedUsers}</span>
              <span className="text-[10px] text-[#756A60] block mt-1">Email verified</span>
            </div>
            <div className="bg-[#EFE6DA] p-4 rounded border border-[#D8CEC2]">
              <span className="text-[#756A60] block mb-1">Active Projects</span>
              <span className="text-2xl font-bold text-[#3F3832]">{stats.activeProjects}</span>
              <span className="text-[10px] text-[#756A60] block mt-1">In design phase</span>
            </div>
            <div className="bg-[#EFE6DA] p-4 rounded border border-[#D8CEC2]">
              <span className="text-[#756A60] block mb-1">Completed Projects</span>
              <span className="text-2xl font-bold text-[#3F3832]">{stats.completedProjects}</span>
              <span className="text-[10px] text-[#756A60] block mt-1">Finalized envelopes</span>
            </div>
            <div className="bg-[#EFE6DA] p-4 rounded border border-[#D8CEC2]">
              <span className="text-[#756A60] block mb-1">Client Inquiries</span>
              <span className="text-2xl font-bold text-[#54483C]">{stats.inquiries}</span>
              <span className="text-[10px] text-[#756A60] block mt-1">Incoming briefs</span>
            </div>
            <div className="bg-[#EFE6DA] p-4 rounded border border-[#D8CEC2]">
              <span className="text-[#756A60] block mb-1">Real Client Reviews</span>
              <span className="text-2xl font-bold text-[#54483C]">{stats.clientReviews}</span>
              <span className="text-[10px] text-[#756A60] block mt-1">Submitted ratings</span>
            </div>
            <div className="bg-[#EFE6DA] p-4 rounded border border-[#D8CEC2]">
              <span className="text-[#756A60] block mb-1">Marketing Opt-Ins</span>
              <span className="text-2xl font-bold text-emerald-800">{marketingConsents.length}</span>
              <span className="text-[10px] text-[#756A60] block mt-1">Consented subscribers</span>
            </div>
            <div className="bg-[#EFE6DA] p-4 rounded border border-[#D8CEC2]">
              <span className="text-[#756A60] block mb-1">Audit Entries</span>
              <span className="text-2xl font-bold text-[#3F3832]">{auditLogs.length}</span>
              <span className="text-[10px] text-[#756A60] block mt-1">Security action log</span>
            </div>
          </div>

          <div className="bg-[#FAF7F2] p-5 rounded border border-[#D8CEC2] text-xs">
            <h3 className="font-serif-arch text-sm font-semibold text-[#54483C] uppercase tracking-wider mb-2">
              Primary System Ownership Confirmation
            </h3>
            <p className="text-[#756A60] leading-relaxed">
              Authenticated Owner: <strong>dd3.99d@gmail.com</strong>.
              All administrative permissions are validated server-side on every request through token session records in the persistent database.
            </p>
          </div>
        </div>
      )}

      {/* TAB B: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="mt-6 space-y-4 text-xs">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#EFE6DA] p-3 rounded border border-[#D8CEC2]">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-[#8A7A6A] absolute left-3 top-2.5" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search user by name or email..."
                className="w-full bg-[#FAF7F2] border border-[#D8CEC2] rounded pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-[#54483C]"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[#756A60]">Role:</span>
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="bg-[#FAF7F2] border border-[#D8CEC2] rounded px-2.5 py-1.5 text-xs focus:outline-none"
              >
                <option value="all">All Roles</option>
                <option value="owner">Owner</option>
                <option value="engineer">Engineer</option>
                <option value="architect">Architect</option>
                <option value="designer">Designer</option>
                <option value="company">Company</option>
                <option value="client">Client</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-[#FAF7F2] rounded border border-[#D8CEC2] overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#EFE6DA] text-[#54483C] font-semibold border-b border-[#D8CEC2]">
                <tr>
                  <th className="p-3">User Name</th>
                  <th className="p-3">Email Address</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Projects</th>
                  <th className="p-3">Verification</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Registered</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DDD3]">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-[#756A60]">
                      No users match the criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-[#EFE6DA]/40">
                      <td className="p-3 font-semibold text-[#3F3832]">{u.name}</td>
                      <td className="p-3 text-[#756A60]">{u.email}</td>
                      <td className="p-3">
                        {u.role === 'owner' ? (
                          <span className="px-2 py-0.5 bg-[#54483C] text-[#FAF7F2] rounded text-[10px] font-bold uppercase">
                            Owner
                          </span>
                        ) : (
                          <select
                            value={u.role}
                            onChange={(e) => handleChangeRole(u.id, e.target.value)}
                            className="bg-[#EFE6DA] border border-[#D8CEC2] rounded px-2 py-1 text-[11px] capitalize focus:outline-none"
                          >
                            <option value="engineer">Engineer</option>
                            <option value="architect">Architect</option>
                            <option value="designer">Designer</option>
                            <option value="company">Company</option>
                            <option value="client">Client</option>
                          </select>
                        )}
                      </td>
                      <td className="p-3 font-medium text-[#54483C]">{u.projectCount}</td>
                      <td className="p-3">
                        {u.isVerified ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-semibold border border-emerald-200">
                            Verified
                          </span>
                        ) : (
                          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[10px] border border-amber-200">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${u.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {u.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="p-3 text-[#756A60] text-[11px]">{u.createdAt?.split('T')[0] || u.createdAt}</td>
                      <td className="p-3 text-right">
                        {u.role !== 'owner' && (
                          <button
                            onClick={() => handleToggleUser(u.id, u.isActive)}
                            className="px-2.5 py-1 bg-[#EFE6DA] text-[#54483C] border border-[#D8CEC2] rounded hover:bg-[#D8CEC2] text-[11px]"
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: EMAIL & SMTP SERVICE */}
      {activeTab === 'email' && (
        <div className="mt-6 space-y-6 text-xs">
          {/* Active Status Card */}
          <div className="bg-[#FAF7F2] p-5 rounded-lg border border-[#D8CEC2] shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D8CEC2]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#EFE6DA] border border-[#D8CEC2] flex items-center justify-center text-[#54483C]">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif-arch text-base font-bold text-[#3F3832]">
                    Real Email Service & OTP Verification
                  </h3>
                  <p className="text-xs text-[#756A60]">
                    Authoritative real email delivery for new account registration, 6-digit OTP codes, and password recovery.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 ${
                  emailStatus?.connected
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${emailStatus?.connected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                  {emailStatus?.connected ? 'Connected & Ready' : 'Configuration Pending'}
                </span>
                <button
                  type="button"
                  onClick={fetchEmailStatus}
                  className="px-2.5 py-1 bg-[#EFE6DA] border border-[#D8CEC2] rounded text-xs text-[#54483C] hover:bg-[#D8CEC2]"
                >
                  Verify Connection
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
              <div className="bg-[#EFE6DA]/60 p-3 rounded border border-[#D8CEC2]">
                <span className="text-[#756A60] block text-[11px] mb-1">Active Provider</span>
                <span className="font-bold text-[#3F3832] uppercase">
                  {emailStatus?.provider === 'custom_smtp' ? 'Custom SMTP' : emailStatus?.provider === 'resend' ? 'Resend API' : 'None Configured'}
                </span>
              </div>
              <div className="bg-[#EFE6DA]/60 p-3 rounded border border-[#D8CEC2]">
                <span className="text-[#756A60] block text-[11px] mb-1">Sender Address</span>
                <span className="font-medium text-[#3F3832] truncate block">
                  {emailStatus?.senderEmail || 'verify@deal-architecture.com'}
                </span>
              </div>
              <div className="bg-[#EFE6DA]/60 p-3 rounded border border-[#D8CEC2]">
                <span className="text-[#756A60] block text-[11px] mb-1">Sender Name</span>
                <span className="font-medium text-[#3F3832] truncate block">
                  {emailStatus?.senderName || 'DEAL Architectural Platform'}
                </span>
              </div>
            </div>

            {emailStatus?.connectionDetails && (
              <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-[11px]">
                {emailStatus.connectionDetails}
              </div>
            )}

            {emailStatus?.connectionError && (
              <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded text-[11px]">
                Diagnostic Warning: {emailStatus.connectionError}
              </div>
            )}
          </div>

          {/* Live Delivery Test Section */}
          <div className="bg-[#FAF7F2] p-5 rounded-lg border border-[#D8CEC2]">
            <h4 className="font-serif-arch text-sm font-semibold text-[#54483C] uppercase tracking-wider mb-2">
              Send Live Test Verification Email
            </h4>
            <p className="text-xs text-[#756A60] mb-4">
              Trigger a live 6-digit verification code dispatch to confirm emails physically arrive in your real email inbox.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 max-w-lg">
              <input
                type="email"
                value={testEmailTo}
                onChange={(e) => setTestEmailTo(e.target.value)}
                placeholder="recipient@domain.com"
                className="w-full bg-[#FAF7F2] border border-[#D8CEC2] rounded px-3 py-2 text-xs focus:outline-none focus:border-[#54483C]"
              />
              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={isSendingTest || !testEmailTo}
                className="w-full sm:w-auto px-4 py-2 bg-[#54483C] text-[#FAF7F2] rounded text-xs font-semibold hover:bg-[#3F3832] transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingTest ? 'Sending Real Email...' : 'Send Live Test Email'}</span>
              </button>
            </div>

            {testResult && (
              <div className={`mt-3 p-3 rounded border text-xs ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <div className="font-semibold">{testResult.message}</div>
                {testResult.code && (
                  <div className="mt-1 font-mono text-[11px]">
                    Delivered 6-Digit OTP Code: <strong>{testResult.code}</strong> (Expires in 10 min)
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Email Provider Configuration Form */}
          <form onSubmit={handleSaveEmailConfig} className="bg-[#FAF7F2] p-5 rounded-lg border border-[#D8CEC2] space-y-4">
            <h4 className="font-serif-arch text-sm font-semibold text-[#54483C] uppercase tracking-wider">
              Email Provider Credentials (.env / Persistent DB)
            </h4>
            <p className="text-xs text-[#756A60]">
              Credentials saved here are stored securely server-side and take effect immediately without restarting the server.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[#756A60] font-medium mb-1">Email Delivery Method</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="emailProvider"
                      value="custom_smtp"
                      checked={emailForm.provider === 'custom_smtp'}
                      onChange={() => setEmailForm(prev => ({ ...prev, provider: 'custom_smtp' }))}
                      className="accent-[#54483C]"
                    />
                    <span>Custom SMTP (Gmail, SendGrid, Mailgun, Brevo, AWS SES)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="emailProvider"
                      value="resend"
                      checked={emailForm.provider === 'resend'}
                      onChange={() => setEmailForm(prev => ({ ...prev, provider: 'resend' }))}
                      className="accent-[#54483C]"
                    />
                    <span>Resend API (resend.com)</span>
                  </label>
                </div>
              </div>

              {emailForm.provider === 'custom_smtp' && (
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#756A60] font-medium mb-1">SMTP Host</label>
                      <input
                        type="text"
                        value={emailForm.smtpHost}
                        onChange={(e) => setEmailForm(prev => ({ ...prev, smtpHost: e.target.value }))}
                        placeholder="e.g. smtp.gmail.com or smtp.sendgrid.net"
                        className="w-full bg-[#FAF7F2] border border-[#D8CEC2] rounded px-3 py-2 text-xs focus:outline-none focus:border-[#54483C]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#756A60] font-medium mb-1">SMTP Port</label>
                      <input
                        type="number"
                        value={emailForm.smtpPort}
                        onChange={(e) => setEmailForm(prev => ({ ...prev, smtpPort: e.target.value }))}
                        placeholder="587 or 465"
                        className="w-full bg-[#FAF7F2] border border-[#D8CEC2] rounded px-3 py-2 text-xs focus:outline-none focus:border-[#54483C]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#756A60] font-medium mb-1">SMTP Username / Email</label>
                      <input
                        type="text"
                        value={emailForm.smtpUser}
                        onChange={(e) => setEmailForm(prev => ({ ...prev, smtpUser: e.target.value }))}
                        placeholder="e.g. your-email@gmail.com or apikey"
                        className="w-full bg-[#FAF7F2] border border-[#D8CEC2] rounded px-3 py-2 text-xs focus:outline-none focus:border-[#54483C]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#756A60] font-medium mb-1">SMTP Password / App Password</label>
                      <input
                        type="password"
                        value={emailForm.smtpPass}
                        onChange={(e) => setEmailForm(prev => ({ ...prev, smtpPass: e.target.value }))}
                        placeholder="••••••••••••••••"
                        className="w-full bg-[#FAF7F2] border border-[#D8CEC2] rounded px-3 py-2 text-xs focus:outline-none focus:border-[#54483C]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="smtpSecure"
                      checked={emailForm.smtpSecure}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, smtpSecure: e.target.checked }))}
                      className="accent-[#54483C]"
                    />
                    <label htmlFor="smtpSecure" className="text-[#756A60] text-xs cursor-pointer">
                      Use SSL/TLS directly (Port 465). For port 587, leave unchecked (uses STARTTLS).
                    </label>
                  </div>
                </div>
              )}

              {emailForm.provider === 'resend' && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-[#756A60] font-medium mb-1">Resend API Key</label>
                    <input
                      type="password"
                      value={emailForm.resendApiKey}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, resendApiKey: e.target.value }))}
                      placeholder="re_••••••••••••••••"
                      className="w-full bg-[#FAF7F2] border border-[#D8CEC2] rounded px-3 py-2 text-xs focus:outline-none focus:border-[#54483C]"
                    />
                    <span className="text-[10px] text-[#756A60] mt-1 block">
                      Obtain an API key from your Resend Dashboard (resend.com/api-keys).
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#D8CEC2]">
                <div>
                  <label className="block text-[#756A60] font-medium mb-1">Sender Email Address</label>
                  <input
                    type="text"
                    value={emailForm.senderEmail}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, senderEmail: e.target.value }))}
                    placeholder="verify@deal-architecture.com"
                    className="w-full bg-[#FAF7F2] border border-[#D8CEC2] rounded px-3 py-2 text-xs focus:outline-none focus:border-[#54483C]"
                  />
                  <span className="text-[10px] text-[#756A60] mt-1 block">
                    Must be a verified sender or domain on your email provider.
                  </span>
                </div>
                <div>
                  <label className="block text-[#756A60] font-medium mb-1">Sender Display Name</label>
                  <input
                    type="text"
                    value={emailForm.senderName}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, senderName: e.target.value }))}
                    placeholder="DEAL Platform"
                    className="w-full bg-[#FAF7F2] border border-[#D8CEC2] rounded px-3 py-2 text-xs focus:outline-none focus:border-[#54483C]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSavingEmailConfig}
                className="px-5 py-2.5 bg-[#54483C] text-[#FAF7F2] rounded text-xs font-semibold hover:bg-[#3F3832] transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingEmailConfig ? 'Saving & Verifying...' : 'Save Email Configuration'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB C: CONTENT MANAGEMENT (Arabic & English) */}
      {activeTab === 'content' && (
        <div className="mt-6 space-y-6 text-xs">
          <div className="flex items-center justify-between bg-[#EFE6DA] p-3 rounded border border-[#D8CEC2]">
            <p className="text-[#756A60]">
              Edit the live public platform content in English and Arabic. Changes persist in the database and take effect immediately.
            </p>

            <div className="flex items-center gap-1 bg-[#FAF7F2] p-1 rounded border border-[#D8CEC2]">
              <button
                onClick={() => setContentLang('en')}
                className={`px-3 py-1 rounded text-xs transition-colors ${
                  contentLang === 'en' ? 'bg-[#54483C] text-[#FAF7F2]' : 'text-[#3F3832]'
                }`}
              >
                English (LTR)
              </button>
              <button
                onClick={() => setContentLang('ar')}
                className={`px-3 py-1 rounded text-xs transition-colors ${
                  contentLang === 'ar' ? 'bg-[#54483C] text-[#FAF7F2]' : 'text-[#3F3832]'
                }`}
              >
                العربية (RTL)
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {Object.keys(contentItems).map((key) => {
              const itemKey = key as keyof typeof contentItems;
              const val = contentItems[itemKey][contentLang];

              return (
                <div key={key} className="bg-[#FAF7F2] p-5 rounded border border-[#D8CEC2] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-xs uppercase tracking-wider text-[#54483C]">
                      {key.replace(/_/g, ' ')} ({contentLang.toUpperCase()})
                    </label>
                    <button
                      onClick={() => handleSaveContentKey(key, contentLang, val)}
                      className="px-3 py-1 bg-[#54483C] text-[#FAF7F2] rounded text-xs font-medium hover:bg-[#3F3832] flex items-center gap-1"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </button>
                  </div>

                  {key.includes('text') || key.includes('subtitle') ? (
                    <textarea
                      rows={3}
                      dir={contentLang === 'ar' ? 'rtl' : 'ltr'}
                      value={val}
                      onChange={(e) => {
                        const newVal = e.target.value;
                        setContentItems(prev => ({
                          ...prev,
                          [itemKey]: { ...prev[itemKey], [contentLang]: newVal }
                        }));
                      }}
                      className="w-full bg-[#EFE6DA] border border-[#D8CEC2] rounded p-2.5 text-xs text-[#3F3832] focus:outline-none focus:border-[#54483C] resize-none"
                    />
                  ) : (
                    <input
                      type="text"
                      dir={contentLang === 'ar' ? 'rtl' : 'ltr'}
                      value={val}
                      onChange={(e) => {
                        const newVal = e.target.value;
                        setContentItems(prev => ({
                          ...prev,
                          [itemKey]: { ...prev[itemKey], [contentLang]: newVal }
                        }));
                      }}
                      className="w-full bg-[#EFE6DA] border border-[#D8CEC2] rounded px-3 py-2 text-xs text-[#3F3832] focus:outline-none focus:border-[#54483C]"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB D: BRAND SETTINGS */}
      {activeTab === 'brand' && (
        <div className="mt-6 bg-[#FAF7F2] p-6 rounded border border-[#D8CEC2] text-xs space-y-5 max-w-3xl">
          <div className="border-b border-[#D8CEC2] pb-3">
            <h3 className="font-serif-arch text-base font-bold text-[#54483C]">
              Official DEAL Brand Architecture
            </h3>
            <p className="text-[#756A60] text-xs mt-0.5">
              Preserve the premium architectural palette while customizing core branding parameters.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[#756A60] font-medium block mb-1">Brand Name</label>
              <input
                type="text"
                value={brandSettings.brandName}
                onChange={(e) => setBrandSettings({ ...brandSettings, brandName: e.target.value })}
                className="w-full bg-[#EFE6DA] border border-[#D8CEC2] rounded px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="text-[#756A60] font-medium block mb-1">Brand Tagline</label>
              <input
                type="text"
                value={brandSettings.tagline}
                onChange={(e) => setBrandSettings({ ...brandSettings, tagline: e.target.value })}
                className="w-full bg-[#EFE6DA] border border-[#D8CEC2] rounded px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[#756A60] font-medium block mb-1">Primary Architectural Brown</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={brandSettings.primaryColor}
                  onChange={(e) => setBrandSettings({ ...brandSettings, primaryColor: e.target.value })}
                  className="w-8 h-8 rounded border border-[#D8CEC2] cursor-pointer"
                />
                <input
                  type="text"
                  value={brandSettings.primaryColor}
                  onChange={(e) => setBrandSettings({ ...brandSettings, primaryColor: e.target.value })}
                  className="w-full bg-[#EFE6DA] border border-[#D8CEC2] rounded px-2.5 py-1.5 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[#756A60] font-medium block mb-1">Background Warm Ivory</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={brandSettings.bgColor}
                  onChange={(e) => setBrandSettings({ ...brandSettings, bgColor: e.target.value })}
                  className="w-8 h-8 rounded border border-[#D8CEC2] cursor-pointer"
                />
                <input
                  type="text"
                  value={brandSettings.bgColor}
                  onChange={(e) => setBrandSettings({ ...brandSettings, bgColor: e.target.value })}
                  className="w-full bg-[#EFE6DA] border border-[#D8CEC2] rounded px-2.5 py-1.5 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[#756A60] font-medium block mb-1">Accent Taupe</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={brandSettings.accentColor}
                  onChange={(e) => setBrandSettings({ ...brandSettings, accentColor: e.target.value })}
                  className="w-8 h-8 rounded border border-[#D8CEC2] cursor-pointer"
                />
                <input
                  type="text"
                  value={brandSettings.accentColor}
                  onChange={(e) => setBrandSettings({ ...brandSettings, accentColor: e.target.value })}
                  className="w-full bg-[#EFE6DA] border border-[#D8CEC2] rounded px-2.5 py-1.5 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[#756A60] font-medium block mb-1">Contact Email</label>
              <input
                type="email"
                value={brandSettings.contactEmail}
                onChange={(e) => setBrandSettings({ ...brandSettings, contactEmail: e.target.value })}
                className="w-full bg-[#EFE6DA] border border-[#D8CEC2] rounded px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="text-[#756A60] font-medium block mb-1">Headquarters Address</label>
              <input
                type="text"
                value={brandSettings.headquarters}
                onChange={(e) => setBrandSettings({ ...brandSettings, headquarters: e.target.value })}
                className="w-full bg-[#EFE6DA] border border-[#D8CEC2] rounded px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#D8CEC2] flex justify-end">
            <button
              onClick={handleSaveBrandSettings}
              className="px-5 py-2.5 bg-[#54483C] text-[#FAF7F2] rounded text-xs font-semibold hover:bg-[#3F3832] flex items-center gap-1.5 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Persist Brand Settings to Database</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB E: PROJECTS */}
      {activeTab === 'projects' && (
        <div className="mt-6 space-y-4 text-xs">
          <div className="bg-[#FAF7F2] rounded border border-[#D8CEC2] overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#EFE6DA] text-[#54483C] font-semibold border-b border-[#D8CEC2]">
                <tr>
                  <th className="p-3">Project Name</th>
                  <th className="p-3">Owner</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Land Area</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DDD3]">
                {allProjects.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-[#756A60]">
                      No projects currently stored in the database.
                    </td>
                  </tr>
                ) : (
                  allProjects.map((p) => (
                    <tr key={p.id} className="hover:bg-[#EFE6DA]/40">
                      <td className="p-3 font-semibold text-[#3F3832]">{p.name}</td>
                      <td className="p-3 text-[#756A60]">{p.ownerName || p.ownerEmail || 'Engineer'}</td>
                      <td className="p-3">{p.projectType}</td>
                      <td className="p-3 text-[#756A60]">{p.location}</td>
                      <td className="p-3">{p.landArea} m²</td>
                      <td className="p-3 capitalize">{p.status?.replace('_', ' ')}</td>
                      <td className="p-3 text-[#756A60]">{p.updatedAt?.split('T')[0] || p.updatedAt}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB F: INQUIRIES */}
      {activeTab === 'inquiries' && (
        <div className="mt-6 space-y-3 text-xs">
          {contactRequests.length === 0 ? (
            <div className="p-8 bg-[#FAF7F2] rounded border border-[#D8CEC2] text-center text-[#756A60]">
              No contact inquiries recorded in database yet.
            </div>
          ) : (
            contactRequests.map((inq) => (
              <div key={inq.id} className="bg-[#FAF7F2] p-5 rounded border border-[#D8CEC2]">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-sm text-[#3F3832]">{inq.subject}</h4>
                    <span className="text-[11px] text-[#756A60]">
                      From: {inq.name} ({inq.email}) · Category: {inq.category}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#756A60]">{inq.created_at?.split('T')[0] || inq.created_at}</span>
                </div>
                <p className="text-xs text-[#54483C] bg-[#EFE6DA] p-3 rounded border border-[#D8CEC2]">
                  "{inq.message}"
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB G: REVIEWS */}
      {activeTab === 'reviews' && (
        <div className="mt-6 space-y-3 text-xs">
          {clientReviews.length === 0 ? (
            <div className="p-8 bg-[#FAF7F2] rounded border border-[#D8CEC2] text-center text-[#756A60]">
              No client reviews submitted in database yet.
            </div>
          ) : (
            clientReviews.map((rev) => (
              <div key={rev.id} className="bg-[#FAF7F2] p-4 rounded border border-[#D8CEC2] flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-[#3F3832]">{rev.client_name}</span>
                    <span className="text-amber-700 font-bold">★ {rev.rating}/5</span>
                  </div>
                  <p className="text-xs text-[#54483C]">"{rev.review_text}"</p>
                  <span className="text-[10px] text-[#756A60] block mt-1">{rev.created_at?.split('T')[0] || rev.created_at}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB H: MARKETING CONSENTS */}
      {activeTab === 'marketing' && (
        <div className="mt-6 space-y-3 text-xs">
          <div className="bg-[#FAF7F2] rounded border border-[#D8CEC2] overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#EFE6DA] text-[#54483C] font-semibold border-b border-[#D8CEC2]">
                <tr>
                  <th className="p-3">Consenting User Email</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Consent Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DDD3]">
                {marketingConsents.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-[#756A60]">
                      No marketing consents recorded yet.
                    </td>
                  </tr>
                ) : (
                  marketingConsents.map((mc, idx) => (
                    <tr key={idx}>
                      <td className="p-3 font-medium text-[#3F3832]">{mc.email}</td>
                      <td className="p-3 text-emerald-800 font-semibold">Opted In</td>
                      <td className="p-3 text-[#756A60]">{mc.consented_at}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB I: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="mt-6 bg-[#FAF7F2] rounded border border-[#D8CEC2] overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-[#EFE6DA] text-[#54483C] font-semibold border-b border-[#D8CEC2]">
              <tr>
                <th className="p-3">Action</th>
                <th className="p-3">Details</th>
                <th className="p-3">IP Address</th>
                <th className="p-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DDD3]">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-[#756A60]">
                    No audit logs recorded yet.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#EFE6DA]/40">
                    <td className="p-3 font-semibold text-[#54483C]">{log.action}</td>
                    <td className="p-3 text-[#3F3832]">{log.details}</td>
                    <td className="p-3 font-mono text-[11px] text-[#756A60]">{log.ip_address || 'local'}</td>
                    <td className="p-3 text-[#756A60] text-[11px]">{log.created_at}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
