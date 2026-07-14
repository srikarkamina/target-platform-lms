"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardPageContainer from "@/components/layout/DashboardPageContainer";
import { toast, Toaster } from "react-hot-toast";
import { 
  Building2, Palette, Award, Globe, Loader2, Save, Upload, 
  ShieldAlert, Sparkles, HelpCircle, Mail
} from "lucide-react";

interface CertificateTemplate {
  id: string;
  name: string;
  title: string;
}

interface SettingsState {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone: string;
  email: string;
  website: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  defaultSignatureImage: string;
  defaultSealImage: string;
  defaultCertificateTemplateId: string;
  timezone: string;
  dateFormat: string;
  language: string;
  smtpHost: string;
  smtpPort: string | number;
  smtpUsername: string;
  smtpPassword: string;
  smtpEncryption: string;
  smtpSenderName: string;
  smtpSenderEmail: string;
  smtpReplyTo: string;
  emailNotificationsEnabled: boolean;
}

const defaultSettings: SettingsState = {
  name: "",
  address: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
  phone: "",
  email: "",
  website: "",
  description: "",
  logoUrl: "",
  bannerUrl: "",
  faviconUrl: "",
  primaryColor: "#0f172a",
  secondaryColor: "#3b82f6",
  defaultSignatureImage: "",
  defaultSealImage: "",
  defaultCertificateTemplateId: "",
  timezone: "UTC",
  dateFormat: "YYYY-MM-DD",
  language: "en",
  smtpHost: "",
  smtpPort: 587,
  smtpUsername: "",
  smtpPassword: "",
  smtpEncryption: "NONE",
  smtpSenderName: "",
  smtpSenderEmail: "",
  smtpReplyTo: "",
  emailNotificationsEnabled: false,
};

export default function SettingsPage() {
  const [role, setRole] = useState<string>("STUDENT");
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  
  // Preview state matching saved settings initially, but updates live before save
  const [preview, setPreview] = useState({
    name: "",
    logoUrl: "",
    bannerUrl: "",
    primaryColor: "#0f172a",
    secondaryColor: "#3b82f6",
  });

  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split(".")[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = parseJwt(token);
      if (payload && payload.role) {
        setRole(payload.role);
      }
    }
  }, []);

  const fetchSettingsAndTemplates = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const searchParams = new URLSearchParams(window.location.search);
      const urlInstituteId = searchParams.get("instituteId");
      const query = urlInstituteId ? `?instituteId=${urlInstituteId}` : "";
      
      // 1. Fetch settings
      const settingsRes = await fetch(`/api/institute/settings${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!settingsRes.ok) {
        throw new Error("Failed to fetch settings");
      }
      const settingsData = await settingsRes.json();
      
      const parsedSettings: SettingsState = {
        name: settingsData.name || "",
        address: settingsData.address || "",
        city: settingsData.city || "",
        state: settingsData.state || "",
        country: settingsData.country || "",
        postalCode: settingsData.postalCode || "",
        phone: settingsData.phone || "",
        email: settingsData.email || "",
        website: settingsData.website || "",
        description: settingsData.description || "",
        logoUrl: settingsData.logoUrl || "",
        bannerUrl: settingsData.bannerUrl || "",
        faviconUrl: settingsData.faviconUrl || "",
        primaryColor: settingsData.primaryColor || "#0f172a",
        secondaryColor: settingsData.secondaryColor || "#3b82f6",
        defaultSignatureImage: settingsData.defaultSignatureImage || "",
        defaultSealImage: settingsData.defaultSealImage || "",
        defaultCertificateTemplateId: settingsData.defaultCertificateTemplateId || "",
        timezone: settingsData.timezone || "UTC",
        dateFormat: settingsData.dateFormat || "YYYY-MM-DD",
        language: settingsData.language || "en",
        smtpHost: settingsData.smtpHost || "",
        smtpPort: settingsData.smtpPort !== null && settingsData.smtpPort !== undefined ? settingsData.smtpPort : 587,
        smtpUsername: settingsData.smtpUsername || "",
        smtpPassword: settingsData.smtpPassword || "",
        smtpEncryption: settingsData.smtpEncryption || "NONE",
        smtpSenderName: settingsData.smtpSenderName || "",
        smtpSenderEmail: settingsData.smtpSenderEmail || "",
        smtpReplyTo: settingsData.smtpReplyTo || "",
        emailNotificationsEnabled: settingsData.emailNotificationsEnabled || false,
      };

      setSettings(parsedSettings);
      setPreview({
        name: parsedSettings.name,
        logoUrl: parsedSettings.logoUrl,
        bannerUrl: parsedSettings.bannerUrl,
        primaryColor: parsedSettings.primaryColor,
        secondaryColor: parsedSettings.secondaryColor,
      });

      // 2. Fetch templates
      const templatesRes = await fetch(`/api/certificate-templates${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (templatesRes.ok) {
        const templatesData = await templatesRes.json();
        setTemplates(templatesData);
      }
    } catch (err: any) {
      toast.error(err.message || "Error loading setup data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (role !== "STUDENT") {
      fetchSettingsAndTemplates();
    } else {
      setIsLoading(false);
    }
  }, [role]);

  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const finalValue = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setSettings((prev) => ({ ...prev, [name]: finalValue }));
    
    // Live update preview for certain branding fields
    if (["name", "primaryColor", "secondaryColor"].includes(name)) {
      setPreview((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleTestSMTP = async () => {
    if (!testEmailAddress) {
      toast.error("Please enter a test email address.");
      return;
    }
    setIsTestingSmtp(true);
    const toastId = toast.loading("Testing SMTP connection...");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/institute/email/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          smtpSettings: {
            smtpHost: settings.smtpHost,
            smtpPort: settings.smtpPort,
            smtpUsername: settings.smtpUsername,
            smtpPassword: settings.smtpPassword,
            smtpEncryption: settings.smtpEncryption,
            smtpSenderName: settings.smtpSenderName,
            smtpSenderEmail: settings.smtpSenderEmail,
            smtpReplyTo: settings.smtpReplyTo,
            emailNotificationsEnabled: settings.emailNotificationsEnabled,
          },
          testEmailAddress,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || resData.error || "SMTP verification failed");
      }

      toast.success("SMTP Connection test successful! Test email has been dispatched.", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "SMTP connection test failed", { id: toastId });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "banner" | "favicon" | "signature" | "seal") => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Size check: 30MB limit for all branding assets
    const maxSize = 30 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Maximum file size is 30 MB.");
      return;
    }

    const toastId = toast.loading(`Uploading ${type}...`);
    try {
      const token = localStorage.getItem("token");
      const searchParams = new URLSearchParams(window.location.search);
      const urlInstituteId = searchParams.get("instituteId");
      const uploadQuery = urlInstituteId ? `?instituteId=${urlInstituteId}` : "";

      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const res = await fetch(`/api/upload/branding${uploadQuery}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || `Upload failed`);
      }

      setSettings((prev) => ({ ...prev, [type === "logo" ? "logoUrl" : type === "banner" ? "bannerUrl" : type === "favicon" ? "faviconUrl" : type === "signature" ? "defaultSignatureImage" : "defaultSealImage"]: resData.url }));
      
      // Update live preview immediately
      if (type === "logo" || type === "banner") {
        setPreview((prev) => ({ ...prev, [type === "logo" ? "logoUrl" : "bannerUrl"]: resData.url }));
      }

      toast.success(`${type} uploaded!`, { id: toastId });
    } catch (err: any) {
      toast.error(err.message || `Failed to upload ${type}`, { id: toastId });
    }
  };

  const handleRemoveAsset = (type: "logo" | "banner" | "favicon" | "signature" | "seal") => {
    const fieldMap = {
      logo: "logoUrl",
      banner: "bannerUrl",
      favicon: "faviconUrl",
      signature: "defaultSignatureImage",
      seal: "defaultSealImage",
    };
    const fieldName = fieldMap[type];
    setSettings((prev) => ({ ...prev, [fieldName]: "" }));
    if (type === "logo" || type === "banner") {
      setPreview((prev) => ({ ...prev, [type === "logo" ? "logoUrl" : "bannerUrl"]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === "FACULTY") {
      toast.error("Faculty member cannot save adjustments.");
      return;
    }
    
    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      const searchParams = new URLSearchParams(window.location.search);
      const urlInstituteId = searchParams.get("instituteId");
      const query = urlInstituteId ? `?instituteId=${urlInstituteId}` : "";

      const bodyPayload = {
        ...settings,
        ...(urlInstituteId ? { instituteId: urlInstituteId } : {})
      };

      const res = await fetch(`/api/institute/settings${query}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyPayload),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || "Failed to update settings");
      }

      // Refresh settings & preview status from response
      setSettings({
        name: resData.name || "",
        address: resData.address || "",
        city: resData.city || "",
        state: resData.state || "",
        country: resData.country || "",
        postalCode: resData.postalCode || "",
        phone: resData.phone || "",
        email: resData.email || "",
        website: resData.website || "",
        description: resData.description || "",
        logoUrl: resData.logoUrl || "",
        bannerUrl: resData.bannerUrl || "",
        faviconUrl: resData.faviconUrl || "",
        primaryColor: resData.primaryColor || "#0f172a",
        secondaryColor: resData.secondaryColor || "#3b82f6",
        defaultSignatureImage: resData.defaultSignatureImage || "",
        defaultSealImage: resData.defaultSealImage || "",
        defaultCertificateTemplateId: resData.defaultCertificateTemplateId || "",
        timezone: resData.timezone || "UTC",
        dateFormat: resData.dateFormat || "YYYY-MM-DD",
        language: resData.language || "en",
        smtpHost: resData.smtpHost || "",
        smtpPort: resData.smtpPort !== null && resData.smtpPort !== undefined ? resData.smtpPort : 587,
        smtpUsername: resData.smtpUsername || "",
        smtpPassword: resData.smtpPassword || "",
        smtpEncryption: resData.smtpEncryption || "NONE",
        smtpSenderName: resData.smtpSenderName || "",
        smtpSenderEmail: resData.smtpSenderEmail || "",
        smtpReplyTo: resData.smtpReplyTo || "",
        emailNotificationsEnabled: resData.emailNotificationsEnabled || false,
      });

      setPreview({
        name: resData.name || "",
        logoUrl: resData.logoUrl || "",
        bannerUrl: resData.bannerUrl || "",
        primaryColor: resData.primaryColor || "#0f172a",
        secondaryColor: resData.secondaryColor || "#3b82f6",
      });

      toast.success("Institute settings saved successfully!");
    } catch (err: any) {
      toast.error(err.message || "An error occurred while saving");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <DashboardPageContainer>
          <div className="flex h-96 items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 text-indigo-650 animate-spin" />
              <p className="text-sm font-semibold text-slate-500">Loading institute parameters...</p>
            </div>
          </div>
        </DashboardPageContainer>
      </DashboardLayout>
    );
  }

  // Tenant/Access Check
  if (role === "STUDENT" || role === "FACULTY") {
    return (
      <DashboardLayout>
        <DashboardPageContainer>
          <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 text-center max-w-xl mx-auto my-12">
            <ShieldAlert className="h-12 w-12 text-rose-500 shrink-0" />
            <div>
              <h2 className="text-xl font-black text-rose-900">Access Denied</h2>
              <p className="text-sm mt-1 leading-relaxed font-medium">
                Students and Faculty do not have permission to view or manage institute settings. Please contact your administrator.
              </p>
            </div>
          </div>
        </DashboardPageContainer>
      </DashboardLayout>
    );
  }

  const isReadOnly = role === "FACULTY";

  return (
    <DashboardLayout>
      <DashboardPageContainer>
        <Toaster position="top-right" />
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Institute Settings</h1>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
              Manage your institute profile, custom branding elements, localized formats, and default certificate visuals.
            </p>
          </div>
          {isReadOnly && (
            <div className="px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-xs font-bold flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              <span>Read-Only Access (Faculty)</span>
            </div>
          )}
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
          {/* Column 1 & 2: Edit Form */}
          <div className="xl:col-span-2 space-y-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Section 1: Profile */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                  <Building2 className="h-5 w-5 text-indigo-650" />
                  <div>
                    <h3 className="font-extrabold text-slate-905">Institute Profile</h3>
                    <p className="text-xs text-slate-400">Basic identification details for documents and portals</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Institute Name</label>
                    <input
                      type="text"
                      name="name"
                      value={settings.name}
                      onChange={handleInputChange}
                      disabled={isReadOnly}
                      className="w-full bg-slate-50/50 disabled:bg-slate-100/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Email</label>
                    <input
                      type="email"
                      name="email"
                      value={settings.email}
                      onChange={handleInputChange}
                      disabled={isReadOnly}
                      className="w-full bg-slate-50/50 disabled:bg-slate-100/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                    <input
                      type="text"
                      name="phone"
                      value={settings.phone}
                      onChange={handleInputChange}
                      disabled={isReadOnly}
                      className="w-full bg-slate-50/50 disabled:bg-slate-100/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Website URL</label>
                    <input
                      type="text"
                      name="website"
                      value={settings.website}
                      onChange={handleInputChange}
                      disabled={isReadOnly}
                      placeholder="https://example.com"
                      className="w-full bg-slate-50/50 disabled:bg-slate-100/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Street Address</label>
                    <input
                      type="text"
                      name="address"
                      value={settings.address}
                      onChange={handleInputChange}
                      disabled={isReadOnly}
                      className="w-full bg-slate-50/50 disabled:bg-slate-100/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">City</label>
                    <input
                      type="text"
                      name="city"
                      value={settings.city}
                      onChange={handleInputChange}
                      disabled={isReadOnly}
                      className="w-full bg-slate-50/50 disabled:bg-slate-100/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">State / Province</label>
                    <input
                      type="text"
                      name="state"
                      value={settings.state}
                      onChange={handleInputChange}
                      disabled={isReadOnly}
                      className="w-full bg-slate-50/50 disabled:bg-slate-100/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={settings.country}
                      onChange={handleInputChange}
                      disabled={isReadOnly}
                      className="w-full bg-slate-50/50 disabled:bg-slate-100/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Postal / ZIP Code</label>
                    <input
                      type="text"
                      name="postalCode"
                      value={settings.postalCode}
                      onChange={handleInputChange}
                      disabled={isReadOnly}
                      className="w-full bg-slate-50/50 disabled:bg-slate-100/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
                    <textarea
                      name="description"
                      value={settings.description}
                      onChange={handleInputChange}
                      disabled={isReadOnly}
                      rows={3}
                      className="w-full bg-slate-50/50 disabled:bg-slate-100/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Branding */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                  <Palette className="h-5 w-5 text-indigo-650" />
                  <div>
                    <h3 className="font-extrabold text-slate-905">Branding Styles</h3>
                    <p className="text-xs text-slate-400">Match the portal looks to your corporate theme identity</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Colors */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Primary Color</label>
                      <div className="flex gap-2.5 items-center">
                        <input
                          type="color"
                          name="primaryColor"
                          value={settings.primaryColor}
                          onChange={handleInputChange}
                          disabled={isReadOnly}
                          className="h-10 w-16 border border-slate-200 rounded-lg p-0.5 cursor-pointer bg-white"
                        />
                        <input
                          type="text"
                          name="primaryColor"
                          value={settings.primaryColor}
                          onChange={handleInputChange}
                          disabled={isReadOnly}
                          className="flex-1 bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-mono font-semibold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Secondary Color</label>
                      <div className="flex gap-2.5 items-center">
                        <input
                          type="color"
                          name="secondaryColor"
                          value={settings.secondaryColor}
                          onChange={handleInputChange}
                          disabled={isReadOnly}
                          className="h-10 w-16 border border-slate-200 rounded-lg p-0.5 cursor-pointer bg-white"
                        />
                        <input
                          type="text"
                          name="secondaryColor"
                          value={settings.secondaryColor}
                          onChange={handleInputChange}
                          disabled={isReadOnly}
                          className="flex-1 bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-mono font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Asset uploads */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Logo upload */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Logo</span>
                      {settings.logoUrl ? (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col items-center gap-2">
                          <img src={settings.logoUrl} alt="Logo" className="h-16 w-full object-contain rounded-lg bg-white p-1 border" />
                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() => handleRemoveAsset("logo")}
                              className="text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg w-full text-center"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ) : (
                        <label className="border border-dashed border-slate-300 rounded-2xl p-4 flex flex-col items-center gap-1 cursor-pointer hover:bg-slate-50/50 text-center">
                          <Upload className="h-4 w-4 text-slate-400" />
                          <span className="text-xs font-bold text-indigo-650">Upload Logo</span>
                          <span className="text-[9px] text-slate-400">PNG, JPG (Max 30MB)</span>
                          <input type="file" accept=".png,.jpg,.jpeg" onChange={(e) => handleFileUpload(e, "logo")} disabled={isReadOnly} className="hidden" />
                        </label>
                      )}
                    </div>

                    {/* Banner upload */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Banner Image</span>
                      {settings.bannerUrl ? (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col items-center gap-2">
                          <img src={settings.bannerUrl} alt="Banner" className="h-16 w-full object-cover rounded-lg bg-white border" />
                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() => handleRemoveAsset("banner")}
                              className="text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg w-full text-center"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ) : (
                        <label className="border border-dashed border-slate-300 rounded-2xl p-4 flex flex-col items-center gap-1 cursor-pointer hover:bg-slate-50/50 text-center">
                          <Upload className="h-4 w-4 text-slate-400" />
                          <span className="text-xs font-bold text-indigo-650">Upload Banner</span>
                          <span className="text-[9px] text-slate-400">PNG, JPG (Max 30MB)</span>
                          <input type="file" accept=".png,.jpg,.jpeg" onChange={(e) => handleFileUpload(e, "banner")} disabled={isReadOnly} className="hidden" />
                        </label>
                      )}
                    </div>

                    {/* Favicon upload */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Favicon</span>
                      {settings.faviconUrl ? (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col items-center gap-2">
                          <img src={settings.faviconUrl} alt="Favicon" className="h-12 w-12 object-contain rounded-lg bg-white border p-1" />
                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() => handleRemoveAsset("favicon")}
                              className="text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg w-full text-center"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ) : (
                        <label className="border border-dashed border-slate-300 rounded-2xl p-4 flex flex-col items-center gap-1 cursor-pointer hover:bg-slate-50/50 text-center">
                          <Upload className="h-4 w-4 text-slate-400" />
                          <span className="text-xs font-bold text-indigo-650">Upload Favicon</span>
                          <span className="text-[9px] text-slate-400">ICO, PNG, GIF (Max 30MB)</span>
                          <input type="file" accept=".png,.jpg,.jpeg,.ico,.gif" onChange={(e) => handleFileUpload(e, "favicon")} disabled={isReadOnly} className="hidden" />
                        </label>
                      )}
                    </div>

                  </div>
                </div>
              </div>

              {/* Section 3: Certificate Branding */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                  <Award className="h-5 w-5 text-indigo-650" />
                  <div>
                    <h3 className="font-extrabold text-slate-905">Certificate Defaults</h3>
                    <p className="text-xs text-slate-400">Branding signatures, seals, and layout templates for credentials</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Default Template Layout</label>
                    <select
                      name="defaultCertificateTemplateId"
                      value={settings.defaultCertificateTemplateId}
                      onChange={handleInputChange}
                      disabled={isReadOnly}
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-1"
                    >
                      <option value="">No default layout selected</option>
                      {templates.map((tpl) => (
                        <option key={tpl.id} value={tpl.id}>
                          {tpl.name} ({tpl.title})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Default Signature */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Default Signature Image</span>
                      {settings.defaultSignatureImage ? (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col items-center gap-2">
                          <img src={settings.defaultSignatureImage} alt="Signature" className="h-16 object-contain rounded-lg bg-white border p-1" />
                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() => handleRemoveAsset("signature")}
                              className="text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg w-full text-center"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ) : (
                        <label className="border border-dashed border-slate-300 rounded-2xl p-4 flex flex-col items-center gap-1 cursor-pointer hover:bg-slate-50/50 text-center">
                          <Upload className="h-4 w-4 text-slate-400" />
                          <span className="text-xs font-bold text-indigo-650">Upload Signature</span>
                          <span className="text-[9px] text-slate-400">PNG, JPG (Max 30MB)</span>
                          <input type="file" accept=".png,.jpg,.jpeg" onChange={(e) => handleFileUpload(e, "signature")} disabled={isReadOnly} className="hidden" />
                        </label>
                      )}
                    </div>

                    {/* Default Seal */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Default Seal Image</span>
                      {settings.defaultSealImage ? (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col items-center gap-2">
                          <img src={settings.defaultSealImage} alt="Seal" className="h-16 object-contain rounded-lg bg-white border p-1" />
                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() => handleRemoveAsset("seal")}
                              className="text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg w-full text-center"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ) : (
                        <label className="border border-dashed border-slate-300 rounded-2xl p-4 flex flex-col items-center gap-1 cursor-pointer hover:bg-slate-50/50 text-center">
                          <Upload className="h-4 w-4 text-slate-400" />
                          <span className="text-xs font-bold text-indigo-650">Upload Seal</span>
                          <span className="text-[9px] text-slate-400">PNG, JPG (Max 30MB)</span>
                          <input type="file" accept=".png,.jpg,.jpeg" onChange={(e) => handleFileUpload(e, "seal")} disabled={isReadOnly} className="hidden" />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Localization */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                  <Globe className="h-5 w-5 text-indigo-650" />
                  <div>
                    <h3 className="font-extrabold text-slate-905">Localization Parameters</h3>
                    <p className="text-xs text-slate-400">Standard configurations for display formats and times</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Timezone</label>
                    <select
                      name="timezone"
                      value={settings.timezone}
                      onChange={handleInputChange}
                      disabled={isReadOnly}
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-1"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">EST / EDT (New York)</option>
                      <option value="Europe/London">GMT / BST (London)</option>
                      <option value="Asia/Kolkata">IST (India)</option>
                      <option value="Asia/Tokyo">JST (Tokyo)</option>
                      <option value="Asia/Singapore">SGT (Singapore)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Date Format</label>
                    <select
                      name="dateFormat"
                      value={settings.dateFormat}
                      onChange={handleInputChange}
                      disabled={isReadOnly}
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-1"
                    >
                      <option value="YYYY-MM-DD">YYYY-MM-DD (2026-07-08)</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY (08/07/2026)</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY (07/08/2026)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Language</label>
                    <select
                      name="language"
                      value={settings.language}
                      onChange={handleInputChange}
                      disabled={isReadOnly}
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-1"
                    >
                      <option value="en">English (en)</option>
                      <option value="es">Español (es)</option>
                      <option value="fr">Français (fr)</option>
                      <option value="de">Deutsch (de)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 5: Email Settings */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                  <Mail className="h-5 w-5 text-indigo-650" />
                  <div>
                    <h3 className="font-extrabold text-slate-905">Email Settings & SMTP</h3>
                    <p className="text-xs text-slate-400">Configure outbound SMTP servers and automated notification parameters</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Enable Switch */}
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200/60 rounded-2xl p-4">
                    <div className="space-y-0.5">
                      <label className="text-sm font-bold text-slate-800">Enable Automated Email Notifications</label>
                      <p className="text-xs text-slate-400 leading-normal">
                        When enabled, LMS notifications (enrollments, assignments, quizzes, certificates) are dispatched to users via SMTP.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      name="emailNotificationsEnabled"
                      checked={settings.emailNotificationsEnabled}
                      onChange={handleInputChange}
                      disabled={isReadOnly}
                      className="h-5 w-5 rounded-md text-indigo-650 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>

                  {settings.emailNotificationsEnabled && (
                    <div className="space-y-6 animate-fadeIn">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">SMTP Host</label>
                          <input
                            type="text"
                            name="smtpHost"
                            placeholder="smtp.gmail.com"
                            value={settings.smtpHost}
                            onChange={handleInputChange}
                            disabled={isReadOnly}
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-1"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">SMTP Port</label>
                          <input
                            type="number"
                            name="smtpPort"
                            placeholder="587"
                            value={settings.smtpPort}
                            onChange={handleInputChange}
                            disabled={isReadOnly}
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-hidden"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">SMTP Username</label>
                          <input
                            type="text"
                            name="smtpUsername"
                            placeholder="user@example.com"
                            value={settings.smtpUsername}
                            onChange={handleInputChange}
                            disabled={isReadOnly}
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">SMTP Password</label>
                          <input
                            type="password"
                            name="smtpPassword"
                            placeholder={settings.smtpPassword ? "••••••••" : "Enter SMTP Password"}
                            value={settings.smtpPassword}
                            onChange={handleInputChange}
                            disabled={isReadOnly}
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Encryption Method</label>
                          <select
                            name="smtpEncryption"
                            value={settings.smtpEncryption}
                            onChange={handleInputChange}
                            disabled={isReadOnly}
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500"
                          >
                            <option value="NONE">None</option>
                            <option value="SSL">SSL (Secure Sockets Layer)</option>
                            <option value="TLS">TLS (Transport Layer Security)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sender Display Name</label>
                          <input
                            type="text"
                            name="smtpSenderName"
                            placeholder="My Institute Notifications"
                            value={settings.smtpSenderName}
                            onChange={handleInputChange}
                            disabled={isReadOnly}
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sender Outbound Email</label>
                          <input
                            type="email"
                            name="smtpSenderEmail"
                            placeholder="notifications@myinstitute.com"
                            value={settings.smtpSenderEmail}
                            onChange={handleInputChange}
                            disabled={isReadOnly}
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-hidden"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reply-To Email Address</label>
                          <input
                            type="email"
                            name="smtpReplyTo"
                            placeholder="support@myinstitute.com"
                            value={settings.smtpReplyTo}
                            onChange={handleInputChange}
                            disabled={isReadOnly}
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-hidden"
                          />
                        </div>
                      </div>

                      {/* SMTP Verification Test */}
                      {!isReadOnly && (
                        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-3">
                          <label className="text-xs font-black text-slate-800 block">SMTP Configuration Verification Test</label>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <input
                              type="email"
                              placeholder="Enter test recipient email address"
                              value={testEmailAddress}
                              onChange={(e) => setTestEmailAddress(e.target.value)}
                              className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500"
                            />
                            <button
                              type="button"
                              onClick={handleTestSMTP}
                              disabled={isTestingSmtp}
                              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                            >
                              {isTestingSmtp ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  Testing...
                                </>
                              ) : (
                                "Test SMTP Connection"
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              {!isReadOnly && (
                <div className="flex justify-end gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl text-sm font-bold flex items-center gap-2 shadow-md cursor-pointer transition-all duration-200"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4.5 w-4.5 animate-spin" />
                        Saving configurations...
                      </>
                    ) : (
                      <>
                        <Save className="h-4.5 w-4.5" />
                        Save Settings
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Column 3: Live Preview Panel */}
          <div className="xl:col-span-1 space-y-6 xl:sticky xl:top-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Sparkles className="h-5 w-5 text-indigo-650 animate-pulse" />
                <h3 className="font-extrabold text-slate-905">Branding Live Preview</h3>
              </div>

              {/* Real mock layout demonstrating the theme colors and logo */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                {/* Banner preview */}
                <div className="h-32 bg-slate-100 relative">
                  {preview.bannerUrl ? (
                    <img src={preview.bannerUrl} alt="Banner Preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-linear-to-r from-slate-200 to-slate-350 flex items-center justify-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                      Banner Frame
                    </div>
                  )}

                  {/* Logo overlay badge */}
                  <div className="absolute -bottom-6 left-6 h-16 w-16 bg-white border border-slate-200 rounded-2xl shadow-md overflow-hidden flex items-center justify-center p-1.5">
                    {preview.logoUrl ? (
                      <img src={preview.logoUrl} alt="Logo Preview" className="h-full w-full object-contain" />
                    ) : (
                      <Building2 className="h-6 w-6 text-slate-300" />
                    )}
                  </div>
                </div>

                {/* Institute profile header preview */}
                <div className="pt-8 px-6 pb-6 bg-white space-y-4">
                  <div>
                    <h4 className="text-base font-black text-slate-900 truncate">
                      {preview.name || "My Central Institute"}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-bold tracking-wider mt-0.5 uppercase">Learning Management Hub</p>
                  </div>

                  {/* Mock dashboard element styled with primary & secondary colors */}
                  <div className="border border-slate-100 rounded-xl p-4 bg-slate-50 space-y-3">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Accent Color Visualizer</p>
                    
                    {/* Primary color demo block */}
                    <div className="flex items-center gap-3">
                      <div 
                        className="h-10 flex-1 rounded-xl flex items-center justify-center text-xs font-black text-white px-3 text-center shadow-xs"
                        style={{ backgroundColor: preview.primaryColor }}
                      >
                        Primary Color Element
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 font-bold">{preview.primaryColor}</div>
                    </div>

                    {/* Secondary color demo block */}
                    <div className="flex items-center gap-3">
                      <button 
                        type="button"
                        className="h-10 flex-1 rounded-xl flex items-center justify-center text-xs font-black text-white px-3 text-center shadow-xs cursor-default"
                        style={{ backgroundColor: preview.secondaryColor }}
                      >
                        Secondary Action Button
                      </button>
                      <div className="text-[10px] font-mono text-slate-500 font-bold">{preview.secondaryColor}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 flex gap-2.5 items-start">
                <HelpCircle className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                  Color pickers and images uploaded will automatically reflect in the live simulator preview. Save changes to commit updates.
                </p>
              </div>
            </div>
          </div>
        </div>

      </DashboardPageContainer>
    </DashboardLayout>
  );
}
