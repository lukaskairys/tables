"use client";

import { useState } from "react";
import { CreateTableDialog } from "@/components/table/create-table-dialog";

export function CreateTableButton({ eventId }: { eventId: string }) {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Create Table
      </button>

      {showDialog && (
        <CreateTableDialog eventId={eventId} onClose={() => setShowDialog(false)} />
      )}
    </>
  );
}
