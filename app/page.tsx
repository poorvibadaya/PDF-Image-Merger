"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  DndContext,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type FileItem = {
  id: string;
  file: File;
  type: "pdf" | "image";
};

function SortableItem({ item, index }: { item: FileItem; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="border rounded p-3 bg-white flex justify-between items-center cursor-move"
    >
      <div>
        <div className="font-medium">
          {index + 1}. {item.file.name}
        </div>
        <div className="text-sm text-gray-500">
          {item.type.toUpperCase()}
        </div>
      </div>
      <div className="text-gray-400">⇅</div>
    </div>
  );
}

export default function Home() {
  const [files, setFiles] = useState<FileItem[]>([]);

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg"],
    },
    onDrop: (acceptedFiles) => {
      const newFiles: FileItem[] = acceptedFiles.map((file) => ({
        id: crypto.randomUUID(),
        file,
        type: file.type === "application/pdf" ? "pdf" : "image",
      }));
      setFiles((prev) => [...prev, ...newFiles]);
    },
  });

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-center">
          PDF & Image Merger
        </h1>

        {/* Upload */}
        <div
          {...getRootProps()}
          className="border-2 border-dashed rounded p-6 text-center bg-white cursor-pointer"
        >
          <input {...getInputProps()} />
          <p className="text-gray-600">
            Click or drag to upload PDFs & Images
          </p>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={(event) => {
              const { active, over } = event;
              if (over && active.id !== over.id) {
                setFiles((items) => {
                  const oldIndex = items.findIndex(
                    (i) => i.id === active.id
                  );
                  const newIndex = items.findIndex(
                    (i) => i.id === over.id
                  );
                  return arrayMove(items, oldIndex, newIndex);
                });
              }
            }}
          >
            <SortableContext
              items={files.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {files.map((item, index) => (
                  <SortableItem
                    key={item.id}
                    item={item}
                    index={index}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Merge Button */}
        {files.length > 0 && (
          <button
          onClick={async () => {
            const formData = new FormData();
          
            files.forEach((item) => {
              formData.append("files", item.file);
            });
          
            const res = await fetch("/api/merge", {
              method: "POST",
              body: formData,
            });
          
            if (!res.ok) {
              alert("Failed to merge files");
              return;
            }
          
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
          
            const a = document.createElement("a");
            a.href = url;
            a.download = "merged.pdf";
            a.click();
          
            URL.revokeObjectURL(url);
          }}
            className="w-full bg-black text-white py-3 rounded"
          >
            Merge & Download PDF
          </button>
        )}
      </div>
    </main>
  );
}
