const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const { getPdfPath } = require("../utils/paths");
const {
  getSupabaseClient,
  getSupabaseServiceClient,
} = require("../supabaseClient");
const { getBearerToken } = require("../utils/authHelpers");
const { calculateTax } = require("../taxCalculator");
const { generateTaxPDF } = require("../utils/pdfHelper");

async function getUserFromRequest(req) {
  const supabase = await getSupabaseClient();
  const token = getBearerToken(req);
  if (!token)
    return { error: { status: 401, message: "missing bearer token" } };
  const { data: userData, error: userError } = await supabase.auth.getUser(
    token
  );
  if (userError) return { error: { status: 401, message: userError.message } };
  return { user: userData.user };
}

// GET /api/reports?year=2024&q=term&page=1&pageSize=20
router.get("/reports", async (req, res) => {
  try {
    const { user, error } = await getUserFromRequest(req);
    if (error) return res.status(error.status).json({ error: error.message });
    const service = await getSupabaseServiceClient();
    const page = Math.max(1, Number(req.query.page || 1));
    const pageSize = Math.min(
      100,
      Math.max(1, Number(req.query.pageSize || 20))
    );
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = service
      .from("reports")
      .select("id,file_name,year,created_at,tax_data,calculation_result", {
        count: "exact",
      })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (req.query.year) {
      query = query.eq("year", Number(req.query.year));
    }
    if (req.query.q) {
      // simple ilike on file_name
      query = query.ilike("file_name", `%${req.query.q}%`);
    }

    const { data, error: qError, count } = await query;
    if (qError) return res.status(400).json({ error: qError.message });
    res.json({ items: data || [], total: count || 0, page, pageSize });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reports  { taxData, calculationResult?, fileName?, year? }
router.post("/reports", async (req, res) => {
  try {
    const { user, error } = await getUserFromRequest(req);
    if (error) return res.status(error.status).json({ error: error.message });
    const service = await getSupabaseServiceClient();

    const {
      taxData,
      calculationResult: inputCalc,
      fileName,
      year,
    } = req.body || {};
    if (!taxData) return res.status(400).json({ error: "taxData is required" });

    const calculationResult = inputCalc || calculateTax(taxData);

    // Generate temp PDF
    const tempPath = getPdfPath(`report-${Date.now()}.pdf`);
    await generateTaxPDF({ ...taxData, ...calculationResult }, tempPath);

    const fullName =
      [taxData.firstName, taxData.lastName].filter(Boolean).join(" ") ||
      taxData.employeeName ||
      taxData.name ||
      "דוח";
    const safeName = fullName
      .replace(/[^\u0590-\u05FF\w\s-]/g, "")
      .replace(/\s+/g, "_");
    const reportYear = Number(
      year || calculationResult.taxYear || new Date().getFullYear() - 1
    );
    const finalName = `${safeName}-${reportYear}.pdf`;
    // Use ASCII-only path for Storage to avoid unicode path issues
    const asciiPathName = finalName.replace(/[^\x20-\x7E]/g, "_");

    // Upload to Supabase Storage (bucket: reports)
    const storagePath = `${user.id}/${Date.now()}-${asciiPathName}`;
    const fileBuffer = fs.readFileSync(tempPath);
    const { error: uploadError } = await service.storage
      .from("reports")
      .upload(storagePath, fileBuffer, {
        contentType: "application/pdf",
        upsert: false,
      });
    fs.unlink(tempPath, () => {});
    if (uploadError)
      return res.status(400).json({ error: uploadError.message });

    // Insert DB row
    const { data, error: insertError } = await service
      .from("reports")
      .insert({
        user_id: user.id,
        tax_data: taxData,
        calculation_result: calculationResult,
        storage_path: storagePath,
        file_name: finalName,
        year: reportYear,
        created_at: new Date().toISOString(),
      })
      .select("id,file_name,year,created_at")
      .single();

    if (insertError)
      return res.status(400).json({ error: insertError.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/:id/download  => returns signed URL
router.get("/reports/:id/download", async (req, res) => {
  try {
    const { user, error } = await getUserFromRequest(req);
    if (error) return res.status(error.status).json({ error: error.message });
    const service = await getSupabaseServiceClient();

    const { data: report, error: fetchError } = await service
      .from("reports")
      .select("id,storage_path,user_id,file_name")
      .eq("id", req.params.id)
      .single();
    if (fetchError) return res.status(404).json({ error: "report not found" });
    if (report.user_id !== user.id)
      return res.status(403).json({ error: "forbidden" });

    const { data: signed, error: signError } = await service.storage
      .from("reports")
      .createSignedUrl(report.storage_path, 60 * 5, {
        download: report.file_name,
      });
    if (signError) return res.status(400).json({ error: signError.message });
    res.json({ url: signed.signedUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/:id/view  => returns signed URL for viewing (inline)
router.get("/reports/:id/view", async (req, res) => {
  try {
    const { user, error } = await getUserFromRequest(req);
    if (error) return res.status(error.status).json({ error: error.message });
    const service = await getSupabaseServiceClient();

    const { data: report, error: fetchError } = await service
      .from("reports")
      .select("id,storage_path,user_id,file_name")
      .eq("id", req.params.id)
      .single();
    if (fetchError) return res.status(404).json({ error: "report not found" });
    if (report.user_id !== user.id)
      return res.status(403).json({ error: "forbidden" });

    const { data: signed, error: signError } = await service.storage
      .from("reports")
      .createSignedUrl(report.storage_path, 60 * 5);
    if (signError) return res.status(400).json({ error: signError.message });
    res.json({ url: signed.signedUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/reports/:id
router.delete("/reports/:id", async (req, res) => {
  try {
    const { user, error } = await getUserFromRequest(req);
    if (error) return res.status(error.status).json({ error: error.message });
    const service = await getSupabaseServiceClient();

    const { data: report, error: fetchError } = await service
      .from("reports")
      .select("id,storage_path,user_id")
      .eq("id", req.params.id)
      .single();
    if (fetchError) return res.status(404).json({ error: "report not found" });
    if (report.user_id !== user.id)
      return res.status(403).json({ error: "forbidden" });

    const { error: delError } = await service.storage
      .from("reports")
      .remove([report.storage_path]);
    if (delError) return res.status(400).json({ error: delError.message });

    const { error: dbDelError } = await service
      .from("reports")
      .delete()
      .eq("id", report.id);
    if (dbDelError) return res.status(400).json({ error: dbDelError.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
