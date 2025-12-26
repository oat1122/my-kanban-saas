"use client";

import Link from "next/link";
import { useGetBoardsQuery } from "@/features/boards/boardsApi";
import { Header } from "@/components/layout";
import { Layout, Calendar, Users, ArrowRight, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function DashboardPage() {
  const { data: boards, isLoading, error } = useGetBoardsQuery();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Welcome back! 👋
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Select a board to start managing your tasks
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
            <p className="text-red-600 dark:text-red-400">
              Failed to load boards. Please check if the server is running.
            </p>
          </div>
        )}

        {/* Boards Grid */}
        {boards && boards.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {boards.map((board) => (
              <Link
                key={board.id}
                href={`/boards/${board.id}`}
                className="group relative bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200"
              >
                {/* Gradient Accent */}
                <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-blue-600 to-indigo-600" />

                {/* Icon */}
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-4">
                  <Layout className="h-6 w-6" />
                </div>

                {/* Content */}
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {board.name}
                </h2>

                {board.description && (
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                    {board.description}
                  </p>
                )}

                {/* Meta */}
                <div className="mt-4 flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(new Date(board.createdAt), "MMM d, yyyy")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />1 member
                  </span>
                </div>

                {/* Arrow */}
                <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Empty State */}
        {boards && boards.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Layout className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">
              No boards yet
            </h3>
            <p className="mt-2 text-slate-500 dark:text-slate-400">
              Create your first board to get started
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
