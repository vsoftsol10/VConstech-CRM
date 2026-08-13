const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function classifyEmail(email) {
  console.log("🚀 classifyEmail() called");

  const prompt = `
Classify this CRM email into exactly ONE category:

LEAD
TICKET
GENERAL_INQUIRY
SPAM

Definitions:

LEAD:
A new or potential customer showing interest in buying a product,
requesting pricing, quotation, demo, product information, or sales contact.

TICKET:
An existing customer reporting a problem, bug, error, technical issue,
login issue, account issue, or requesting support.

GENERAL_INQUIRY:
A genuine email that is neither a sales lead nor a support ticket.

SPAM:
Unwanted, fraudulent, irrelevant, or suspicious email.

EMAIL:

From:
${email.from || "Unknown"}

Subject:
${email.subject || "No subject"}

Body:
${email.body || "No body"}

Return JSON with exactly these fields:
{
  "type": "LEAD",
  "confidence": 0.95,
  "summary": "Short explanation",
  "reason": "Why this classification was chosen"
}
`;

  try {
    console.log("🤖 Groq: sending request...");

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",

      temperature: 0,

      response_format: {
        type: "json_object",
      },

      messages: [
        {
          role: "system",
          content:
            "You are a precise CRM email classification system. Always return valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    console.log("🤖 Groq: response received");

    const result = completion.choices?.[0]?.message?.content;

    console.log("🤖 Groq raw response:");
    console.log(result);

    if (!result) {
      throw new Error("Groq returned an empty response");
    }

    const classification = JSON.parse(result);

    console.log("✅ Groq classification:");
    console.log(classification);

    return classification;

  } catch (error) {
    console.error("❌ Groq classification failed");
    console.error("Message:", error.message);

    if (error.status) {
      console.error("Status:", error.status);
    }

    if (error.code) {
      console.error("Code:", error.code);
    }

    return null;
  }
}

module.exports = {
  classifyEmail,
};