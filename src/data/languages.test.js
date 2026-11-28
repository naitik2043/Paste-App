import test from "node:test";
import assert from "node:assert/strict";
import { LANGUAGE_OPTIONS, LANGUAGE_LABELS, getLanguageLabel } from "./languages.js";

test("language options expose unique identifiers and readable labels", () => {
  const values = LANGUAGE_OPTIONS.map((language) => language.value);
  assert.equal(new Set(values).size, values.length);
  assert.ok(LANGUAGE_OPTIONS.every((language) => language.label && language.value));
});

test("language labels cover core and additional programming languages", () => {
  assert.equal(getLanguageLabel("cpp"), "C++");
  assert.equal(getLanguageLabel("python"), "Python");
  assert.equal(getLanguageLabel("csharp"), "C#");
  assert.equal(getLanguageLabel("typescript"), "TypeScript");
  assert.ok(LANGUAGE_LABELS.graphql);
});
