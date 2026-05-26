import React, { useState, useEffect } from "react";

import Spinner from "../../components/common/Spinner";
import progressService from "../../services/progressService";
import toast from "react-hot-toast";

import {
  FileText,
  BookOpen,
  BrainCircuit,
  TrendingUp,
  Clock,
} from "lucide-react";

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data =
          await progressService.getDashboardData();

        console.log("Dashboard Data:", data);

        setDashboardData(data.data);
      } catch (error) {
        toast.error(
          "Failed to fetch dashboard data."
        );

        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <Spinner />;
  }

  if (!dashboardData || !dashboardData.overview) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <TrendingUp className="w-10 h-10 mx-auto text-slate-400 mb-4" />

          <p className="text-slate-600">
            No dashboard data available.
          </p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: "Total Documents",
      value: dashboardData.overview.totalDocuments,
      icon: FileText,
      gradient: "from-blue-400 to-cyan-500",
    },

    {
      label: "Total Flashcards",
      value: dashboardData.overview.totalFlashcards,
      icon: BookOpen,
      gradient: "from-purple-400 to-pink-500",
    },

    {
      label: "Total Quizzes",
      value: dashboardData.overview.totalQuizzes,
      icon: BrainCircuit,
      gradient: "from-green-400 to-emerald-500",
    },
  ];

  return (
    <div className="min-h-screen p-6 bg-slate-50">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Dashboard
        </h1>

        <p className="text-slate-500 mt-2">
          Track your learning progress
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-slate-500">
                  {stat.label}
                </p>

                <h2 className="text-3xl font-bold text-slate-900 mt-2">
                  {stat.value}
                </h2>
              </div>

              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}
              >
                <stat.icon
                  className="text-white"
                  size={22}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <Clock className="w-5 h-5 text-slate-600" />
          </div>

          <h2 className="text-xl font-semibold text-slate-900">
            Recent Activity
          </h2>
        </div>

        {dashboardData.recentActivity ? (
          <div className="space-y-4">

            {[
              ...(dashboardData.recentActivity.documents || []).map(
                (doc) => ({
                  id: doc._id,
                  description: doc.title,
                  timestamp: doc.lastAccessed,
                  type: "document",
                })
              ),

              ...(dashboardData.recentActivity.quizzes || []).map(
                (quiz) => ({
                  id: quiz._id,
                  description: quiz.title,
                  timestamp: quiz.lastAttempted,
                  type: "quiz",
                })
              ),
            ]
              .sort(
                (a, b) =>
                  new Date(b.timestamp) -
                  new Date(a.timestamp)
              )
              .map((activity, index) => (
                <div
                  key={activity.id || index}
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {activity.type === "document"
                        ? "Accessed Document:"
                        : "Attempted Quiz:"}{" "}
                      {activity.description}
                    </p>

                    <p className="text-sm text-slate-500 mt-1">
                      {new Date(
                        activity.timestamp
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <Clock className="w-10 h-10 text-slate-400 mx-auto mb-4" />

            <p className="text-slate-600">
              No recent activity yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;