"use client";

import React, { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardPageContainer from "@/components/layout/DashboardPageContainer";
import LoadingState from "@/components/common/LoadingState";
import EmptyState from "@/components/common/EmptyState";
import { 
  Calendar, Search, Filter, Plus, Edit2, Trash2, Clock, MapPin, 
  Video, Users, ExternalLink, Loader2, User
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/axios";

interface Event {
  id: string;
  title: string;
  description: string;
  venue: string | null;
  onlineMeetingLink: string | null;
  speaker: string | null;
  banner: string | null;
  startDate: string;
  endDate: string;
  registrationRequired: boolean;
  capacity: number | null;
  registrationsCount: number;
  isRegistered: boolean;
  createdBy: string;
  creatorName: string;
  createdAt: string;
  registrations?: Array<{ student: { name: string; email: string } }>;
}

export default function EventsPage() {
  const [role, setRole] = useState<string>("STUDENT");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [upcoming, setUpcoming] = useState<boolean | string>("true");
  const [page, setPage] = useState(1);

  // Modal forms
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState("");

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("");
  const [onlineMeetingLink, setOnlineMeetingLink] = useState("");
  const [speaker, setSpeaker] = useState("");
  const [banner, setBanner] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [registrationRequired, setRegistrationRequired] = useState(false);
  const [capacity, setCapacity] = useState("");
  const [submittingForm, setSubmittingForm] = useState(false);

  // Detail drawer / registration list
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [registeringMap, setRegisteringMap] = useState<Record<string, boolean>>({});

  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split(".")[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        window.atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  };

  const fetchUserRole = useCallback(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = parseJwt(token);
      if (payload) {
        setRole(payload.role || "STUDENT");
      }
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams: Record<string, any> = {
        page,
        limit: 10,
        search: activeSearch || undefined,
        upcoming: upcoming === "true" ? true : upcoming === "false" ? false : undefined
      };

      const res = await api.get("/events", { params: queryParams });
      setEvents(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [page, upcoming, activeSearch]);

  useEffect(() => {
    fetchUserRole();
  }, [fetchUserRole]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setActiveSearch(search);
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setTitle("");
    setDescription("");
    setVenue("");
    setOnlineMeetingLink("");
    setSpeaker("");
    setBanner("");
    setStartDate("");
    setEndDate("");
    setRegistrationRequired(false);
    setCapacity("");
    setShowModal(true);
  };

  const openEditModal = (e: Event) => {
    setIsEditing(true);
    setCurrentId(e.id);
    setTitle(e.title);
    setDescription(e.description);
    setVenue(e.venue || "");
    setOnlineMeetingLink(e.onlineMeetingLink || "");
    setSpeaker(e.speaker || "");
    setBanner(e.banner || "");
    
    // Format to local timezone input format
    const formatLocal = (isoStr: string) => {
      const d = new Date(isoStr);
      const pad = (n: number) => n.toString().padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    setStartDate(e.startDate ? formatLocal(e.startDate) : "");
    setEndDate(e.endDate ? formatLocal(e.endDate) : "");
    setRegistrationRequired(e.registrationRequired);
    setCapacity(e.capacity ? e.capacity.toString() : "");
    setShowModal(true);
  };

  const handleFormSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();

    if (!title.trim() || !description.trim() || !startDate || !endDate) {
      toast.error("Required fields cannot be empty");
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      toast.error("Start date must be before end date");
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      venue: venue.trim() || null,
      onlineMeetingLink: onlineMeetingLink.trim() || null,
      speaker: speaker.trim() || null,
      banner: banner.trim() || null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      registrationRequired,
      capacity: capacity ? parseInt(capacity) : null
    };

    try {
      setSubmittingForm(true);
      if (isEditing) {
        await api.patch(`/events/${currentId}`, payload);
        toast.success("Event updated successfully");
      } else {
        await api.post("/events", payload);
        toast.success("Event created successfully");
      }
      setShowModal(false);
      fetchEvents();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save event");
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await api.delete(`/events/${id}`);
      toast.success("Event deleted");
      fetchEvents();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to delete event");
    }
  };

  const handleRegister = async (event: Event) => {
    try {
      setRegisteringMap(prev => ({ ...prev, [event.id]: true }));
      if (event.isRegistered) {
        await api.delete(`/events/${event.id}/register`);
        toast.success("Cancelled registration");
      } else {
        await api.post(`/events/${event.id}/register`);
        toast.success("Registered for event successfully!");
      }
      fetchEvents();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setRegisteringMap(prev => ({ ...prev, [event.id]: false }));
    }
  };

  const viewEventRegistrations = async (e: Event) => {
    try {
      setLoadingDetails(true);
      setActiveEvent(e);
      const res = await api.get(`/events/${e.id}`);
      setActiveEvent(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch registrations");
    } finally {
      setLoadingDetails(false);
    }
  };

  const isStaff = ["FACULTY", "ADMIN", "SUPER_ADMIN"].includes(role);

  return (
    <DashboardLayout>
      <DashboardPageContainer>
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 dark:bg-slate-950 p-6 rounded-3xl border border-slate-850 shadow-sm text-left">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-650 text-white">
              <Calendar className="h-6 w-6 text-white" />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white">
                Event & Workshop Management
              </h1>
              <p className="text-xs text-slate-200 mt-1">
                Explore hackathons, webinars, live workshops, and campus meetups.
              </p>
            </div>
          </div>

          {isStaff && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold px-4 py-2.5 text-xs transition-colors shadow-sm shadow-indigo-100 dark:shadow-none border-none cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create Event</span>
            </button>
          )}
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center gap-4">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-550" />
            <input
              type="text"
              placeholder="Search events by title or speaker..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-855 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            <button type="submit" className="hidden" />
          </form>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-650 dark:text-slate-350 font-sans">
              <Filter className="h-3.5 w-3.5" />
              <span>Timing</span>
            </div>

            <select
              value={upcoming.toString()}
              onChange={(e) => { setUpcoming(e.target.value); setPage(1); }}
              className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-655 dark:text-slate-300 focus:outline-hidden"
            >
              <option value="true">Upcoming Events</option>
              <option value="false">Past Events</option>
              <option value="all">All Events</option>
            </select>
          </div>
        </div>

        {/* Content list */}
        {loading ? (
          <LoadingState message="Fetching events list..." />
        ) : events.length === 0 ? (
          <EmptyState title="No Events Found" description="There are no events registered matching your query." />
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {events.map((e) => {
              const isPast = new Date(e.endDate) < new Date();
              const atCapacity = e.capacity !== null && e.registrationsCount >= e.capacity;
              
              return (
                <div 
                  key={e.id}
                  className={`bg-white dark:bg-slate-900 border rounded-3xl p-6 shadow-xs flex flex-col md:flex-row gap-6 text-left hover:shadow-md transition-shadow ${
                    isPast ? "border-slate-200 dark:border-slate-850 opacity-80" : "border-slate-200 dark:border-slate-800"
                  }`}
                >
                  {/* Calendar Badge */}
                  <div className="flex flex-col items-center justify-center h-24 w-24 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 rounded-2xl shrink-0 self-center md:self-start">
                    <span className="text-[10px] font-extrabold uppercase text-indigo-650 dark:text-indigo-400 tracking-widest">
                      {new Date(e.startDate).toLocaleString("en-US", { month: "short" })}
                    </span>
                    <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">
                      {new Date(e.startDate).getDate()}
                    </span>
                  </div>

                  <div className="flex-1 space-y-3 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {isPast ? (
                        <span className="text-[9px] font-extrabold uppercase bg-slate-100 text-slate-500 px-2 py-0.5 rounded">Completed</span>
                      ) : (
                        <span className="text-[9px] font-extrabold uppercase bg-emerald-500 text-white px-2 py-0.5 rounded">Upcoming</span>
                      )}

                      {e.speaker && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 px-2 py-0.5 rounded border border-indigo-150">
                          <User className="h-3 w-3" />
                          <span>Speaker: {e.speaker}</span>
                        </span>
                      )}

                      {e.registrationRequired && (
                        <span className="text-[9px] font-extrabold uppercase bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full">
                          Registration Required
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-extrabold text-slate-850 dark:text-slate-150 leading-snug">
                      {e.title}
                    </h3>

                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-350 leading-relaxed max-w-3xl">
                      {e.description}
                    </p>

                    {/* Metadata boxes */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 pt-2 text-xs font-bold text-slate-500 dark:text-slate-450">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                        <span>{new Date(e.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(e.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </span>

                      {e.venue && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                          <span>Venue: {e.venue}</span>
                        </span>
                      )}

                      {e.onlineMeetingLink && (
                        <a 
                          href={e.onlineMeetingLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-indigo-650 hover:underline cursor-pointer"
                        >
                          <Video className="h-4 w-4 shrink-0" />
                          <span>Join Online Webinar</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}

                      {e.registrationRequired && (
                        <span className="flex items-center gap-1.5 text-indigo-650">
                          <Users className="h-4 w-4 shrink-0" />
                          <span>Registered: {e.registrationsCount} {e.capacity ? `/ ${e.capacity}` : ""}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 self-stretch border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-850 pt-4 md:pt-0 md:pl-6 shrink-0">
                    {!isStaff && e.registrationRequired && !isPast && (
                      <button
                        onClick={() => handleRegister(e)}
                        disabled={registeringMap[e.id] || (!e.isRegistered && atCapacity)}
                        className={`px-5 py-2.5 font-extrabold rounded-xl text-xs transition-all border-none cursor-pointer ${
                          e.isRegistered 
                            ? "bg-rose-50 hover:bg-rose-100 text-rose-600 shadow-2xs border border-rose-250" 
                            : "bg-indigo-650 hover:bg-indigo-700 text-white disabled:opacity-50"
                        }`}
                      >
                        {registeringMap[e.id] ? "Loading..." : e.isRegistered ? "Cancel Registration" : atCapacity ? "Fully Booked" : "Register Now"}
                      </button>
                    )}

                    {isStaff && (
                      <div className="flex items-center gap-2">
                        {e.registrationRequired && (
                          <button
                            onClick={() => viewEventRegistrations(e)}
                            className="p-2 border border-slate-200 dark:border-slate-850 text-slate-400 hover:text-indigo-650 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
                            title="View Registrants"
                          >
                            <Users className="h-4.5 w-4.5" />
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(e)}
                          className="p-2 border border-slate-200 dark:border-slate-855 text-slate-405 hover:text-indigo-650 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
                          title="Edit Event"
                        >
                          <Edit2 className="h-4.5 w-4.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(e.id)}
                          className="p-2 border border-slate-200 dark:border-slate-855 text-slate-405 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                          title="Delete Event"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal form */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs font-sans overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto flex flex-col my-8">
              <div className="p-6 border-b border-slate-100 dark:border-slate-805 flex items-center justify-between shrink-0">
                <h3 className="text-lg font-bold text-slate-850 dark:text-slate-150 tracking-tight flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-indigo-650" />
                  <span>{isEditing ? "Edit Event" : "Create Event"}</span>
                </h3>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-slate-650 hover:bg-slate-50 cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="p-6 space-y-6 text-left overflow-y-auto flex-1">
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-550 uppercase tracking-wide">Event Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter event title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-855 dark:text-slate-205 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-550 uppercase tracking-wide">Description *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide details about the schedule, topic, speaker..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-855 dark:text-slate-205 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-y"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Start Date */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-550 uppercase tracking-wide">Start Date & Time *</label>
                    <input
                      type="datetime-local"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-205 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* End Date */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-550 uppercase tracking-wide">End Date & Time *</label>
                    <input
                      type="datetime-local"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-205 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Venue */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-550 uppercase tracking-wide">Physical Venue (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Auditorium 2 / Main Campus Room 402..."
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-855 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-205 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Online Meeting Link */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-550 uppercase tracking-wide">Online Webinar URL (Optional)</label>
                    <input
                      type="url"
                      placeholder="e.g. Zoom or Google Meet URL..."
                      value={onlineMeetingLink}
                      onChange={(e) => setOnlineMeetingLink(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-855 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-205 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Speaker */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-550 uppercase tracking-wide">Guest Speaker Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Jane Smith..."
                      value={speaker}
                      onChange={(e) => setSpeaker(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-855 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-205 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Banner image URL */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-550 uppercase tracking-wide">Banner Image Link (Optional)</label>
                    <input
                      type="url"
                      placeholder="e.g. Hosted banner image link..."
                      value={banner}
                      onChange={(e) => setBanner(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-855 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-205 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Registration Required */}
                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-650 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={registrationRequired}
                        onChange={(e) => setRegistrationRequired(e.target.checked)}
                        className="h-4 w-4 rounded-sm text-indigo-650 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span>Strict Student Registration Required</span>
                    </label>
                  </div>

                  {/* Capacity */}
                  {registrationRequired && (
                    <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                      <label className="text-xs font-bold text-slate-550 uppercase tracking-wide">Maximum Seating Capacity (Optional)</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 100 students limit..."
                        value={capacity}
                        onChange={(e) => setCapacity(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-855 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-205 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}
                </div>

                {/* Form submit actions */}
                <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-808 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-750 font-bold border border-slate-200 dark:border-slate-800 rounded-xl text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingForm}
                    className="px-5 py-2 bg-indigo-650 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs border-none"
                  >
                    {submittingForm ? "Saving..." : "Save Event"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Registrations List Drawer/Modal */}
        {activeEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs font-sans">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in-50 zoom-in-95 duration-200 max-h-[80vh]">
              <div className="p-6 border-b border-slate-100 dark:border-slate-805 flex items-center justify-between shrink-0">
                <h3 className="text-lg font-bold text-slate-850 dark:text-slate-150 tracking-tight flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-650" />
                  <span>Registrants for: "{activeEvent.title}"</span>
                </h3>
                <button 
                  onClick={() => setActiveEvent(null)}
                  className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-slate-650 hover:bg-slate-50 cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                {loadingDetails ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-indigo-650" /></div>
                ) : !activeEvent.registrations || activeEvent.registrations.length === 0 ? (
                  <p className="text-xs text-slate-450 dark:text-slate-500 italic text-center py-8">No students registered for this event yet.</p>
                ) : (
                  <div className="space-y-3">
                    <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-left">Students list ({activeEvent.registrations.length})</p>
                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                      {activeEvent.registrations.map((reg, idx) => (
                        <div key={idx} className="p-3.5 flex items-center justify-between bg-slate-50/20 text-left">
                          <div>
                            <p className="text-xs font-bold text-slate-850 dark:text-slate-150">{reg.student.name}</p>
                            <p className="text-[10px] font-semibold text-slate-450 dark:text-slate-500">{reg.student.email}</p>
                          </div>
                          <span className="text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-150">Registered</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </DashboardPageContainer>
    </DashboardLayout>
  );
}
