const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.get("/", (req, res) => res.json({ status: "WasteProfile OS API running" }));

app.post("/extract-pdf", async (req, res) => {
  try {
    const { text, filename } = req.body;
    const key = process.env.GEMINI_API_KEY;
    if (!key) return res.status(500).json({ error: "API key not configured" });
    if (!text) return res.status(400).json({ error: "No text provided" });

    const prompt = `You are a hazardous waste compliance specialist. Extract ALL profile information from this waste profile document text and return ONLY JSON with no markdown or explanation.

Document text:
${text.slice(0, 8000)}

Return this exact JSON structure (use empty string if not found):
{"profileNumber":"","generatedDate":"","expirationDate":"","status":"Active","generator":{"name":"","contact":"","email":"","phone":"","address":"","epaId":"","naicsCode":""},"facility":{"name":"","address":"","epaId":""},"wasteCharacterization":{"wasteName":"","processGenerating":"","wasteCode":"","rcraHazardous":false,"hazardousCodes":[],"physicalState":"","color":"","odor":"","ph":"","flashPoint":"","containerType":"","containerSize":"","estimatedAnnualQuantity":""},"regulatoryInfo":{"dotProperShippingName":"","dotHazardClass":"","unNumber":"","packagingGroup":""},"approvalConditions":[],"specialHandlingInstructions":"","certificationStatement":""}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    const clean = data.candidates?.[0]?.content?.parts?.[0]?.text?.replace(/```json|```/g, "").trim();
    res.json({ success: true, data: JSON.parse(clean) });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/generate-profile", async (req, res) => {
  try {
    const { prompt } = req.body;
    const key = process.env.GEMINI_API_KEY;
    if (!key) return res.status(500).json({ error: "API key not configured" });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    const clean = data.candidates?.[0]?.content?.parts?.[0]?.text?.replace(/```json|```/g, "").trim();
    res.json({ success: true, text: clean });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`WasteProfile API running on port ${PORT}`));
