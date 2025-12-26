"use client";

import { use } from "react";
import Link from "next/link";
import { useGetBoardByIdQuery } from "@/features/boards/boardsApi";
import { Header } from "@/components/layout";
import { KanbanBoard } from "@/components/kanban";
import { ArrowLeft, Loader2, AlertCircle, Wifi } from "lucide-react";
import { Button } from "@/components/ui";
import { useSocket } from "@/hooks/useSocket";

interface BoardPageProps {
  params: Promise<{ boardId: string }>;
}

export default function BoardPage({ params }: BoardPageProps) {
  const { boardId } = use(params);

  // Fetch board data
  const {
    data: board,
    isLoading,
    error,
    refetch,
  } = useGetBoardByIdQuery(boardId);

  // Connect to WebSocket for real-time updates
  useSocket(boardId);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <Header />

      {/* Board Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-full mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>

            {board && (
              <div className="flex-1">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  {board.name}
                </h1>
                {board.description && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {board.description}
                  </p>
                )}
              </div>
            )}

            {/* WebSocket Real-time indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                Real-time
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center h-full py-20">
            <div className="text-center">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto" />
              <p className="mt-4 text-slate-500 dark:text-slate-400">
                Loading board...
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center justify-center h-full py-20">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Failed to load board
              </h2>
              <p className="mt-2 text-slate-500 dark:text-slate-400">
                Please check if the server is running and the board exists.
              </p>
              <div className="mt-6 flex gap-3 justify-center">
                <Button variant="secondary" onClick={() => refetch()}>
                  Try Again
                </Button>
                <Link href="/">
                  <Button variant="ghost">Back to Dashboard</Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Kanban Board */}
        {board && (
          <div className="h-full py-6 overflow-x-auto">
            <KanbanBoard board={board} />
          </div>
        )}
      </div>
    </div>
  );
}
