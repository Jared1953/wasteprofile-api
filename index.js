const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.get("/", (req, res) => res.json({ status: "WasteProfile OS API running" }));

app.post("/extract-pdf", async (req, res) => {
  try {
    const { base64, filename, text } = req.body;
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) return res.status(500).json({ error: "API key not configured" });

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 2000,
        messages: [{
          role: "user",
          content: base64 ? [
            { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } },
            { type: "text", text: 'Extract ALL profile information from this waste profile document. Return ONLY JSON: {"profileNumber":"","generatedDate":"","expirationDate":"","status":"Active","generator":{"name":"","contact":"","email":"","phone":"","address":"","epaId":"","naicsCode":""},"facility":{"name":"","address":"","epaId":""},"wasteCharacterization":{"wasteName":"","processGenerating":"","wasteCode":"","rcraHazardous":false,"hazardousCodes":[],"physicalState":"","color":"","odor":"","ph":"","flashPoint":"","containerType":"","containerSize":"","estimatedAnnualQuantity":""},"regulatoryInfo":{"dotProperShippingName":"","dotHazardClass":"","unNumber":"","packagingGroup":""},"approvalConditions":[],"specialHandlingInstructions":"","certificationStatement":""}' }
          ] : `Extract all waste profile information from this text and return ONLY JSON:\n\n${text}\n\n{"profileNumber":"","generator":{"name":"","contact":"","email":"","phone":"","address":"","epaId":"","naicsCode":""},"facility":{"name":"","address":"","epaId":""},"wasteCharacterization":{"wasteName":"","processGenerating":"","wasteCode":"","rcraHazardous":false,"hazardousCodes":[],"physicalState":"","color":"","odor":"","ph":"","flashPoint":"","containerType":"","containerSize":"","estimatedAnnualQuantity":""},"regulatoryInfo":{"dotProperShippingName":"","dotHazardClass":"","unNumber":"","packagingGroup":""},"specialHandlingInstructions":"","certificationStatement":""}`
        }]
      })
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    const clean = data.content[0].text.replace(/```json|```/g, "").trim();
    res.json({ success: true, data: JSON.parse(clean) });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/generate-profile", async (req, res) => {
  try {
    const { prompt } = req.body;
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) return res.status(500).json({ error: "API key not configured" });

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    const clean = data.content[0].text.replace(/```json|```/g, "").trim();
    res.json({ success: true, text: clean });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`WasteProfile API running on port ${PORT}`));
