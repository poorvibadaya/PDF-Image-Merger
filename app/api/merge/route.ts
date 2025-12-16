import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_TOTAL_SIZE = 20 * 1024 * 1024; // 20 MB

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files received" },
        { status: 400 }
      );
    }

    let totalSize = 0;

    for (const file of files) {
      totalSize += file.size;

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `${file.name} exceeds 5 MB limit` },
          { status: 400 }
        );
      }
    }

    if (totalSize > MAX_TOTAL_SIZE) {
      return NextResponse.json(
        { error: "Total file size exceeds 20 MB limit" },
        { status: 400 }
      );
    }

    const mergedPdf = await PDFDocument.create();

    for (const file of files) {
      const bytes = await file.arrayBuffer();

      // PDF
      if (file.type === "application/pdf") {
        const pdf = await PDFDocument.load(bytes);
        const pages = await mergedPdf.copyPages(
          pdf,
          pdf.getPageIndices()
        );
        pages.forEach((page) => mergedPdf.addPage(page));
      }
      // Image
      else {
        const image =
          file.type === "image/png"
            ? await mergedPdf.embedPng(bytes)
            : await mergedPdf.embedJpg(bytes);

        const page = mergedPdf.addPage([
          image.width,
          image.height,
        ]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
      }
    }

    const pdfBytes = await mergedPdf.save();

    return new NextResponse(
        new Blob([pdfBytes], { type: "application/pdf" }),
        {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": 'attachment; filename="merged.pdf"',
          },
        }
      );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to merge files" },
      { status: 500 }
    );
  }
}