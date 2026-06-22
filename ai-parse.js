export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    console.error("Missing Groq API key. Set GROQ_API_KEY in Vercel environment variables.");
    return res.status(500).json({ error: "Server misconfiguration" });
  }

  const rawText = req.body?.rawText;
  if (!rawText || typeof rawText !== "string") {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const MODEL = "openai/gpt-oss-120b";

  const prompt = `Extract candidate information from the following raw text and return ONLY a valid JSON object with exactly these keys (use empty string "" if not found):\n${
    JSON.stringify({
      name: "",
      fatherName: "",
      phone: "",
      altPhone: "",
      email: "",
      dob: "",
      gender: "",
      marital: "",
      aadhar: "",
      qualification: "",
      address: "",
      languages: "",
      experience: "",
      joining: ""
    }, null, 2)
  }\n\nRules:\n- name: candidate's own full name only\n- fatherName: father's name (look for S/O, D/O, W/O, Father's Name labels)\n- phone: primary 10-digit mobile number (digits only, no spaces)\n- altPhone: secondary/alternative number if present\n- email: email address in lowercase\n- dob: date of birth in DD/MM/YYYY format\n- gender: Male / Female / Other\n- marital: Single / Married / Divorced / Widowed\n- aadhar: 12-digit number, digits only\n- qualification: highest education qualification\n- address: full residential address with pincode\n- languages: languages spoken/known\n- experience: work experience summary\n- joining: joining availability / notice period\n\nRaw text:\n${rawText}\n\nReturn ONLY the JSON object, no explanation, no markdown.`;

  try {
    const apiResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 800,
        temperature: 0.0
      })
    });

    if (!apiResponse.ok) {
      const errorBody = await apiResponse.json().catch(() => null);
      console.error('Groq API error status:', apiResponse.status);
      console.error('Groq API error body:', errorBody);
      const message = errorBody?.error?.message || errorBody?.message || JSON.stringify(errorBody) || 'Groq API error';
      return res.status(apiResponse.status).json({ error: message });
    }

    const body = await apiResponse.json();
    const raw = body.choices?.[0]?.message?.content || "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(502).json({ error: "Unable to parse AI response" });
    }

    const candidate = JSON.parse(jsonMatch[0]);
    return res.status(200).json({ candidate });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error" });
  }
}