import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

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

    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'attachment; filename="merged.pdf"',
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to merge files" },
      { status: 500 }
    );
  }
}