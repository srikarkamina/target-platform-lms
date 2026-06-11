"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

// ─── Type Definitions ───────────────────────────────────────────────────────

interface Course {
  id: string;
  title: string;
  description: string | null;
  courseCode: string;
  facultyId: string | null;
  instituteId: string;
}

interface Video {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  duration: number | null;
  sortOrder: number;
}

interface Material {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  materialType: string;
  sortOrder: number;
}

interface Student {
  id: string;
  name: string;
  email: string;
}

interface Enrollment {
  id: string;
  enrolledAt: string;
  student: Student;
  batch: {
    id: string;
    name: string;
  };
}

type Tab = "info" | "videos" | "materials" | "students";

const MATERIAL_TYPES = [
  "PDF",
  "DOC",
  "DOCX",
  "PPT",
  "PPTX",
  "XLSX",
  "OTHER",
];

const MATERIAL_TYPE_COLORS: Record<string, string> = {
  PDF: "bg-red-100 text-red-700",
  DOC: "bg-blue-100 text-blue-700",
  DOCX: "bg-blue-100 text-blue-700",
  PPT: "bg-orange-100 text-orange-700",
  PPTX: "bg-orange-100 text-orange-700",
  XLSX: "bg-green-100 text-green-700",
  OTHER: "bg-gray-100 text-gray-700",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDuration(seconds: number | null) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

// ─── Main Page Component ─────────────────────────────────────────────────────

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  // ── Tab State ────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>("info");

  // ── Course Info State ────────────────────────────────────────────────────
  const [course, setCourse] = useState<Course | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [infoLoading, setInfoLoading] = useState(true);
  const [infoSaving, setInfoSaving] = useState(false);

  // ── Videos State ─────────────────────────────────────────────────────────
  const [videos, setVideos] = useState<Video[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [editingVideo, setEditingVideo] =
    useState<Video | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] =
    useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoDuration, setVideoDuration] = useState("");
  const [videoSortOrder, setVideoSortOrder] = useState("0");
  const [videoSaving, setVideoSaving] = useState(false);

  // ── Materials State ───────────────────────────────────────────────────────
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialsLoading, setMaterialsLoading] =
    useState(false);
  const [showMaterialForm, setShowMaterialForm] =
    useState(false);
  const [editingMaterial, setEditingMaterial] =
    useState<Material | null>(null);
  const [materialTitle, setMaterialTitle] = useState("");
  const [materialDescription, setMaterialDescription] =
    useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [materialType, setMaterialType] = useState("PDF");
  const [materialSortOrder, setMaterialSortOrder] =
    useState("0");
  const [materialSaving, setMaterialSaving] = useState(false);

  // ── Students State ────────────────────────────────────────────────────────
  const [enrollments, setEnrollments] = useState<
    Enrollment[]
  >([]);
  const [studentsLoading, setStudentsLoading] =
    useState(false);

  // ─── Data Fetching ─────────────────────────────────────────────────────────

  // Fetch course info on mount
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setInfoLoading(true);
        const res = await api.get(`/courses/${courseId}`);
        const data: Course = res.data;
        setCourse(data);
        setTitle(data.title || "");
        setDescription(data.description || "");
        setCourseCode(data.courseCode || "");
      } catch (err) {
        console.error(err);
      } finally {
        setInfoLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  // Fetch tab data when tab changes
  useEffect(() => {
    if (activeTab === "videos") fetchVideos();
    if (activeTab === "materials") fetchMaterials();
    if (activeTab === "students") fetchEnrollments();
  }, [activeTab]);

  const fetchVideos = async () => {
    try {
      setVideosLoading(true);
      const res = await api.get(
        `/courses/${courseId}/videos`
      );
      setVideos(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setVideosLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      setMaterialsLoading(true);
      const res = await api.get(
        `/courses/${courseId}/materials`
      );
      setMaterials(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setMaterialsLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    try {
      setStudentsLoading(true);
      const res = await api.get(`/enrollments`);
      // Filter enrollments that belong to this course's batches
      const filtered = res.data.filter(
        (e: { batch: { course: { id: string } } }) =>
          e.batch?.course?.id === courseId
      );
      setEnrollments(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setStudentsLoading(false);
    }
  };

  // ─── Course Info Handlers ───────────────────────────────────────────────────

  const handleUpdateCourse = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    try {
      setInfoSaving(true);
      await api.put(`/courses/${courseId}`, {
        title,
        description,
        courseCode,
      });
      alert("Course updated successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to update course.");
    } finally {
      setInfoSaving(false);
    }
  };

  const handleDeleteCourse = async () => {
    const confirmed = confirm(
      "Are you sure you want to delete this course?"
    );

    if (!confirmed) return;

    try {
      await api.delete(`/courses/${courseId}`);
      alert("Course deleted.");
      router.push("/dashboard/courses");
    } catch (err) {
      console.error(err);
      alert("Failed to delete course.");
    }
  };

  // ─── Video Handlers ─────────────────────────────────────────────────────────

  const resetVideoForm = () => {
    setEditingVideo(null);
    setVideoTitle("");
    setVideoDescription("");
    setVideoUrl("");
    setVideoDuration("");
    setVideoSortOrder("0");
    setShowVideoForm(false);
  };

  const openEditVideo = (video: Video) => {
    setEditingVideo(video);
    setVideoTitle(video.title);
    setVideoDescription(video.description || "");
    setVideoUrl(video.videoUrl);
    setVideoDuration(
      video.duration ? String(video.duration) : ""
    );
    setVideoSortOrder(String(video.sortOrder));
    setShowVideoForm(true);
  };

  const handleSaveVideo = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    try {
      setVideoSaving(true);

      const payload = {
        title: videoTitle,
        description: videoDescription || null,
        videoUrl,
        duration: videoDuration
          ? Number(videoDuration)
          : null,
        sortOrder: Number(videoSortOrder),
      };

      if (editingVideo) {
        await api.put(
          `/courses/${courseId}/videos/${editingVideo.id}`,
          payload
        );
      } else {
        await api.post(
          `/courses/${courseId}/videos`,
          payload
        );
      }

      resetVideoForm();
      fetchVideos();
    } catch (err) {
      console.error(err);
      alert("Failed to save video.");
    } finally {
      setVideoSaving(false);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    const confirmed = confirm(
      "Are you sure you want to delete this video?"
    );

    if (!confirmed) return;

    try {
      await api.delete(
        `/courses/${courseId}/videos/${videoId}`
      );
      fetchVideos();
    } catch (err) {
      console.error(err);
      alert("Failed to delete video.");
    }
  };

  // ─── Material Handlers ──────────────────────────────────────────────────────

  const resetMaterialForm = () => {
    setEditingMaterial(null);
    setMaterialTitle("");
    setMaterialDescription("");
    setFileUrl("");
    setMaterialType("PDF");
    setMaterialSortOrder("0");
    setShowMaterialForm(false);
  };

  const openEditMaterial = (material: Material) => {
    setEditingMaterial(material);
    setMaterialTitle(material.title);
    setMaterialDescription(material.description || "");
    setFileUrl(material.fileUrl);
    setMaterialType(material.materialType);
    setMaterialSortOrder(String(material.sortOrder));
    setShowMaterialForm(true);
  };

  const handleSaveMaterial = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    try {
      setMaterialSaving(true);

      const payload = {
        title: materialTitle,
        description: materialDescription || null,
        fileUrl,
        materialType,
        sortOrder: Number(materialSortOrder),
      };

      if (editingMaterial) {
        await api.put(
          `/courses/${courseId}/materials/${editingMaterial.id}`,
          payload
        );
      } else {
        await api.post(
          `/courses/${courseId}/materials`,
          payload
        );
      }

      resetMaterialForm();
      fetchMaterials();
    } catch (err) {
      console.error(err);
      alert("Failed to save material.");
    } finally {
      setMaterialSaving(false);
    }
  };

  const handleDeleteMaterial = async (
    materialId: string
  ) => {
    const confirmed = confirm(
      "Are you sure you want to delete this material?"
    );

    if (!confirmed) return;

    try {
      await api.delete(
        `/courses/${courseId}/materials/${materialId}`
      );
      fetchMaterials();
    } catch (err) {
      console.error(err);
      alert("Failed to delete material.");
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (infoLoading) {
    return (
      <div>
        <Navbar />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 p-6">
            <p className="text-gray-500">
              Loading course...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div>
        <Navbar />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 p-6">
            <p className="text-red-500">
              Course not found.
            </p>
            <Link
              href="/dashboard/courses"
              className="mt-4 inline-block text-blue-600 hover:underline"
            >
              ← Back to Courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "info", label: "ℹ️ Course Info" },
    { key: "videos", label: "🎥 Videos" },
    { key: "materials", label: "📄 Materials" },
    { key: "students", label: "👥 Students" },
  ];

  return (
    <div>
      <Navbar />

      <div className="flex">
        <Sidebar />

        <div className="flex-1 p-6">
          {/* Page Header */}
          <div className="mb-6 flex items-center gap-4">
            <Link
              href="/dashboard/courses"
              className="text-sm text-blue-600 hover:underline"
            >
              ← Courses
            </Link>

            <div>
              <h1 className="text-2xl font-bold">
                {course.title}
              </h1>

              <p className="text-sm text-gray-500">
                {course.courseCode}
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6 flex gap-1 border-b">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Tab: Course Info ────────────────────────── */}
          {activeTab === "info" && (
            <div className="max-w-lg">
              <form
                onSubmit={handleUpdateCourse}
                className="space-y-4"
              >
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Course Title
                  </label>

                  <input
                    value={title}
                    onChange={(e) =>
                      setTitle(e.target.value)
                    }
                    className="w-full rounded border p-2"
                    placeholder="Title"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Course Code
                  </label>

                  <input
                    value={courseCode}
                    onChange={(e) =>
                      setCourseCode(e.target.value)
                    }
                    className="w-full rounded border p-2"
                    placeholder="e.g. JAVA102"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Description
                  </label>

                  <textarea
                    value={description}
                    onChange={(e) =>
                      setDescription(e.target.value)
                    }
                    className="w-full rounded border p-2"
                    rows={4}
                    placeholder="Course description..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={infoSaving}
                    className="rounded bg-green-600 px-4 py-2 text-white disabled:opacity-60"
                  >
                    {infoSaving ? "Saving..." : "Update"}
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteCourse}
                    className="rounded bg-red-600 px-4 py-2 text-white"
                  >
                    Delete Course
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Tab: Videos ─────────────────────────────── */}
          {activeTab === "videos" && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Videos ({videos.length})
                </h2>

                {!showVideoForm && (
                  <button
                    onClick={() => {
                      resetVideoForm();
                      setShowVideoForm(true);
                    }}
                    className="rounded bg-blue-600 px-4 py-2 text-sm text-white"
                  >
                    + Add Video
                  </button>
                )}
              </div>

              {/* Video Form (Add / Edit) */}
              {showVideoForm && (
                <div className="mb-6 rounded border bg-gray-50 p-4">
                  <h3 className="mb-4 font-semibold">
                    {editingVideo
                      ? "Edit Video"
                      : "Add New Video"}
                  </h3>

                  <form
                    onSubmit={handleSaveVideo}
                    className="space-y-3"
                  >
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Title *
                      </label>

                      <input
                        value={videoTitle}
                        onChange={(e) =>
                          setVideoTitle(e.target.value)
                        }
                        className="w-full rounded border p-2"
                        placeholder="e.g. Introduction to Java"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Video URL *
                      </label>

                      <input
                        value={videoUrl}
                        onChange={(e) =>
                          setVideoUrl(e.target.value)
                        }
                        className="w-full rounded border p-2"
                        placeholder="e.g. https://youtube.com/watch?v=..."
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Description
                      </label>

                      <textarea
                        value={videoDescription}
                        onChange={(e) =>
                          setVideoDescription(e.target.value)
                        }
                        className="w-full rounded border p-2"
                        rows={2}
                        placeholder="Optional description..."
                      />
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="mb-1 block text-sm font-medium">
                          Duration (seconds)
                        </label>

                        <input
                          type="number"
                          value={videoDuration}
                          onChange={(e) =>
                            setVideoDuration(e.target.value)
                          }
                          className="w-full rounded border p-2"
                          placeholder="e.g. 3600"
                          min="0"
                        />
                      </div>

                      <div className="flex-1">
                        <label className="mb-1 block text-sm font-medium">
                          Sort Order
                        </label>

                        <input
                          type="number"
                          value={videoSortOrder}
                          onChange={(e) =>
                            setVideoSortOrder(e.target.value)
                          }
                          className="w-full rounded border p-2"
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={videoSaving}
                        className="rounded bg-green-600 px-4 py-2 text-sm text-white disabled:opacity-60"
                      >
                        {videoSaving
                          ? "Saving..."
                          : editingVideo
                            ? "Update Video"
                            : "Create Video"}
                      </button>

                      <button
                        type="button"
                        onClick={resetVideoForm}
                        className="rounded border px-4 py-2 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Videos List */}
              {videosLoading && (
                <p className="text-gray-500">
                  Loading videos...
                </p>
              )}

              {!videosLoading && videos.length === 0 && (
                <div className="rounded border p-8 text-center text-gray-500">
                  <p>No videos yet.</p>
                  <p className="mt-1 text-sm">
                    Click &quot;Add Video&quot; to get
                    started.
                  </p>
                </div>
              )}

              {!videosLoading && videos.length > 0 && (
                <div className="space-y-3">
                  {videos.map((video, idx) => (
                    <div
                      key={video.id}
                      className="flex items-start justify-between rounded border bg-white p-4"
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                          {idx + 1}
                        </span>

                        <div>
                          <p className="font-medium">
                            {video.title}
                          </p>

                          {video.description && (
                            <p className="mt-0.5 text-sm text-gray-500">
                              {video.description}
                            </p>
                          )}

                          <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                            <span>
                              ⏱{" "}
                              {formatDuration(video.duration)}
                            </span>

                            <a
                              href={video.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              🔗 Open Video
                            </a>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 shrink-0 ml-4">
                        <button
                          onClick={() =>
                            openEditVideo(video)
                          }
                          className="rounded bg-yellow-500 px-3 py-1 text-xs text-white"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            handleDeleteVideo(video.id)
                          }
                          className="rounded bg-red-500 px-3 py-1 text-xs text-white"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Materials ───────────────────────────── */}
          {activeTab === "materials" && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Study Materials ({materials.length})
                </h2>

                {!showMaterialForm && (
                  <button
                    onClick={() => {
                      resetMaterialForm();
                      setShowMaterialForm(true);
                    }}
                    className="rounded bg-blue-600 px-4 py-2 text-sm text-white"
                  >
                    + Add Material
                  </button>
                )}
              </div>

              {/* Material Form (Add / Edit) */}
              {showMaterialForm && (
                <div className="mb-6 rounded border bg-gray-50 p-4">
                  <h3 className="mb-4 font-semibold">
                    {editingMaterial
                      ? "Edit Material"
                      : "Add New Material"}
                  </h3>

                  <form
                    onSubmit={handleSaveMaterial}
                    className="space-y-3"
                  >
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Title *
                      </label>

                      <input
                        value={materialTitle}
                        onChange={(e) =>
                          setMaterialTitle(e.target.value)
                        }
                        className="w-full rounded border p-2"
                        placeholder="e.g. Java Notes - Chapter 1"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        File URL *
                      </label>

                      <input
                        value={fileUrl}
                        onChange={(e) =>
                          setFileUrl(e.target.value)
                        }
                        className="w-full rounded border p-2"
                        placeholder="e.g. https://drive.google.com/..."
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Material Type
                      </label>

                      <select
                        value={materialType}
                        onChange={(e) =>
                          setMaterialType(e.target.value)
                        }
                        className="w-full rounded border p-2"
                      >
                        {MATERIAL_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Description
                      </label>

                      <textarea
                        value={materialDescription}
                        onChange={(e) =>
                          setMaterialDescription(
                            e.target.value
                          )
                        }
                        className="w-full rounded border p-2"
                        rows={2}
                        placeholder="Optional description..."
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Sort Order
                      </label>

                      <input
                        type="number"
                        value={materialSortOrder}
                        onChange={(e) =>
                          setMaterialSortOrder(
                            e.target.value
                          )
                        }
                        className="w-full rounded border p-2"
                        min="0"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={materialSaving}
                        className="rounded bg-green-600 px-4 py-2 text-sm text-white disabled:opacity-60"
                      >
                        {materialSaving
                          ? "Saving..."
                          : editingMaterial
                            ? "Update Material"
                            : "Create Material"}
                      </button>

                      <button
                        type="button"
                        onClick={resetMaterialForm}
                        className="rounded border px-4 py-2 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Materials List */}
              {materialsLoading && (
                <p className="text-gray-500">
                  Loading materials...
                </p>
              )}

              {!materialsLoading &&
                materials.length === 0 && (
                  <div className="rounded border p-8 text-center text-gray-500">
                    <p>No materials yet.</p>
                    <p className="mt-1 text-sm">
                      Click &quot;Add Material&quot; to get
                      started.
                    </p>
                  </div>
                )}

              {!materialsLoading &&
                materials.length > 0 && (
                  <div className="space-y-3">
                    {materials.map((material, idx) => (
                      <div
                        key={material.id}
                        className="flex items-start justify-between rounded border bg-white p-4"
                      >
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                            {idx + 1}
                          </span>

                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {material.title}
                              </p>

                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                  MATERIAL_TYPE_COLORS[
                                    material.materialType
                                  ] ||
                                  MATERIAL_TYPE_COLORS.OTHER
                                }`}
                              >
                                {material.materialType}
                              </span>
                            </div>

                            {material.description && (
                              <p className="mt-0.5 text-sm text-gray-500">
                                {material.description}
                              </p>
                            )}

                            <a
                              href={material.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 inline-block text-xs text-blue-600 hover:underline"
                            >
                              📎 Open File
                            </a>
                          </div>
                        </div>

                        <div className="flex gap-2 shrink-0 ml-4">
                          <button
                            onClick={() =>
                              openEditMaterial(material)
                            }
                            className="rounded bg-yellow-500 px-3 py-1 text-xs text-white"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              handleDeleteMaterial(
                                material.id
                              )
                            }
                            className="rounded bg-red-500 px-3 py-1 text-xs text-white"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          )}

          {/* ── Tab: Students ────────────────────────────── */}
          {activeTab === "students" && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Enrolled Students ({enrollments.length})
                </h2>
              </div>

              {studentsLoading && (
                <p className="text-gray-500">
                  Loading students...
                </p>
              )}

              {!studentsLoading &&
                enrollments.length === 0 && (
                  <div className="rounded border p-8 text-center text-gray-500">
                    <p>No students enrolled yet.</p>
                    <p className="mt-1 text-sm">
                      Students are enrolled through Batches.
                    </p>
                  </div>
                )}

              {!studentsLoading &&
                enrollments.length > 0 && (
                  <table className="w-full border text-sm">
                    <thead className="bg-gray-50">
                      <tr className="border-b">
                        <th className="p-3 text-left font-semibold">
                          #
                        </th>

                        <th className="p-3 text-left font-semibold">
                          Name
                        </th>

                        <th className="p-3 text-left font-semibold">
                          Email
                        </th>

                        <th className="p-3 text-left font-semibold">
                          Batch
                        </th>

                        <th className="p-3 text-left font-semibold">
                          Enrolled On
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {enrollments.map(
                        (enrollment, idx) => (
                          <tr
                            key={enrollment.id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="p-3 text-gray-500">
                              {idx + 1}
                            </td>

                            <td className="p-3 font-medium">
                              {enrollment.student.name}
                            </td>

                            <td className="p-3 text-gray-600">
                              {enrollment.student.email}
                            </td>

                            <td className="p-3 text-gray-600">
                              {enrollment.batch.name}
                            </td>

                            <td className="p-3 text-gray-600">
                              {new Date(
                                enrollment.enrolledAt
                              ).toLocaleDateString()}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}