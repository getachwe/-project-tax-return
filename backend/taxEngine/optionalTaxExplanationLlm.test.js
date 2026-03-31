const {
  parseTaxExplanationLlmJson,
  augmentExplanationLayerWithOptionalLlm,
  isOptionalTaxExplanationLlmEnabled,
} = require("./optionalTaxExplanationLlm");

describe("optionalTaxExplanationLlm", () => {
  const prevTax = process.env.TAX_EXPLANATION_LLM;
  const prevKey = process.env.OPENAI_API_KEY;

  afterEach(() => {
    process.env.TAX_EXPLANATION_LLM = prevTax;
    process.env.OPENAI_API_KEY = prevKey;
  });

  test("parseTaxExplanationLlmJson parses bare JSON and fenced block", () => {
    const o = parseTaxExplanationLlmJson(
      '{"simpleExplanation":"שלום","additionalFollowUps":["אחת"]}',
    );
    expect(o.simpleExplanation).toBe("שלום");
    expect(o.additionalFollowUps).toEqual(["אחת"]);
    const fenced = parseTaxExplanationLlmJson(
      "```json\n{\"simpleExplanation\":\"x\",\"additionalFollowUps\":[]}\n```",
    );
    expect(fenced.simpleExplanation).toBe("x");
    expect(parseTaxExplanationLlmJson("not json")).toBeNull();
  });

  test("isOptionalTaxExplanationLlmEnabled requires flag and key", () => {
    delete process.env.TAX_EXPLANATION_LLM;
    delete process.env.OPENAI_API_KEY;
    expect(isOptionalTaxExplanationLlmEnabled()).toBe(false);
    process.env.TAX_EXPLANATION_LLM = "1";
    expect(isOptionalTaxExplanationLlmEnabled()).toBe(false);
    process.env.OPENAI_API_KEY = "sk-test";
    expect(isOptionalTaxExplanationLlmEnabled()).toBe(true);
  });

  test("augmentExplanationLayerWithOptionalLlm returns same layer when disabled", async () => {
    delete process.env.TAX_EXPLANATION_LLM;
    const layer = {
      narrative: "a",
      suggestedFollowUps: [],
      figures: { refund: 1 },
      source: "deterministic",
    };
    const out = await augmentExplanationLayerWithOptionalLlm(layer, {});
    expect(out).toBe(layer);
    expect(out.source).toBe("deterministic");
  });
});
